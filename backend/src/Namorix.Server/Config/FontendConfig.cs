namespace Namorix.Server.Config;

public class FrontendConfig
{
    public int Port { get; init; } = 5000;
    public string Host { get; init; } = "http://localhost";
    public string BaseUrl => $"{Host}:{Port}";
}