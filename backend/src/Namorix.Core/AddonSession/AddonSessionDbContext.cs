using Microsoft.EntityFrameworkCore;

namespace Namorix.Core.AddonSession;

// Addons inherit this to get the shared Sessions table mapped into their own context.
public abstract class AddonSessionDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<AddonSession> Sessions => Set<AddonSession>();
}
