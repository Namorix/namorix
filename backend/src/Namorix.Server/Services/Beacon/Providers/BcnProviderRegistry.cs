using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public sealed class BcnProviderRegistry(IEnumerable<IBcnProviderClient> providers)
{
    private readonly Dictionary<string, IBcnProviderClient> _byId =
        providers.ToDictionary(p => p.Info.Id);

    public IReadOnlyList<BcnProviderInfo> Infos => [.. _byId.Values.Select(p => p.Info)];
    public IBcnProviderClient Get(string providerId) => _byId[providerId];
    public bool Contains(string providerId) => _byId.ContainsKey(providerId);
}