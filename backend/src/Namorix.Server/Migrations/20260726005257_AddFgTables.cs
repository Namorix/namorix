using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddFgTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReverseProxyRules");

            migrationBuilder.CreateTable(
                name: "FgAccessPolicies",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    RulesJson = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FgAccessPolicies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FgCertificates",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Domain = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Issuer = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    PrivateKeyEncrypted = table.Column<string>(type: "TEXT", nullable: false),
                    CertificateChain = table.Column<string>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AutoRenew = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FgCertificates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FgReverseProxyRules",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Source = table.Column<string>(type: "TEXT", maxLength: 253, nullable: false),
                    Destination = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    CertificateId = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    Access = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    AccessPolicyId = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FgReverseProxyRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FgReverseProxyRules_FgAccessPolicies_AccessPolicyId",
                        column: x => x.AccessPolicyId,
                        principalTable: "FgAccessPolicies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_FgReverseProxyRules_FgCertificates_CertificateId",
                        column: x => x.CertificateId,
                        principalTable: "FgCertificates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FgReverseProxyRules_AccessPolicyId",
                table: "FgReverseProxyRules",
                column: "AccessPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_FgReverseProxyRules_CertificateId",
                table: "FgReverseProxyRules",
                column: "CertificateId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FgReverseProxyRules");

            migrationBuilder.DropTable(
                name: "FgAccessPolicies");

            migrationBuilder.DropTable(
                name: "FgCertificates");

            migrationBuilder.CreateTable(
                name: "ReverseProxyRules",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Access = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Destination = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Source = table.Column<string>(type: "TEXT", maxLength: 253, nullable: false),
                    SslEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReverseProxyRules", x => x.Id);
                });
        }
    }
}
