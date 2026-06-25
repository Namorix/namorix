namespace Namorix.Core.Constants;

public static class DockerState
{
    public const string Running = "running";
    public const string Exited = "exited";
    public const string Stopped = "stopped";
    public const string Paused = "paused";
}

public static class DockerEvent
{
    public const string Start = "start";
    public const string Stop = "stop";
    public const string Die = "die";
    public const string Destroy = "destroy";
}

public static class DockerFilter
{
    public const string Type = "type";
    public const string Container = "container";
    public const string Label = "label";
}