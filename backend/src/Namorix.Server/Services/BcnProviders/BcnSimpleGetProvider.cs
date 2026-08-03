using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.RegularExpressions;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public sealed class BcnSimpleGetProvider(IHttpClientFactory httpFactory) : IBcnProviderClient
{
    public BcnProviderInfo Info => new("custom", BcnProviderKind.Get, []);

    public async Task<BcnUpdateResult> UpdateAsync(string hostname, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(config.UrlTemplate))
            return new BcnUpdateResult(false, BcnErrorCodes.ConfigInvalid,
                new Dictionary<string, object?> { ["field"] = "urlTemplate" });
        
        if (config.AuthType == "basic" &&
            (string.IsNullOrWhiteSpace(config.User) || string.IsNullOrWhiteSpace(config.Password)))
            return new BcnUpdateResult(false, BcnErrorCodes.ConfigInvalid,
                new Dictionary<string, object?> { ["field"] = "user" });
        
        var url = BcnTemplate.Replace(config.UrlTemplate ?? string.Empty, hostname, ipv4, ipv6, config);
        using var client = httpFactory.CreateClient("BcnGet");
        using var request = new HttpRequestMessage(HttpMethod.Get, url);

        if (config.AuthType == "basic" && !string.IsNullOrEmpty(config.User))
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic",
                Convert.ToBase64String(Encoding.UTF8.GetBytes($"{config.User}:{config.Password}")));

        using var response = await client.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        
        if ((int)response.StatusCode == StatusCodes.Status429TooManyRequests)
            return new BcnUpdateResult(false, BcnErrorCodes.RateLimited,
                new Dictionary<string, object?> { ["httpStatus"] = 429 }, RateLimited: true);

        if (!response.IsSuccessStatusCode)
            return new BcnUpdateResult(false, BcnHttpStatus.ToErrorCode(response.StatusCode),
                new Dictionary<string, object?> { ["httpStatus"] = (int)response.StatusCode });

        return MatchSuccess(body, config);
    }

    private static BcnUpdateResult MatchSuccess(string body, BcnProviderConfig config)
    {
        var ok = config.SuccessMatch switch
        {
            "http200" => true,
            "custom" => !string.IsNullOrEmpty(config.SuccessContains)
                && Regex.IsMatch(body, config.SuccessContains),
            _ => !string.IsNullOrEmpty(config.SuccessContains) && body.Contains(config.SuccessContains),
        };
        return ok ? new BcnUpdateResult(true)
                  : new BcnUpdateResult(false, BcnErrorCodes.ProviderError);
    }

    public Task<BcnTestResult> TestAsync(string hostname, BcnProviderConfig config, IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct) =>
        UpdateAsync(hostname, config, ipv4, ipv6, ct)
            .ContinueWith(t => new BcnTestResult(t.Result.Success, t.Result.Code, t.Result.Params), ct);
}