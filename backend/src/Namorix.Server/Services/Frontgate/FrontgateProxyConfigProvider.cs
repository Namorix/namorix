using System.Collections.Concurrent;
using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using Namorix.Server.Config;
using Namorix.Server.Models.Frontgate;
using Namorix.Server.Persistence;
using Yarp.ReverseProxy.Configuration;
using Yarp.ReverseProxy.Forwarder;

namespace Namorix.Server.Services.Frontgate;

public class FrontgateProxyConfigProvider(
    IServiceScopeFactory scopeFactory,
    IWebHostEnvironment env,
    IOptions<FrontendConfig> frontend) : IProxyConfigProvider
{
    private FrontgateProxyConfig _config = new([], []);
    public ConcurrentDictionary<string, byte> ForceSslSources { get; } = new();
    public ConcurrentDictionary<string, byte> WebSocketSources { get; } = new();
   public ConcurrentDictionary<string, byte> HstsSources { get; } = new();
    public ConcurrentDictionary<string, byte> HstsSubdomainSources { get; } = new();
    public ConcurrentDictionary<string, byte> BlockExploitSources { get; } = new();
    public ConcurrentDictionary<string, (ProxyAccessMode Mode, FgAccessPolicy? Policy)> AccessSources { get; } = new();
    public ConcurrentDictionary<string, (int Limit, int WindowSec)> RateLimitSources { get; } = new();
    public bool HasDryRun { get; private set; }

    public IProxyConfig GetConfig() => _config;

    public async Task UpdateAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Only load active rules; join with certificates to get domains if applicable
        var rules = await db.FgReverseProxyRules
            .Where(r => r.Status == ProxyRuleStatus.Active)
            .Include(fgReverseProxyRule => fgReverseProxyRule.Locations)
            .Include(fgReverseProxyRule => fgReverseProxyRule.AccessPolicy)
            .ToListAsync();

        var clusters = new Dictionary<string, ClusterConfig>();
        var routes = new List<RouteConfig>();

        foreach (var rule in rules)
        {
            var clusterId = $"fg:{rule.Id}";

            clusters[clusterId] = new ClusterConfig
            {
                ClusterId = clusterId,
                Destinations = new Dictionary<string, DestinationConfig>
                {
                    ["default"] = new()
                    {
                        Address = $"{rule.DestinationScheme}://{rule.DestinationHost}:{rule.DestinationPort}"
                    }
                },
                HttpRequest = new ForwarderRequestConfig
                {
                    Version = rule.Http2Support ? HttpVersion.Version20 : HttpVersion.Version11,
                    VersionPolicy = HttpVersionPolicy.RequestVersionOrLower,
                }
            };

            var transforms = new List<Dictionary<string, string>>();
            
            if (!string.IsNullOrEmpty(rule.AdditionalHeadersJson))
            {
                var customHeaders = JsonSerializer.Deserialize<Dictionary<string, string>>(rule.AdditionalHeadersJson);
                if (customHeaders != null)
                {
                    foreach (var (key, value) in customHeaders)
                    {
                        transforms.Add(new Dictionary<string, string>
                        {
                            ["RequestHeader"] = key, ["Set"] = value
                        });
                    }
                }
            }

            if (rule.CacheAssets)
            {
                transforms.Add(new Dictionary<string, string>
                {
                    ["ResponseHeader"] = "Cache-Control",
                    ["Set"] = "public, max-age=86400"
                });
            }

            routes.Add(new RouteConfig
            {
                RouteId = $"fg:{rule.Id}",
                ClusterId = clusterId,
                Match = new RouteMatch { Hosts = [rule.Source] },
                Transforms = transforms.Count > 0 ? transforms : null,
            });

            if (rule.Locations is not { Count: > 0 })
                continue;
            
            foreach (var loc in rule.Locations)
            {
                var locClusterId = $"fg:{rule.Id}:{loc.Path}";
                clusters[locClusterId] = new ClusterConfig
                {
                    ClusterId = locClusterId,
                    Destinations = new Dictionary<string, DestinationConfig>
                    {
                        ["default"] = new()
                        {
                            Address = $"{loc.Scheme}://{loc.ForwardHost}:{loc.ForwardPort}"
                        }
                    }
                };

                routes.Add(new RouteConfig
                {
                    RouteId = locClusterId,
                    ClusterId = locClusterId,
                    Match = new RouteMatch
                    {
                        Hosts = [rule.Source],
                        Path = loc.Path + "/{**catch-all}"
                    },
                    Transforms = transforms.Count > 0 ? transforms : null,
                });
            }
        }

        if (env.IsDevelopment())
        {
            // Dev-only: Kestrel (API port) is the sole entry — anything the app requests
            // that isn't /api|/hubs (assets, @vite/client, HMR websocket) forwards to Vite.
            var viteClusterId = "dev:vite";
            clusters[viteClusterId] = new ClusterConfig
            {
                ClusterId = viteClusterId,
                Destinations = new Dictionary<string, DestinationConfig>
                {
                    ["default"] = new() { Address = frontend.Value.BaseUrl }
                }
            };
            
            routes.Add(new RouteConfig
            {
                RouteId = viteClusterId,
                ClusterId = viteClusterId,
                Match = new RouteMatch
                {
                    Hosts = ["localhost", "127.0.0.1"],
                    Path = "{**catch-all}"
                }
            });
        }

        var oldConfig = _config;
        _config = new FrontgateProxyConfig(routes, [.. clusters.Values]);
        oldConfig.SignalChange(); // notify YARP
        
        ForceSslSources.Clear();
        foreach (var rule in rules.Where(r => r.ForceSsl))
            ForceSslSources.TryAdd(rule.Source, 0);
        
        WebSocketSources.Clear();
        foreach (var ruleWs in rules.Where(r => r.WebSocketsSupport))
            WebSocketSources.TryAdd(ruleWs.Source, 0);
        
        HstsSources.Clear();
        foreach (var rule in rules.Where(r => r.HstsEnabled))
            HstsSources.TryAdd(rule.Source, 0);

        HstsSubdomainSources.Clear();
        foreach (var rule in rules.Where(r => r.HstsSubdomains))
            HstsSubdomainSources.TryAdd(rule.Source, 0);

        BlockExploitSources.Clear();
        foreach (var rule in rules.Where(r => r.BlockCommonExploits))
            BlockExploitSources.TryAdd(rule.Source, 0);
        
        AccessSources.Clear();
        foreach (var rule in rules)
            AccessSources[rule.Source] = (rule.Access, rule.AccessPolicy);

        RateLimitSources.Clear();
        foreach (var rule in rules.Where(r => r.RateLimit.HasValue))
            RateLimitSources[rule.Source] = (rule.RateLimit!.Value, rule.RateLimitWindowSec ?? 60);
        
        HasDryRun = await db.FgReverseProxyRules.AnyAsync(r => r.DryRunExpiresAt != null);
    }
}

internal class FrontgateProxyConfig(IReadOnlyList<RouteConfig> routes, IReadOnlyList<ClusterConfig> clusters) : IProxyConfig
{
    private readonly CancellationTokenSource _cts = new();
    public IReadOnlyList<RouteConfig> Routes => routes;
    public IReadOnlyList<ClusterConfig> Clusters => clusters;
    public IChangeToken ChangeToken => new CancellationChangeToken(_cts.Token);
    public void SignalChange() => _cts.Cancel();
}