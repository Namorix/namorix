namespace Namorix.Core.Config;

public class JwtConfig
{
    public string Secret { get; init; } = string.Empty;
    public string Issuer { get; init; } = "Namorix";
    public string Audience { get; init; } = "Namorix";
    public int AccessTokenExpirationSeconds { get; init; } = 900;
    public int RefreshTokenExpirationDays { get; init; } = 7;
    public int RefreshTokenExpirationDaysRemember { get; init; } = 90;

}