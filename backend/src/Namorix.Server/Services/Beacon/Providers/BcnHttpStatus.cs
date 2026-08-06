using System.Net;
using Namorix.Server.Constants;

namespace Namorix.Server.Services.Beacon.Providers;

public static class BcnHttpStatus
{
    public static string ToErrorCode(HttpStatusCode status) => status switch
    {
        HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden => BcnErrorCodes.InvalidCredentials,
        HttpStatusCode.NotFound => BcnErrorCodes.HostnameNotFound,
        _ => BcnErrorCodes.ProviderError,
    };
}