using Namorix.Server.Services;

namespace Namorix.Server.Models;

public enum AddonTaskType
{
    Install,
    Start,
    Stop,
    Uninstall,
    Update,
}

public class AddonTask
{
    public string Id { get; init; } = Guid.NewGuid().ToString("N");
    public AddonTaskType Type { get; init; }
    public string AddonId { get; init; } = string.Empty;
    public InstallRequest? InstallRequest { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}