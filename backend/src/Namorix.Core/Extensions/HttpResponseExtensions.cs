using Microsoft.AspNetCore.Http;

namespace Namorix.Core.Extensions;

public static class HttpResponseExtensions
{
    public static void SetCookie(this HttpResponse response, string name, string token, DateTime expires, bool secure = false)
    {
        response.Cookies.Append(name, token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = secure,
            Path = "/",
            Expires = expires,
        });
    }
}