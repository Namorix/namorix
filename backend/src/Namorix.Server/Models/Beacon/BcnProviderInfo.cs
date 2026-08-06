namespace Namorix.Server.Models.Beacon;

public enum BcnCredentialFieldType { Text, Secret }

public record BcnCredentialField(string Key, BcnCredentialFieldType Type, bool Required = true);

public record BcnProviderInfo(string Id, BcnProviderKind Kind,
    IReadOnlyList<BcnCredentialField> CredentialFields, bool Tested = false,
    bool HostIsDomain = false);