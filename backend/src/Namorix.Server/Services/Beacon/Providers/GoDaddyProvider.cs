using System.Net;
using System.Net.Http.Headers;
using System.Net.Mime;
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
        new BcnCredentialField(BcnCredentialParam.ApiKey, BcnCredentialFieldType.Secret),
        new BcnCredentialField(BcnCredentialParam.ApiSecret, BcnCredentialFieldType.Secret),
        new BcnCredentialField(BcnCredentialParam.Zone, BcnCredentialFieldType.Text)
    ]);

    public async Task<BcnUpdateResult> UpdateAsync(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct)
    {
        var zone = config.Zone ?? "";

        var targets = new List<(string Type, IPAddress Ip)>();
        if (ipv4 is not null) targets.Add(("A", ipv4));
        if (ipv6 is not null) targets.Add(("AAAA", ipv6));
        if (targets.Count == 0) return new BcnUpdateResult(false, BcnErrorCodes.NoIp);

        using var client = httpFactory.CreateClient(BcnHttpClientNames.Rest);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(BcnHeaderKey.SsoKey, $"{config.ApiKey}:{config.ApiSecret}");

        BcnUpdateResult? firstFailure = null;
        foreach (var tag in host.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            foreach (var (type, ip) in targets)
            {
                var payload = JsonSerializer.Serialize(new[] { new { data = ip.ToString() } });
                using var req = new HttpRequestMessage(HttpMethod.Put,
                    $"https://api.godaddy.com/v1/domains/{Uri.EscapeDataString(zone)}/records/{type}/{Uri.EscapeDataString(tag)}");

                req.Content = new StringContent(payload, Encoding.UTF8, MediaTypeNames.Application.Json);
                using var resp = await client.SendAsync(req, ct);

                if ((int)resp.StatusCode == StatusCodes.Status429TooManyRequests)
                {
                    firstFailure ??= new BcnUpdateResult(false, BcnErrorCodes.RateLimited,
                        new Dictionary<string, object?> { [BcnParam.HttpStatus] = StatusCodes.Status429TooManyRequests }, RateLimited: true);
                    continue;
                }

                if (!resp.IsSuccessStatusCode)
                {
                    firstFailure ??= new BcnUpdateResult(false, BcnHttpStatus.ToErrorCode(resp.StatusCode),
                        new Dictionary<string, object?> { [BcnParam.HttpStatus] = (int)resp.StatusCode, [BcnParam.Hostname] = tag });
                }
            }
        }

        return firstFailure ?? new BcnUpdateResult(true);
    }

    public Task<BcnTestResult> TestAsync(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct) =>
        UpdateAsync(host, domain, config, ipv4, ipv6, ct)
            .ContinueWith(t => new BcnTestResult(t.Result.Success, t.Result.Code, t.Result.Params), ct);
}
