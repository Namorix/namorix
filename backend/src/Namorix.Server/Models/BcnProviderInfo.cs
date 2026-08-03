namespace Namorix.Server.Models;

public enum BcnCredentialFieldType { Text, Secret }

public record BcnCredentialField(string Key, BcnCredentialFieldType Type, bool Required = true);

public record BcnProviderInfo(string Id, BcnProviderKind Kind, IReadOnlyList<BcnCredentialField> CredentialFields);