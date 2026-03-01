using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkCenterProcessingMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "default_processing_mode",
                table: "work_centers",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: false,
                defaultValue: "BatchQuantity");

            migrationBuilder.AddColumn<string>(
                name: "processing_mode_override",
                table: "route_template_steps",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "processing_mode",
                table: "order_line_route_step_instances",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: false,
                defaultValue: "BatchQuantity");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "default_processing_mode",
                table: "work_centers");

            migrationBuilder.DropColumn(
                name: "processing_mode_override",
                table: "route_template_steps");

            migrationBuilder.DropColumn(
                name: "processing_mode",
                table: "order_line_route_step_instances");
        }
    }
}
