namespace LPCylinderMES.Api.Models;

public partial class OrderLineRouteInstance
{
    public long Id { get; set; }
    public int SalesOrderId { get; set; }
    public int SalesOrderDetailId { get; set; }
    public int RouteTemplateId { get; set; }
    public int? RouteTemplateAssignmentId { get; set; }
    public string State { get; set; } = "Active";
    public int? CurrentStepSequence { get; set; }
    public DateTime StartedUtc { get; set; }
    public DateTime? CompletedUtc { get; set; }
    public string RouteReviewState { get; set; } = "Pending";
    public string? RouteReviewedBy { get; set; }
    public DateTime? RouteReviewedUtc { get; set; }
    public string? RouteReviewNotes { get; set; }
    public bool SupervisorApprovalRequired { get; set; }
    public string? SupervisorApprovedBy { get; set; }
    public DateTime? SupervisorApprovedUtc { get; set; }

    public virtual SalesOrder SalesOrder { get; set; } = null!;
    public virtual SalesOrderDetail SalesOrderDetail { get; set; } = null!;
    public virtual RouteTemplate RouteTemplate { get; set; } = null!;
    public virtual RouteTemplateAssignment? RouteTemplateAssignment { get; set; }
    public virtual ICollection<OrderLineRouteStepInstance> Steps { get; set; } = new List<OrderLineRouteStepInstance>();
}
