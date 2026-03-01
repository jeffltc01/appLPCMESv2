namespace LPCylinderMES.Api.Models;

public partial class WorkCenter
{
    public int Id { get; set; }
    public string WorkCenterCode { get; set; } = null!;
    public string WorkCenterName { get; set; } = null!;
    public int SiteId { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public string DefaultTimeCaptureMode { get; set; } = "Automated";
    public string DefaultProcessingMode { get; set; } = "BatchQuantity";
    public bool RequiresScanByDefault { get; set; } = true;
    public DateTime CreatedUtc { get; set; }
    public DateTime UpdatedUtc { get; set; }

    public virtual Site Site { get; set; } = null!;
    public virtual ICollection<RouteTemplateStep> RouteTemplateSteps { get; set; } = new List<RouteTemplateStep>();
    public virtual ICollection<OrderLineRouteStepInstance> OrderLineRouteStepInstances { get; set; } = new List<OrderLineRouteStepInstance>();
    public virtual ICollection<OperatorActivityLog> OperatorActivityLogs { get; set; } = new List<OperatorActivityLog>();
}
