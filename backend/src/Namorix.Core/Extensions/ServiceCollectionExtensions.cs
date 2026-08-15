using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Namorix.Core.Config;
using Namorix.Core.Constants;
using Namorix.Core.Filters;
using Namorix.Core.FlatFile;
using Namorix.Core.Helpers;
using Namorix.Core.Hubs;
using Namorix.Core.Infrastructure;
using Namorix.Core.IO;
using Namorix.Core.Logger;
using Namorix.Core.Responses;
using Namorix.Core.Services;
using Namorix.Core.Workers;

namespace Namorix.Core.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddNamorixCore<THub>(this IServiceCollection services, bool isDevelopment = false,
        Action<NmxCoreOptions>? configure = null)
        where THub: NmxHub
    {
        var options = new NmxCoreOptions();
        configure?.Invoke(options);
        services.AddSingleton(options);
        
        services.Configure<KestrelServerOptions>(opts =>
        {
            opts.Limits.MaxRequestBodySize = 10240;
        });
        
        services.AddSingleton<FlatFileOptions>();
        services.AddSingleton<DataDirectory>(sp =>
            new DataDirectory(options?.DataBasePath
                ?? sp.GetRequiredService<IOptions<AppConfig>>().Value.DataBasePath));
        services.AddSingleton<IFlatFileStore, FlatFileStore>();
        services.AddSingleton<LogService>();
        services.AddSingleton<ILogNotifier, SignalRLogNotifier<THub>>();
        
        services.AddSingleton<ILoggerProvider>(sp =>
        {
            var opts = sp.GetRequiredService<FlatFileOptions>();
            return new FileLoggerProvider(() => opts.MinLogLevel);
        });
        
        services.AddScoped<ISystemNotifier, SignalRSystemNotifier<THub>>();
        services.AddScoped<IUserSettingsNotifier, SignalRUserSettingsNotifier<THub>>();
        services.AddHostedService<LogFlushWorker>();
        services.AddHostedService<LogCleanupWorker>();
        
        services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(opts =>
        {
            opts.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        });
        
        services.AddMemoryCache();
        services.AddSignalR(opts =>
        {
            opts.AddFilter<NmxHubFilter>();
            opts.EnableDetailedErrors = isDevelopment;
        });
        
        services.AddRateLimiter(opts =>
        {
            opts.AddPolicy("Default", context =>
                context.Request.Path.StartsWithSegments(SignalRPath.HubPrefix)
                    ? RateLimitPartition.GetNoLimiter("signalr-hubs")
                    : RateLimitPartition.GetFixedWindowLimiter("Global", _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 100,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst
                    }));
            opts.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            opts.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
                await context.HttpContext.Response.WriteAsJsonAsync(
                    ApiResponse.Fail(MiddlewareErrorCodes.RateLimitExceeded, "Too many requests, please slow down"),
                    cancellationToken: cancellationToken);
            };
        });
        
        services.Configure<ApiBehaviorOptions>(opts =>
        {
            opts.SuppressModelStateInvalidFilter = true;
        });
        
        services.AddControllers(opts =>
        {
            opts.Filters.Add<ValidationFilter>();
        }).AddJsonOptions(opts =>
        {
            opts.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            opts.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
            opts.JsonSerializerOptions.Converters.Add(new UtcDateTimeJsonConverter());
        });
        
        services.AddCors();
        
        return services;
    }
}