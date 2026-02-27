using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceSubmissionAuditTrailAndStagingBoundary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "order_invoice_submission_audits",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_id = table.Column<int>(type: "int", nullable: false),
                    attempt_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    review_completed_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    submission_actor_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    final_review_confirmed = table.Column<bool>(type: "bit", nullable: false),
                    review_paperwork_confirmed = table.Column<bool>(type: "bit", nullable: false),
                    review_pricing_confirmed = table.Column<bool>(type: "bit", nullable: false),
                    review_billing_confirmed = table.Column<bool>(type: "bit", nullable: false),
                    attachment_email_prompted = table.Column<bool>(type: "bit", nullable: false),
                    attachment_email_sent = table.Column<bool>(type: "bit", nullable: false),
                    attachment_recipient_summary = table.Column<string>(type: "varchar(300)", unicode: false, maxLength: 300, nullable: true),
                    attachment_skip_reason = table.Column<string>(type: "varchar(200)", unicode: false, maxLength: 200, nullable: true),
                    selected_attachment_ids_csv = table.Column<string>(type: "varchar(300)", unicode: false, maxLength: 300, nullable: true),
                    invoice_submission_channel = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: true),
                    invoice_submission_correlation_id = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    invoice_staging_result = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: true),
                    invoice_staging_error = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    erp_invoice_reference = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: true),
                    is_success_handoff = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_invoice_submission_audits", x => x.id);
                    table.ForeignKey(
                        name: "FK_order_invoice_submission_audits_sales_orders",
                        column: x => x.order_id,
                        principalTable: "sales_orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_order_invoice_submission_audits_correlation_id",
                table: "order_invoice_submission_audits",
                column: "invoice_submission_correlation_id");

            migrationBuilder.CreateIndex(
                name: "ix_order_invoice_submission_audits_order_id",
                table: "order_invoice_submission_audits",
                column: "order_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "order_invoice_submission_audits");
        }
    }
}
