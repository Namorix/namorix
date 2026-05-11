using backend.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>();

var app = builder.Build();

app.MapGet("/", () => "Hello Worlds");

app.Run();