namespace backend.Config;

public class AppConfig
{
    public JwtConfig Jwt { get; init; } = new();
    public string ConnectionString { get; init; } = string.Empty;
    public string AllowedOrigins { get;  init; } = "http://localhost:5173";
}
