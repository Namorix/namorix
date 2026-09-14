using System.Buffers.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Namorix.Core.Constants;
using Namorix.Core.IO;

namespace Namorix.Server.Services;

// Signs addon access tokens with the desktop's own RSA key. Lives in the desktop
// assembly on purpose: Namorix.Core is the addon SDK, and neither the signing code
// nor the private key may be shipped to addons.
public sealed class NmxAddonTokenSigner : IDisposable
{
    private const int KeySizeBits = 2048;

    private const string ClaimSub = "sub";
    private const string ClaimJti = "jti";
    private const string ClaimIat = "iat";
    private const string HeaderKid = "kid";

    private readonly RSA _key;
    private readonly SigningCredentials _credentials;
    private readonly ILogger<NmxAddonTokenSigner> _logger;

    // RSA instance members are not documented as thread safe.
    private readonly Lock _signLock = new();

    public string KeyId { get; }
    public string PublicKeyPem { get; }

    public NmxAddonTokenSigner(DataDirectory dataDir, ILogger<NmxAddonTokenSigner> logger)
    {
        _logger = logger;
        _key = LoadOrCreateKey(dataDir);
        PublicKeyPem = _key.ExportSubjectPublicKeyInfoPem();
        KeyId = ComputeKeyId(_key);
        _credentials = new SigningCredentials(
            new RsaSecurityKey(_key) { KeyId = KeyId }, SecurityAlgorithms.RsaSha256);
    }

    public string Sign(int userId, string clientId, TimeSpan ttl)
    {
        var handler = new JwtSecurityTokenHandler();
        var now = DateTime.UtcNow;

        lock (_signLock)
        {
            var token = new JwtSecurityToken(
                issuer: OAuth.AddonToken.Issuer,
                claims:
                [
                    new Claim(ClaimSub, userId.ToString()),
                    new Claim(OAuth.AddonToken.ClientIdClaim, clientId),
                ],
                notBefore: now,
                expires: now.Add(ttl),
                signingCredentials: _credentials)
            {
                Header =
                {
                    [HeaderKid] = KeyId
                },
                Payload =
                {
                    [ClaimJti] = Guid.NewGuid().ToString("N"),
                    [ClaimIat] = new DateTimeOffset(now).ToUnixTimeSeconds()
                }
            };

            return handler.WriteToken(token);
        }
    }

    private RSA LoadOrCreateKey(DataDirectory dataDir)
    {
        var existing = dataDir.ReadFile(DataDirectory.OAuthSigningKeyFile);
        if (existing is not null)
        {
            var loaded = RSA.Create();
            try
            {
                loaded.ImportFromPem(Encoding.UTF8.GetString(existing));
                return loaded;
            }
            catch (Exception ex)
            {
                loaded.Dispose();
                throw new InvalidOperationException(
                    $"Addon signing key {DataDirectory.OAuthSigningKeyFile} is unreadable. " +
                    "Delete it to regenerate — every already-issued addon token stops verifying.",
                    ex);
            }
        }

        var created = RSA.Create(KeySizeBits);
        var path = dataDir.WriteFile(DataDirectory.OAuthSigningKeyFile,
            Encoding.UTF8.GetBytes(created.ExportPkcs8PrivateKeyPem()));
        RestrictToOwner(path);
        _logger.LogInformation("Generated addon signing key {KeyFile} (kid={KeyId})",
            DataDirectory.OAuthSigningKeyFile, ComputeKeyId(created));
        return created;
    }

    // The file is created with the process umask and narrowed immediately after, so
    // there is a brief window where it may be group/world readable. Acceptable inside
    // the desktop's own data directory; a UnixCreateMode file stream would close the
    // window but DataDirectory owns all writes here.
    private static void RestrictToOwner(string path)
    {
        if (OperatingSystem.IsWindows())
            return;

        File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite);
    }

    private static string ComputeKeyId(RSA key)
        => Base64Url.EncodeToString(SHA256.HashData(key.ExportSubjectPublicKeyInfo()));

    public void Dispose() => _key.Dispose();
}
