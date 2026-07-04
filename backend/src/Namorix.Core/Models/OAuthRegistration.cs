using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class OAuthRegistration
{
    public int Id { get; init; }

    [MaxLength(200)]
    public string Token { get; init; } = string.Empty;

    [MaxLength(100)]
    public string AddonInstallationId { get; init; } = string.Empty;

    public DateTime ExpiresAt { get; init; }
    public bool Used { get; set; }
}