using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAttachmentAuditAndSecurityMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "uploaded_by_emp_no",
                table: "order_attachments",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "uploaded_utc",
                table: "order_attachments",
                type: "datetime",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE order_attachments
                SET uploaded_utc = ISNULL(uploaded_utc, created_at_utc)
                WHERE uploaded_utc IS NULL;
                """);

            migrationBuilder.CreateTable(
                name: "order_attachment_audits",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_id = table.Column<int>(type: "int", nullable: false),
                    attachment_id = table.Column<int>(type: "int", nullable: true),
                    action_type = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: false),
                    acting_role = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: true),
                    actor_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true),
                    occurred_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    details = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_attachment_audits", x => x.id);
                    table.ForeignKey(
                        name: "FK_order_attachment_audits_order_attachments",
                        column: x => x.attachment_id,
                        principalTable: "order_attachments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_order_attachment_audits_sales_orders",
                        column: x => x.order_id,
                        principalTable: "sales_orders",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "ix_order_attachment_audits_attachment_id",
                table: "order_attachment_audits",
                column: "attachment_id");

            migrationBuilder.CreateIndex(
                name: "ix_order_attachment_audits_order_id",
                table: "order_attachment_audits",
                column: "order_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "order_attachment_audits");

            migrationBuilder.DropColumn(
                name: "uploaded_by_emp_no",
                table: "order_attachments");

            migrationBuilder.DropColumn(
                name: "uploaded_utc",
                table: "order_attachments");
        }
    }
}
