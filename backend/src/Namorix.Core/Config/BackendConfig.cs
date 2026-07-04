namespace Namorix.Core.Config;

public class BackendConfig
{
    public int Port { get; init; } = 5000;
    public string ContainerName { get; init; } = "namorix-desktop";
    public string NetworkName { get; init; } = "namorix-net";
    public int RegistrationTokenTtlMinutes { get; init; } = 60;

}