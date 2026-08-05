using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddBcnDomainAndHost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Hostname",
                table: "BcnHostnames",
                newName: "Host");

            migrationBuilder.AddColumn<string>(
                name: "Domain",
                table: "BcnHostnames",
                type: "TEXT",
                maxLength: 253,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Domain",
                table: "BcnHostnames");

            migrationBuilder.RenameColumn(
                name: "Host",
                table: "BcnHostnames",
                newName: "Hostname");
        }
    }
}
