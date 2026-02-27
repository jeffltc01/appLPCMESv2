using System.Reflection;
using LPCylinderMES.Api.Migrations;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;

namespace LPCylinderMES.Api.Tests;

public class AlignWorkCenterWorkflowSpecFieldsMigrationTests
{
    [Fact]
    public void Migration_Adds_Expected_Spec_Parity_Columns()
    {
        var migration = new AlignWorkCenterWorkflowSpecFields();
        var builder = new MigrationBuilder("Microsoft.EntityFrameworkCore.SqlServer");

        var upMethod = typeof(AlignWorkCenterWorkflowSpecFields)
            .GetMethod("Up", BindingFlags.Instance | BindingFlags.NonPublic);
        Assert.NotNull(upMethod);

        upMethod!.Invoke(migration, [builder]);

        var columns = builder.Operations
            .OfType<AddColumnOperation>()
            .ToList();

        Assert.Contains(columns, c => c.Table == "route_template_steps" && c.Name == "checklist_template_id");
        Assert.Contains(columns, c => c.Table == "route_template_steps" && c.Name == "auto_queue_next_step" && c.DefaultValue is true);
        Assert.Contains(columns, c => c.Table == "route_template_steps" && c.Name == "sla_minutes");

        Assert.Contains(columns, c => c.Table == "route_template_assignments" && c.Name == "order_priority_min");
        Assert.Contains(columns, c => c.Table == "route_template_assignments" && c.Name == "order_priority_max");
        Assert.Contains(columns, c => c.Table == "route_template_assignments" && c.Name == "pick_up_via_id");
        Assert.Contains(columns, c => c.Table == "route_template_assignments" && c.Name == "ship_to_via_id");
        Assert.Contains(columns, c => c.Table == "route_template_assignments" && c.Name == "supervisor_gate_override");

        Assert.Contains(columns, c => c.Table == "order_line_route_instances" && c.Name == "route_template_version_no");
        Assert.Contains(columns, c => c.Table == "order_line_route_step_instances" && c.Name == "requires_scan" && c.DefaultValue is true);
        Assert.Contains(columns, c => c.Table == "order_line_route_step_instances" && c.Name == "checklist_failure_policy" && Equals(c.DefaultValue, "BlockCompletion"));
        Assert.Contains(columns, c => c.Table == "order_line_route_step_instances" && c.Name == "step_adjusted_by");
        Assert.Contains(columns, c => c.Table == "order_line_route_step_instances" && c.Name == "step_adjusted_utc");
        Assert.Contains(columns, c => c.Table == "order_line_route_step_instances" && c.Name == "step_adjustment_reason");

        Assert.Contains(columns, c => c.Table == "sales_orders" && c.Name == "production_state");
        Assert.Contains(columns, c => c.Table == "sales_orders" && c.Name == "packing_slip_no");
        Assert.Contains(columns, c => c.Table == "sales_orders" && c.Name == "bol_no");

        Assert.Contains(columns, c => c.Table == "sales_order_details" && c.Name == "active_line_route_instance_id");
        Assert.Contains(columns, c => c.Table == "sales_order_details" && c.Name == "open_rework_count");
    }
}
