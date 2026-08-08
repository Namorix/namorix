using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddFgAuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FgAuditLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Actor = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    ActorId = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    ClientIp = table.Column<string>(type: "TEXT", maxLength: 45, nullable: true),
                    TargetType = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    TargetId = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    TargetName = table.Column<string>(type: "TEXT", maxLength: 253, nullable: true),
                    Action = table.Column<string>(type: "TEXT", maxLength: 24, nullable: false),
                    BeforeJson = table.Column<string>(type: "TEXT", maxLength: 8192, nullable: true),
                    AfterJson = table.Column<string>(type: "TEXT", maxLength: 8192, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FgAuditLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FgAuditLogs_TargetType_TargetId",
                table: "FgAuditLogs",
                columns: new[] { "TargetType", "TargetId" });

            migrationBuilder.CreateIndex(
                name: "IX_FgAuditLogs_Timestamp",
                table: "FgAuditLogs",
                column: "Timestamp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FgAuditLogs");
        }
    }
}
