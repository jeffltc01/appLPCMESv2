using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOperatorAuthFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "operator_password_hash",
                table: "app_users",
                type: "varchar(500)",
                unicode: false,
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "app_auth_sessions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    token_hash = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false),
                    auth_method = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    site_id = table.Column<int>(type: "int", nullable: false),
                    work_center_id = table.Column<int>(type: "int", nullable: false),
                    created_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    expires_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    revoked_utc = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_auth_sessions", x => x.id);
                    table.ForeignKey(
                        name: "FK_app_auth_sessions_app_users_user_id",
                        column: x => x.user_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_app_auth_sessions_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_app_auth_sessions_work_centers_work_center_id",
                        column: x => x.work_center_id,
                        principalTable: "work_centers",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "order_field_audits",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_id = table.Column<int>(type: "int", nullable: false),
                    entity_name = table.Column<string>(type: "varchar(60)", unicode: false, maxLength: 60, nullable: false),
                    entity_id = table.Column<int>(type: "int", nullable: true),
                    field_name = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    old_value = table.Column<string>(type: "varchar(4000)", unicode: false, maxLength: 4000, nullable: true),
                    new_value = table.Column<string>(type: "varchar(4000)", unicode: false, maxLength: 4000, nullable: true),
                    action_type = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    actor_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    actor_role = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: true),
                    source = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: true),
                    correlation_id = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: true),
                    occurred_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_field_audits", x => x.id);
                    table.ForeignKey(
                        name: "FK_order_field_audits_sales_orders",
                        column: x => x.order_id,
                        principalTable: "sales_orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_app_auth_sessions_expires_utc",
                table: "app_auth_sessions",
                column: "expires_utc");

            migrationBuilder.CreateIndex(
                name: "IX_app_auth_sessions_site_id",
                table: "app_auth_sessions",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_app_auth_sessions_token_hash",
                table: "app_auth_sessions",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_app_auth_sessions_user_id",
                table: "app_auth_sessions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_app_auth_sessions_work_center_id",
                table: "app_auth_sessions",
                column: "work_center_id");

            migrationBuilder.CreateIndex(
                name: "ix_order_field_audits_occurred_utc",
                table: "order_field_audits",
                column: "occurred_utc");

            migrationBuilder.CreateIndex(
                name: "ix_order_field_audits_order_entity",
                table: "order_field_audits",
                columns: new[] { "order_id", "entity_name", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "ix_order_field_audits_order_id",
                table: "order_field_audits",
                column: "order_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "app_auth_sessions");

            migrationBuilder.DropTable(
                name: "order_field_audits");

            migrationBuilder.DropColumn(
                name: "operator_password_hash",
                table: "app_users");
        }
    }
}
