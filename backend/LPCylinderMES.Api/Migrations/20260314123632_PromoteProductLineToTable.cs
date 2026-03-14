using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class PromoteProductLineToTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "product_lines",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: false),
                    is_finished_good = table.Column<bool>(type: "bit", nullable: false),
                    weekly_capacity_target = table.Column<int>(type: "int", nullable: true),
                    schedule_color_hex = table.Column<string>(type: "varchar(7)", unicode: false, maxLength: 7, nullable: true),
                    sort_order = table.Column<int>(type: "int", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_lines", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_items_product_line_id",
                table: "items",
                column: "product_line_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_lines_code",
                table: "product_lines",
                column: "code",
                unique: true);

            migrationBuilder.Sql(@"
                INSERT INTO product_lines (code, name, is_finished_good, weekly_capacity_target, schedule_color_hex, sort_order, is_active)
                SELECT DISTINCT LTRIM(RTRIM(pl.product_line)), LTRIM(RTRIM(pl.product_line)), 0, NULL, NULL, 0, 1
                FROM (SELECT product_line FROM items WHERE product_line IS NOT NULL AND LTRIM(RTRIM(product_line)) != '') pl
            ");

            migrationBuilder.AddColumn<int>(
                name: "product_line_id",
                table: "items",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE i SET product_line_id = pl.id
                FROM items i
                INNER JOIN product_lines pl ON LTRIM(RTRIM(i.product_line)) = pl.code
                WHERE i.product_line IS NOT NULL AND LTRIM(RTRIM(i.product_line)) != ''
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_items_product_lines",
                table: "items",
                column: "product_line_id",
                principalTable: "product_lines",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_items_product_lines",
                table: "items");

            migrationBuilder.DropTable(
                name: "product_lines");

            migrationBuilder.DropIndex(
                name: "IX_items_product_line_id",
                table: "items");

            migrationBuilder.DropColumn(
                name: "product_line_id",
                table: "items");
        }
    }
}
