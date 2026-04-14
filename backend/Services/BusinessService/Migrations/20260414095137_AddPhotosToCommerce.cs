using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusinessService.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotosToCommerce : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PhotosCommerces",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CommerceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NomFichier = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: false),
                    CheminFichier = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TypeContenu = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TailleFichier = table.Column<long>(type: "bigint", nullable: false),
                    Ordre = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    DateAjout = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhotosCommerces", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhotosCommerces_Commerces_CommerceId",
                        column: x => x.CommerceId,
                        principalTable: "Commerces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PhotosCommerces_CommerceId",
                table: "PhotosCommerces",
                column: "CommerceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PhotosCommerces");
        }
    }
}
