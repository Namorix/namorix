using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddFgCertificateDomainsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Domain",
                table: "FgCertificates");

            migrationBuilder.CreateTable(
                name: "FgCertificateDomains",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Domain = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    CertificateId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FgCertificateDomains", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FgCertificateDomains_FgCertificates_CertificateId",
                        column: x => x.CertificateId,
                        principalTable: "FgCertificates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FgCertificateDomains_CertificateId",
                table: "FgCertificateDomains",
                column: "CertificateId");

            migrationBuilder.CreateIndex(
                name: "IX_FgCertificateDomains_Domain",
                table: "FgCertificateDomains",
                column: "Domain");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FgCertificateDomains");

            migrationBuilder.AddColumn<string>(
                name: "Domain",
                table: "FgCertificates",
                type: "TEXT",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }
    }
}
