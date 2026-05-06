using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CultureService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CategoriesCulturelles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Nom = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Icone = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoriesCulturelles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TagsCulturels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Nom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagsCulturels", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContenusCulturels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Titre = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Corps = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Resume = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Lieu = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Latitude = table.Column<double>(type: "float", nullable: true),
                    Longitude = table.Column<double>(type: "float", nullable: true),
                    Statut = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LangueOriginale = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    AuteurId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DatePublication = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DateMiseAJour = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CategorieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContenusCulturels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContenusCulturels_CategoriesCulturelles_CategorieId",
                        column: x => x.CategorieId,
                        principalTable: "CategoriesCulturelles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ContenuCulturelTag",
                columns: table => new
                {
                    ContenusId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TagsId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContenuCulturelTag", x => new { x.ContenusId, x.TagsId });
                    table.ForeignKey(
                        name: "FK_ContenuCulturelTag_ContenusCulturels_ContenusId",
                        column: x => x.ContenusId,
                        principalTable: "ContenusCulturels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContenuCulturelTag_TagsCulturels_TagsId",
                        column: x => x.TagsId,
                        principalTable: "TagsCulturels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MediasContenus",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Url = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Legende = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Ordre = table.Column<int>(type: "int", nullable: false),
                    DateAjout = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ContenuCulturelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediasContenus", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MediasContenus_ContenusCulturels_ContenuCulturelId",
                        column: x => x.ContenuCulturelId,
                        principalTable: "ContenusCulturels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TraductionsContenus",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Langue = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Titre = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Corps = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Resume = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateMiseAJour = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ContenuCulturelId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraductionsContenus", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TraductionsContenus_ContenusCulturels_ContenuCulturelId",
                        column: x => x.ContenuCulturelId,
                        principalTable: "ContenusCulturels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(name: "IX_CategoriesCulturelles_Nom", table: "CategoriesCulturelles", column: "Nom", unique: true);
            migrationBuilder.CreateIndex(name: "IX_TagsCulturels_Nom", table: "TagsCulturels", column: "Nom", unique: true);
            migrationBuilder.CreateIndex(name: "IX_ContenusCulturels_CategorieId", table: "ContenusCulturels", column: "CategorieId");
            migrationBuilder.CreateIndex(name: "IX_ContenuCulturelTag_TagsId", table: "ContenuCulturelTag", column: "TagsId");
            migrationBuilder.CreateIndex(name: "IX_MediasContenus_ContenuCulturelId", table: "MediasContenus", column: "ContenuCulturelId");
            migrationBuilder.CreateIndex(name: "IX_TraductionsContenus_ContenuCulturelId_Langue", table: "TraductionsContenus", columns: new[] { "ContenuCulturelId", "Langue" }, unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ContenuCulturelTag");
            migrationBuilder.DropTable(name: "MediasContenus");
            migrationBuilder.DropTable(name: "TraductionsContenus");
            migrationBuilder.DropTable(name: "ContenusCulturels");
            migrationBuilder.DropTable(name: "CategoriesCulturelles");
            migrationBuilder.DropTable(name: "TagsCulturels");
        }
    }
}
