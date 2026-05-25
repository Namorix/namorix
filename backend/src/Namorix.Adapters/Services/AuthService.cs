using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Namorix.Adapters.Persistence;
using Namorix.Core.Config;
using Namorix.Core.Constants;
using Namorix.Core.Exceptions;
using Namorix.Core.Models;

namespace Namorix.Adapters.Services;

public class AuthService(AppDbContext dbContext, IOptions<JwtConfig> jwtConfig, ILogger<AuthService> logger)
{
    private readonly JwtConfig _jwtConfig = jwtConfig.Value;
    
    private async Task<User> Login(string username, string password)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null ||
            string.IsNullOrEmpty(user.Password) ||
            !BCrypt.Net.BCrypt.Verify(password, user.Password))
        {
            logger.LogWarning("Login failed: invalid credentials for username={Username}", username);
            throw new AuthException(AuthErrors.InvalidCredentials);
        }

        logger.LogInformation("Login success: userId={UserId}, username={Username}", user.Id, user.Username);
        return user;
    }

    public async Task<User> Register(string username, string password)
    {
        var usernameExists = await dbContext.Users.AnyAsync(u => u.Username == username);
        if (usernameExists)
        {
            logger.LogWarning("Register failed: username={Username} already exists", username);
            throw new AuthException(AuthErrors.UsernameExists);
        }

        var userCount = await dbContext.Users.CountAsync();
        var role = userCount == 0 ? UserRole.Admin : UserRole.User;
        var user = new User
        {
            Username = username,
            Password = BCrypt.Net.BCrypt.HashPassword(password),
            Role = role,
            CreatedAt = DateTime.UtcNow
        };
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        logger.LogInformation("User registered: username={Username}, role={Role}", username, role);
        return user;
    }

    public async Task<User?> GetUserById(int userId) =>
        await dbContext.Users.FindAsync(userId);

    public DateTime GetAccessTokenExpirationDateTime() =>
        DateTime.UtcNow.AddSeconds(_jwtConfig.AccessTokenExpirationSeconds);

    public int GetRefreshTokenExpiration(bool rememberMe = false) =>
        rememberMe ? _jwtConfig.RefreshTokenExpirationDaysRemember : _jwtConfig.RefreshTokenExpirationDays;
    
    public DateTime GetRefreshTokenExpirationDatetime(bool rememberMe = false) =>
        DateTime.UtcNow.AddDays(GetRefreshTokenExpiration());
    
    private (string accessToken, string refreshToken, string jti) GenerateTokens(User user)
    {
        var jti = Guid.NewGuid().ToString();
        var expires = GetAccessTokenExpirationDateTime();
        var claims = new[]
        {
            new Claim(JwtClaims.UserId, user.Id.ToString()),
            new Claim(JwtClaims.Username, user.Username),
            new Claim(JwtClaims.Role, user.Role.ToString()),
            new Claim(JwtClaims.Jti, jti),
            new Claim(JwtClaims.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtConfig.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(issuer: _jwtConfig.Issuer, audience: _jwtConfig.Audience, claims: claims,
            expires: expires, signingCredentials: credentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        return (accessToken, refreshToken, jti);
    }

    private static RefreshToken CreateRefreshToken(User user, string jti, string refreshToken,
        string? userAgent, string? fingerprint, string? ipAddress, int ttlDays)
    {
        return new RefreshToken
        {
            UserId = user.Id,
            Jti = jti,
            TokenHash = HashToken(refreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(ttlDays),
            CreatedAt = DateTime.UtcNow,
            UserAgent = userAgent,
            Fingerprint = fingerprint,
            IpAddress = ipAddress
        };
    }

    private static JwtSecurityToken ValidateAndParseToken(string token, SymmetricSecurityKey key, string issuer,
        string audience)
    {
        var handler = new JwtSecurityTokenHandler();
        handler.ValidateToken(token, new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        }, out var validateToken);
        return (JwtSecurityToken)validateToken;
    }

    private static string HashToken(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(Convert.FromBase64String(rawToken)));
    
    public (int userId, string username, int role)? VerifyAccessToken(string token)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtConfig.Secret));

        try
        {
            var jwtToken = ValidateAndParseToken(token, key, _jwtConfig.Issuer, _jwtConfig.Audience);
            var userId = int.Parse(jwtToken.Claims.First(c => c.Type == JwtClaims.UserId).Value);
            var username = jwtToken.Claims.First(c => c.Type == JwtClaims.Username).Value;
            var role = int.Parse(jwtToken.Claims.First(c => c.Type == JwtClaims.Role).Value);

            return (userId, username, role);
        }
        catch
        {
            return null;
        }
    }

    public async Task<(User user, string accessToken, string refreshToken)> RefreshToken(string token,
        string? fingerprint, string? ipAddress)
    {
        string tokenHash;

        try
        {
            tokenHash = HashToken(token);
        }
        catch (FormatException)
        {
            throw new AuthException(AuthErrors.InvalidToken);
        }

        var storedToken = await dbContext.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (storedToken == null)
        {
            logger.LogError("Token reuse detected: hash={Hash}", tokenHash[..12]);
            throw new AuthException(AuthErrors.TokenReuseDetected);
        }

        if (storedToken.ExpiresAt < DateTime.UtcNow)
        {
            dbContext.RefreshTokens.Remove(storedToken);
            await dbContext.SaveChangesAsync();
            logger.LogInformation("Expired token refresh attempt: userId={UserId}", storedToken.UserId);
            throw new AuthException(AuthErrors.InvalidToken);
        }

        if (!string.IsNullOrEmpty(storedToken.Fingerprint) &&
            !string.IsNullOrEmpty(fingerprint) &&
            storedToken.Fingerprint != fingerprint)
        {
            await RevokeAllUserTokens(storedToken.UserId);
            logger.LogError("Fingerprint mismatch — revoking all tokens: userId={UserId}", storedToken.UserId);
            throw new AuthException(AuthErrors.FingerprintMismatch);
        }

        if (storedToken.User == null)
            throw new AuthException(AuthErrors.InvalidToken);

        var user = storedToken.User;
        dbContext.RefreshTokens.Remove(storedToken);

        var (newAccessToken, newRefreshToken, newJti) = GenerateTokens(user);
        var ttlDays = GetRefreshTokenExpiration();
        var newEntity = CreateRefreshToken(user, newJti, newRefreshToken,
            storedToken.UserAgent, fingerprint, ipAddress, ttlDays);

        dbContext.RefreshTokens.Add(newEntity);
        try
        {
            await dbContext.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // Token was already deleted by a concurrent request (another refresh
            // or cleanup worker). Treat as token reuse — client must re-login.
            logger.LogError("Concurrent refresh conflict — token reuse detected: userId={UserId}", user.Id);
            throw new AuthException(AuthErrors.TokenReuseDetected);
        }

        logger.LogInformation("Token refreshed: userId={UserId}", user.Id);
        return (user, newAccessToken, newRefreshToken);
    }

    public async Task RevokeTokenByHash(string rawToken)
    {
        try
        {
            var hash = HashToken(rawToken);
            var token = await dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == hash);

            if (token != null)
            {
                dbContext.RefreshTokens.Remove(token);
                await dbContext.SaveChangesAsync();
            }
        }
        catch (FormatException)
        {
            return;
        }
    }

    public async Task RevokeAllUserTokens(int userId)
    {
        var tokens = await dbContext.RefreshTokens
            .Where(rt => rt.UserId == userId).ToListAsync();
        logger.LogWarning("Revoking {Count} tokens for userId={UserId}", tokens.Count, userId);
        dbContext.RefreshTokens.RemoveRange(tokens);
        await dbContext.SaveChangesAsync();
    }

    public async Task<(User user, string accessToken, string refreshToken)> LoginWithTokens(
        string username, string password, bool rememberMe, string? userAgent, string? fingerprint, string? ipAddress)
    {
        var user = await Login(username, password);
        var ttlDays = GetRefreshTokenExpiration(rememberMe);

        var (accessToken, refreshToken, jti) = GenerateTokens(user);
        var refreshTokenEntity = CreateRefreshToken(user, jti, refreshToken,
            userAgent, fingerprint, ipAddress, ttlDays);
        dbContext.RefreshTokens.Add(refreshTokenEntity);
        await dbContext.SaveChangesAsync();

        return (user, accessToken, refreshToken);
    }
}

