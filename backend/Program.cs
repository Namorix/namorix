using backend.Config;
using backend.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.Configure<AppConfig>(builder.Configuration);
builder.Services.Configure<JwtConfig>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddDbContext<AppDbContext>();

var app = builder.Build();
app.MapGet("/", () => "Hello World");
app.Run();