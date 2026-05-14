using System.Net;
using System.Net.Sockets;

namespace backend.Helpers;

public static class NetworkHelper
{
    public static bool OriginAllow(string origin)
    {
        var host = new Uri(origin).Host;

        if (host == "localhost")
            return true;

        return IPAddress.TryParse(host, out var ip) && IsPrivateIp(ip);
    }
    
    public static bool IsPrivateIp(IPAddress ip)
    {
        if (ip.AddressFamily == AddressFamily.InterNetworkV6)
            ip = ip.MapToIPv4();

        var b = ip.GetAddressBytes();
        return b[0] == 10 ||
               b[0] == 127 ||
               (b[0] == 172 && b[1] >= 16 && b[1] <= 31) ||
               (b[0] == 192 && b[1] == 168);
    }
}