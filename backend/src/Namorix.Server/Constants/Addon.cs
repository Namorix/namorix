namespace Namorix.Server.Constants;

public static class AddonStatus
{
    public const string Installing = "installing";
    public const string Installed = "installed";
    public const string Running = "running";
    public const string Stopped = "stopped";
    public const string Error = "error";
}

public static class AddonLabels
{
    public const string Addon = "namorix-addon";
    public const string Id = "namorix-addon-id";
    public const string Name = "namorix-addon-name";
    public const string Description = "namorix-addon-description";
    public const string Author = "namorix-addon-author";
}

public static class AddonTaskPending
{
    public const string Starting = "starting";
    public const string Stopping = "stopping";
    public const string Uninstalling = "uninstalling";
}