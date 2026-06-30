using Microsoft.EntityFrameworkCore;
using Namorix.Core.Config;
using Namorix.Core.Models;
using Namorix.Server.Constants;
using Namorix.Server.Models;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public class AddonService(AppDbContext appDbContext, DockerService dockerService)
{
    public async Task<List<AddonInstallation>> GetInstalledAddonsAsync()
    {
        return await appDbContext.AddonInstallations.OrderBy(a => a.Name).ToListAsync();
    }

    public async Task<AddonInstallation> InstallAddonAsync(InstallRequest request)
    {
        var addonId = request.Image.Replace("/", "-").Replace(":", "-");

        // Pull image
        await dockerService.PullImageAsync(request.Image);

        // Gen RSA key pair
        var (publicKey, privateKey) = GenerateKeyPair();

        // Create container
        var containerId = await dockerService.CreateContainerAsync(new AddonContainerSpec
        {
            Image = request.Image,
            AddonId = addonId,
            ApiUrl = "http://host.docker.internal:3000",
            ClientId = addonId,
            RedirectUri = $"http://localhost:{request.HostPort}/oauth/callback",
            PrivateKey = privateKey,
            PortMappings = [new PortMapping
            {
                InternalPort = request.ContainerPort,
                HostPort = request.HostPort
            }],
        });

        await dockerService.StartContainerAsync(containerId);

        // Save to DB
        var manifest = new AddonInstallation
        {
            Id = addonId,
            Name = request.Name ?? addonId,
            Description = request.Description,
            Icon = request.Icon,
            Image = request.Image,
            HostPort = request.HostPort,
            Status = AddonStatus.Running,
            Version = request.Version,
            Author = request.Author,
            InstalledAt = DateTime.UtcNow,
            ClientId = addonId,
            PublicKey = publicKey,
            RedirectUri = $"http://localhost:{request.HostPort}/oauth/callback",
        };

        appDbContext.AddonInstallations.Add(manifest);
        await appDbContext.SaveChangesAsync();

        return manifest;
    }

    public async Task UninstallAddonAsync(string id)
    {
        var addon = await appDbContext.AddonInstallations.FindAsync(id)
            ?? throw new KeyNotFoundException($"Addon {id} not found");

        await dockerService.StopContainerAsync(id);
        await dockerService.RemoveContainerAsync(id);

        appDbContext.AddonInstallations.Remove(addon);
        await appDbContext.SaveChangesAsync();
    }

    public async Task StartAddonAsync(string id)
    {
        await dockerService.StartContainerAsync(id);
        var addon = await appDbContext.AddonInstallations.FindAsync(id);
        if (addon is not null)
        {
            addon.Status = AddonStatus.Running;
            await appDbContext.SaveChangesAsync();
        }
    }

    public async Task StopAddonAsync(string id)
    {
        await dockerService.StopContainerAsync(id);
        var addon = await appDbContext.AddonInstallations.FindAsync(id);
        if (addon is not null)
        {
            addon.Status = AddonStatus.Stopped;
            await appDbContext.SaveChangesAsync();
        }
    }
    
    public async Task<List<AddonCatalogEntry>> GetCatalogAsync()
    {
        return await appDbContext.AddonCatalogEntries
            .Where(e => !e.IsOrphaned)
            .OrderBy(e => e.Name)
            .ToListAsync();
    }
    
    public async Task<List<AddonCatalogEntry>> RefreshCatalogAsync(
        CatalogService catalog, AddonCatalogConfig config)
    {
        await catalog.SyncCatalogAsync(
            config.CatalogUrl, config.TtlSeconds, appDbContext, CancellationToken.None, true);
        return await appDbContext.AddonCatalogEntries
            .Where(e => !e.IsOrphaned)
            .OrderBy(e => e.Name)
            .ToListAsync();
    }

    private static (string publicKey, string privateKey) GenerateKeyPair()
    {
        using var rsa = System.Security.Cryptography.RSA.Create(2048);
        var publicKey = Convert.ToBase64String(rsa.ExportRSAPublicKey());
        var privateKey = Convert.ToBase64String(rsa.ExportRSAPrivateKey());
        return (publicKey, privateKey);
    }
}

public class InstallRequest
{
    public string Image { get; init; } = string.Empty;
    public int ContainerPort { get; init; } = 80;
    public int HostPort { get; init; }
    public string? Name { get; init; }
    public string? Description { get; init; }
    public string? Icon { get; init; }
    public string? Version { get; init; }
    public string? Author { get; init; }
}