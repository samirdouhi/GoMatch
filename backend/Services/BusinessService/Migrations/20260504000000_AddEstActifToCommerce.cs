using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusinessService.Migrations
{
    public partial class AddEstActifToCommerce : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EstActif",
                table: "Commerces",
                type: "bit",
                nullable: false,
                defaultValue: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstActif",
                table: "Commerces");
        }
    }
}
