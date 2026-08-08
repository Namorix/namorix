using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class RemoveThemeCssPath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CssPath",
                table: "ThemeManifests");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CssPath",
                table: "ThemeManifests",
                type: "TEXT",
                maxLength: 250,
                nullable: false,
                defaultValue: "");
        }
    }
}
