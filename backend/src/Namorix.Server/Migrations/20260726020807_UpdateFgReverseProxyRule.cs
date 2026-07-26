using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateFgReverseProxyRule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Destination",
                table: "FgReverseProxyRules");

            migrationBuilder.AddColumn<string>(
                name: "AdditionalHeadersJson",
                table: "FgReverseProxyRules",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CacheAssets",
                table: "FgReverseProxyRules",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "DestinationHost",
                table: "FgReverseProxyRules",
                type: "TEXT",
                maxLength: 253,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "DestinationPort",
                table: "FgReverseProxyRules",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "DestinationScheme",
                table: "FgReverseProxyRules",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "ForceSsl",
                table: "FgReverseProxyRules",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HstsEnabled",
                table: "FgReverseProxyRules",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HstsSubdomains",
                table: "FgReverseProxyRules",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Http2Support",
                table: "FgReverseProxyRules",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "TrustForwardedProtoHeaders",
                table: "FgReverseProxyRules",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "WebSocketsSupport",
                table: "FgReverseProxyRules",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "FgReverseProxyLocations",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    RuleId = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Path = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Scheme = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ForwardHost = table.Column<string>(type: "TEXT", maxLength: 253, nullable: false),
                    ForwardPort = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FgReverseProxyLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FgReverseProxyLocations_FgReverseProxyRules_RuleId",
                        column: x => x.RuleId,
                        principalTable: "FgReverseProxyRules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FgReverseProxyLocations_RuleId",
                table: "FgReverseProxyLocations",
                column: "RuleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FgReverseProxyLocations");

            migrationBuilder.DropColumn(
                name: "AdditionalHeadersJson",
                table: "FgReverseProxyRules");

            migrationBuilder.DropColumn(
                name: "CacheAssets",
                table: "FgReverseProxyRules");

            migrationBuilder.DropColumn(
                name: "DestinationHost",
                table: "FgReverseProxyRules");

            migrationBuilder.DropColumn(
                name: "DestinationPort",
                table: "FgReverseProxyRules");

            migrationBuilder.DropColumn(
                name: "DestinationScheme",
                table: "FgReverseProxyRules");

            migrationBuilder.DropColumn(
                name: "ForceSsl",
                table: "FgReverseProxyRules");

            migrationBuilder.DropColumn(
                name: "HstsEnabled",
                table: "FgReverseProxyRules");

            migrationBuilder.DropColumn(
                name: "HstsSubdomains",
                table: "FgReverseProxyRules");

            migrationBuilder.DropColumn(
                name: "Http2Support",
                table: "FgReverseProxyRules");

            migrationBuilder.DropColumn(
                name: "TrustForwardedProtoHeaders",
                table: "FgReverseProxyRules");

            migrationBuilder.DropColumn(
                name: "WebSocketsSupport",
                table: "FgReverseProxyRules");

            migrationBuilder.AddColumn<string>(
                name: "Destination",
                table: "FgReverseProxyRules",
                type: "TEXT",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }
    }
}
