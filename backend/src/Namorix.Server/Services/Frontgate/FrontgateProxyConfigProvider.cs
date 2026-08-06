using System.Collections.Concurrent;
using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Primitives;
using Namorix.Server.Models;
using Namorix.Server.Persistence;
using Yarp.ReverseProxy.Configuration;
using Yarp.ReverseProxy.Forwarder;

namespace Namorix.Server.Services;

public class FrontgateProxyConfigProvider(IServiceScopeFactory scopeFactory) : IProxyConfigProvider
{
    private FrontgateProxyConfig _config = new([], []);
    public ConcurrentDictionary<string, byte> ForceSslSources { get; } = new();

    public IProxyConfig GetConfig() => _config;

    public async Task UpdateAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Only load active rules; join with certificates to get domains if applicable
        var rules = await db.FgReverseProxyRules
            .Where(r => r.Status == ProxyRuleStatus.Active)
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
                    VersionPolicy = rule.Http2Support
                        ? HttpVersionPolicy.RequestVersionExact
                        : HttpVersionPolicy.RequestVersionOrLower,
                }
            };

            var transforms = new List<Dictionary<string, string>>();
            if (rule.WebSocketsSupport)
            {
                transforms.Add(new Dictionary<string, string>
                {
                    ["X-Forwarded"] = "Transform"
                });
            }

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

            routes.Add(new RouteConfig
            {
                RouteId = $"fg:{rule.Id}",
                ClusterId = clusterId,
                Match = new RouteMatch { Hosts = [rule.Source] },
                Transforms = transforms.Count > 0 ? transforms : null,
            });
        }

        var oldConfig = _config;
        _config = new FrontgateProxyConfig(routes, [.. clusters.Values]);
        oldConfig.SignalChange(); // notify YARP
        
        ForceSslSources.Clear();
        foreach (var rule in rules.Where(r => r.ForceSsl))
            ForceSslSources.TryAdd(rule.Source, 0);
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