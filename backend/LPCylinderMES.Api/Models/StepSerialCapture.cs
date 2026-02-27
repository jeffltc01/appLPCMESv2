namespace LPCylinderMES.Api.Models;

public partial class StepSerialCapture
{
    public long Id { get; set; }
    public long OrderLineRouteStepInstanceId { get; set; }
    public int SalesOrderDetailId { get; set; }
    public string SerialNo { get; set; } = null!;
    public string Manufacturer { get; set; } = null!;
    public DateOnly? ManufactureDate { get; set; }
    public DateOnly? TestDate { get; set; }
    public int? LidColorId { get; set; }
    public int? LidSizeId { get; set; }
    public string ConditionStatus { get; set; } = "Good";
    public int? ScrapReasonId { get; set; }
    public string RecordedByEmpNo { get; set; } = null!;
    public DateTime RecordedUtc { get; set; }

    public virtual OrderLineRouteStepInstance OrderLineRouteStepInstance { get; set; } = null!;
    public virtual SalesOrderDetail SalesOrderDetail { get; set; } = null!;
    public virtual Color? LidColor { get; set; }
    public virtual ItemSize? LidSize { get; set; }
    public virtual ScrapReason? ScrapReason { get; set; }
}
