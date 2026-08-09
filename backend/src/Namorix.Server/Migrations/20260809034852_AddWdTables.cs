using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddWdTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WdFirewallRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    SourceCidr = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    Ports = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    Protocol = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    Action = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    Enabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    Auto = table.Column<bool>(type: "INTEGER", nullable: false),
                    Priority = table.Column<int>(type: "INTEGER", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WdFirewallRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WdSecurityEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EventType = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Severity = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    SourceAddon = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    SourceIp = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Count = table.Column<int>(type: "INTEGER", nullable: false),
                    WindowStart = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DetailJson = table.Column<string>(type: "TEXT", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WdSecurityEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WdSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FirewallEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    Profile = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WdSettings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WdFirewallRules_SourceCidr_Enabled",
                table: "WdFirewallRules",
                columns: new[] { "SourceCidr", "Enabled" });

            migrationBuilder.CreateIndex(
                name: "IX_WdSecurityEvents_SourceIp_Timestamp",
                table: "WdSecurityEvents",
                columns: new[] { "SourceIp", "Timestamp" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WdFirewallRules");

            migrationBuilder.DropTable(
                name: "WdSecurityEvents");

            migrationBuilder.DropTable(
                name: "WdSettings");
        }
    }
}
