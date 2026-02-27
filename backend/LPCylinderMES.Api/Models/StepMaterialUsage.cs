namespace LPCylinderMES.Api.Models;

public partial class StepMaterialUsage
{
    public long Id { get; set; }
    public long OrderLineRouteStepInstanceId { get; set; }
    public int SalesOrderDetailId { get; set; }
    public int PartItemId { get; set; }
    public decimal QuantityUsed { get; set; }
    public string? Uom { get; set; }
    public string RecordedByEmpNo { get; set; } = null!;
    public DateTime RecordedUtc { get; set; }

    public virtual OrderLineRouteStepInstance OrderLineRouteStepInstance { get; set; } = null!;
    public virtual SalesOrderDetail SalesOrderDetail { get; set; } = null!;
    public virtual Item PartItem { get; set; } = null!;
}
