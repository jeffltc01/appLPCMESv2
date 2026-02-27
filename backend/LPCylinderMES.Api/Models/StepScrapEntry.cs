namespace LPCylinderMES.Api.Models;

public partial class StepScrapEntry
{
    public long Id { get; set; }
    public long OrderLineRouteStepInstanceId { get; set; }
    public int SalesOrderDetailId { get; set; }
    public decimal QuantityScrapped { get; set; }
    public int ScrapReasonId { get; set; }
    public string? Notes { get; set; }
    public string RecordedByEmpNo { get; set; } = null!;
    public DateTime RecordedUtc { get; set; }

    public virtual OrderLineRouteStepInstance OrderLineRouteStepInstance { get; set; } = null!;
    public virtual SalesOrderDetail SalesOrderDetail { get; set; } = null!;
    public virtual ScrapReason ScrapReason { get; set; } = null!;
}
