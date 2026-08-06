using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Beacon;

namespace Namorix.Server.Services.Beacon.Providers;

public abstract class BcnGetProviderBase(IHttpClientFactory httpFactory) : IBcnProviderClient
{
    public abstract BcnProviderInfo Info { get; }

    protected abstract string BuildUrl(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6);
    protected abstract BcnUpdateResult Classify(string body);

    public virtual async Task<BcnUpdateResult> UpdateAsync(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct)
    {
        var url = BuildUrl(host, domain, config, ipv4, ipv6);
        using var client = httpFactory.CreateClient(BcnHttpClientNames.Get);
        using var request = new HttpRequestMessage(HttpMethod.Get, url);

        if (!string.IsNullOrEmpty(config.User))
            request.Headers.Authorization = new AuthenticationHeaderValue(BcnHeaderKey.Basic,
                Convert.ToBase64String(Encoding.UTF8.GetBytes($"{config.User}:{config.Password}")));

        using var response = await client.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if ((int)response.StatusCode == StatusCodes.Status429TooManyRequests)
            return new BcnUpdateResult(false, BcnErrorCodes.RateLimited,
                new Dictionary<string, object?> { [BcnParam.HttpStatus] = StatusCodes.Status429TooManyRequests }, RateLimited: true);

        if (!response.IsSuccessStatusCode)
            return new BcnUpdateResult(false, BcnErrorCodes.ProviderError,
                new Dictionary<string, object?> { [BcnParam.HttpStatus] = (int)response.StatusCode });
        
        return Classify(body);
    }

    public virtual async Task<BcnTestResult> TestAsync(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct)
    {
        try
        {
            var result = await UpdateAsync(host, domain, config, ipv4, ipv6, ct);
            return new BcnTestResult(result.Success, result.Code, result.Params);
        }
        catch (Exception)
        {
            return new BcnTestResult(false, BcnErrorCodes.ProviderError);
        }
    }
}