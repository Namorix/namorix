namespace backend.Config;

public class JwtConfig
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "Namorix";
    public string Audience { get; set; } = "Namorix";
    public int AccessTokenExpirationMinutes { get; set; } = 15;
    public int RefreshTokenExpirationDays { get; set; } = 7;

}