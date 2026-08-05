using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public sealed class CloudflareProvider(IHttpClientFactory httpFactory) : IBcnProviderClient
{
    public BcnProviderInfo Info => new("cloudflare", BcnProviderKind.Rest,
        [
            new BcnCredentialField("apiToken", BcnCredentialFieldType.Secret),
            new BcnCredentialField("zone", BcnCredentialFieldType.Text)
        ]);

    public async Task<BcnUpdateResult> UpdateAsync(string hostname, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct)
    {
        var targets = new List<(string Type, IPAddress Ip)>();
        if (ipv4 is not null) targets.Add(("A", ipv4));
        if (ipv6 is not null) targets.Add(("AAAA", ipv6));
        if (targets.Count == 0)
            return new BcnUpdateResult(false, BcnErrorCodes.NoIp);

        if (string.IsNullOrEmpty(config.Zone))
            return new BcnUpdateResult(false, BcnErrorCodes.ZoneNotFound);

        using var client = httpFactory.CreateClient("BcnRest");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", config.ApiToken);

        var zoneId = await FindZoneIdAsync(client, config.Zone, ct);
        if (zoneId is null)
        {
            return new BcnUpdateResult(false, BcnErrorCodes.ZoneNotFound,
                new Dictionary<string, object?> { ["zone"] = config.Zone });
        }

        foreach (var (type, ip) in targets)
        {
            var recordId = await FindRecordIdAsync(client, zoneId, hostname, type, ct);
            if (recordId is null)
            {
                return new BcnUpdateResult(false, BcnErrorCodes.HostnameNotFound,
                    new Dictionary<string, object?> { ["hostname"] = hostname, ["type"] = type });
            }

            var payload = JsonSerializer.Serialize(new { type, name = hostname, content = ip.ToString(), ttl = 1, proxied = false });
            using var req = new HttpRequestMessage(HttpMethod.Patch,
                $"https://api.cloudflare.com/client/v4/zones/{zoneId}/dns_records/{recordId}");
            req.Content = new StringContent(payload, Encoding.UTF8, "application/json");

            using var resp = await client.SendAsync(req, ct);
            var result = await ClassifyAsync(resp);
            if (!result.Success) return result;
        }

        return new BcnUpdateResult(true);
    }

    private static async Task<string?> FindZoneIdAsync(HttpClient client, string zone, CancellationToken ct)
    {
        using var resp = await client.GetAsync($"https://api.cloudflare.com/client/v4/zones?name={Uri.EscapeDataString(zone)}", ct);
        if (!resp.IsSuccessStatusCode) return null;
        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        foreach (var item in doc.RootElement.GetProperty("result").EnumerateArray())
            if (item.TryGetProperty("id", out var id)) return id.GetString();
        return null;
    }

    private static async Task<string?> FindRecordIdAsync(HttpClient client, string zoneId, string name, string type, CancellationToken ct)
    {
        using var resp = await client.GetAsync($"https://api.cloudflare.com/client/v4/zones/{zoneId}/dns_records?type={type}&name={Uri.EscapeDataString(name)}", ct);
        if (!resp.IsSuccessStatusCode) return null;
        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        foreach (var item in doc.RootElement.GetProperty("result").EnumerateArray())
            if (item.TryGetProperty("id", out var id)) return id.GetString();
        return null;
    }

    private static async Task<BcnUpdateResult> ClassifyAsync(HttpResponseMessage resp)
    {
        var text = await resp.Content.ReadAsStringAsync();
        if ((int)resp.StatusCode == StatusCodes.Status429TooManyRequests)
        {
            return new BcnUpdateResult(false, BcnErrorCodes.RateLimited,
                new Dictionary<string, object?> { ["httpStatus"] = 429 }, RateLimited: true);
        }

        if (!resp.IsSuccessStatusCode)
        {
            return new BcnUpdateResult(false, BcnHttpStatus.ToErrorCode(resp.StatusCode),
                new Dictionary<string, object?> { ["httpStatus"] = (int)resp.StatusCode });
        }

        using var doc = JsonDocument.Parse(text);
        return doc.RootElement.GetProperty("success").GetBoolean()
            ? new BcnUpdateResult(true)
            : new BcnUpdateResult(false, BcnErrorCodes.ProviderError);
    }

    public Task<BcnTestResult> TestAsync(string hostname, BcnProviderConfig config, IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct) =>
        UpdateAsync(hostname, config, ipv4, ipv6, ct)
            .ContinueWith(t => new BcnTestResult(t.Result.Success, t.Result.Code, t.Result.Params), ct);
}