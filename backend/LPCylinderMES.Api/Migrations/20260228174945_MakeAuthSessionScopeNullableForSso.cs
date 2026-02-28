using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class MakeAuthSessionScopeNullableForSso : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_app_auth_sessions_sites_site_id",
                table: "app_auth_sessions");

            migrationBuilder.DropForeignKey(
                name: "FK_app_auth_sessions_work_centers_work_center_id",
                table: "app_auth_sessions");

            migrationBuilder.AlterColumn<int>(
                name: "work_center_id",
                table: "app_auth_sessions",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "site_id",
                table: "app_auth_sessions",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_app_auth_sessions_sites_site_id",
                table: "app_auth_sessions",
                column: "site_id",
                principalTable: "sites",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_app_auth_sessions_work_centers_work_center_id",
                table: "app_auth_sessions",
                column: "work_center_id",
                principalTable: "work_centers",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_app_auth_sessions_sites_site_id",
                table: "app_auth_sessions");

            migrationBuilder.DropForeignKey(
                name: "FK_app_auth_sessions_work_centers_work_center_id",
                table: "app_auth_sessions");

            migrationBuilder.AlterColumn<int>(
                name: "work_center_id",
                table: "app_auth_sessions",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "site_id",
                table: "app_auth_sessions",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_app_auth_sessions_sites_site_id",
                table: "app_auth_sessions",
                column: "site_id",
                principalTable: "sites",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_app_auth_sessions_work_centers_work_center_id",
                table: "app_auth_sessions",
                column: "work_center_id",
                principalTable: "work_centers",
                principalColumn: "id");
        }
    }
}
