using System.Net;
using System.Text;
using System.Text.Json;
using Namorix.Server.Models.Frontgate;

namespace Namorix.Server.Services.Frontgate;

public enum AccessDecision
{
    Allow,
    Deny
}

public class FrontgateAccessService(GeoIpService geoIpService)
{
    public static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };
    
    public AccessDecision Evaluate(ProxyAccessMode mode, FgAccessPolicy? policy, IPAddress clientIp, string? authorizationHeader)
    {
        if (clientIp.IsIPv4MappedToIPv6) 
            clientIp = clientIp.MapToIPv4();

        switch (mode)
        {
            case ProxyAccessMode.Private:
                return IsPrivateIp(clientIp) ? AccessDecision.Allow : AccessDecision.Deny;

            case ProxyAccessMode.Restricted when policy?.Type == AccessPolicyType.IpAllowlist:
                var ips = JsonSerializer.Deserialize<string[]>(policy.RulesJson);
                return ips != null && ips.Any(i => IpMatches(clientIp, i))
                    ? AccessDecision.Allow
                    : AccessDecision.Deny;

            case ProxyAccessMode.Restricted when policy?.Type == AccessPolicyType.IpDenylist:
                var blocked = JsonSerializer.Deserialize<string[]>(policy.RulesJson);
                return blocked != null && blocked.Any(i => IpMatches(clientIp, i))
                    ? AccessDecision.Deny
                    : AccessDecision.Allow;
            
            case ProxyAccessMode.Restricted when policy?.Type == AccessPolicyType.GeoBlock:
                var countries = JsonSerializer.Deserialize<string[]>(policy.RulesJson);
                if (countries is not { Length: > 0 }) return AccessDecision.Allow;
                var code = geoIpService.GetCountryCode(clientIp);
                return code != null && countries.Contains(code, StringComparer.OrdinalIgnoreCase)
                    ? AccessDecision.Allow
                    : AccessDecision.Deny;
            
            case ProxyAccessMode.BasicAuth when policy?.Type == AccessPolicyType.BasicAuth:
                var creds = JsonSerializer.Deserialize<FgBasicAuthPolicy>(policy.RulesJson, SerializerOptions);
                return creds is not null && TryParseBasicAuth(authorizationHeader, out var username, out var password)
                                         && username == creds.Username && BCrypt.Net.BCrypt.Verify(password, creds.PasswordHash)
                    ? AccessDecision.Allow
                    : AccessDecision.Deny;
            
            case ProxyAccessMode.BasicAuth:
                return AccessDecision.Deny;
            
            case ProxyAccessMode.Public:
            default:
                return AccessDecision.Allow;
        }
    }

    private static bool IsPrivateIp(IPAddress ip) =>
        IPAddress.IsLoopback(ip) || ip.GetAddressBytes() is [10, ..] or [172, >= 16 and <= 31, ..] or [192, 168, ..];

    private static bool IpMatches(IPAddress ip, string cidr)     {
        if (!cidr.Contains('/'))
            return ip.ToString() == cidr;

        var parts = cidr.Split('/');
        if (parts.Length != 2 || !int.TryParse(parts[1], out var prefixLength))
            return false;

        var ipBytes = ip.GetAddressBytes();
        var cidrBytes = IPAddress.Parse(parts[0]).GetAddressBytes();

        if (ipBytes.Length != cidrBytes.Length)
            return false;

        var fullBytes = prefixLength / 8;
        var remainingBits = prefixLength % 8;

        for (var i = 0; i < fullBytes; i++)
            if (ipBytes[i] != cidrBytes[i])
                return false;

        if (remainingBits <= 0)
            return true;
        
        var mask = (byte)(0xFF << (8 - remainingBits));
        return (ipBytes[fullBytes] & mask) == (cidrBytes[fullBytes] & mask);
    }
    
    private static bool TryParseBasicAuth(string? header, out string username, out string password)
    {
        username = password = string.Empty;
        if (string.IsNullOrEmpty(header) || !header.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
            return false;
        
        try
        {
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(header[6..].Trim()));
            var idx = decoded.IndexOf(':');
            if (idx < 0) return false;
            username = decoded[..idx];
            password = decoded[(idx + 1)..];
            return true;
        }
        catch (FormatException) { return false; }
    }

}