using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.AddonSession;

public sealed class AddonSessionAuthOptions
{
    public const string SectionName = "AddonSessionAuth";

    [Required] public string CookieName { get; set; } = "nmx_addon_session";
    [Required] public string CallbackPath { get; set; } = "/api/oauth/callback";
    public string RedirectPath { get; set; } = "/";
    public string ProtectionPurpose { get; set; } = "AddonSession.Tokens";
    public string AuthenticationScheme { get; set; } = "AddonSession";
    public int SessionTtlDays { get; set; } = 30;
    public int StateTtlMinutes { get; set; } = 10;
}
