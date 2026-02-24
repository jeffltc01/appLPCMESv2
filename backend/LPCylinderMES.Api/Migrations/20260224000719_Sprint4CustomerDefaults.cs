using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class Sprint4CustomerDefaults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "default_order_contact_id",
                table: "customers",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE c
                SET c.default_bill_to_id = billTo.address_id
                FROM customers c
                CROSS APPLY (
                    SELECT MIN(a.id) AS address_id, COUNT(*) AS address_count
                    FROM addresses a
                    WHERE a.customer_id = c.id
                      AND a.type = 'BILL_TO'
                ) billTo
                WHERE c.default_bill_to_id IS NULL
                  AND billTo.address_count = 1;
                """);

            migrationBuilder.Sql(
                """
                UPDATE c
                SET c.default_ship_to_id = shipTo.address_id
                FROM customers c
                CROSS APPLY (
                    SELECT MIN(a.id) AS address_id, COUNT(*) AS address_count
                    FROM addresses a
                    WHERE a.customer_id = c.id
                      AND a.type = 'SHIP_TO'
                ) shipTo
                WHERE c.default_ship_to_id IS NULL
                  AND shipTo.address_count = 1;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_customers_default_order_contact_id",
                table: "customers",
                column: "default_order_contact_id");

            migrationBuilder.AddForeignKey(
                name: "FK_customers_default_order_contact",
                table: "customers",
                column: "default_order_contact_id",
                principalTable: "contacts",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_customers_default_order_contact",
                table: "customers");

            migrationBuilder.DropIndex(
                name: "IX_customers_default_order_contact_id",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "default_order_contact_id",
                table: "customers");
        }
    }
}
