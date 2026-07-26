namespace Namorix.Server.Config;

public class BackendConfig
{
    public int Port { get; init; } = 5001;
    public int GrpcPort { get; init; } = 5002;
    public string ContainerName { get; init; } = "namorix-desktop";
    public string NetworkName { get; init; } = "namorix-net";
    public int RegistrationTokenTtlMinutes { get; init; } = 60;

    public int HttpPort { get; init; } = 80; // 0 = disabled, requires root/setcap
    public int HttpsPort { get; init; } = 443; // 0 = disabled
    public string? SslCertPath { get; init; } // PFX cert path
    public string? SslCertPassword { get; init; } // PFX password
    
}