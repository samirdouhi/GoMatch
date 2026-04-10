using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusinessService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TagsCulturels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagsCulturels", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Commerces",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nom = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Adresse = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Latitude = table.Column<double>(type: "float", nullable: false),
                    Longitude = table.Column<double>(type: "float", nullable: false),
                    ProprietaireUtilisateurId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EstValide = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CategorieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Commerces", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Commerces_Categories_CategorieId",
                        column: x => x.CategorieId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CommerceTagCulturel",
                columns: table => new
                {
                    CommercesId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TagsCulturelsId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommerceTagCulturel", x => new { x.CommercesId, x.TagsCulturelsId });
                    table.ForeignKey(
                        name: "FK_CommerceTagCulturel_Commerces_CommercesId",
                        column: x => x.CommercesId,
                        principalTable: "Commerces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommerceTagCulturel_TagsCulturels_TagsCulturelsId",
                        column: x => x.TagsCulturelsId,
                        principalTable: "TagsCulturels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HorairesCommerces",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CommerceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JourSemaine = table.Column<int>(type: "int", nullable: false),
                    HeureOuverture = table.Column<TimeSpan>(type: "time", nullable: false),
                    HeureFermeture = table.Column<TimeSpan>(type: "time", nullable: false),
                    EstFerme = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HorairesCommerces", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HorairesCommerces_Commerces_CommerceId",
                        column: x => x.CommerceId,
                        principalTable: "Commerces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Nom",
                table: "Categories",
                column: "Nom",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Commerces_CategorieId",
                table: "Commerces",
                column: "CategorieId");

            migrationBuilder.CreateIndex(
                name: "IX_CommerceTagCulturel_TagsCulturelsId",
                table: "CommerceTagCulturel",
                column: "TagsCulturelsId");

            migrationBuilder.CreateIndex(
                name: "IX_HorairesCommerces_CommerceId",
                table: "HorairesCommerces",
                column: "CommerceId");

            migrationBuilder.CreateIndex(
                name: "IX_TagsCulturels_Nom",
                table: "TagsCulturels",
                column: "Nom",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommerceTagCulturel");

            migrationBuilder.DropTable(
                name: "HorairesCommerces");

            migrationBuilder.DropTable(
                name: "TagsCulturels");

            migrationBuilder.DropTable(
                name: "Commerces");

            migrationBuilder.DropTable(
                name: "Categories");
        }
    }
}
