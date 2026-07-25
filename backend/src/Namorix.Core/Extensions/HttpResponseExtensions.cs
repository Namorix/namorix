using Microsoft.AspNetCore.Http;

namespace Namorix.Core.Extensions;

public static class HttpResponseExtensions
{
    extension(HttpResponse response)
    {
        public void SetCookie(string name, string token, DateTime expires, bool secure = false)
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

        public void DeleteCookie(string name)
        {
            response.Cookies.Delete(name);
        }
    }
}