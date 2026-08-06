using System.Text.Json;
using System.Text.Json.Serialization;

namespace Namorix.Server.Models.Beacon;

public sealed class BcnProviderConfig
{
    public static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter() },
    };
    
    public BcnProviderKind Kind { get; set; }

    // GET-based configuration
    public string? UrlTemplate { get; set; }      // Contains placeholders: {hostname}, {ip}, {ipv6}, {token}, {user}, {password}
    public string? AuthType { get; set; }         // "none" | "basic" | "query"
    public string? User { get; set; }
    public string? Password { get; set; }
    public string? Token { get; set; }
    public string? SuccessMatch { get; set; }     // "contains" | "http200" | "custom"
    public string? SuccessContains { get; set; }

    // REST API configuration
    public string? ApiToken { get; set; }
    public string? ApiKey { get; set; }
    public string? ApiSecret { get; set; }
    public string? Zone { get; set; }
    public string? Method { get; set; }           // PATCH | PUT | POST
    public string? EndpointTemplate { get; set; } // Update URL, may contain {recordId}
    public string? BodyTemplate { get; set; }     // JSON body with the placeholders listed above
    public string? SuccessPath { get; set; }      // JSON pointer for "success" flag/field
    public string? RecordLookupTemplate { get; set; }  // Optional: GET request to find the record ID
    public string? RecordIdPath { get; set; }          // JSON pointer to the record ID
}