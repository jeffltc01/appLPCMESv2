using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReceiptStatusToSalesOrderDetail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "receipt_status",
                table: "sales_order_details",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: false,
                defaultValue: "Unknown");

            migrationBuilder.Sql("""
                UPDATE sales_order_details
                SET receipt_status = CASE
                    WHEN ISNULL(quantity_as_received, 0) > 0 THEN 'Received'
                    ELSE 'Unknown'
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "receipt_status",
                table: "sales_order_details");
        }
    }
}
