namespace Namorix.Core.AddonSession;

public interface IAddonTokenProtector
{
    string? Protect(string? value);
    string? Unprotect(string? value);
}
