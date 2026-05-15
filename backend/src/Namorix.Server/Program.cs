using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Namorix.Core.Config;
using Namorix.Core.Constants;
using Namorix.Core.Responses;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Namorix.Adapters.Persistence;
using Namorix.Adapters.Services;
using Namorix.Server.Extensions;
using Namorix.Server.Helpers;
using Namorix.Workers;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10240; // 10KB
});

builder.Services.Configure<AppConfig>(builder.Configuration);
builder.Services.Configure<JwtConfig>(builder.Configuration.GetSection("Jwt"));

builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
{
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<SettingsService>();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddMemoryCache();
builder.Services.AddHostedService<TokenCleanupWorker>();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("Global", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
        await context.HttpContext.Response.WriteAsJsonAsync(
            ApiResponse.Fail(MiddlewareErrorCodes.RateLimitExceeded, "Too many requests, please slow down"),
            cancellationToken: cancellationToken);
    };
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddCors();

var app = builder.Build();
var memoryCache = app.Services.GetRequiredService<IMemoryCache>();
var appConfig = app.Services.GetRequiredService<IOptions<AppConfig>>().Value;
var configOrigins = appConfig.AllowedOrigins
    .Split(",", StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

app.UseApiErrorHandling();
app.UseCors(policy =>
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

app.UseSecurityHeaders();
app.UseAuth();
app.UseTrustedProxy();
app.UseRouting();
app.UseNotFoundHandler();
app.UseRateLimiter();
app.UseCsrfProtection();
app.MapControllers();
app.Run();
