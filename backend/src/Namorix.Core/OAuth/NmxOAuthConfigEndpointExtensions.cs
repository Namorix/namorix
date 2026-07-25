using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Namorix.Core.OAuth;

public static class NmxOAuthConfigEndpointExtensions
{
    public static WebApplication MapNmxOAuthConfig(this WebApplication app,
        string path = Constants.OAuth.WellKnownPath)
    {
        app.MapGet(path, (NmxOAuth2Client oauth, NmxAddonConfig config, HttpRequest request) =>
        {
            if (oauth.ClientId is null)
                return Results.NotFound(new { error = "OAuth not initialized" });

            var redirectUri = $"{request.Scheme}://{request.Host}";
            return Results.Ok(new
            {
                authorizeUrl = $"{config.DesktopApiUrl}{OAuthEndpoints.Authorize}",
                tokenUrl = $"{config.DesktopApiUrl}{OAuthEndpoints.Token}",
                clientId = oauth.ClientId,
                redirectUri,
            });
        });
        return app;
    }
}