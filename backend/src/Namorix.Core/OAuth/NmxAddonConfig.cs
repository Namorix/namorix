namespace Namorix.Core.OAuth;

public record NmxAddonConfig(string DesktopApiUrl, string DesktopGrpcUrl, string? RegistrationToken)
{
    public string DataDir { get; private init; } = Constants.OAuth.NmxOAuth2Defaults.DataDir;
    public int ClientAssertionTtlMinutes { get; private init; } = 2;
    
    public static NmxAddonConfig FromEnvironment()
    {
        var desktopApiUrl = RequireEnv(Constants.OAuth.NmxOAuth2Env.DesktopApiUrl);
        var desktopGrpcUrl = RequireEnv(Constants.OAuth.NmxOAuth2Env.DesktopGrpcUrl);
        var registrationToken = Environment.GetEnvironmentVariable(
            Constants.OAuth.NmxOAuth2Env.RegistrationToken);

        return new NmxAddonConfig(desktopApiUrl, desktopGrpcUrl, registrationToken)
        {
            DataDir = Environment.GetEnvironmentVariable(Constants.OAuth.NmxOAuth2Env.DataDir) ??
                      Constants.OAuth.NmxOAuth2Defaults.DataDir
        };
    }

    private static string RequireEnv(string name) =>
        Environment.GetEnvironmentVariable(name)
        ?? throw new InvalidOperationException(
            $"Environment variable '{name}' is required but not set.");
}