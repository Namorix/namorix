namespace backend.Config;

public class AppConfig
{
    public JwtConfig Jwt { get; set; } = new();
    public string ConnectionString { get; set; } = string.Empty;
    public string AllowedOrigins { get; set; } = "http://localhost:5173";
}
