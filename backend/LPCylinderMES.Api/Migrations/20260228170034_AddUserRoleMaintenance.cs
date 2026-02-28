using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserRoleMaintenance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "app_roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    role_name = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: false),
                    description = table.Column<string>(type: "varchar(240)", unicode: false, maxLength: 240, nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    created_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    updated_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "app_users",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    display_name = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    email = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    default_site_id = table.Column<int>(type: "int", nullable: true),
                    state = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    created_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    updated_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_users", x => x.id);
                    table.ForeignKey(
                        name: "FK_app_users_sites_default_site_id",
                        column: x => x.default_site_id,
                        principalTable: "sites",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "app_user_roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    role_id = table.Column<int>(type: "int", nullable: false),
                    site_id = table.Column<int>(type: "int", nullable: true),
                    created_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    created_by = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_user_roles", x => x.id);
                    table.ForeignKey(
                        name: "FK_app_user_roles_app_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "app_roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_app_user_roles_app_users_user_id",
                        column: x => x.user_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_app_user_roles_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_app_roles_role_name",
                table: "app_roles",
                column: "role_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_app_user_roles_role_id",
                table: "app_user_roles",
                column: "role_id");

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

            migrationBuilder.CreateIndex(
                name: "IX_app_users_default_site_id",
                table: "app_users",
                column: "default_site_id");

            migrationBuilder.CreateIndex(
                name: "IX_app_users_emp_no",
                table: "app_users",
                column: "emp_no",
                unique: true,
                filter: "[emp_no] IS NOT NULL");

            migrationBuilder.InsertData(
                table: "app_roles",
                columns: new[] { "id", "role_name", "description", "is_active", "created_utc", "updated_utc" },
                values: new object[,]
                {
                    { 1, "Admin", "IT-level administration and emergency controls", true, new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc), new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc) },
                    { 2, "Setup", "Master data and configuration ownership", true, new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc), new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc) },
                    { 3, "Office", "Order entry validation and invoice operations", true, new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc), new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc) },
                    { 4, "Transportation", "Inbound/outbound logistics planning and release operations", true, new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc), new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc) },
                    { 5, "Receiving", "Physical intake and reconciliation", true, new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc), new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc) },
                    { 6, "Production", "Work-center execution and production data capture", true, new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc), new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc) },
                    { 7, "Supervisor", "Route review, approval gates, overrides, and exceptional control actions", true, new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc), new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc) },
                    { 8, "Quality", "Quality holds, inspection governance, and release authority", true, new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc), new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc) },
                    { 9, "PlantManager", "Site-level privileged production interventions", true, new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc), new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc) },
                    { 10, "ReadOnly", "View-only operational visibility", true, new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc), new DateTime(2026, 2, 28, 17, 0, 34, DateTimeKind.Utc) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "app_user_roles");

            migrationBuilder.DropTable(
                name: "app_roles");

            migrationBuilder.DropTable(
                name: "app_users");
        }
    }
}
