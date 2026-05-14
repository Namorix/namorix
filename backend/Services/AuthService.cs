using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Config;
using backend.Constants;
using backend.Exceptions;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

public class AuthService(AppDbContext dbContext, IOptions<JwtConfig> jwtConfig)
{
    private readonly JwtConfig _jwtConfig = jwtConfig.Value;
    
    private async Task<User> Login(string username, string password)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.Password))
        {
            throw new AuthException(AuthErrors.InvalidCredentials);
        }

        return user;
    }

    public async Task<User> Register(string username, string password)
    {
        var usernameExists = await dbContext.Users.AnyAsync(u => u.Username == username);
        if (usernameExists)
            throw new AuthException(AuthErrors.UsernameExists);

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
        return user;
    }

    public async Task<User?> GetUserById(int userId) =>
        await dbContext.Users.FindAsync(userId);

    private (string accessToken, string refreshToken, string jti) GenerateTokens(User user)
    {
        var jti = Guid.NewGuid().ToString();
        var expires = DateTime.UtcNow.AddMinutes(_jwtConfig.AccessTokenExpirationMinutes);
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

    private static RefreshToken CreateRefreshToken(User user, string jti, string? userAgent, string? fingerprint,
        string? ipAddress, int ttlDays)
    {
        return new RefreshToken
        {
            UserId = user.Id,
            Jti = jti,
            TokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(jti))),
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
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtConfig.Secret));

        try
        {
            var jwtToken = ValidateAndParseToken(token, key, _jwtConfig.Issuer, _jwtConfig.Audience);
            var jti = jwtToken.Claims.First(c => c.Type == JwtClaims.Jti).Value;
            var userId = int.Parse(jwtToken.Claims.First(c => c.Type == JwtClaims.UserId).Value);
            var storedToken = await dbContext.RefreshTokens.Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Jti == jti && rt.UserId == userId);

            if (storedToken == null)
            {
                await RevokeAllUserTokens(userId);
                throw new AuthException(AuthErrors.TokenReuseDetected);
            }

            if (!string.IsNullOrEmpty(storedToken.Fingerprint) && !string.IsNullOrEmpty(fingerprint) &&
                storedToken.Fingerprint != fingerprint)
            {
                await RevokeAllUserTokens(userId);
                throw new AuthException(AuthErrors.FingerprintMismatch);
            }

            if (storedToken.User == null)
            {
                throw new AuthException(AuthErrors.InvalidToken);
            }
            
            var user = storedToken.User;
            dbContext.RefreshTokens.Remove(storedToken);

            var (newAccessToken, newRefreshToken, newJti) = GenerateTokens(user);
            var ttlDays = _jwtConfig.RefreshTokenExpirationDays;
            var newRefreshTokenEntity =
                CreateRefreshToken(user, newJti, storedToken.UserAgent, fingerprint, ipAddress, ttlDays);
            dbContext.RefreshTokens.Add(newRefreshTokenEntity);
            await dbContext.SaveChangesAsync();

            return (user, newAccessToken, newRefreshToken);
        }
        catch (AuthException)
        {
            throw;
        }
        catch
        {
            throw new AuthException(AuthErrors.InvalidToken);
        }
    }

    public async Task RevokeToken(string jti)
    {
        var token = await dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Jti == jti);
        if (token != null)
        {
            dbContext.RefreshTokens.Remove(token);
            await dbContext.SaveChangesAsync();
        }
    }

    public async Task RevokeAllUserTokens(int userId)
    {
        var tokens = await dbContext.RefreshTokens.Where(rt => rt.UserId == userId).ToListAsync();
        dbContext.RefreshTokens.RemoveRange(tokens);
        await dbContext.SaveChangesAsync();
    }

    public async Task<(User user, string accessToken, string refreshToken)> LoginWithTokens(
        string username, string password, bool rememberMe, string? userAgent, string? fingerprint, string? ipAddress)
    {
        var user = await Login(username, password);
        var ttlDays = rememberMe
            ? _jwtConfig.RefreshTokenExpirationDaysRemember
            : _jwtConfig.RefreshTokenExpirationDays;

        var (accessToken, refreshToken, jti) = GenerateTokens(user);
        var refreshTokenEntity = CreateRefreshToken(user, jti, userAgent, fingerprint, ipAddress, ttlDays);
        dbContext.RefreshTokens.Add(refreshTokenEntity);
        await dbContext.SaveChangesAsync();

        return (user, accessToken, refreshToken);
    }
}

