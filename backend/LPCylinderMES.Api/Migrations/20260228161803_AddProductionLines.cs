using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductionLines : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "production_lines",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "varchar(40)", unicode: false, maxLength: 40, nullable: false),
                    name = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    show_where_mask = table.Column<int>(type: "int", nullable: false),
                    created_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    updated_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_production_lines", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_production_lines_code",
                table: "production_lines",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_production_lines_name",
                table: "production_lines",
                column: "name",
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO production_lines (code, name, show_where_mask, created_utc, updated_utc)
                SELECT src.code, src.name, 15, SYSUTCDATETIME(), SYSUTCDATETIME()
                FROM (
                    SELECT DISTINCT
                        TRIM(product_line) AS code,
                        TRIM(product_line) AS name
                    FROM items
                    WHERE product_line IS NOT NULL AND TRIM(product_line) <> ''
                ) AS src
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM production_lines pl
                    WHERE pl.code = src.code
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "production_lines");
        }
    }
}
