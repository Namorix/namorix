using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddFgCertificateStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "FgCertificates",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_FgReverseProxyRules_Source",
                table: "FgReverseProxyRules",
                column: "Source",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FgReverseProxyRules_Source",
                table: "FgReverseProxyRules");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "FgCertificates");
        }
    }
}
