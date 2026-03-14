using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduleSettingsDesigner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "schedule_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    throughput_lookback_days = table.Column<int>(type: "int", nullable: false, defaultValue: 90),
                    updated_utc = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    updated_by_emp_no = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_schedule_settings", x => x.id);
                });

            migrationBuilder.Sql(@"
                SET IDENTITY_INSERT schedule_settings ON;
                INSERT INTO schedule_settings (id, throughput_lookback_days, updated_utc)
                VALUES (1, 90, SYSUTCDATETIME());
                SET IDENTITY_INSERT schedule_settings OFF;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "schedule_settings");
        }
    }
}
