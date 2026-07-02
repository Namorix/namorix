using Docker.DotNet;
using Docker.DotNet.Models;
using Namorix.Server.Constants;

namespace Namorix.Server.Services;

public class DockerService
{
    public readonly DockerClient Client;

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
                ["label"] = new Dictionary<string, bool> { [AddonLabels.Addon] = true }
            }
        });
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
            $"NMX_ADDON_ID={spec.AddonId}",
            $"NMX_API_URL={spec.ApiUrl}",
            $"NMX_CLIENT_ID={spec.ClientId}",
            $"NMX_REDIRECT_URI={spec.RedirectUri}",
        };
        if (!string.IsNullOrEmpty(spec.PrivateKey))
            envVars.Add($"NMX_PRIVATE_KEY={spec.PrivateKey}");

        var response = await Client.Containers.CreateContainerAsync(new CreateContainerParameters
        {
            Image = spec.Image,
            Env = envVars,
            Labels = new Dictionary<string, string>
            {
                [AddonLabels.Addon] = "true",
                [AddonLabels.Id] = spec.AddonId,
            },
            HostConfig = new HostConfig
            {
                PortBindings = spec.PortMappings?.ToDictionary(
                    p => $"{p.InternalPort}/tcp", IList<PortBinding> (p) => new List<PortBinding>
                    {
                        new() { HostPort = p.HostPort.ToString() }
                    }
                ),
                Memory = spec.MemoryLimit ?? 0,
                NanoCPUs = spec.CpuLimit ?? 0,
                ReadonlyRootfs = true,
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
    public string ApiUrl { get; init; } = string.Empty;
    public string? ClientId { get; init; }
    public string? RedirectUri { get; init; }
    public string? PrivateKey { get; init; }
    public List<PortMapping>? PortMappings { get; init; }
    public int? MemoryLimit { get; init; }
    public long? CpuLimit { get; init; }  // NanoCPUs
}

public class PortMapping
{
    public int InternalPort { get; init; }
    public int HostPort { get; init; }
}