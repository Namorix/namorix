using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace Namorix.Core.OAuth;

public class NmxOAuth2Client(HttpClient http, NmxAddonConfig config, ILogger<NmxOAuth2Client> logger)
{
    private string CredentialsFile => $"{config.DataDir}/oauth.json";
    
    private readonly RSA _key = RSA.Create();
    private (string Token, DateTime ExpiresAt)? _cached;
    private string? _clientId;
    private bool _initialized;
    
    private async Task EnsureInitializedAsync(CancellationToken ct)
    {
        if (_initialized)
            return;
        
        if (!File.Exists(CredentialsFile))
        {
            var stored = JsonSerializer.Deserialize<StoredCredentials>(
                await File.ReadAllTextAsync(CredentialsFile, ct));
            _key.ImportFromPem(stored!.PrivateKeyPem);
            _clientId = stored.ClientId;
        }
        else if (config.RegistrationToken is not null)
        {
            await RegisterAsync(ct);
        }
        else
        {
            throw new InvalidOperationException(
                "No credentials found and NMX_REGISTRATION_TOKEN not set.");
        }

        _initialized = true;
    }
    
    private async Task RegisterAsync(CancellationToken ct)
    {
        Console.WriteLine("RegisterAsync 1");
        using var rsa = RSA.Create(2048);
        var publicKeyPem = rsa.ExportSubjectPublicKeyInfoPem();
        var privateKeyPem = rsa.ExportPkcs8PrivateKeyPem();
        
        var res = await http.PostAsJsonAsync(
            $"{config.ApiUrl}{OAuthEndpoints.Register}",
            new {
                registrationToken = config.RegistrationToken,
                publicKey = publicKeyPem
            }, ct);
        await EnsureSuccessAsync(res, "OAuth registration", ct);
        
        var result = await res.Content
            .ReadFromJsonAsync<RegisterResponse>(cancellationToken: ct);
        
        ArgumentNullException.ThrowIfNull(result);
        _clientId = result.ClientId;
        _key.ImportFromPem(privateKeyPem);

        Directory.CreateDirectory(Path.GetDirectoryName(CredentialsFile)!);
        await File.WriteAllTextAsync(CredentialsFile,
            JsonSerializer.Serialize(new StoredCredentials(_clientId, privateKeyPem)), ct);
    }
    
    public async Task<string> GetAccessTokenAsync(CancellationToken ct = default)
    {
        await EnsureInitializedAsync(ct);
        if (_cached is { } cached && DateTime.UtcNow < cached.ExpiresAt)
            return cached.Token;
        
        var handler = new JwtSecurityTokenHandler();
        var assertion = handler.CreateEncodedJwt(new SecurityTokenDescriptor
        {
            Issuer = _clientId,
            Subject = new ClaimsIdentity([
                new Claim(ClaimTypes.NameIdentifier, _clientId!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            ]),
            Audience = $"{config.ApiUrl}{OAuthEndpoints.Token}",
            Expires = DateTime.UtcNow.AddMinutes(config.ClientAssertionTtlMinutes),
            SigningCredentials = new SigningCredentials(
                new RsaSecurityKey(_key), SecurityAlgorithms.RsaSha256),
        });
        
        var form = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            [Constants.OAuth.OAuthParameter.GrantType] = Constants.OAuth.GrantTypes.ClientCredentials,
            [Constants.OAuth.OAuthParameter.ClientAssertionType] = Constants.OAuth.NmxOAuth2Defaults.JwtBearerAssertionType,
            [Constants.OAuth.OAuthParameter.ClientAssertion] = assertion,
        });
        
        var res = await http.PostAsync($"{config.ApiUrl}{OAuthEndpoints.Token}",
            form, ct);
        await EnsureSuccessAsync(res, "Oauth token request", ct);

        var json = await res.Content
            .ReadFromJsonAsync<OAuthTokenResponse>(cancellationToken: ct);
        ArgumentNullException.ThrowIfNull(json);

        _cached = (json.AccessToken,
            DateTime.UtcNow.AddSeconds(json.ExpiresIn - 30));
        return _cached.Value.Token;
    }
    
    private async Task EnsureSuccessAsync(HttpResponseMessage response, string action, CancellationToken ct)
    {
        if (response.IsSuccessStatusCode)
            return;

        var error = await response.Content
            .ReadFromJsonAsync<OAuthErrorResponse>(cancellationToken: ct);

        logger.LogError(
            "{Action} failed: status={StatusCode}, error={Error}, description={Description}",
            action, response.StatusCode, error?.Error, error?.ErrorDescription);

        throw new NmxOAuthException(action, response.StatusCode, error?.Error, error?.ErrorDescription);
    }
}

public record StoredCredentials(string ClientId, string PrivateKeyPem);
public record RegisterResponse(string ClientId);