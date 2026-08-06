using System.Net.Http.Headers;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Namorix.Core.Config;
using Namorix.Core.Constants;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Namorix.Core.Extensions;
using Namorix.Core.Helpers;
using Namorix.Core.Hubs;
using Namorix.Core.Infrastructure;
using Namorix.Core.IO;
using Namorix.Server.Config;
using Namorix.Server.Extensions;
using Namorix.Server.Hubs;
using Namorix.Server.Infrastructure;
using Namorix.Server.Middleware;
using Namorix.Server.Persistence;
using Namorix.Server.Services;
using Namorix.Server.Services.BcnProviders;
using Namorix.Server.Services.Frontgate;
using Namorix.Server.Services.Grpc;
using Namorix.Server.Workers;
using Yarp.ReverseProxy.Configuration;

var builder = WebApplication.CreateBuilder(args);
var backendConfig = builder.Configuration.GetSection("Backend").Get<BackendConfig>() ?? new BackendConfig();
var dataBasePath = builder.Configuration.GetValue<string>("DataBasePath") ?? "data";
var dbPath = Path.Combine(dataBasePath, "namorix.db");

if (backendConfig.HttpsPort > 0 && string.IsNullOrEmpty(backendConfig.SslCertPath))
{
    SelfSignedCertificateProvider.Ensure(ref backendConfig, new DataDirectory(dataBasePath));
}

builder.Services.Configure<AppConfig>(builder.Configuration);
builder.Services.Configure<JwtConfig>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<AddonCatalogConfig>(builder.Configuration.GetSection("AddonCatalog"));
builder.Services.Configure<BackendConfig>(builder.Configuration.GetSection("Backend"));
builder.Services.Configure<FrontendConfig>(builder.Configuration.GetSection("Frontend"));

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(backendConfig.Port, o => o.Protocols = HttpProtocols.Http1);
    options.ListenAnyIP(backendConfig.GrpcPort, o => o.Protocols = HttpProtocols.Http2);
    
    if (backendConfig.HttpPort > 0)
        options.ListenAnyIP(backendConfig.HttpPort, o => o.Protocols = HttpProtocols.Http1);

    if (backendConfig.HttpsPort > 0 && !string.IsNullOrEmpty(backendConfig.SslCertPath))
    {
        options.ListenAnyIP(backendConfig.HttpsPort, o =>
        {
            o.Protocols = HttpProtocols.Http1;
            o.UseHttps(backendConfig.SslCertPath, backendConfig.SslCertPassword);
        });
    }
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<UserSettingsService>();
builder.Services.AddScoped<SettingsService>();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<ThemeService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddSingleton<DockerService>();
builder.Services.AddScoped<AddonService>();
builder.Services.AddScoped<OAuthService>();
builder.Services.AddScoped<BcnHostnameService>();
builder.Services.AddSingleton<FrontgateProxyConfigProvider>();
builder.Services.AddBcnProviders();

builder.Services.AddDataProtection()
    .SetApplicationName("Namorix")
    .PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(dataBasePath, "keys")));

builder.Services.AddSingleton<BcnSecretProtector>();
builder.Services.AddSingleton<IPublicIpDetector, PublicIpService>();
builder.Services.AddHttpClient("PublicIp", client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("Namorix/1.0");
});

builder.Services.AddReverseProxy()
    .Services.AddSingleton<IProxyConfigProvider>(
        sp => sp.GetRequiredService<FrontgateProxyConfigProvider>());

builder.Services.AddScoped<INotificationNotifier, SignalRNotificationNotifier<MainHub>>();
builder.Services.AddScoped<ISystemMonitorNotifier, SignalRSystemMonitorNotifier>();
builder.Services.AddScoped<IAddonNotifier, SignalRAddonNotifier>();
builder.Services.AddScoped<IBeaconNotifier, SignalRBeaconNotifier>();

builder.Services.AddHttpClient<CatalogService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("Namorix/1.0");
    client.DefaultRequestHeaders.CacheControl = new CacheControlHeaderValue
    {
        NoCache = true
    };
});

