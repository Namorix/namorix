using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddFgDryRun : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DryRunExpiresAt",
                table: "FgReverseProxyRules",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DryRunSnapshotJson",
                table: "FgReverseProxyRules",
                type: "TEXT",
                maxLength: 8192,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DryRunExpiresAt",
                table: "FgReverseProxyRules");

            migrationBuilder.DropColumn(
                name: "DryRunSnapshotJson",
                table: "FgReverseProxyRules");
        }
    }
}
