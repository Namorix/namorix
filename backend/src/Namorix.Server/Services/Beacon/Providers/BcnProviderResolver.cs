using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Beacon;

namespace Namorix.Server.Services.Beacon.Providers;

public sealed class BcnProviderResolver(BcnProviderRegistry registry,
    BcnSimpleGetProvider simpleGet, BcnRestJsonProvider restJson)
{
    public IBcnProviderClient Resolve(string providerId, BcnProviderConfig config) =>
        registry.Contains(providerId)
            ? registry.Get(providerId)
            : config.Kind == BcnProviderKind.Rest ? restJson : simpleGet;
}