using System.Security.Cryptography;

namespace Namorix.Core.Utils;

public class TokenHash
{
    public static string HashToken(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(Convert.FromBase64String(rawToken)));
}