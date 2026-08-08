using Namorix.Core.Models;

namespace Namorix.Server.Services;

public class ThemeService()
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
                    IsBuiltIn = true
                },
                new ThemeManifest
                {
                    Id = "dark",
                    Name = "Dark",
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