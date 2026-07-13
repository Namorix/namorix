using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Namorix.Core.OAuth;

namespace Namorix.Core.Grpc;

public static class AddonChannelClientExtensions
{
    public static IServiceCollection AddAddonChannelClient(this IServiceCollection services)
    {
        services.AddSingleton<AddonChannelClient>(sp =>
        {
            var config = sp.GetRequiredService<NmxAddonConfig>();
            var oauth = sp.GetRequiredService<NmxOAuth2Client>();
            var logger = sp.GetRequiredService<ILogger<AddonChannelClient>>();
            return new AddonChannelClient(oauth, config, logger);
        });
        return services;
    }
}