using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFeatureFlagsAndSitePoliciesSetupConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "feature_flag_configs",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    flag_key = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    display_name = table.Column<string>(type: "varchar(240)", unicode: false, maxLength: 240, nullable: false),
                    category = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: false),
                    site_id = table.Column<int>(type: "int", nullable: true),
                    current_value = table.Column<bool>(type: "bit", nullable: false),
                    effective_from_utc = table.Column<DateTime>(type: "datetime", nullable: true),
                    rollback_plan = table.Column<string>(type: "varchar(1000)", unicode: false, maxLength: 1000, nullable: true),
                    last_reason_code = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: true),
                    last_change_note = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    last_changed_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    last_changed_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_feature_flag_configs", x => x.id);
                    table.ForeignKey(
                        name: "FK_feature_flag_configs_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "setup_config_audits",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    config_type = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    config_key = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    action = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    site_id = table.Column<int>(type: "int", nullable: true),
                    changed_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    changed_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    previous_value = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    new_value = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    reason_code = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: false),
                    change_note = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    correlation_id = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_setup_config_audits", x => x.id);
                    table.ForeignKey(
                        name: "FK_setup_config_audits_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "site_policy_configs",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    policy_key = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    display_name = table.Column<string>(type: "varchar(240)", unicode: false, maxLength: 240, nullable: false),
                    category = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: false),
                    site_id = table.Column<int>(type: "int", nullable: true),
                    policy_value = table.Column<string>(type: "varchar(240)", unicode: false, maxLength: 240, nullable: false),
                    effective_from_utc = table.Column<DateTime>(type: "datetime", nullable: true),
                    rollback_plan = table.Column<string>(type: "varchar(1000)", unicode: false, maxLength: 1000, nullable: true),
                    last_reason_code = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: true),
                    last_change_note = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    last_changed_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    last_changed_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_site_policy_configs", x => x.id);
                    table.ForeignKey(
                        name: "FK_site_policy_configs_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_feature_flag_configs_flag_key",
                table: "feature_flag_configs",
                column: "flag_key",
                unique: true,
                filter: "[site_id] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_feature_flag_configs_flag_key_site_id",
                table: "feature_flag_configs",
                columns: new[] { "flag_key", "site_id" },
                unique: true,
                filter: "[site_id] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_feature_flag_configs_site_id_category",
                table: "feature_flag_configs",
                columns: new[] { "site_id", "category" });

            migrationBuilder.CreateIndex(
                name: "IX_setup_config_audits_changed_utc",
                table: "setup_config_audits",
                column: "changed_utc");

            migrationBuilder.CreateIndex(
                name: "IX_setup_config_audits_config_type_config_key_changed_utc",
                table: "setup_config_audits",
                columns: new[] { "config_type", "config_key", "changed_utc" });

            migrationBuilder.CreateIndex(
                name: "IX_setup_config_audits_site_id",
                table: "setup_config_audits",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_site_policy_configs_policy_key",
                table: "site_policy_configs",
                column: "policy_key",
                unique: true,
                filter: "[site_id] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_site_policy_configs_policy_key_site_id",
                table: "site_policy_configs",
                columns: new[] { "policy_key", "site_id" },
                unique: true,
                filter: "[site_id] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_site_policy_configs_site_id_category",
                table: "site_policy_configs",
                columns: new[] { "site_id", "category" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "feature_flag_configs");

            migrationBuilder.DropTable(
                name: "setup_config_audits");

            migrationBuilder.DropTable(
                name: "site_policy_configs");
        }
    }
}
