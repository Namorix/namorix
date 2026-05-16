using Namorix.Adapters.Persistence;
using Namorix.Core.Models;

namespace Namorix.Adapters.Services;

public class ThemeService(AppDbContext appDbContext)
{
    public async Task<IReadOnlyList<ThemeManifest>> GetAllAsync()
    {
        return
        [
            new ThemeManifest
            {
                Id = "light",
                Name = "Light",
                IsBuiltIn = true
            }
        ];
    }
}