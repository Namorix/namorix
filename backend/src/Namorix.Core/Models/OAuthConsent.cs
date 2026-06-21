using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class OAuthConsent
{
    public int UserId { get; init; }

    [MaxLength(100)] public string ClientId { get; init; } = string.Empty;
    [MaxLength(500)] public string? Scope { get; init; }

    public DateTime GrantedAt { get; init; }
}