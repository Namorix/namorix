using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Namorix.Core.IO;
using Namorix.Server.Config;

namespace Namorix.Server.Infrastructure;

public static class SelfSignedCertificateProvider
{
    public static void Ensure(ref BackendConfig config, DataDirectory dataDir)
    {
        var pkiDir = dataDir.PkiPath;
        var certPath = Path.Combine(pkiDir, "namorix-selfsigned.pfx");

        if (!IsValidCertificate(certPath))
        {
            Directory.CreateDirectory(pkiDir);
            using var rsa = RSA.Create(2048);
            var subject = new X500DistinguishedName("CN=namorix.local");
            var request = new CertificateRequest(subject, rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

            request.CertificateExtensions.Add(new X509BasicConstraintsExtension(false, false, 0, true));
            request.CertificateExtensions.Add(new X509KeyUsageExtension(
                X509KeyUsageFlags.DigitalSignature | X509KeyUsageFlags.KeyEncipherment, true));
            request.CertificateExtensions.Add(new X509EnhancedKeyUsageExtension(
                new OidCollection { new Oid("1.3.6.1.5.5.7.3.1") }, true));
            using var cert = request.CreateSelfSigned(DateTimeOffset.Now, DateTimeOffset.Now.AddYears(5));

            File.WriteAllBytes(certPath, cert.Export(X509ContentType.Pfx, ""));
        }

        config.SslCertPath = Path.GetFullPath(certPath);
        config.SslCertPassword = "";
    }

    private static bool IsValidCertificate(string certPath)
    {
        if (!File.Exists(certPath))
            return false;

        try
        {
            using var cert = X509CertificateLoader.LoadPkcs12FromFile(
                certPath, "", X509KeyStorageFlags.EphemeralKeySet);
            return true;
        }
        catch (Exception ex) when (ex is CryptographicException or ArgumentException or IOException)
        {
            return false;
        }
    }
}