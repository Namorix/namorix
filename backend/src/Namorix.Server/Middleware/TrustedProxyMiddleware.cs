using System.Net;
using Namorix.Adapters.Services;
using Namorix.Core.Constants;
using Namorix.Core.Responses;

namespace Namorix.Server.Middleware;

public class TrustedProxyMiddleware(RequestDelegate requestDelegate)
{
    public async Task InvokeAsync(HttpContext httpContext, SettingsService settingsService)
    {
        if (HttpMethods.IsOptions(httpContext.Request.Method))
        {
            await requestDelegate(httpContext);
            return;
        }
        
        var remoteIp = httpContext.Connection.RemoteIpAddress;
        var isTrusted = false;
        
        if (remoteIp != null)
        {
            var normalizedRemote = remoteIp.IsIPv4MappedToIPv6 ? remoteIp.MapToIPv4() : remoteIp;
            var isLocalNetwork = IPAddress.IsLoopback(normalizedRemote);

            if (!isLocalNetwork)
            {
                var trustedProxies = await settingsService.GetTrustedProxies();
                isTrusted = trustedProxies.Any(p =>
                {
                    if (!IPAddress.TryParse(p, out var parsed))
                        return false;

                    var normalizedParsed = parsed.IsIPv4MappedToIPv6 ? parsed.MapToIPv4() : parsed;
                    return normalizedParsed.Equals(normalizedRemote);
                });
            }
            else
            {
                isTrusted = true;
            }
        }

        httpContext.Items[HttpContextKeys.TrustedProxy] = isTrusted;

        var hasForwardedHeaders = httpContext.Request.Headers.ContainsKey(HttpHeaders.XForwardedFor) ||
                                  httpContext.Request.Headers.ContainsKey(HttpHeaders.XForwardedProto);
        if (hasForwardedHeaders && !isTrusted)
        {
            httpContext.Items[HttpContextKeys.Validated] = true;
            httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            httpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
            await httpContext.Response.WriteAsJsonAsync(ApiResponse.Fail(MiddlewareErrorCodes.UntrustedProxy,
                "Untrusted proxy. Add this proxy to trusted proxies list"));
            return;
        }
        
        if (isTrusted)
        {
            var fwd = httpContext.Request.Headers[HttpHeaders.XForwardedFor].FirstOrDefault();
            if (!string.IsNullOrEmpty(fwd))
                httpContext.Items[HttpContextKeys.RealIp] = fwd.Split(",")[0].Trim();

            var proto = httpContext.Request.Headers[HttpHeaders.XForwardedProto].FirstOrDefault();
            if (!string.IsNullOrEmpty(proto))
                httpContext.Items[HttpContextKeys.RealScheme] = proto;
        }

        await requestDelegate(httpContext);
    }
    
}