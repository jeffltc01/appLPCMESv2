using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDecisionPolicyGovernanceAndInvoiceEvidence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "delivery_evidence_received_utc",
                table: "sales_orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "delivery_evidence_status",
                table: "sales_orders",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "erp_invoice_reference",
                table: "sales_orders",
                type: "varchar(80)",
                unicode: false,
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "erp_reconcile_note",
                table: "sales_orders",
                type: "varchar(500)",
                unicode: false,
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "erp_reconcile_status",
                table: "sales_orders",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "invoice_staging_error",
                table: "sales_orders",
                type: "varchar(500)",
                unicode: false,
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "invoice_staging_result",
                table: "sales_orders",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "category",
                table: "order_attachments",
                type: "varchar(60)",
                unicode: false,
                maxLength: 60,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "business_decision_policies",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    policy_version = table.Column<int>(type: "int", nullable: false),
                    decision_key = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    scope_type = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    site_id = table.Column<int>(type: "int", nullable: true),
                    customer_id = table.Column<int>(type: "int", nullable: true),
                    policy_value = table.Column<string>(type: "varchar(1000)", unicode: false, maxLength: 1000, nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    updated_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    updated_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    notes = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_decision_policies", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "business_decision_signoffs",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    policy_version = table.Column<int>(type: "int", nullable: false),
                    function_role = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: false),
                    approved_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    approved_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    notes = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_decision_signoffs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "promise_reason_policies",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    reason_code = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: false),
                    description = table.Column<string>(type: "varchar(240)", unicode: false, maxLength: 240, nullable: false),
                    owner_role = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: false),
                    allowed_notification_policies = table.Column<string>(type: "varchar(200)", unicode: false, maxLength: 200, nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    updated_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    updated_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_promise_reason_policies", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_business_decision_policies_policy_version_decision_key_scope_type_site_id_customer_id",
                table: "business_decision_policies",
                columns: new[] { "policy_version", "decision_key", "scope_type", "site_id", "customer_id" },
                unique: true,
                filter: "[site_id] IS NOT NULL AND [customer_id] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_business_decision_signoffs_policy_version_function_role",
                table: "business_decision_signoffs",
                columns: new[] { "policy_version", "function_role" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_promise_reason_policies_reason_code",
                table: "promise_reason_policies",
                column: "reason_code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "business_decision_policies");

            migrationBuilder.DropTable(
                name: "business_decision_signoffs");

            migrationBuilder.DropTable(
                name: "promise_reason_policies");

            migrationBuilder.DropColumn(
                name: "delivery_evidence_received_utc",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "delivery_evidence_status",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "erp_invoice_reference",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "erp_reconcile_note",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "erp_reconcile_status",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "invoice_staging_error",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "invoice_staging_result",
                table: "sales_orders");

            migrationBuilder.DropColumn(
                name: "category",
                table: "order_attachments");
        }
    }
}
