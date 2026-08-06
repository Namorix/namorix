using System.Collections.Generic;

namespace Namorix.Server.Models;

public enum DnsCredentialFieldType
{
    Text,
    Secret,
    FilePath,
}

public record DnsCredentialField(
    string Key,
    DnsCredentialFieldType Type,
    bool Required = true
);

public record DnsProvider(
    string Id,
    bool Implemented,
    IReadOnlyList<DnsCredentialField> CredentialFields
);

public static class DnsProviders
{
    public static readonly IReadOnlyList<DnsProvider> All = new List<DnsProvider>
    {
        new("cloudflare", true, [
            new DnsCredentialField("apiToken", DnsCredentialFieldType.Secret)
        ]),

        new("route53", true, [
            new DnsCredentialField("accessKeyId", DnsCredentialFieldType.Text),
            new DnsCredentialField("secretAccessKey", DnsCredentialFieldType.Secret),
            new DnsCredentialField("region", DnsCredentialFieldType.Text, Required: false),
            new DnsCredentialField("hostedZoneId", DnsCredentialFieldType.Text, Required: false)
        ]),

        new("digitalocean", true, [
            new DnsCredentialField("authToken", DnsCredentialFieldType.Secret)
        ]),

        new("godaddy", true, [
            new DnsCredentialField("apiKey", DnsCredentialFieldType.Secret),
            new DnsCredentialField("apiSecret", DnsCredentialFieldType.Secret)
        ]),

        new("azuredns", true, [
            new DnsCredentialField("tenantId", DnsCredentialFieldType.Text),
            new DnsCredentialField("clientId", DnsCredentialFieldType.Text),
            new DnsCredentialField("clientSecret", DnsCredentialFieldType.Secret),
            new DnsCredentialField("subscriptionId", DnsCredentialFieldType.Text, Required: false),
            new DnsCredentialField("resourceGroup", DnsCredentialFieldType.Text, Required: false)
        ]),

        new("gcloud", true, [
            new DnsCredentialField("project", DnsCredentialFieldType.Text),
            new DnsCredentialField("serviceAccountFile", DnsCredentialFieldType.FilePath)
        ]),

        new("namecheap", true, [
            new DnsCredentialField("apiUser", DnsCredentialFieldType.Text),
            new DnsCredentialField("apiKey", DnsCredentialFieldType.Secret)
        ]),

        new("acme-dns", true, [
            new DnsCredentialField("apiBase", DnsCredentialFieldType.Text)
        ]),

        // --- Chưa implement ---

        new("active24", false, []),
        new("akamai-edgedns", false, []),
        new("aliyun", false, []),
        new("all-inkl", false, []),
        new("arvancloud", false, []),
        new("baidu", false, []),
        new("beget", false, []),
        new("bunny", false, []),
        new("cdmon", false, []),
        new("cloudns", false, []),
        new("cloudxns", false, []),
        new("constellix", false, []),
        new("corenetworks", false, []),
        new("cpanel", false, []),
        new("ddnss", false, []),
        new("desec", false, []),
        new("directadmin", false, []),
        new("dnsmadeeasy", false, []),
        new("dnsimple", false, []),
        new("dnsmulti", false, []),
        new("dnspod", false, []),
        new("dode", false, []),
        new("domeneshop", false, []),
        new("duckdns", false, []),
        new("dynu", false, []),
        new("easydns", false, []),
        new("eurodns", false, []),
        new("firstdomains", false, []),
        new("freedns", false, []),
        new("gandiv5", false, []),
        new("gcore", false, []),
        new("glesys", false, []),
        new("googledomains", false, []),
        new("hetzner", false, []),
        new("hetznercloud", false, []),
        new("hostingnl", false, []),
        new("hover", false, []),
        new("hurricane", false, []),
        new("hurricane-ddns", false, []),
        new("infomaniak", false, []),
        new("inwx", false, []),
        new("ionos", false, []),
        new("ispconfig", false, []),
        new("isset", false, []),
        new("joker", false, []),
        new("leaseweb", false, []),
        new("linode", false, []),
        new("loopia", false, []),
        new("luadns", false, []),
        new("mc-host24", false, []),
        new("netcup", false, []),
        new("nicru", false, []),
        new("njalla", false, []),
        new("ns1", false, []),
        new("oraclecloud", false, []),
        new("ovh", false, []),
        new("plesk", false, []),
        new("porkbun", false, []),
        new("pdns", false, []),
        new("regru", false, []),
        new("rfc2136", false, []),
        new("rockenstein", false, []),
        new("selectelv2", false, []),
        new("simply", false, []),
        new("spaceship", false, []),
        new("strato", false, []),
        new("tencentcloud", false, []),
        new("timewebcloud", false, []),
        new("transip", false, []),
        new("vultr", false, []),
        new("websupport", false, []),
        new("wedos", false, []),
        new("zoneedit", false, []),
    };
}
