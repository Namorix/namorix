using System.Net;
using System.Net.Sockets;

namespace Namorix.Server.Helpers;

public static class NetworkHelper
{
    public static bool OriginAllow(string origin)
    {
        var host = new Uri(origin).Host;

        if (host == "localhost")
            return true;

        return IPAddress.TryParse(host, out var ip) && IsPrivateIp(ip);
    }

    private static bool IsPrivateIp(IPAddress ip)
    {
        if (ip.AddressFamily == AddressFamily.InterNetworkV6)
        {
            if (IPAddress.IsLoopback(ip))
                return true;

            if (!ip.IsIPv4MappedToIPv6)
                return true;

            ip = ip.MapToIPv4();
        }

        var b = ip.GetAddressBytes();
        return b[0] == 10 ||
               b[0] == 127 ||
               (b[0] == 172 && b[1] >= 16 && b[1] <= 31) ||
               (b[0] == 192 && b[1] == 168);
    }
}