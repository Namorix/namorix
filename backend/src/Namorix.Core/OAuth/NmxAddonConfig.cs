namespace Namorix.Core.OAuth;

public record NmxAddonConfig(string ApiUrl, string? RegistrationToken)
{
    public string DataDir { get; private init; } = "./data";
    public int ClientAssertionTtlMinutes { get; private init; } = 2;
    
    public static NmxAddonConfig FromEnvironment()
    {
        var apiUrl = RequireEnv(Constants.OAuth.NmxOAuth2Env.ApiUrl);
        var registrationToken = Environment.GetEnvironmentVariable(
            Constants.OAuth.NmxOAuth2Env.RegistrationToken);

        return new NmxAddonConfig(apiUrl, registrationToken)
        {
            DataDir = Environment.GetEnvironmentVariable(Constants.OAuth.NmxOAuth2Env.DataDir) ?? "./data"
        };
    }

    private static string RequireEnv(string name) =>
        Environment.GetEnvironmentVariable(name)
        ?? throw new InvalidOperationException(
            $"Environment variable '{name}' is required but not set.");
}