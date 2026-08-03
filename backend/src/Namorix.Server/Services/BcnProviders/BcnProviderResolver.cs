using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public sealed class BcnProviderResolver(BcnProviderRegistry registry,
    BcnSimpleGetProvider simpleGet, BcnRestJsonProvider restJson)
{
    public IBcnProviderClient Resolve(string providerId, BcnProviderConfig config) =>
        registry.Contains(providerId)
            ? registry.Get(providerId)
            : config.Kind == BcnProviderKind.Rest ? restJson : simpleGet;
}