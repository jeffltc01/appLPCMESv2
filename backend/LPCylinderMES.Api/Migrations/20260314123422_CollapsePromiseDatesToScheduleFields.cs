using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class CollapsePromiseDatesToScheduleFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "schedule_week_of",
                table: "sales_orders",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "target_date_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE sales_orders
                SET target_date_utc = COALESCE(current_committed_date_utc, promised_date_utc),
                    schedule_week_of = CASE
                        WHEN COALESCE(current_committed_date_utc, promised_date_utc) IS NOT NULL
                        THEN DATEADD(day, -((DATEPART(weekday, COALESCE(current_committed_date_utc, promised_date_utc)) + 5) % 7), CAST(COALESCE(current_committed_date_utc, promised_date_utc) AS date))
                        ELSE NULL
                    END
                WHERE COALESCE(current_committed_date_utc, promised_date_utc) IS NOT NULL;
            ");

            migrationBuilder.DropColumn(
                name: "current_committed_date_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "promise_date_last_changed_by_emp_no",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "promise_date_last_changed_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "promise_miss_reason_code",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "promise_revision_count",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "promised_date_utc",
                table: "sales_orders");

            migrationBuilder.RenameColumn(
                name: "old_committed_date_utc",
                table: "order_promise_change_events",
                newName: "old_date_utc");

            migrationBuilder.RenameColumn(
                name: "new_committed_date_utc",
                table: "order_promise_change_events",
                newName: "new_date_utc");

            migrationBuilder.RenameColumn(
                name: "promise_change_reason_note",
                table: "order_promise_change_events",
                newName: "note");

            migrationBuilder.DropColumn(
                name: "customer_notification_by_emp_no",
                table: "order_promise_change_events");

            migrationBuilder.DropColumn(
                name: "customer_notification_channel",
                table: "order_promise_change_events");

            migrationBuilder.DropColumn(
                name: "customer_notification_status",
                table: "order_promise_change_events");

            migrationBuilder.DropColumn(
                name: "customer_notification_utc",
                table: "order_promise_change_events");

            migrationBuilder.DropColumn(
                name: "event_type",
                table: "order_promise_change_events");

            migrationBuilder.DropColumn(
                name: "miss_reason_code",
                table: "order_promise_change_events");

            migrationBuilder.DropColumn(
                name: "promise_change_reason_code",
                table: "order_promise_change_events");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "schedule_week_of",
                table: "sales_orders");

            migrationBuilder.RenameColumn(
                name: "target_date_utc",
                table: "sales_orders",
                newName: "promised_date_utc");

            migrationBuilder.RenameColumn(
                name: "old_date_utc",
                table: "order_promise_change_events",
                newName: "old_committed_date_utc");

            migrationBuilder.RenameColumn(
                name: "note",
                table: "order_promise_change_events",
                newName: "promise_change_reason_note");

            migrationBuilder.RenameColumn(
                name: "new_date_utc",
                table: "order_promise_change_events",
                newName: "new_committed_date_utc");

            migrationBuilder.AddColumn<DateTime>(
                name: "current_committed_date_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "promise_date_last_changed_by_emp_no",
                table: "sales_orders",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "promise_date_last_changed_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "promise_miss_reason_code",
                table: "sales_orders",
                type: "varchar(80)",
                unicode: false,
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "promise_revision_count",
                table: "sales_orders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "customer_notification_by_emp_no",
                table: "order_promise_change_events",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "customer_notification_channel",
                table: "order_promise_change_events",
                type: "varchar(40)",
                unicode: false,
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "customer_notification_status",
                table: "order_promise_change_events",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "customer_notification_utc",
                table: "order_promise_change_events",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "event_type",
                table: "order_promise_change_events",
                type: "varchar(60)",
                unicode: false,
                maxLength: 60,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "miss_reason_code",
                table: "order_promise_change_events",
                type: "varchar(80)",
                unicode: false,
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "promise_change_reason_code",
                table: "order_promise_change_events",
                type: "varchar(80)",
                unicode: false,
                maxLength: 80,
                nullable: true);
        }
    }
}
