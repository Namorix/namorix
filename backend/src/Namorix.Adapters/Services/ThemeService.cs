using Namorix.Adapters.Persistence;
using Namorix.Core.Models;

namespace Namorix.Adapters.Services;

public class ThemeService(AppDbContext appDbContext)
{
    public static Task<IReadOnlyList<ThemeManifest>> GetAllAsync()
    {
        try
        {
            return Task.FromResult<IReadOnlyList<ThemeManifest>>([
                new ThemeManifest
                {
                    Id = "light",
                    Name = "Light",
                    CssPath = "/theme.css",
                    IsBuiltIn = true
                },
                new ThemeManifest
                {
                    Id = "dark",
                    Name = "Dark",
                    CssPath = "/theme.css",
                    IsBuiltIn = true
                },
            ]);
        }
        catch (Exception exception)
        {
            return Task.FromException<IReadOnlyList<ThemeManifest>>(exception);
        }
    }
}