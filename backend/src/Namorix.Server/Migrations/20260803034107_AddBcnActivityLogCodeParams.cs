using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddBcnActivityLogCodeParams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Message",
                table: "BcnActivityLogs");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "BcnActivityLogs",
                type: "TEXT",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParamsJson",
                table: "BcnActivityLogs",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Code",
                table: "BcnActivityLogs");

            migrationBuilder.DropColumn(
                name: "ParamsJson",
                table: "BcnActivityLogs");

            migrationBuilder.AddColumn<string>(
                name: "Message",
                table: "BcnActivityLogs",
                type: "TEXT",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }
    }
}
