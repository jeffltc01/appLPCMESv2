using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOverlayReworkLifecycleFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "rework_approved_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "rework_closed_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "rework_disposition",
                table: "sales_orders",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "rework_in_progress_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "rework_last_updated_by_emp_no",
                table: "sales_orders",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "rework_reason_code",
                table: "sales_orders",
                type: "varchar(80)",
                unicode: false,
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "rework_requested_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "rework_state",
                table: "sales_orders",
                type: "varchar(40)",
                unicode: false,
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "rework_verification_pending_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "rework_approved_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "rework_closed_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "rework_disposition",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "rework_in_progress_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "rework_last_updated_by_emp_no",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "rework_reason_code",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "rework_requested_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "rework_state",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "rework_verification_pending_utc",
                table: "sales_orders");
        }
    }
}
