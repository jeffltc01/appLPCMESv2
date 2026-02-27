using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderLifecycleBackfillAuditAndRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "order_lifecycle_migration_audits",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    migration_batch_id = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false),
                    order_id = table.Column<int>(type: "int", nullable: false),
                    legacy_status = table.Column<string>(type: "varchar(60)", unicode: false, maxLength: 60, nullable: false),
                    previous_lifecycle_status = table.Column<string>(type: "varchar(60)", unicode: false, maxLength: 60, nullable: true),
                    proposed_lifecycle_status = table.Column<string>(type: "varchar(60)", unicode: false, maxLength: 60, nullable: false),
                    rule_applied = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    dry_run = table.Column<bool>(type: "bit", nullable: false),
                    was_updated = table.Column<bool>(type: "bit", nullable: false),
                    migrated_by = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: true),
                    computed_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    applied_utc = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_lifecycle_migration_audits", x => x.id);
                    table.ForeignKey(
                        name: "FK_order_lifecycle_migration_audits_sales_orders",
                        column: x => x.order_id,
                        principalTable: "sales_orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_order_lifecycle_migration_audits_batch_id",
                table: "order_lifecycle_migration_audits",
                column: "migration_batch_id");

            migrationBuilder.CreateIndex(
                name: "ix_order_lifecycle_migration_audits_computed_utc",
                table: "order_lifecycle_migration_audits",
                column: "computed_utc");

            migrationBuilder.CreateIndex(
                name: "ix_order_lifecycle_migration_audits_order_id",
                table: "order_lifecycle_migration_audits",
                column: "order_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "order_lifecycle_migration_audits");
        }
    }
}
