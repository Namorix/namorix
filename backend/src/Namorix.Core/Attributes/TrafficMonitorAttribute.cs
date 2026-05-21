using Microsoft.AspNetCore.Mvc;

namespace Namorix.Core.Attributes;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class TrafficMonitorAttribute : Attribute
{
    public string? Label { get; init; }
}

public class TrafficGetAttribute(string template, string? label = null) : HttpGetAttribute(template)
{
    public string? Label { get; init; } = label;
}

public class TrafficPostAttribute(string template, string? label = null) : HttpPostAttribute(template)
{
    public string? Label { get; init; } = label;
}

public class TrafficPutAttribute(string template, string? label = null) : HttpPutAttribute(template)
{
    public string? Label { get; init; } = label;
}

public class TrafficDeleteAttribute(string template, string? label = null) : HttpDeleteAttribute(template)
{
    public string? Label { get; init; } = label;
}

public class TrafficPatchAttribute(string template, string? label = null) : HttpPatchAttribute(template)
{
    public string? Label { get; init; } = label;
}
