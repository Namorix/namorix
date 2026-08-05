using System.Net;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public static class BcnTemplate
{
    public static string Replace(string template, string host, string domain,
        IPAddress? ipv4, IPAddress? ipv6, BcnProviderConfig config)
    {
        var ip = ipv4 ?? ipv6;
        return template
            .Replace("{host}", host)
            .Replace("{domain}", domain)
            .Replace("{ip}", ip?.ToString() ?? string.Empty)
            .Replace("{ipv6}", ipv6?.ToString() ?? string.Empty)
            .Replace("{token}", config.Token ?? string.Empty)
            .Replace("{user}", config.User ?? string.Empty)
            .Replace("{password}", config.Password ?? string.Empty)
            .Replace("{zone}", config.Zone ?? string.Empty);
    }
}