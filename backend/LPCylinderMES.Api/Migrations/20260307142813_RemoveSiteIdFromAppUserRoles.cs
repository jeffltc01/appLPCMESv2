using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSiteIdFromAppUserRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_app_user_roles_sites_site_id",
                table: "app_user_roles");

            migrationBuilder.DropIndex(
                name: "IX_app_user_roles_site_id",
                table: "app_user_roles");

            migrationBuilder.DropIndex(
                name: "IX_app_user_roles_user_id_role_id_site_id",
                table: "app_user_roles");

            migrationBuilder.DropColumn(
                name: "site_id",
                table: "app_user_roles");

            migrationBuilder.CreateIndex(
                name: "IX_app_user_roles_user_id_role_id",
                table: "app_user_roles",
                columns: new[] { "user_id", "role_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_app_user_roles_user_id_role_id",
                table: "app_user_roles");

            migrationBuilder.AddColumn<int>(
                name: "site_id",
                table: "app_user_roles",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_app_user_roles_site_id",
                table: "app_user_roles",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_app_user_roles_user_id_role_id_site_id",
                table: "app_user_roles",
                columns: new[] { "user_id", "role_id", "site_id" },
                unique: true,
                filter: "[site_id] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_app_user_roles_sites_site_id",
                table: "app_user_roles",
                column: "site_id",
                principalTable: "sites",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
