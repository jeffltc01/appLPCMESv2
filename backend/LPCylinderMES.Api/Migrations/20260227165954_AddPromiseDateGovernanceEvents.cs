using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPromiseDateGovernanceEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "order_promise_change_events",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_id = table.Column<int>(type: "int", nullable: false),
                    event_type = table.Column<string>(type: "varchar(60)", unicode: false, maxLength: 60, nullable: false),
                    old_committed_date_utc = table.Column<DateTime>(type: "datetime", nullable: true),
                    new_committed_date_utc = table.Column<DateTime>(type: "datetime", nullable: true),
                    promise_change_reason_code = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: true),
                    promise_change_reason_note = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    changed_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    occurred_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    customer_notification_status = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    customer_notification_channel = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: true),
                    customer_notification_utc = table.Column<DateTime>(type: "datetime", nullable: true),
                    customer_notification_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    miss_reason_code = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_promise_change_events", x => x.id);
                    table.ForeignKey(
                        name: "FK_order_promise_change_events_sales_orders",
                        column: x => x.order_id,
                        principalTable: "sales_orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_order_promise_change_events_occurred_utc",
                table: "order_promise_change_events",
                column: "occurred_utc");

            migrationBuilder.CreateIndex(
                name: "ix_order_promise_change_events_order_id",
                table: "order_promise_change_events",
                column: "order_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "order_promise_change_events");
        }
    }
}
