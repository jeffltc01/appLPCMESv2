using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddQuantityAsShippedToSalesOrderDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "quantity_as_shipped",
                table: "sales_order_details",
                type: "numeric(18,6)",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE sales_order_details
                SET quantity_as_shipped = quantity_as_received
                WHERE quantity_as_received IS NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "quantity_as_shipped",
                table: "sales_order_details");
        }
    }
}
