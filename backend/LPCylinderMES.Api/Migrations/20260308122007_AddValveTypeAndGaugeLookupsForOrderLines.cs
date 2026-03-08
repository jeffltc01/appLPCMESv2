using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddValveTypeAndGaugeLookupsForOrderLines : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "gauge_id",
                table: "sales_order_details",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "valve_type_id",
                table: "sales_order_details",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "gauge_lookups",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: false),
                    display_name = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false),
                    created_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    updated_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gauge_lookups", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "valve_type_lookups",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "varchar(80)", unicode: false, maxLength: 80, nullable: false),
                    display_name = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false),
                    created_utc = table.Column<DateTime>(type: "datetime", nullable: false),
                    updated_utc = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_valve_type_lookups", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_sales_order_details_gauge_id",
                table: "sales_order_details",
                column: "gauge_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_order_details_valve_type_id",
                table: "sales_order_details",
                column: "valve_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_gauge_lookups_sort_order",
                table: "gauge_lookups",
                column: "sort_order");

            migrationBuilder.CreateIndex(
                name: "UX_gauge_lookups_code",
                table: "gauge_lookups",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_gauge_lookups_display_name",
                table: "gauge_lookups",
                column: "display_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_valve_type_lookups_sort_order",
                table: "valve_type_lookups",
                column: "sort_order");

            migrationBuilder.CreateIndex(
                name: "UX_valve_type_lookups_code",
                table: "valve_type_lookups",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_valve_type_lookups_display_name",
                table: "valve_type_lookups",
                column: "display_name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_sales_order_details_gauge_lookup",
                table: "sales_order_details",
                column: "gauge_id",
                principalTable: "gauge_lookups",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_sales_order_details_valve_type_lookup",
                table: "sales_order_details",
                column: "valve_type_id",
                principalTable: "valve_type_lookups",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.Sql("""
                INSERT INTO valve_type_lookups (code, display_name, is_active, sort_order, created_utc, updated_utc)
                SELECT seed.code, seed.display_name, 1, seed.sort_order, GETUTCDATE(), GETUTCDATE()
                FROM (VALUES
                    ('STANDARD', 'Standard', 10),
                    ('CGA_510', 'CGA 510', 20),
                    ('CGA_540', 'CGA 540', 30)
                ) AS seed(code, display_name, sort_order)
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM valve_type_lookups existing
                    WHERE existing.code = seed.code OR existing.display_name = seed.display_name
                );

                WITH raw_values AS (
                    SELECT DISTINCT LTRIM(RTRIM(valve_type)) AS display_name
                    FROM sales_order_details
                    WHERE valve_type IS NOT NULL AND LTRIM(RTRIM(valve_type)) <> ''
                ),
                prepared AS (
                    SELECT
                        display_name,
                        CASE
                            WHEN UPPER(REPLACE(REPLACE(REPLACE(display_name, ' ', '_'), '-', '_'), '/', '_')) = '' THEN 'VALVE'
                            ELSE UPPER(REPLACE(REPLACE(REPLACE(display_name, ' ', '_'), '-', '_'), '/', '_'))
                        END AS base_code
                    FROM raw_values
                ),
                numbered AS (
                    SELECT
                        display_name,
                        base_code,
                        ROW_NUMBER() OVER (PARTITION BY base_code ORDER BY display_name) AS duplicate_ordinal,
                        ROW_NUMBER() OVER (ORDER BY display_name) AS sort_ordinal
                    FROM prepared
                )
                INSERT INTO valve_type_lookups (code, display_name, is_active, sort_order, created_utc, updated_utc)
                SELECT
                    CASE
                        WHEN duplicate_ordinal = 1 THEN LEFT(base_code, 80)
                        ELSE LEFT(base_code, 70) + '_' + CAST(duplicate_ordinal AS varchar(10))
                    END AS code,
                    display_name,
                    1,
                    1000 + sort_ordinal,
                    GETUTCDATE(),
                    GETUTCDATE()
                FROM numbered n
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM valve_type_lookups existing
                    WHERE existing.display_name = n.display_name
                );

                INSERT INTO gauge_lookups (code, display_name, is_active, sort_order, created_utc, updated_utc)
                SELECT seed.code, seed.display_name, 1, seed.sort_order, GETUTCDATE(), GETUTCDATE()
                FROM (VALUES
                    ('STANDARD', 'Standard', 10),
                    ('YES', 'Yes', 20),
                    ('NO', 'No', 30)
                ) AS seed(code, display_name, sort_order)
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM gauge_lookups existing
                    WHERE existing.code = seed.code OR existing.display_name = seed.display_name
                );

                WITH raw_values AS (
                    SELECT DISTINCT LTRIM(RTRIM(gauges)) AS display_name
                    FROM sales_order_details
                    WHERE gauges IS NOT NULL AND LTRIM(RTRIM(gauges)) <> ''
                ),
                prepared AS (
                    SELECT
                        display_name,
                        CASE
                            WHEN UPPER(REPLACE(REPLACE(REPLACE(display_name, ' ', '_'), '-', '_'), '/', '_')) = '' THEN 'GAUGE'
                            ELSE UPPER(REPLACE(REPLACE(REPLACE(display_name, ' ', '_'), '-', '_'), '/', '_'))
                        END AS base_code
                    FROM raw_values
                ),
                numbered AS (
                    SELECT
                        display_name,
                        base_code,
                        ROW_NUMBER() OVER (PARTITION BY base_code ORDER BY display_name) AS duplicate_ordinal,
                        ROW_NUMBER() OVER (ORDER BY display_name) AS sort_ordinal
                    FROM prepared
                )
                INSERT INTO gauge_lookups (code, display_name, is_active, sort_order, created_utc, updated_utc)
                SELECT
                    CASE
                        WHEN duplicate_ordinal = 1 THEN LEFT(base_code, 80)
                        ELSE LEFT(base_code, 70) + '_' + CAST(duplicate_ordinal AS varchar(10))
                    END AS code,
                    display_name,
                    1,
                    1000 + sort_ordinal,
                    GETUTCDATE(),
                    GETUTCDATE()
                FROM numbered n
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM gauge_lookups existing
                    WHERE existing.display_name = n.display_name
                );

                UPDATE sod
                SET valve_type_id = lookup.id
                FROM sales_order_details sod
                INNER JOIN valve_type_lookups lookup
                    ON lookup.display_name = LTRIM(RTRIM(sod.valve_type))
                WHERE sod.valve_type IS NOT NULL
                  AND LTRIM(RTRIM(sod.valve_type)) <> ''
                  AND sod.valve_type_id IS NULL;

                UPDATE sod
                SET gauge_id = lookup.id
                FROM sales_order_details sod
                INNER JOIN gauge_lookups lookup
                    ON lookup.display_name = LTRIM(RTRIM(sod.gauges))
                WHERE sod.gauges IS NOT NULL
                  AND LTRIM(RTRIM(sod.gauges)) <> ''
                  AND sod.gauge_id IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE sod
                SET
                    valve_type = COALESCE(NULLIF(LTRIM(RTRIM(sod.valve_type)), ''), vt.display_name),
                    gauges = COALESCE(NULLIF(LTRIM(RTRIM(sod.gauges)), ''), g.display_name)
                FROM sales_order_details sod
                LEFT JOIN valve_type_lookups vt ON sod.valve_type_id = vt.id
                LEFT JOIN gauge_lookups g ON sod.gauge_id = g.id;
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_sales_order_details_gauge_lookup",
                table: "sales_order_details");

            migrationBuilder.DropForeignKey(
                name: "FK_sales_order_details_valve_type_lookup",
                table: "sales_order_details");

            migrationBuilder.DropTable(
                name: "gauge_lookups");

            migrationBuilder.DropTable(
                name: "valve_type_lookups");

            migrationBuilder.DropIndex(
                name: "IX_sales_order_details_gauge_id",
                table: "sales_order_details");

            migrationBuilder.DropIndex(
                name: "IX_sales_order_details_valve_type_id",
                table: "sales_order_details");

            migrationBuilder.DropColumn(
                name: "gauge_id",
                table: "sales_order_details");

            migrationBuilder.DropColumn(
                name: "valve_type_id",
                table: "sales_order_details");
        }
    }
}
