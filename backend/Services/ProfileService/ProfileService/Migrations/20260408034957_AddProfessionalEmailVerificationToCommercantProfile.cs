using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProfileService.Migrations
{
    /// <inheritdoc />
    public partial class AddProfessionalEmailVerificationToCommercantProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsProfessionalEmailVerified",
                table: "CommercantProfiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ProfessionalEmailVerificationToken",
                table: "CommercantProfiles",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProfessionalEmailVerificationTokenExpiresAt",
                table: "CommercantProfiles",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsProfessionalEmailVerified",
                table: "CommercantProfiles");

            migrationBuilder.DropColumn(
                name: "ProfessionalEmailVerificationToken",
                table: "CommercantProfiles");

            migrationBuilder.DropColumn(
                name: "ProfessionalEmailVerificationTokenExpiresAt",
                table: "CommercantProfiles");
        }
    }
}
