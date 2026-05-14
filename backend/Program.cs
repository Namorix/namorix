using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using backend.Config;
using backend.Constants;
using backend.Extensions;
using backend.Helpers;
using backend.Models;
using backend.Responses;
using backend.Services;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

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
builder.Services.AddHostedService<TokenCleanupService>();

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

    options.OnRejected = async (context, _) =>
    {
        context.HttpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
        await context.HttpContext.Response.WriteAsJsonAsync(
            ApiResponse.Fail(MiddlewareErrorCodes.RateLimitExceeded, "Too many requests, please slow down"),
            cancellationToken: _);
    };
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddCors();

var app = builder.Build();
var memoryCache = app.Services.GetRequiredService<IMemoryCache>();
app.UseApiErrorHandling();
app.UseCors(policy =>
{
    policy.SetIsOriginAllowed(origin =>
    {
        if (memoryCache.TryGetValue(SettingKeys.AllowedOrigins, out string? value)
            && !string.IsNullOrEmpty(value))
        {
            return NetworkHelper.OriginAllow(origin) ||
                   value.Split(",", StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                       .Contains(origin, StringComparer.OrdinalIgnoreCase);
        }
        return true;
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
