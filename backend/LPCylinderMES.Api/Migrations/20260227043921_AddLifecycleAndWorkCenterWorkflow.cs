using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLifecycleAndWorkCenterWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "attachment_email_prompted",
                table: "sales_orders",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "attachment_email_recipient_summary",
                table: "sales_orders",
                type: "varchar(300)",
                unicode: false,
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "attachment_email_sent",
                table: "sales_orders",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "attachment_email_sent_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "attachment_email_skip_reason",
                table: "sales_orders",
                type: "varchar(200)",
                unicode: false,
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "current_committed_date_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "customer_ready_contact_name",
                table: "sales_orders",
                type: "varchar(150)",
                unicode: false,
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "customer_ready_last_contact_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "customer_ready_retry_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "has_open_rework",
                table: "sales_orders",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "hold_overlay",
                table: "sales_orders",
                type: "varchar(60)",
                unicode: false,
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "inbound_mode",
                table: "sales_orders",
                type: "varchar(40)",
                unicode: false,
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "invoice_review_completed_by_emp_no",
                table: "sales_orders",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "invoice_review_completed_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "invoice_submission_channel",
                table: "sales_orders",
                type: "varchar(40)",
                unicode: false,
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "invoice_submission_correlation_id",
                table: "sales_orders",
                type: "varchar(120)",
                unicode: false,
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "invoice_submission_requested_by_emp_no",
                table: "sales_orders",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "invoice_submission_requested_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "order_lifecycle_status",
                table: "sales_orders",
                type: "varchar(60)",
                unicode: false,
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "order_origin",
                table: "sales_orders",
                type: "varchar(40)",
                unicode: false,
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "outbound_mode",
                table: "sales_orders",
                type: "varchar(40)",
                unicode: false,
                maxLength: 40,
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

            migrationBuilder.AddColumn<DateTime>(
                name: "promised_date_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "requested_date_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "rework_blocking_invoice",
                table: "sales_orders",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "status_note",
                table: "sales_orders",
                type: "varchar(500)",
                unicode: false,
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "status_owner_role",
                table: "sales_orders",
                type: "varchar(40)",
                unicode: false,
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "status_reason_code",
                table: "sales_orders",
                type: "varchar(80)",
                unicode: false,
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "status_updated_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "route_templates",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    route_template_code = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: false),
                    route_template_name = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    description = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    version_no = table.Column<int>(type: "int", nullable: false),
                    created_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    updated_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_route_templates", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "work_centers",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    work_center_code = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    work_center_name = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    site_id = table.Column<int>(type: "int", nullable: false),
                    description = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    default_time_capture_mode = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    requires_scan_by_default = table.Column<bool>(type: "bit", nullable: false),
                    created_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    updated_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_work_centers", x => x.id);
                    table.ForeignKey(
                        name: "FK_work_centers_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "route_template_assignments",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    assignment_name = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    priority = table.Column<int>(type: "int", nullable: false),
                    revision_no = table.Column<int>(type: "int", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    customer_id = table.Column<int>(type: "int", nullable: true),
                    site_id = table.Column<int>(type: "int", nullable: true),
                    item_id = table.Column<int>(type: "int", nullable: true),
                    item_type = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: true),
                    route_template_id = table.Column<int>(type: "int", nullable: false),
                    effective_from_utc = table.Column<DateTime>(type: "datetime", nullable: true),
                    effective_to_utc = table.Column<DateTime>(type: "datetime", nullable: true),
                    created_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    updated_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_route_template_assignments", x => x.id);
                    table.ForeignKey(
                        name: "FK_route_template_assignments_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_route_template_assignments_items_item_id",
                        column: x => x.item_id,
                        principalTable: "items",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_route_template_assignments_route_templates_route_template_id",
                        column: x => x.route_template_id,
                        principalTable: "route_templates",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_route_template_assignments_sites_site_id",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "route_template_steps",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    route_template_id = table.Column<int>(type: "int", nullable: false),
                    step_sequence = table.Column<int>(type: "int", nullable: false),
                    step_code = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: false),
                    step_name = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    work_center_id = table.Column<int>(type: "int", nullable: false),
                    is_required = table.Column<bool>(type: "bit", nullable: false),
                    data_capture_mode = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    time_capture_mode = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    requires_scan = table.Column<bool>(type: "bit", nullable: false),
                    requires_usage_entry = table.Column<bool>(type: "bit", nullable: false),
                    requires_scrap_entry = table.Column<bool>(type: "bit", nullable: false),
                    requires_serial_capture = table.Column<bool>(type: "bit", nullable: false),
                    requires_checklist_completion = table.Column<bool>(type: "bit", nullable: false),
                    checklist_failure_policy = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: false),
                    require_scrap_reason_when_bad = table.Column<bool>(type: "bit", nullable: false),
                    requires_trailer_capture = table.Column<bool>(type: "bit", nullable: false),
                    requires_serial_load_verification = table.Column<bool>(type: "bit", nullable: false),
                    generate_packing_slip_on_complete = table.Column<bool>(type: "bit", nullable: false),
                    generate_bol_on_complete = table.Column<bool>(type: "bit", nullable: false),
                    requires_attachment = table.Column<bool>(type: "bit", nullable: false),
                    requires_supervisor_approval = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_route_template_steps", x => x.id);
                    table.ForeignKey(
                        name: "FK_route_template_steps_route_templates_route_template_id",
                        column: x => x.route_template_id,
                        principalTable: "route_templates",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_route_template_steps_work_centers_work_center_id",
                        column: x => x.work_center_id,
                        principalTable: "work_centers",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "order_line_route_instances",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    sales_order_id = table.Column<int>(type: "int", nullable: false),
                    sales_order_detail_id = table.Column<int>(type: "int", nullable: false),
                    route_template_id = table.Column<int>(type: "int", nullable: false),
                    route_template_assignment_id = table.Column<int>(type: "int", nullable: true),
                    state = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    current_step_sequence = table.Column<int>(type: "int", nullable: true),
                    started_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    completed_utc = table.Column<DateTime>(type: "datetime", nullable: true),
                    route_review_state = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    route_reviewed_by = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    route_reviewed_utc = table.Column<DateTime>(type: "datetime", nullable: true),
                    route_review_notes = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    supervisor_approval_required = table.Column<bool>(type: "bit", nullable: false),
                    supervisor_approved_by = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    supervisor_approved_utc = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_line_route_instances", x => x.id);
                    table.ForeignKey(
                        name: "FK_order_line_route_instances_route_template_assignments_route_template_assignment_id",
                        column: x => x.route_template_assignment_id,
                        principalTable: "route_template_assignments",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_order_line_route_instances_route_templates_route_template_id",
                        column: x => x.route_template_id,
                        principalTable: "route_templates",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_order_line_route_instances_sales_order_details_sales_order_detail_id",
                        column: x => x.sales_order_detail_id,
                        principalTable: "sales_order_details",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_order_line_route_instances_sales_orders_sales_order_id",
                        column: x => x.sales_order_id,
                        principalTable: "sales_orders",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "order_line_route_step_instances",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_line_route_instance_id = table.Column<long>(type: "bigint", nullable: false),
                    sales_order_detail_id = table.Column<int>(type: "int", nullable: false),
                    step_sequence = table.Column<int>(type: "int", nullable: false),
                    step_code = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: false),
                    step_name = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    work_center_id = table.Column<int>(type: "int", nullable: false),
                    state = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    is_required = table.Column<bool>(type: "bit", nullable: false),
                    data_capture_mode = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    time_capture_mode = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    requires_usage_entry = table.Column<bool>(type: "bit", nullable: false),
                    requires_scrap_entry = table.Column<bool>(type: "bit", nullable: false),
                    requires_serial_capture = table.Column<bool>(type: "bit", nullable: false),
                    requires_checklist_completion = table.Column<bool>(type: "bit", nullable: false),
                    requires_trailer_capture = table.Column<bool>(type: "bit", nullable: false),
                    scan_in_utc = table.Column<DateTime>(type: "datetime", nullable: true),
                    scan_out_utc = table.Column<DateTime>(type: "datetime", nullable: true),
                    duration_minutes = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    manual_duration_minutes = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    manual_duration_reason = table.Column<string>(type: "varchar(300)", unicode: false, maxLength: 300, nullable: true),
                    time_capture_source = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    started_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    completed_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    completed_utc = table.Column<DateTime>(type: "datetime", nullable: true),
                    blocked_reason = table.Column<string>(type: "varchar(300)", unicode: false, maxLength: 300, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_line_route_step_instances", x => x.id);
                    table.ForeignKey(
                        name: "FK_order_line_route_step_instances_order_line_route_instances_order_line_route_instance_id",
                        column: x => x.order_line_route_instance_id,
                        principalTable: "order_line_route_instances",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_order_line_route_step_instances_sales_order_details_sales_order_detail_id",
                        column: x => x.sales_order_detail_id,
                        principalTable: "sales_order_details",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_order_line_route_step_instances_work_centers_work_center_id",
                        column: x => x.work_center_id,
                        principalTable: "work_centers",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "operator_activity_logs",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    sales_order_id = table.Column<int>(type: "int", nullable: false),
                    sales_order_detail_id = table.Column<int>(type: "int", nullable: false),
                    order_line_route_step_instance_id = table.Column<long>(type: "bigint", nullable: false),
                    work_center_id = table.Column<int>(type: "int", nullable: false),
                    operator_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    action_type = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    action_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    device_id = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: true),
                    notes = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_operator_activity_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_operator_activity_logs_order_line_route_step_instances_order_line_route_step_instance_id",
                        column: x => x.order_line_route_step_instance_id,
                        principalTable: "order_line_route_step_instances",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_operator_activity_logs_sales_order_details_sales_order_detail_id",
                        column: x => x.sales_order_detail_id,
                        principalTable: "sales_order_details",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_operator_activity_logs_sales_orders_sales_order_id",
                        column: x => x.sales_order_id,
                        principalTable: "sales_orders",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_operator_activity_logs_work_centers_work_center_id",
                        column: x => x.work_center_id,
                        principalTable: "work_centers",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "step_checklist_results",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_line_route_step_instance_id = table.Column<long>(type: "bigint", nullable: false),
                    checklist_template_item_id = table.Column<int>(type: "int", nullable: false),
                    item_label = table.Column<string>(type: "varchar(200)", unicode: false, maxLength: 200, nullable: false),
                    is_required_item = table.Column<bool>(type: "bit", nullable: false),
                    result_status = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    result_notes = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    completed_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    completed_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_step_checklist_results", x => x.id);
                    table.ForeignKey(
                        name: "FK_step_checklist_results_order_line_route_step_instances_order_line_route_step_instance_id",
                        column: x => x.order_line_route_step_instance_id,
                        principalTable: "order_line_route_step_instances",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "step_material_usages",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_line_route_step_instance_id = table.Column<long>(type: "bigint", nullable: false),
                    sales_order_detail_id = table.Column<int>(type: "int", nullable: false),
                    part_item_id = table.Column<int>(type: "int", nullable: false),
                    quantity_used = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    uom = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: true),
                    recorded_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    recorded_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_step_material_usages", x => x.id);
                    table.ForeignKey(
                        name: "FK_step_material_usages_items_part_item_id",
                        column: x => x.part_item_id,
                        principalTable: "items",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_step_material_usages_order_line_route_step_instances_order_line_route_step_instance_id",
                        column: x => x.order_line_route_step_instance_id,
                        principalTable: "order_line_route_step_instances",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_step_material_usages_sales_order_details_sales_order_detail_id",
                        column: x => x.sales_order_detail_id,
                        principalTable: "sales_order_details",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "step_scrap_entries",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_line_route_step_instance_id = table.Column<long>(type: "bigint", nullable: false),
                    sales_order_detail_id = table.Column<int>(type: "int", nullable: false),
                    quantity_scrapped = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    scrap_reason_id = table.Column<int>(type: "int", nullable: false),
                    notes = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    recorded_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    recorded_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_step_scrap_entries", x => x.id);
                    table.ForeignKey(
                        name: "FK_step_scrap_entries_order_line_route_step_instances_order_line_route_step_instance_id",
                        column: x => x.order_line_route_step_instance_id,
                        principalTable: "order_line_route_step_instances",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_step_scrap_entries_sales_order_details_sales_order_detail_id",
                        column: x => x.sales_order_detail_id,
                        principalTable: "sales_order_details",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_step_scrap_entries_scrap_reasons_scrap_reason_id",
                        column: x => x.scrap_reason_id,
                        principalTable: "scrap_reasons",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "step_serial_captures",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_line_route_step_instance_id = table.Column<long>(type: "bigint", nullable: false),
                    sales_order_detail_id = table.Column<int>(type: "int", nullable: false),
                    serial_no = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: false),
                    manufacturer = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    manufacture_date = table.Column<DateOnly>(type: "date", nullable: true),
                    test_date = table.Column<DateOnly>(type: "date", nullable: true),
                    lid_color_id = table.Column<int>(type: "int", nullable: true),
                    lid_size_id = table.Column<int>(type: "int", nullable: true),
                    condition_status = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    scrap_reason_id = table.Column<int>(type: "int", nullable: true),
                    recorded_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    recorded_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_step_serial_captures", x => x.id);
                    table.ForeignKey(
                        name: "FK_step_serial_captures_colors_lid_color_id",
                        column: x => x.lid_color_id,
                        principalTable: "colors",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_step_serial_captures_item_sizes_lid_size_id",
                        column: x => x.lid_size_id,
                        principalTable: "item_sizes",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_step_serial_captures_order_line_route_step_instances_order_line_route_step_instance_id",
                        column: x => x.order_line_route_step_instance_id,
                        principalTable: "order_line_route_step_instances",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_step_serial_captures_sales_order_details_sales_order_detail_id",
                        column: x => x.sales_order_detail_id,
                        principalTable: "sales_order_details",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_step_serial_captures_scrap_reasons_scrap_reason_id",
                        column: x => x.scrap_reason_id,
                        principalTable: "scrap_reasons",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_operator_activity_logs_order_line_route_step_instance_id",
                table: "operator_activity_logs",
                column: "order_line_route_step_instance_id");

            migrationBuilder.CreateIndex(
                name: "IX_operator_activity_logs_sales_order_detail_id",
                table: "operator_activity_logs",
                column: "sales_order_detail_id");

            migrationBuilder.CreateIndex(
                name: "IX_operator_activity_logs_sales_order_id",
                table: "operator_activity_logs",
                column: "sales_order_id");

            migrationBuilder.CreateIndex(
                name: "IX_operator_activity_logs_work_center_id",
                table: "operator_activity_logs",
                column: "work_center_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_line_route_instances_route_template_assignment_id",
                table: "order_line_route_instances",
                column: "route_template_assignment_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_line_route_instances_route_template_id",
                table: "order_line_route_instances",
                column: "route_template_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_line_route_instances_sales_order_detail_id",
                table: "order_line_route_instances",
                column: "sales_order_detail_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_line_route_instances_sales_order_id",
                table: "order_line_route_instances",
                column: "sales_order_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_line_route_step_instances_order_line_route_instance_id",
                table: "order_line_route_step_instances",
                column: "order_line_route_instance_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_line_route_step_instances_sales_order_detail_id",
                table: "order_line_route_step_instances",
                column: "sales_order_detail_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_line_route_step_instances_work_center_id",
                table: "order_line_route_step_instances",
                column: "work_center_id");

            migrationBuilder.CreateIndex(
                name: "IX_route_template_assignments_customer_id",
                table: "route_template_assignments",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "IX_route_template_assignments_item_id",
                table: "route_template_assignments",
                column: "item_id");

            migrationBuilder.CreateIndex(
                name: "IX_route_template_assignments_route_template_id",
                table: "route_template_assignments",
                column: "route_template_id");

            migrationBuilder.CreateIndex(
                name: "IX_route_template_assignments_site_id",
                table: "route_template_assignments",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_route_template_steps_route_template_id",
                table: "route_template_steps",
                column: "route_template_id");

            migrationBuilder.CreateIndex(
                name: "IX_route_template_steps_work_center_id",
                table: "route_template_steps",
                column: "work_center_id");

            migrationBuilder.CreateIndex(
                name: "IX_route_templates_route_template_code",
                table: "route_templates",
                column: "route_template_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_step_checklist_results_order_line_route_step_instance_id",
                table: "step_checklist_results",
                column: "order_line_route_step_instance_id");

            migrationBuilder.CreateIndex(
                name: "IX_step_material_usages_order_line_route_step_instance_id",
                table: "step_material_usages",
                column: "order_line_route_step_instance_id");

            migrationBuilder.CreateIndex(
                name: "IX_step_material_usages_part_item_id",
                table: "step_material_usages",
                column: "part_item_id");

            migrationBuilder.CreateIndex(
                name: "IX_step_material_usages_sales_order_detail_id",
                table: "step_material_usages",
                column: "sales_order_detail_id");

            migrationBuilder.CreateIndex(
                name: "IX_step_scrap_entries_order_line_route_step_instance_id",
                table: "step_scrap_entries",
                column: "order_line_route_step_instance_id");

            migrationBuilder.CreateIndex(
                name: "IX_step_scrap_entries_sales_order_detail_id",
                table: "step_scrap_entries",
                column: "sales_order_detail_id");

            migrationBuilder.CreateIndex(
                name: "IX_step_scrap_entries_scrap_reason_id",
                table: "step_scrap_entries",
                column: "scrap_reason_id");

            migrationBuilder.CreateIndex(
                name: "IX_step_serial_captures_lid_color_id",
                table: "step_serial_captures",
                column: "lid_color_id");

            migrationBuilder.CreateIndex(
                name: "IX_step_serial_captures_lid_size_id",
                table: "step_serial_captures",
                column: "lid_size_id");

            migrationBuilder.CreateIndex(
                name: "IX_step_serial_captures_order_line_route_step_instance_id",
                table: "step_serial_captures",
                column: "order_line_route_step_instance_id");

            migrationBuilder.CreateIndex(
                name: "IX_step_serial_captures_sales_order_detail_id",
                table: "step_serial_captures",
                column: "sales_order_detail_id");

            migrationBuilder.CreateIndex(
                name: "IX_step_serial_captures_scrap_reason_id",
                table: "step_serial_captures",
                column: "scrap_reason_id");

            migrationBuilder.CreateIndex(
                name: "IX_work_centers_site_id",
                table: "work_centers",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_work_centers_work_center_code",
                table: "work_centers",
                column: "work_center_code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "operator_activity_logs");

            migrationBuilder.DropTable(
                name: "route_template_steps");

            migrationBuilder.DropTable(
                name: "step_checklist_results");

            migrationBuilder.DropTable(
                name: "step_material_usages");

            migrationBuilder.DropTable(
                name: "step_scrap_entries");

            migrationBuilder.DropTable(
                name: "step_serial_captures");

            migrationBuilder.DropTable(
                name: "order_line_route_step_instances");

            migrationBuilder.DropTable(
                name: "order_line_route_instances");

            migrationBuilder.DropTable(
                name: "work_centers");

            migrationBuilder.DropTable(
                name: "route_template_assignments");

            migrationBuilder.DropTable(
                name: "route_templates");

            migrationBuilder.DropColumn(
                name: "attachment_email_prompted",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "attachment_email_recipient_summary",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "attachment_email_sent",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "attachment_email_sent_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "attachment_email_skip_reason",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "current_committed_date_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "customer_ready_contact_name",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "customer_ready_last_contact_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "customer_ready_retry_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "has_open_rework",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "hold_overlay",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "inbound_mode",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "invoice_review_completed_by_emp_no",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "invoice_review_completed_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "invoice_submission_channel",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "invoice_submission_correlation_id",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "invoice_submission_requested_by_emp_no",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "invoice_submission_requested_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "order_lifecycle_status",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "order_origin",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "outbound_mode",
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

            migrationBuilder.DropColumn(
                name: "requested_date_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "rework_blocking_invoice",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "status_note",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "status_owner_role",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "status_reason_code",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "status_updated_utc",
                table: "sales_orders");
        }
    }
}
