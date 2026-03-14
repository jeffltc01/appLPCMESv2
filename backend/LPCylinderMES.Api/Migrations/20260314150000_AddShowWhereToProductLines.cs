using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public class AddShowWhereToProductLines : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "show_where_mask",
                table: "product_lines",
                type: "int",
                nullable: false,
                defaultValue: 15);

            migrationBuilder.AddColumn<DateTime>(
                name: "created_utc",
                table: "product_lines",
                type: "datetime",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_utc",
                table: "product_lines",
                type: "datetime",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.Sql(@"
                UPDATE pl
                SET pl.show_where_mask = COALESCE(pr.show_where_mask, 15),
                    pl.created_utc = COALESCE(pr.created_utc, SYSUTCDATETIME()),
                    pl.updated_utc = COALESCE(pr.updated_utc, SYSUTCDATETIME())
                FROM product_lines pl
                LEFT JOIN production_lines pr ON LTRIM(RTRIM(pl.code)) = LTRIM(RTRIM(pr.code))
                WHERE pr.id IS NOT NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "show_where_mask",
                table: "product_lines");

            migrationBuilder.DropColumn(
                name: "created_utc",
                table: "product_lines");

            migrationBuilder.DropColumn(
                name: "updated_utc",
                table: "product_lines");
        }
    }
}
