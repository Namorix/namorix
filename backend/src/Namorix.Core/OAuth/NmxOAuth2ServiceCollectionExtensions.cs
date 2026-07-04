using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Namorix.Core.OAuth;

public static class NmxOAuth2ServiceCollectionExtensions
{
    public static IServiceCollection AddNmxOAuth2Client(this IServiceCollection services)
    {
        services.AddSingleton<NmxAddonConfig>(
            _ => NmxAddonConfig.FromEnvironment());

        services.AddSingleton<NmxOAuth2Client>(sp =>
        {
            var config = sp.GetRequiredService<NmxAddonConfig>();
            var logger = sp.GetRequiredService<ILogger<NmxOAuth2Client>>();

            var handler = new SocketsHttpHandler
            {
                PooledConnectionLifetime = TimeSpan.FromMinutes(5),
            };
            var http = new HttpClient(handler);
            return new NmxOAuth2Client(http, config, logger);
        });

        return services;
    }
}