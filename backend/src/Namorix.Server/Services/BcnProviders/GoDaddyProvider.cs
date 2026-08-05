using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public sealed class GoDaddyProvider(IHttpClientFactory httpFactory) : IBcnProviderClient
{
    public BcnProviderInfo Info => new("godaddy", BcnProviderKind.Rest,
    [
        new BcnCredentialField("apiKey", BcnCredentialFieldType.Secret),
        new BcnCredentialField("apiSecret", BcnCredentialFieldType.Secret),
        new BcnCredentialField("zone", BcnCredentialFieldType.Text)
    ]);

    public async Task<BcnUpdateResult> UpdateAsync(string hostname, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct)
    {
        var zone = config.Zone ?? "";
        var name = hostname.Length > zone.Length ? hostname[..^(zone.Length + 1)] : "@";

        var targets = new List<(string Type, IPAddress Ip)>();
        if (ipv4 is not null) targets.Add(("A", ipv4));
        if (ipv6 is not null) targets.Add(("AAAA", ipv6));
        if (targets.Count == 0) return new BcnUpdateResult(false, BcnErrorCodes.NoIp);

        using var client = httpFactory.CreateClient("BcnRest");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("sso-key", $"{config.ApiKey}:{config.ApiSecret}");

        foreach (var (type, ip) in targets)
        {
            var payload = JsonSerializer.Serialize(new[] { new { data = ip.ToString() } });
            using var req = new HttpRequestMessage(HttpMethod.Put,
                $"https://api.godaddy.com/v1/domains/{Uri.EscapeDataString(zone)}/records/{type}/{Uri.EscapeDataString(name)}");
            
            req.Content = new StringContent(payload, Encoding.UTF8, "application/json");
            using var resp = await client.SendAsync(req, ct);

            if ((int)resp.StatusCode == StatusCodes.Status429TooManyRequests)
                return new BcnUpdateResult(false, BcnErrorCodes.RateLimited,
                    new Dictionary<string, object?> { ["httpStatus"] = 429 }, RateLimited: true);
            
            if (!resp.IsSuccessStatusCode)
                return new BcnUpdateResult(false, BcnHttpStatus.ToErrorCode(resp.StatusCode),
                    new Dictionary<string, object?> { ["httpStatus"] = (int)resp.StatusCode });
        }
        
        return new BcnUpdateResult(true);
    }

    public Task<BcnTestResult> TestAsync(string hostname, BcnProviderConfig config, IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct) =>
        UpdateAsync(hostname, config, ipv4, ipv6, ct)
            .ContinueWith(t => new BcnTestResult(t.Result.Success, t.Result.Code, t.Result.Params), ct);
}