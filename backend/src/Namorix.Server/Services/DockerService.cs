using Docker.DotNet;
using Docker.DotNet.Models;
using Namorix.Core.Constants;
using Namorix.Server.Constants;

namespace Namorix.Server.Services;

public class DockerService
{
    public readonly DockerClient Client;
    public static bool IsRunningInContainer() => File.Exists("/.dockerenv");

    public DockerService()
    {
        var uri = new Uri("unix:///var/run/docker.sock");
        Client = new DockerClientConfiguration(uri).CreateClient();
    }

    public async Task<IList<ContainerListResponse>> ListContainersAsync()
    {
        return await Client.Containers.ListContainersAsync(new ContainersListParameters
        {
            All = true,
            Filters = new Dictionary<string, IDictionary<string, bool>>
            {
                ["label"] = new Dictionary<string, bool> {[AddonLabels.Addon] = true }
            }
        });
    }

    public async Task<bool> ImageExistsLocallyAsync(string image)
    {
        try
        {
            await Client.Images.InspectImageAsync(image);
            return true;
        }
        catch (DockerImageNotFoundException)
        {
            return false;
        }
    }
    
    public async Task<ContainerInspectResponse?> InspectContainerAsync(string id)
    {
        return await Client.Containers.InspectContainerAsync(id);
    }

    public async Task PullImageAsync(string image, IProgress<JSONMessage>? progress = null)
    {
        var credentials = new AuthConfig();
        var parameters = new ImagesCreateParameters { FromImage = image };
        await Client.Images.CreateImageAsync(parameters, credentials, progress ?? new Progress<JSONMessage>());
    }

    public async Task<string> CreateContainerAsync(AddonContainerSpec spec)
    {
        var envVars = new List<string>
        {
            $"{OAuth.NmxOAuth2Env.DesktopApiUrl}={spec.DesktopApiUrl}",
            $"{OAuth.NmxOAuth2Env.DesktopGrpcUrl}={spec.DesktopGrpcUrl}"
        };
        
        if (spec.RegistrationToken is not null)
            envVars.Add($"{OAuth.NmxOAuth2Env.RegistrationToken}={spec.RegistrationToken}");
        
        var response = await Client.Containers.CreateContainerAsync(new CreateContainerParameters
        {
            Image = spec.Image,
            Name = spec.AddonId,
            Env = envVars,
            Labels = new Dictionary<string, string>
            {
                [AddonLabels.Addon] = "true",
                [AddonLabels.Id] = spec.AddonId,
            },
            HostConfig = new HostConfig
            {
                Binds = new List<string>
                {
                    $"{spec.AddonId}-data:/data"
                },
                NetworkMode = "host",
                Memory = spec.MemoryLimit ?? 0,
                NanoCPUs = spec.CpuLimit ?? 0,
                ReadonlyRootfs = true,
                Tmpfs = new Dictionary<string, string> { ["/tmp"] = "rw" },
            },
        });

        return response.ID;
    }

    public async Task StartContainerAsync(string id)
    {
        await Client.Containers.StartContainerAsync(id, null);
    }

    public async Task StopContainerAsync(string id)
    {
        await Client.Containers.StopContainerAsync(id, new ContainerStopParameters());
    }

    public async Task RemoveContainerAsync(string id)
    {
        await Client.Containers.RemoveContainerAsync(id, new ContainerRemoveParameters
        {
            Force = true
        });
    }

    public async Task<bool> RemoveContainerIfExistsAsync(string addonId)
    {
        var containers = await Client.Containers.ListContainersAsync(new ContainersListParameters
        {
            All = true,
            Filters = new Dictionary<string, IDictionary<string, bool>>
            {
                ["name"] = new Dictionary<string, bool> { [$"^/{addonId}$"] = true }
            }
        });

        var existing = containers.FirstOrDefault();
        if (existing is null)
            return false;

        await Client.Containers.RemoveContainerAsync(existing.ID,
            new ContainerRemoveParameters { Force = true });
        return true;
    }
    
    public async Task<string> GetContainerLogsAsync(string id, bool tty = false, CancellationToken cancellationToken = default)
    {
        var parameters = new ContainerLogsParameters
        {
            ShowStdout = true,
            ShowStderr = true,
        };

        using var multiplexedStream = await Client.Containers.GetContainerLogsAsync(
            id, tty, parameters, cancellationToken);

        using var stdout = new MemoryStream();
        using var stderr = new MemoryStream();

        await multiplexedStream.CopyOutputToAsync(Stream.Null, stdout, stderr, cancellationToken);

        stdout.Position = 0;
        stderr.Position = 0;

        var stdoutText = await new StreamReader(stdout).ReadToEndAsync(cancellationToken);
        var stderrText = await new StreamReader(stderr).ReadToEndAsync(cancellationToken);

        return stdoutText + stderrText;
    }
}

public class AddonContainerSpec
{
    public string Image { get; init; } = string.Empty;
    public string AddonId { get; init; } = string.Empty;
    public string DesktopApiUrl { get; init; } = string.Empty;
    public string DesktopGrpcUrl { get; init; } = string.Empty;
    public string? RegistrationToken { get; init; }
    public int? MemoryLimit { get; init; }
    public long? CpuLimit { get; init; }
}