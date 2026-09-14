using Microsoft.EntityFrameworkCore;

namespace Namorix.Core.AddonSession;

// Addons inherit this to get the shared Tokens table mapped into their own context.
public abstract class AddonSessionDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<AddonToken> Tokens => Set<AddonToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // A grant is (addon, user) and an addon serves one user at a time (DG9). Making
        // that a database invariant means a second login cannot quietly create a second
        // row whose data would then be served to whoever asks — the write fails instead.
        modelBuilder.Entity<AddonToken>()
            .HasIndex(t => new { t.ClientId, t.UserId })
            .IsUnique();
    }
}
