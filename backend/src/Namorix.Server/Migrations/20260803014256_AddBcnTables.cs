using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddBcnTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BcnHostnames",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Hostname = table.Column<string>(type: "TEXT", maxLength: 253, nullable: false),
                    ProviderId = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Kind = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ConfigJson = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    CurrentIpv4 = table.Column<string>(type: "TEXT", maxLength: 45, nullable: true),
                    CurrentIpv6 = table.Column<string>(type: "TEXT", maxLength: 45, nullable: true),
                    LastCheckedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastUpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastError = table.Column<string>(type: "TEXT", nullable: true),
                    BackoffUntil = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BcnHostnames", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BcnSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CheckIntervalMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    IpDetectionService = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    UpdateIpv6 = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BcnSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BcnActivityLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Level = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    HostnameId = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BcnActivityLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BcnActivityLogs_BcnHostnames_HostnameId",
                        column: x => x.HostnameId,
                        principalTable: "BcnHostnames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BcnActivityLogs_HostnameId",
                table: "BcnActivityLogs",
                column: "HostnameId");

            migrationBuilder.CreateIndex(
                name: "IX_BcnActivityLogs_Timestamp",
                table: "BcnActivityLogs",
                column: "Timestamp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BcnActivityLogs");

            migrationBuilder.DropTable(
                name: "BcnSettings");

            migrationBuilder.DropTable(
                name: "BcnHostnames");
        }
    }
}
