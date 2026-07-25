namespace Namorix.Server.Config;

public class BackendConfig
{
    public int Port { get; init; } = 5001;
    public int GrpcPort { get; init; } = 5002;
    public string ContainerName { get; init; } = "namorix-desktop";
    public string NetworkName { get; init; } = "namorix-net";
    public int RegistrationTokenTtlMinutes { get; init; } = 60;

}