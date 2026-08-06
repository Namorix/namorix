using Microsoft.AspNetCore.DataProtection;
using Namorix.Server.Models.Beacon;

namespace Namorix.Server.Services.Beacon.Providers;

public sealed class BcnSecretProtector(IDataProtectionProvider provider)
{
    private readonly IDataProtector _protector = provider.CreateProtector("Bcn.ConfigJson");
    private const string Magic = "CfDJ8";   // DataProtection magic prefix

    public BcnProviderConfig Protect(BcnProviderConfig config)
    {
        config.Token = ProtectValue(config.Token);
        config.Password = ProtectValue(config.Password);
        config.ApiToken = ProtectValue(config.ApiToken);
        config.ApiKey = ProtectValue(config.ApiKey);
        config.ApiSecret = ProtectValue(config.ApiSecret);
        return config;
    }

    public BcnProviderConfig Unprotect(BcnProviderConfig config)
    {
        config.Token = UnprotectValue(config.Token);
        config.Password = UnprotectValue(config.Password);
        config.ApiToken = UnprotectValue(config.ApiToken);
        config.ApiKey = UnprotectValue(config.ApiKey);
        config.ApiSecret = UnprotectValue(config.ApiSecret);
        return config;
    }

    private string? ProtectValue(string? value)
    {
        if (string.IsNullOrEmpty(value)) return value;
        // Idempotent: ensures round-trip (edit form resubmitting a blob) does not cause double-encryption
        value = value.StartsWith(Magic, StringComparison.Ordinal) ? UnprotectValue(value) : value;
        return string.IsNullOrEmpty(value) ? value : _protector.Protect(value);
    }

    private string? UnprotectValue(string? value) =>
        string.IsNullOrEmpty(value) || !value.StartsWith(Magic, StringComparison.Ordinal)
            ? value          // Legacy plaintext -> keep as-is without breaking
            : _protector.Unprotect(value);
}