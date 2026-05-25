using Namorix.Core.Config;
using Namorix.Core.Constants;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Namorix.Adapters.Persistence;
using Namorix.Adapters.Services;
using Namorix.Core.Extensions;
using Namorix.Core.Helpers;
using Namorix.Server.Extensions;
using Namorix.Workers;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<AppConfig>(builder.Configuration);
builder.Services.Configure<JwtConfig>(builder.Configuration.GetSection("Jwt"));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<SettingsService>();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<ThemeService>();

builder.Services.AddNamorixCore(builder.Environment.IsDevelopment());
builder.Services.AddHostedService<TokenCleanupWorker>();


var app = builder.Build();

var memoryCache = app.Services.GetRequiredService<IMemoryCache>();
var appConfig = app.Services.GetRequiredService<IOptions<AppConfig>>().Value;
var configOrigins = appConfig.AllowedOrigins
    .Split(",", StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

app.UseNamorixCore(core =>
{
    core.UseCors(policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                if (!memoryCache.TryGetValue(SettingKeys.AllowedOrigins, out string? value)
                    || string.IsNullOrEmpty(value))
                {
                    // Intentionally allow all origins when AllowedOrigins is not configured.
                    // The server is assumed to be running behind a trusted reverse proxy
                    // that handles origin filtering — admins only need to configure
                    // TrustedProxies, not AllowedOrigins.
                    return true;
                }

                var dbOrigins = value.Split(",",
                    StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

                return NetworkHelper.OriginAllow(origin) ||
                       dbOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase) ||
                       configOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
            })
            .AllowCredentials()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
    
    app.UseAuth();
    app.UseTrustedProxy();
});

app.Run();