using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Namorix.Core.Config;
using Namorix.Core.Models;

namespace Namorix.Adapters.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options, IOptions<AppConfig>? config) : DbContext(options)
{
    private readonly AppConfig? _config = config?.Value;
    
    public DbSet<User> Users { get; set; }
    public DbSet<UserSetting> UserSettings { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Setting> Settings { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<UserPermission> UserPermissions { get; set; }
    public DbSet<ThemeManifest> ThemeManifests { get; set; }
    public DbSet<AddonManifest> AddonManifests { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured && _config != null)
        {
            optionsBuilder.UseSqlite(_config.ConnectionString);
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
        
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Name)
            .IsUnique();
        
        modelBuilder.Entity<UserSetting>()
            .HasIndex(s => new { s.UserId, s.Key })
            .IsUnique();
        
        modelBuilder.Entity<Permission>()
            .HasIndex(p => new { p.Name, p.Value })
            .IsUnique();

        modelBuilder.Entity<ThemeManifest>()
            .HasIndex(t => t.Id)
            .IsUnique();

        modelBuilder.Entity<AddonManifest>()
            .HasIndex(a => a.Id)
            .IsUnique();
        
        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.UserId, n.CreatedAt });
        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.UserId, n.IsRead });
    }
}