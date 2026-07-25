namespace Namorix.Core.OAuth;

public static class OAuthEndpoints
{
    private const string BasePath = "/api/oauth";
    public const string Register = BasePath + "/register";
    public const string Token = BasePath + "/token";
    public const string Authorize = BasePath + "/authorize";

}