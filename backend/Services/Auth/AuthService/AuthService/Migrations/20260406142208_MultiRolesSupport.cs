using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthService.Migrations
{
    public partial class MultiRolesSupport : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_Role_Allowed",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "Roles",
                table: "Users",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"
                UPDATE Users
                SET Roles = CASE
                    WHEN Role IS NULL OR LTRIM(RTRIM(Role)) = '' THEN 'Touriste'
                    WHEN Role = 'Touriste' THEN 'Touriste'
                    WHEN Role = 'Commercant' THEN 'Commercant'
                    WHEN Role = 'Admin' THEN 'Admin'
                    ELSE 'Touriste'
                END
            ");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Touriste");

            migrationBuilder.Sql(@"
                UPDATE Users
                SET Role = CASE
                    WHEN Roles IS NULL OR LTRIM(RTRIM(Roles)) = '' THEN 'Touriste'
                    WHEN Roles LIKE '%Admin%' THEN 'Admin'
                    WHEN Roles LIKE '%Commercant%' THEN 'Commercant'
                    WHEN Roles LIKE '%Touriste%' THEN 'Touriste'
                    ELSE 'Touriste'
                END
            ");

            migrationBuilder.DropColumn(
                name: "Roles",
                table: "Users");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_Role_Allowed",
                table: "Users",
                sql: "[Role] IN ('Touriste','Commercant','Admin')");
        }
    }
}