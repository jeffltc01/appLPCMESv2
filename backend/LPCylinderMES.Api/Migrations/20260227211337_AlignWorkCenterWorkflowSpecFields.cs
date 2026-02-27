using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AlignWorkCenterWorkflowSpecFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "active_line_route_count",
                table: "sales_orders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "bol_document_uri",
                table: "sales_orders",
                type: "varchar(500)",
                unicode: false,
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "bol_generated_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "bol_no",
                table: "sales_orders",
                type: "varchar(40)",
                unicode: false,
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "completed_line_route_count",
                table: "sales_orders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "has_blocking_quality_hold",
                table: "sales_orders",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "packing_slip_document_uri",
                table: "sales_orders",
                type: "varchar(500)",
                unicode: false,
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "packing_slip_generated_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "packing_slip_no",
                table: "sales_orders",
                type: "varchar(40)",
                unicode: false,
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "pending_supervisor_review_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "production_completed_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "production_state",
                table: "sales_orders",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "supervisor_reviewed_by",
                table: "sales_orders",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "supervisor_reviewed_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "active_line_route_instance_id",
                table: "sales_order_details",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "last_completed_step_sequence",
                table: "sales_order_details",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "last_completed_step_utc",
                table: "sales_order_details",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "open_rework_count",
                table: "sales_order_details",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "primary_work_center_id",
                table: "sales_order_details",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "auto_queue_next_step",
                table: "route_template_steps",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "checklist_template_id",
                table: "route_template_steps",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "sla_minutes",
                table: "route_template_steps",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "order_priority_max",
                table: "route_template_assignments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "order_priority_min",
                table: "route_template_assignments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "pick_up_via_id",
                table: "route_template_assignments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ship_to_via_id",
                table: "route_template_assignments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "supervisor_gate_override",
                table: "route_template_assignments",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "checklist_failure_policy",
                table: "order_line_route_step_instances",
                type: "varchar(40)",
                unicode: false,
                maxLength: 40,
                nullable: false,
                defaultValue: "BlockCompletion");

            migrationBuilder.AddColumn<int>(
                name: "checklist_template_id",
                table: "order_line_route_step_instances",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "generate_bol_on_complete",
                table: "order_line_route_step_instances",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "generate_packing_slip_on_complete",
                table: "order_line_route_step_instances",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "require_scrap_reason_when_bad",
                table: "order_line_route_step_instances",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "requires_attachment",
                table: "order_line_route_step_instances",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "requires_scan",
                table: "order_line_route_step_instances",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "requires_serial_load_verification",
                table: "order_line_route_step_instances",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "requires_supervisor_approval",
                table: "order_line_route_step_instances",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "step_adjusted_by",
                table: "order_line_route_step_instances",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "step_adjusted_utc",
                table: "order_line_route_step_instances",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "step_adjustment_reason",
                table: "order_line_route_step_instances",
                type: "varchar(300)",
                unicode: false,
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "route_template_version_no",
                table: "order_line_route_instances",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_route_template_assignments_pick_up_via_id",
                table: "route_template_assignments",
                column: "pick_up_via_id");

            migrationBuilder.CreateIndex(
                name: "IX_route_template_assignments_ship_to_via_id",
                table: "route_template_assignments",
                column: "ship_to_via_id");

            migrationBuilder.AddForeignKey(
                name: "FK_route_template_assignments_ship_vias_pick_up_via_id",
                table: "route_template_assignments",
                column: "pick_up_via_id",
                principalTable: "ship_vias",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_route_template_assignments_ship_vias_ship_to_via_id",
                table: "route_template_assignments",
                column: "ship_to_via_id",
                principalTable: "ship_vias",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_route_template_assignments_ship_vias_pick_up_via_id",
                table: "route_template_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_route_template_assignments_ship_vias_ship_to_via_id",
                table: "route_template_assignments");

            migrationBuilder.DropIndex(
                name: "IX_route_template_assignments_pick_up_via_id",
                table: "route_template_assignments");

            migrationBuilder.DropIndex(
                name: "IX_route_template_assignments_ship_to_via_id",
                table: "route_template_assignments");

            migrationBuilder.DropColumn(
                name: "active_line_route_count",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "bol_document_uri",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "bol_generated_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "bol_no",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "completed_line_route_count",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "has_blocking_quality_hold",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "packing_slip_document_uri",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "packing_slip_generated_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "packing_slip_no",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "pending_supervisor_review_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "production_completed_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "production_state",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "supervisor_reviewed_by",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "supervisor_reviewed_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "active_line_route_instance_id",
                table: "sales_order_details");

            migrationBuilder.DropColumn(
                name: "last_completed_step_sequence",
                table: "sales_order_details");

            migrationBuilder.DropColumn(
                name: "last_completed_step_utc",
                table: "sales_order_details");

            migrationBuilder.DropColumn(
                name: "open_rework_count",
                table: "sales_order_details");

            migrationBuilder.DropColumn(
                name: "primary_work_center_id",
                table: "sales_order_details");

            migrationBuilder.DropColumn(
                name: "auto_queue_next_step",
                table: "route_template_steps");

            migrationBuilder.DropColumn(
                name: "checklist_template_id",
                table: "route_template_steps");

            migrationBuilder.DropColumn(
                name: "sla_minutes",
                table: "route_template_steps");

            migrationBuilder.DropColumn(
                name: "order_priority_max",
                table: "route_template_assignments");

            migrationBuilder.DropColumn(
                name: "order_priority_min",
                table: "route_template_assignments");

            migrationBuilder.DropColumn(
                name: "pick_up_via_id",
                table: "route_template_assignments");

            migrationBuilder.DropColumn(
                name: "ship_to_via_id",
                table: "route_template_assignments");

            migrationBuilder.DropColumn(
                name: "supervisor_gate_override",
                table: "route_template_assignments");

            migrationBuilder.DropColumn(
                name: "checklist_failure_policy",
                table: "order_line_route_step_instances");

            migrationBuilder.DropColumn(
                name: "checklist_template_id",
                table: "order_line_route_step_instances");

            migrationBuilder.DropColumn(
                name: "generate_bol_on_complete",
                table: "order_line_route_step_instances");

            migrationBuilder.DropColumn(
                name: "generate_packing_slip_on_complete",
                table: "order_line_route_step_instances");

            migrationBuilder.DropColumn(
                name: "require_scrap_reason_when_bad",
                table: "order_line_route_step_instances");

            migrationBuilder.DropColumn(
                name: "requires_attachment",
                table: "order_line_route_step_instances");

            migrationBuilder.DropColumn(
                name: "requires_scan",
                table: "order_line_route_step_instances");

            migrationBuilder.DropColumn(
                name: "requires_serial_load_verification",
                table: "order_line_route_step_instances");

            migrationBuilder.DropColumn(
                name: "requires_supervisor_approval",
                table: "order_line_route_step_instances");

            migrationBuilder.DropColumn(
                name: "step_adjusted_by",
                table: "order_line_route_step_instances");

            migrationBuilder.DropColumn(
                name: "step_adjusted_utc",
                table: "order_line_route_step_instances");

            migrationBuilder.DropColumn(
                name: "step_adjustment_reason",
                table: "order_line_route_step_instances");

            migrationBuilder.DropColumn(
                name: "route_template_version_no",
                table: "order_line_route_instances");
        }
    }
}
