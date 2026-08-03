using Microsoft.Extensions.DependencyInjection;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Services.BcnProviders;

public static class BcnProviderServiceCollectionExtensions
{
    public static IServiceCollection AddBcnProviders(this IServiceCollection services)
    {
        services.AddSingleton<IBcnProviderClient, NoIpProvider>();
        services.AddSingleton<IBcnProviderClient, DuckDnsProvider>();
        services.AddSingleton<IBcnProviderClient, DynuProvider>();
        services.AddSingleton<IBcnProviderClient, NamecheapProvider>();
        services.AddSingleton<IBcnProviderClient, CloudflareProvider>();
        services.AddSingleton<IBcnProviderClient, GoDaddyProvider>();
        services.AddSingleton<BcnProviderRegistry>();
        services.AddSingleton<BcnSimpleGetProvider>();
        services.AddSingleton<BcnRestJsonProvider>();
        services.AddSingleton<BcnProviderResolver>();
        services.AddHttpClient("BcnGet", c => c.Timeout = TimeSpan.FromSeconds(20));
        services.AddHttpClient("BcnRest", c => c.Timeout = TimeSpan.FromSeconds(20));
        return services;
    }
}