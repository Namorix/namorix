using backend.Config;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace backend.Models;

public class AppDbContext : DbContext
{
    private readonly AppConfig? _config;

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
        _config = null;
    }

    public AppDbContext(DbContextOptions<AppDbContext> options, IOptions<AppConfig>? config) : base(options)
    {
        _config = config?.Value;
    }

    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Setting> Settings { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<UserPermission> UserPermissions { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured && _config != null)
        {
            optionsBuilder.UseSqlite(_config.ConnectionString);
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Permission>()
            .HasIndex(p => new { p.Name, p.Value })
            .IsUnique();
    }
}