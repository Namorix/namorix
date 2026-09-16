using Microsoft.EntityFrameworkCore;

namespace Namorix.Core.AddonSession;

// Addons inherit this to get the shared Tokens table mapped into their own context.
public abstract class AddonSessionDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<AddonToken> Tokens => Set<AddonToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // A session is (addon, desktop refresh chain). Making that a database invariant
        // means two browsers signed in as the same user cannot silently collapse into one
        // row and then rotate each other's refresh token out from under them.
        modelBuilder.Entity<AddonToken>()
            .HasIndex(t => new { t.ClientId, t.SessionId })
            .IsUnique();
    }
}
