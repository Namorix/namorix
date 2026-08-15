using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Namorix.Core.AddonSession;

public static class AddonSessionAuthExtensions
{
    // The controller is only discoverable where this is called (explicit opt-in),
    // so the desktop host never exposes addon-only /api/oauth/* endpoints.
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
        services.AddSingleton<IAddonSessionService, AddonSessionService<TContext>>();
        services.AddSingleton<AddonSessionAuthService>();

        services.AddControllers()
            .AddApplicationPart(typeof(AddonSessionAuthController).Assembly);

        return services;
    }

    public static IApplicationBuilder UseAddonSessionAuth(this IApplicationBuilder app)
        => app.UseMiddleware<AddonSessionMiddleware>();
}
