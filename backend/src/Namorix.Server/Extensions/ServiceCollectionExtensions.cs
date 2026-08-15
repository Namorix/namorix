using Microsoft.AspNetCore.Mvc;
using Namorix.Core.Hubs;
using Namorix.Server.Filters;
using Namorix.Server.Hubs;
using Namorix.Server.Infrastructure;
using Namorix.Server.Services;
using Namorix.Server.Workers.TrafficMonitor;

namespace Namorix.Server.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddNamorixTrafficMonitoring<THub>(
        this IServiceCollection services) where THub : NmxHub
    {
        services.AddSingleton<TrafficMonitorService>();
        services.AddScoped<ITrafficNotifier, SignalRTrafficNotifier<THub>>();
        services.AddHostedService<TrafficFlushWorker>();
        services.AddHostedService<TrafficCleanupWorker>();
        services.AddHostedService<TrafficStatsWorker>();
        services.Configure<MvcOptions>(options => options.Filters.Add<TrafficMonitorFilter>());
        return services;
    }
}
