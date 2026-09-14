using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Namorix.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddOAuthRefreshTokenRotationSuccessor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EncryptedReplacedRefreshToken",
                table: "OAuthRefreshTokens",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReplacedAt",
                table: "OAuthRefreshTokens",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReplacedByAccessTokenId",
                table: "OAuthRefreshTokens",
                type: "TEXT",
                maxLength: 1024,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EncryptedReplacedRefreshToken",
                table: "OAuthRefreshTokens");

            migrationBuilder.DropColumn(
                name: "ReplacedAt",
                table: "OAuthRefreshTokens");

            migrationBuilder.DropColumn(
                name: "ReplacedByAccessTokenId",
                table: "OAuthRefreshTokens");
        }
    }
}
