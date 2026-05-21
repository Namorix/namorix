using System.Collections.Concurrent;
using System.Diagnostics;
using System.Security.Claims;
using Namorix.Adapters.Persistence;
using Namorix.Core.Constants;
using Namorix.Core.Infrastructure;
using Namorix.Core.Models;

namespace Namorix.Server.Middleware;

public class TrafficMonitorMiddleware(RequestDelegate requestDelegate)
{
    private static readonly ConcurrentDictionary<(string, string), int> Registry = [];
    private static readonly ConcurrentDictionary<string, long> IpCache = [];

    public async Task InvokeAsync(HttpContext httpContext, AppDbContext appDbContext)
    {
        if (httpContext.Request.Path.StartsWithSegments(SignalRPath.HubPrefix))
        {
            await requestDelegate(httpContext);
            return;
        }
        
        var originalBody = httpContext.Response.Body;
        var countingStream = new CountingStream(originalBody);
        httpContext.Response.Body = countingStream;
            
        var stopwatch = Stopwatch.StartNew();
        await requestDelegate(httpContext);
        stopwatch.Stop();
        
        if (!Registry.TryGetValue((httpContext.Request.Method, httpContext.Request.Path.Value!), out var endpointId))
            return;

        var ip = httpContext.Connection.RemoteIpAddress?.ToString();
        var trafficAddressId = string.IsNullOrEmpty(ip) ? null : (long?)IpCache.GetOrAdd(ip, _ =>
        {
            var existing = appDbContext.TrafficAddresses.FirstOrDefault(a => a.Ip == ip);
            if (existing != null)
                return existing.Id;

            var addr = new TrafficAddress { Ip = ip };
            appDbContext.TrafficAddresses.Add(addr);
            appDbContext.SaveChanges();
            return addr.Id;
        });
        
        var userId =
            httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value is { } v && int.TryParse(v, out var uid)
                ? uid
                : (int?)null;
        
        var log = new TrafficLog
        {
            EndpointId = endpointId,
            StatusCode = httpContext.Response.StatusCode,
            DurationMs = stopwatch.ElapsedMilliseconds,
            ResponseSizeBytes = countingStream.BytesWritten, // TODO: wrap Response.Body with CountingStream to measure actual size
            TrafficAddressId = trafficAddressId,
            UserId = userId
        };

        TrafficBuffer.Logs.Writer.TryWrite(log);
    }

    public static void AddToRegistry(int endpointId, string method, string path) =>
        Registry[(method, path)] = endpointId;

    public static void RemoveFromRegistry(string method, string path) =>
        Registry.TryRemove((method, path), out _);
}