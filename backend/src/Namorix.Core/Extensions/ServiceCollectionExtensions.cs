using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Namorix.Core.Constants;
using Namorix.Core.FlatFile;
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
    public static IServiceCollection AddNamorixCore(this IServiceCollection services, bool isDevelopment = false)
    {
        services.Configure<KestrelServerOptions>(options =>
        {
            options.Limits.MaxRequestBodySize = 10240;
        });
        
        services.AddSingleton<FlatFileOptions>();
        services.AddSingleton<IFlatFileStore, FlatFileStore>();
        services.AddSingleton<DataDirectory>(_ => new DataDirectory("data"));
        services.AddSingleton<TrafficMonitorService>();
        services.AddSingleton<LogService>();
        services.AddSingleton<ILogNotifier, SignalRLogNotifier>();
        
        services.AddSingleton<ILoggerProvider>(sp =>
        {
            var options = sp.GetRequiredService<FlatFileOptions>();
            return new FileLoggerProvider(() => options.MinLogLevel);
        });
        
        services.AddScoped<ITrafficNotifier, SignalRTrafficNotifier>();
        services.AddScoped<ISystemNotifier, SignalRSystemNotifier>();
        services.AddHostedService<LogFlushWorker>();
        services.AddHostedService<TrafficFlushWorker>();
        services.AddHostedService<TrafficCleanupWorker>();
        services.AddHostedService<TrafficStatsWorker>();

        services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
        {
            options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        });
        
        services.AddMemoryCache();
        services.AddSignalR(options =>
        {
            options.AddFilter<NmxHubFilter>();
            options.EnableDetailedErrors = isDevelopment;
        });
        
        services.AddRateLimiter(options =>
        {
            options.AddPolicy("Default", context =>
                context.Request.Path.StartsWithSegments(SignalRPath.HubPrefix)
                    ? RateLimitPartition.GetNoLimiter("signalr-hubs")
                    : RateLimitPartition.GetFixedWindowLimiter("Global", _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 100,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst
                    }));
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
                await context.HttpContext.Response.WriteAsJsonAsync(
                    ApiResponse.Fail(MiddlewareErrorCodes.RateLimitExceeded, "Too many requests, please slow down"),
                    cancellationToken: cancellationToken);
            };
        });
        
        services.AddControllers().AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        });
        
        services.AddCors();
        
        return services;
    }
}