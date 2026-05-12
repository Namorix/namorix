using backend.Config;
using backend.Extensions;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.Configure<AppConfig>(builder.Configuration);
builder.Services.Configure<JwtConfig>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<SettingsService>();
builder.Services.AddControllers();

var app = builder.Build();
app.UseApiErrorHandling();
app.MapControllers();
app.Run();
