using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusinessService.Migrations
{
    /// <inheritdoc />
    public partial class AddCommerceStatusAndOwnerEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProprietaireEmail",
                table: "Commerces",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RaisonRejet",
                table: "Commerces",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Statut",
                table: "Commerces",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "EnAttente");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProprietaireEmail",
                table: "Commerces");

            migrationBuilder.DropColumn(
                name: "RaisonRejet",
                table: "Commerces");

            migrationBuilder.DropColumn(
                name: "Statut",
                table: "Commerces");
        }
    }
}