builder.Services.AddNamorixCore<MainHub>(builder.Environment.IsDevelopment());

builder.Services.AddHostedService<TokenCleanupWorker>();
builder.Services.AddHostedService<NotificationCleanupWorker>();
builder.Services.AddHostedService<SystemMonitorStatsWorker>();
builder.Services.AddHostedService<DockerMonitorWorker>();
builder.Services.AddHostedService<CatalogSyncWorker>();
builder.Services.AddHostedService<FgCertPendingResetWorker>();
builder.Services.AddHostedService<BcnCheckWorker>();
builder.Services.AddHostedService<BcnActivityCleanupWorker>();

builder.Services.AddSingleton<AddonTaskQueue>();
builder.Services.AddSingleton<AcmeCertQueue>();
builder.Services.AddHostedService<AddonTaskQueue>(sp => sp.GetRequiredService<AddonTaskQueue>());
builder.Services.AddHostedService<AcmeCertQueue>(sp => sp.GetRequiredService<AcmeCertQueue>());
builder.Services.AddScoped<AddonTaskExecutor>();
builder.Services.AddGrpc();
builder.Services.AddSingleton<AddonChannelManager>();

builder.Services.AddSingleton<AcmeChallengeStore>();
builder.Services.AddSingleton<DnsLookupChecker>();
builder.Services.AddSingleton<AcmeDryRunService>();

builder.Services.AddSingleton<BcnUpdateQueue>();
builder.Services.AddHostedService<BcnUpdateQueue>(sp => sp.GetRequiredService<BcnUpdateQueue>());
builder.Services.AddSingleton<BcnProbeQueue>();
builder.Services.AddHostedService<BcnProbeQueue>(sp => sp.GetRequiredService<BcnProbeQueue>());

if (builder.Environment.IsDevelopment())
    builder.Services.AddGrpcReflection();

var app = builder.Build();
var memoryCache = app.Services.GetRequiredService<IMemoryCache>();
var appConfig = app.Services.GetRequiredService<IOptions<AppConfig>>().Value;
var configOrigins = appConfig.AllowedOrigins
    .Split(",", StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

// Common middleware cho ALL ports
app.UseApiErrorHandling();
app.UseSecurityHeaders();

// API port (backendConfig.Port = 5001): full pipeline
app.UseWhen(ctx => ctx.Connection.LocalPort == backendConfig.Port, api =>
{
    api.UseCors(policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                if (!memoryCache.TryGetValue(SettingKeys.AllowedOrigins, out string? value)
                    || string.IsNullOrEmpty(value))
                {
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
    app.UseOAuth2();
    app.UseTrustedProxy();

    api.UseNotFoundHandler();
    api.UseCsrfProtection();
    api.UseRouting();
    api.UseRateLimiter();
    api.UseEndpoints(endpoints =>
    {
        endpoints.MapControllers();
        endpoints.MapHub<MainHub>(SignalRPath.HubMain);
        endpoints.MapReverseProxy();
    });
});

// Proxy ports (HttpPort, HttpsPort): ForceSsl + YARP only
var proxyPorts = new[] { backendConfig.HttpPort, backendConfig.HttpsPort }
    .Where(p => p > 0)
    .ToArray();

if (proxyPorts.Length > 0)
{
    app.UseWhen(ctx => proxyPorts.Contains(ctx.Connection.LocalPort), proxy =>
    {
        var pathPublic = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "frontend", "public");
        
        proxy.UseMiddleware<AcmeChallengeMiddleware>(); // LE HTTP call → serve token before redirect
        proxy.UseMiddleware<ForceSslMiddleware>();
        proxy.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(pathPublic)
        });
        
        proxy.UseRouting();
        proxy.UseEndpoints(endpoints =>
        {
            endpoints.MapReverseProxy();
            endpoints.MapFallbackToFile("frontgate.html", new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(pathPublic)
            });
        });
    });
}

app.MapGrpcService<AddonChannelService>();

if (app.Environment.IsDevelopment())
    app.MapGrpcReflectionService();

app.Run();