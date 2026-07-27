namespace Namorix.Core.Config;

public class AppConfig
{
    public JwtConfig Jwt { get; init; } = new();
    
    // Supplementary origins loaded from appsettings.json. Applied alongside DB-configured origins.
    // Has no effect when AllowedOrigins is not set in DB (allow-all mode via trusted proxy).
    public string AllowedOrigins { get; init; } = "";
    
    // Default false for development/testing. Set to true in production via environment config.
    public bool CsrfEnabled { get; init; } = false;

    // Default false for development/testing (HTTP). Set to true in production (HTTPS).
    public bool SecureCookie { get; init; } = false;
    
    public int OAuthRefreshTokenTtlDays { get; init; } = 1;
    public string DataBasePath { get; init; } = "data";
    
    public AddonCatalogConfig AddonCatalog { get; init; } = new();
}