using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderLifecycleEventsAndKpiSummary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "order_lifecycle_events",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_id = table.Column<int>(type: "int", nullable: false),
                    event_type = table.Column<string>(type: "varchar(60)", unicode: false, maxLength: 60, nullable: false),
                    from_lifecycle_status = table.Column<string>(type: "varchar(60)", unicode: false, maxLength: 60, nullable: true),
                    to_lifecycle_status = table.Column<string>(type: "varchar(60)", unicode: false, maxLength: 60, nullable: true),
                    hold_overlay = table.Column<string>(type: "varchar(60)", unicode: false, maxLength: 60, nullable: true),
                    reason_code = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: true),
                    status_owner_role = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: true),
                    actor_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    occurred_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_lifecycle_events", x => x.id);
                    table.ForeignKey(
                        name: "FK_order_lifecycle_events_sales_orders",
                        column: x => x.order_id,
                        principalTable: "sales_orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_order_lifecycle_events_occurred_utc",
                table: "order_lifecycle_events",
                column: "occurred_utc");

            migrationBuilder.CreateIndex(
                name: "ix_order_lifecycle_events_order_id",
                table: "order_lifecycle_events",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "ix_order_lifecycle_events_order_type_hold",
                table: "order_lifecycle_events",
                columns: new[] { "order_id", "event_type", "hold_overlay" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "order_lifecycle_events");
        }
    }
}
