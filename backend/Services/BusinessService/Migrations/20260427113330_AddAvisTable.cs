using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusinessService.Migrations
{
    /// <inheritdoc />
    public partial class AddAvisTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Avis",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CommerceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UtilisateurId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UtilisateurEmail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Note = table.Column<int>(type: "int", nullable: false),
                    Commentaire = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Avis", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Avis_Commerces_CommerceId",
                        column: x => x.CommerceId,
                        principalTable: "Commerces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Avis_CommerceId",
                table: "Avis",
                column: "CommerceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Avis");
        }
    }
}
