using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.AddonSession;

public sealed class AddonSessionAuthOptions
{
    public const string SectionName = "AddonSessionAuth";

    [Required] public string CookieName { get; set; } = "nmx_addon_session";
    [Required] public string CallbackPath { get; set; } = Constants.OAuth.AddonToken.CallbackPath;
    public string RedirectPath { get; set; } = "/";
    public string ProtectionPurpose { get; set; } = "AddonSession.Tokens";
    public string AuthenticationScheme { get; set; } = "AddonSession";
    public int SessionTtlMinutes { get; set; } = 60 * 24 * 30;
    public int StateTtlMinutes { get; set; } = 10;
}
