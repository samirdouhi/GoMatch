using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceDecouverte.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePlaceOpenFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "EstOuvert",
                table: "Places",
                type: "bit",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AddColumn<string>(
                name: "HorairesOuverture",
                table: "Places",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Popularite",
                table: "Places",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HorairesOuverture",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "Popularite",
                table: "Places");

            migrationBuilder.AlterColumn<bool>(
                name: "EstOuvert",
                table: "Places",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldNullable: true);
        }
    }
}
