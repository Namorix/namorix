using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.Constants;
using Namorix.Server.Persistence;

namespace Namorix.Server.Middleware;

public class OAuth2Middleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        const string bearer = $"{OAuth.NmxOAuth2Defaults.Bearer} ";
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        if (authHeader?.StartsWith(bearer) == true)
        {
            var tokenId = authHeader[bearer.Length..];
            var token = await db.OAuthTokens
                .FirstOrDefaultAsync(t => t.TokenId == tokenId);

            if (token is not null && !token.Revoked && token.ExpiresAt > DateTime.UtcNow)
            {
                var identity = new ClaimsIdentity([
                    new Claim(ClaimTypes.NameIdentifier, token.ClientId),
                    new Claim("client_id", token.ClientId),
                    new Claim("user_id", token.UserId.ToString())
                ], "oauth2"); // TODO constants
                context.User = new ClaimsPrincipal(identity);
            }
        }

        await next(context);
    }
}