using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Namorix.Core.Config;
using Namorix.Core.Models;
using Namorix.Server.Models;

namespace Namorix.Server.Persistence;

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
    public DbSet<AddonInstallation> AddonInstallations { get; set; }
    public DbSet<AddonCatalogEntry> AddonCatalogEntries { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    
    public DbSet<OAuthAuthorizationCode> OAuthAuthorizationCodes { get; set; }
    public DbSet<OAuthToken> OAuthTokens { get; set; }
    public DbSet<OAuthRefreshToken> OAuthRefreshTokens { get; set; }
    public DbSet<OAuthRegistration> OAuthRegistrations { get; set; }
    
    public DbSet<FgReverseProxyRule> FgReverseProxyRules { get; set; }
    public DbSet<FgCertificate> FgCertificates { get; set; }
    public DbSet<FgAccessPolicy> FgAccessPolicies { get; set; }
    public DbSet<FgReverseProxyLocation> FgReverseProxyLocations { get; set; }
    
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

        modelBuilder.Entity<AddonInstallation>()
            .HasIndex(a => a.Id)
            .IsUnique();
        
        modelBuilder.Entity<AddonCatalogEntry>()
            .HasIndex(a => a.Id)
            .IsUnique();
        
        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.UserId, n.CreatedAt });
        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.UserId, n.IsRead });
        
        modelBuilder.Entity<OAuthRegistration>()
            .HasIndex(r => r.Token)
            .IsUnique();
        
        modelBuilder.Entity<FgReverseProxyRule>()
            .HasIndex(r => r.Source)
            .IsUnique();
        
        modelBuilder.Entity<FgReverseProxyRule>()
            .Property(r => r.Access)
            .HasConversion<string>()
            .HasMaxLength(20);

        modelBuilder.Entity<FgReverseProxyRule>()
            .Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(20);
        
        modelBuilder.Entity<FgCertificate>()
            .HasMany(c => c.ReverseProxyRules)
            .WithOne(r => r.Certificate)
            .HasForeignKey(r => r.CertificateId)
            .OnDelete(DeleteBehavior.SetNull);
        
        modelBuilder.Entity<FgCertificate>()
            .Property(c => c.Type)
            .HasConversion<string>()
            .HasMaxLength(20);
        
        modelBuilder.Entity<FgAccessPolicy>()
            .HasMany(p => p.ReverseProxyRules)
            .WithOne(r => r.AccessPolicy)
            .HasForeignKey(r => r.AccessPolicyId)
            .OnDelete(DeleteBehavior.SetNull);
        
        modelBuilder.Entity<FgAccessPolicy>()
            .Property(p => p.Type)
            .HasConversion<string>()
            .HasMaxLength(20);
        
        modelBuilder.Entity<FgReverseProxyLocation>()
            .HasOne(l => l.Rule)
            .WithMany(r => r.Locations)
            .HasForeignKey(l => l.RuleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}