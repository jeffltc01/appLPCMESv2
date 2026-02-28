using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStatusReasonCodeCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "status_reason_codes",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    overlay_type = table.Column<string>(type: "varchar(60)", unicode: false, maxLength: 60, nullable: false),
                    code_name = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: false),
                    updated_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    updated_by_emp_no = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_status_reason_codes", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_status_reason_codes_overlay_type_code_name",
                table: "status_reason_codes",
                columns: new[] { "overlay_type", "code_name" },
                unique: true);

            migrationBuilder.InsertData(
                table: "status_reason_codes",
                columns: new[] { "overlay_type", "code_name", "updated_utc", "updated_by_emp_no" },
                values: new object[,]
                {
                    { "OnHoldCustomer", "CustomerNotReadyForPickup", new DateTime(2026, 2, 28, 5, 36, 23, DateTimeKind.Utc), "SYSTEM" },
                    { "OnHoldQuality", "QualityInspectionOpen", new DateTime(2026, 2, 28, 5, 36, 23, DateTimeKind.Utc), "SYSTEM" },
                    { "OnHoldLogistics", "LogisticsDelay", new DateTime(2026, 2, 28, 5, 36, 23, DateTimeKind.Utc), "SYSTEM" },
                    { "ExceptionQuantityMismatch", "QuantityMismatchDetected", new DateTime(2026, 2, 28, 5, 36, 23, DateTimeKind.Utc), "SYSTEM" },
                    { "ExceptionDocumentation", "MissingDocumentation", new DateTime(2026, 2, 28, 5, 36, 23, DateTimeKind.Utc), "SYSTEM" },
                    { "ExceptionErpReconcile", "ErpInvoiceCreationFailed", new DateTime(2026, 2, 28, 5, 36, 23, DateTimeKind.Utc), "SYSTEM" },
                    { "ReworkOpen", "ReworkRequired", new DateTime(2026, 2, 28, 5, 36, 23, DateTimeKind.Utc), "SYSTEM" },
                    { "Cancelled", "CancelledByOffice", new DateTime(2026, 2, 28, 5, 36, 23, DateTimeKind.Utc), "SYSTEM" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "status_reason_codes");
        }
    }
}
