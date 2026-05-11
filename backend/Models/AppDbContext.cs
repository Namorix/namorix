using backend.Config;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace backend.Models;

public class AppDbContext : DbContext
{
    public readonly AppConfig _config;
    
    public AppDbContext(DbContextOptions<AppDbContext> options, IOptions<AppConfig> config) : base(options)
    {
        _config = config.Value;
    }
    
    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Setting> Settings { get; set; }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseSqlite(_config.ConnectionString);
        }
    }
}