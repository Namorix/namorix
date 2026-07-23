using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPortsToAddonInstallations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Ports",
                table: "AddonInstallations",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Ports",
                table: "AddonInstallations");
        }
    }
}
