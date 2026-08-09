using Microsoft.EntityFrameworkCore;
using Namorix.Core.Models;
using Namorix.Server.Models;
using Namorix.Server.Models.Addon;
using Namorix.Server.Models.Beacon;
using Namorix.Server.Models.Frontgate;
using Namorix.Server.Models.Warden;

namespace Namorix.Server.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
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
    public DbSet<FgCertificateDomain> FgCertificateDomains { get; init; } = null!;
    public DbSet<FgAccessPolicy> FgAccessPolicies { get; set; }
    public DbSet<FgReverseProxyLocation> FgReverseProxyLocations { get; set; }
    public DbSet<FgAuditLog> FgAuditLogs { get; set; }

    public DbSet<BcnHostname> BcnHostnames { get; set; }
    public DbSet<BcnSettings> BcnSettings { get; set; }
    public DbSet<BcnActivityLog> BcnActivityLogs { get; set; }

    public DbSet<WdFirewallRule> WdFirewallRules { get; set; }
    public DbSet<WdSecurityEvent> WdSecurityEvents { get; set; }
    public DbSet<WdSettings> WdSettings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureCore(modelBuilder);
        ConfigureAddonSystem(modelBuilder);
        ConfigureFrontgate(modelBuilder);
        ConfigureBeacon(modelBuilder);
        ConfigureWarden(modelBuilder);
    }

    private static void ConfigureCore(ModelBuilder modelBuilder)
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

        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.UserId, n.CreatedAt });
        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.UserId, n.IsRead });
    }

    private static void ConfigureAddonSystem(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AddonInstallation>()
            .HasIndex(a => a.Id)
            .IsUnique();

        modelBuilder.Entity<AddonCatalogEntry>()
            .HasIndex(a => a.Id)
            .IsUnique();

        modelBuilder.Entity<OAuthRegistration>()
            .HasIndex(r => r.Token)
            .IsUnique();
    }

    private static void ConfigureFrontgate(ModelBuilder modelBuilder)
    {
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

        modelBuilder.Entity<FgCertificate>()
            .Property(c => c.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        modelBuilder.Entity<FgCertificate>()
            .Property(c => c.Source)
            .HasConversion<string>()
            .HasMaxLength(20);

        modelBuilder.Entity<FgCertificateDomain>(entity =>
        {
            entity.HasIndex(d => d.Domain); // Index for future SNI lookup

            entity.HasOne(d => d.Certificate)
                .WithMany(c => c.CertificateDomains)
                .HasForeignKey(d => d.CertificateId)
                .OnDelete(DeleteBehavior.Cascade); // Delete cert -> delete domains as well
        });

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

        modelBuilder.Entity<FgAuditLog>()
            .HasIndex(l => new { l.TargetType, l.TargetId });

        modelBuilder.Entity<FgAuditLog>()
            .HasIndex(l => l.Timestamp);

        modelBuilder.Entity<FgAuditLog>()
            .Property(l => l.TargetType)
            .HasConversion<string>()
            .HasMaxLength(16);

        modelBuilder.Entity<FgAuditLog>()
            .Property(l => l.Action)
            .HasConversion<string>()
            .HasMaxLength(24);
    }

    private static void ConfigureBeacon(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BcnHostname>()
            .Property(h => h.Kind)
            .HasConversion<string>().HasMaxLength(20);

        modelBuilder.Entity<BcnHostname>()
            .Property(h => h.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        modelBuilder.Entity<BcnActivityLog>()
            .Property(l => l.Level)
            .HasConversion<string>()
            .HasMaxLength(20);

        modelBuilder.Entity<BcnActivityLog>()
            .HasIndex(l => l.Timestamp); // Time-based query pruning

        modelBuilder.Entity<BcnActivityLog>()
            .HasOne(l => l.Hostname)
            .WithMany()
            .HasForeignKey(l => l.HostnameId)
            .OnDelete(DeleteBehavior.SetNull);
    }

    private static void ConfigureWarden(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WdFirewallRule>()
            .Property(r => r.Action)
            .HasConversion<string>().HasMaxLength(16);

        modelBuilder.Entity<WdFirewallRule>()
            .Property(r => r.Protocol)
            .HasConversion<string>().HasMaxLength(16);

        modelBuilder.Entity<WdFirewallRule>()
            .HasIndex(r => new { r.SourceCidr, r.Enabled });

        modelBuilder.Entity<WdSecurityEvent>()
            .HasIndex(e => new { e.SourceIp, e.Timestamp }); // Lookup by IP + time window

        modelBuilder.Entity<WdSecurityEvent>()
            .Property(e => e.Severity)
            .HasConversion<string>().HasMaxLength(16);

        modelBuilder.Entity<WdSettings>()
            .Property(s => s.Profile)
            .HasConversion<string>().HasMaxLength(16);
    }
}