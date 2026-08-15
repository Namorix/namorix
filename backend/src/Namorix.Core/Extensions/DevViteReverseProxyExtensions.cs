using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Yarp.ReverseProxy.Configuration;
using Yarp.ReverseProxy.Forwarder;

namespace Namorix.Core.Extensions;

public static class DevViteReverseProxyExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddDevViteReverseProxy(
            IWebHostEnvironment environment,
            IConfiguration configuration,
            string section = "Frontend",
            string hostKey = "Host",
            string portKey = "Port",
            int defaultPort = 5102)
        {
            if (!environment.IsDevelopment())
                return services;

            var host = configuration.GetValue($"{section}:{hostKey}", "http://localhost") ?? "http://localhost";
            var port = configuration.GetValue($"{section}:{portKey}", defaultPort);
            var viteUrl = $"{host}:{port}";

            // Single-origin dev: Kestrel is the sole entry; everything that isn't an
            // API/hub endpoint forwards to the live Vite server (assets, HMR).
            services.AddReverseProxy().LoadFromMemory(
            [
                new RouteConfig
                {
                    RouteId = "dev:vite",
                    ClusterId = "dev:vite",
                    Match = new RouteMatch { Hosts = ["localhost", "127.0.0.1"], Path = "{**catch-all}" }
                }
            ],
            [
                new ClusterConfig
                {
                    ClusterId = "dev:vite",
                    Destinations = new Dictionary<string, DestinationConfig>
                    {
                        ["default"] = new() { Address = viteUrl }
                    },
                    // Vite cold start (esbuild dep pre-bundling) can exceed YARP's default
                    // 100s ActivityTimeout; raise it so the first transform isn't cut.
                    HttpRequest = new ForwarderRequestConfig
                    {
                        ActivityTimeout = TimeSpan.FromMinutes(10)
                    }
                }
            ]);

            return services;
        }
    }

    extension(IEndpointRouteBuilder endpoints)
    {
        public IEndpointRouteBuilder MapDevViteReverseProxy(IWebHostEnvironment environment)
        {
            if (!environment.IsDevelopment())
                return endpoints;
            endpoints.MapReverseProxy();
            return endpoints;
        }
    }
}
