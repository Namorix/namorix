using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public sealed class BcnRestJsonProvider(IHttpClientFactory httpFactory) : IBcnProviderClient
{
    private readonly ConcurrentDictionary<string, string> _recordIds = new();

    public BcnProviderInfo Info => new("custom", BcnProviderKind.Rest, []);

    public async Task<BcnUpdateResult> UpdateAsync(string hostname, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(config.EndpointTemplate))
            return new BcnUpdateResult(false, BcnErrorCodes.ConfigInvalid,
                new Dictionary<string, object?> { ["field"] = "endpointTemplate" });
        
        if (config.EndpointTemplate.Contains("{recordId}") &&
            string.IsNullOrWhiteSpace(config.RecordLookupTemplate))
            return new BcnUpdateResult(false, BcnErrorCodes.ConfigInvalid,
                new Dictionary<string, object?> { ["field"] = "recordLookupTemplate" });
        
        var ip = ipv6 ?? ipv4;
        if (ip is null)
            return new BcnUpdateResult(false, BcnErrorCodes.NoIp);

        using var client = httpFactory.CreateClient("BcnRest");
        if (!string.IsNullOrEmpty(config.ApiToken))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", config.ApiToken);
        else if (!string.IsNullOrEmpty(config.ApiKey))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(config.ApiKey, config.ApiSecret);

        for (var attempt = 0; attempt < 2; attempt++)
        {
            if (!_recordIds.TryGetValue(hostname, out var recordId))
            {
                recordId = await LookupRecordIdAsync(client, hostname, config, ct);
                if (recordId is null)
                    return new BcnUpdateResult(false, BcnErrorCodes.HostnameNotFound,
                        new Dictionary<string, object?> { ["hostname"] = hostname });
                _recordIds[hostname] = recordId;
            }

            var endpoint = BcnTemplate.Replace(config.EndpointTemplate ?? string.Empty, hostname, ipv4, ipv6, config)
                .Replace("{recordId}", recordId);
            var body = BcnTemplate.Replace(config.BodyTemplate ?? string.Empty, hostname, ipv4, ipv6, config);

            using var request = new HttpRequestMessage(new HttpMethod(config.Method ?? "PUT"), endpoint);
            if (!string.IsNullOrEmpty(body))
                request.Content = new StringContent(body, Encoding.UTF8, "application/json");

            using var response = await client.SendAsync(request, ct);

            if ((int)response.StatusCode == StatusCodes.Status404NotFound)
            {
                _recordIds.TryRemove(hostname, out _);   // recordId stale → re-lookup once
                if (attempt == 0) continue;
            }

            return await ClassifyAsync(response, config);
        }

        return new BcnUpdateResult(false, BcnErrorCodes.ProviderError);
    }

    public string GetDomain(string hostname, BcnProviderConfig config) => hostname;
    
    private static async Task<string?> LookupRecordIdAsync(HttpClient client, string hostname,
        BcnProviderConfig config, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(config.RecordLookupTemplate)) return null;
        var url = BcnTemplate.Replace(config.RecordLookupTemplate, hostname, null, null, config);
        using var resp = await client.GetAsync(url, ct);
        if (!resp.IsSuccessStatusCode) return null;
        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        return JsonPointer(doc.RootElement, config.RecordIdPath)?.GetString();
    }

    private static async Task<BcnUpdateResult> ClassifyAsync(HttpResponseMessage resp, BcnProviderConfig config)
    {
        if ((int)resp.StatusCode == StatusCodes.Status429TooManyRequests)
            return new BcnUpdateResult(false, BcnErrorCodes.RateLimited,
                new Dictionary<string, object?> { ["httpStatus"] = 429 }, RateLimited: true);

        if (!resp.IsSuccessStatusCode)
            return new BcnUpdateResult(false, BcnHttpStatus.ToErrorCode(resp.StatusCode),
                new Dictionary<string, object?> { ["httpStatus"] = (int)resp.StatusCode });

        if (string.IsNullOrEmpty(config.SuccessPath))   // no success path → 2xx = success
            return new BcnUpdateResult(true);

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        return JsonPointer(doc.RootElement, config.SuccessPath) is { } el && JsonTruthy(el)
            ? new BcnUpdateResult(true)
            : new BcnUpdateResult(false, BcnErrorCodes.ProviderError);
    }

    private static JsonElement? JsonPointer(JsonElement root, string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return root;
        var current = root;
        foreach (var token in path.Split('/', StringSplitOptions.RemoveEmptyEntries))
        {
            if (current.ValueKind == JsonValueKind.Object && current.TryGetProperty(token, out var next))
                current = next;
            else if (current.ValueKind == JsonValueKind.Array && int.TryParse(token, out var i)
                && i >= 0 && i < current.GetArrayLength())
                current = current[i];
            else return null;
        }
        return current;
    }

    private static bool JsonTruthy(JsonElement el) => el.ValueKind switch
    {
        JsonValueKind.True => true,
        JsonValueKind.String => !string.IsNullOrEmpty(el.GetString()),
        JsonValueKind.Number => el.GetDecimal() != 0,
        JsonValueKind.Array => el.GetArrayLength() > 0,
        _ => false,
    };

    public Task<BcnTestResult> TestAsync(string hostname, BcnProviderConfig config, IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct) =>
        UpdateAsync(hostname, config, ipv4, ipv6, ct)
            .ContinueWith(t => new BcnTestResult(t.Result.Success, t.Result.Code, t.Result.Params), ct);
}