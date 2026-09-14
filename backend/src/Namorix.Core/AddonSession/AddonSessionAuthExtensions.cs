using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Namorix.Core.AddonSession;

public static class AddonSessionAuthExtensions
{
    // The controller is only discoverable where this is called (explicit opt-in),
    // so the desktop host never exposes addon-only /api/oauth/* endpoints.
    //
    // Requires AddAddonChannelClient(): the middleware's availability gate and the token
    // verifier's key fetch both go through that client.
    public static IServiceCollection AddAddonSessionAuth<TContext>(
        this IServiceCollection services,
        Action<AddonSessionAuthOptions>? configure = null)
        where TContext : AddonSessionDbContext
    {
        services.AddOptions<AddonSessionAuthOptions>()
            .Configure(o => configure?.Invoke(o))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddSingleton<IAddonTokenProtector, DataProtectionTokenProtector>();
        services.AddSingleton<IAddonTokenStore, AddonTokenStore<TContext>>();
        services.AddSingleton<AddonSessionLockRegistry>();
        services.AddSingleton<NmxAddonTokenValidator>();
        services.AddSingleton<AddonSessionAuthService>();

        // Applies the desktop's revocations to the token store. Hosted, not wired into the
        // middleware, so grants die as soon as the push arrives rather than at the next
        // request — and so a revocation that lands while nobody is browsing is not missed.
        services.AddHostedService<AddonSessionChannelHandler>();

        services.AddControllers()
            .AddApplicationPart(typeof(AddonSessionAuthController).Assembly);

        return services;
    }

    public static IApplicationBuilder UseAddonSessionAuth(this IApplicationBuilder app)
        => app.UseMiddleware<AddonSessionMiddleware>();
}
