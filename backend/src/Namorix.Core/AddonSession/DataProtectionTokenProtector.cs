using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;

namespace Namorix.Core.AddonSession;

public sealed class DataProtectionTokenProtector(
    IDataProtectionProvider provider,
    IOptions<AddonSessionAuthOptions> options) : IAddonTokenProtector
{
    private readonly IDataProtector _protector = provider.CreateProtector(options.Value.ProtectionPurpose);
    private const string Magic = "CfDJ8"; // DataProtection magic prefix

    public string? Protect(string? value)
    {
        if (string.IsNullOrEmpty(value)) return value;
        // Idempotent: re-protecting an already-protected blob would double-encrypt.
        value = value.StartsWith(Magic, StringComparison.Ordinal) ? Unprotect(value) : value;
        return string.IsNullOrEmpty(value) ? value : _protector.Protect(value);
    }

    public string? Unprotect(string? value) =>
        string.IsNullOrEmpty(value) || !value.StartsWith(Magic, StringComparison.Ordinal)
            ? value          // Legacy plaintext -> keep as-is without breaking
            : _protector.Unprotect(value);
}
