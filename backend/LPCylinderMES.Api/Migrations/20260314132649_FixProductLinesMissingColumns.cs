using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixProductLinesMissingColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('product_lines') AND name = 'show_where_mask')
                BEGIN
                    ALTER TABLE product_lines ADD show_where_mask int NOT NULL DEFAULT 15;
                END
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('product_lines') AND name = 'created_utc')
                BEGIN
                    ALTER TABLE product_lines ADD created_utc datetime NOT NULL DEFAULT SYSUTCDATETIME();
                END
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('product_lines') AND name = 'updated_utc')
                BEGIN
                    ALTER TABLE product_lines ADD updated_utc datetime NOT NULL DEFAULT SYSUTCDATETIME();
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('product_lines') AND name = 'show_where_mask')
                    ALTER TABLE product_lines DROP COLUMN show_where_mask;
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('product_lines') AND name = 'created_utc')
                    ALTER TABLE product_lines DROP COLUMN created_utc;
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('product_lines') AND name = 'updated_utc')
                    ALTER TABLE product_lines DROP COLUMN updated_utc;
            ");
        }
    }
}
