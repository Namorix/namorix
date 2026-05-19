namespace Namorix.Core.Attributes;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class TrafficMonitorAttribute : Attribute
{
    public string? Label { get; init; }
}