namespace LPCylinderMES.Api.Models;

public partial class OperatorActivityLog
{
    public long Id { get; set; }
    public int SalesOrderId { get; set; }
    public int SalesOrderDetailId { get; set; }
    public long OrderLineRouteStepInstanceId { get; set; }
    public int WorkCenterId { get; set; }
    public string OperatorEmpNo { get; set; } = null!;
    public string ActionType { get; set; } = null!;
    public DateTime ActionUtc { get; set; }
    public string? DeviceId { get; set; }
    public string? Notes { get; set; }

    public virtual SalesOrder SalesOrder { get; set; } = null!;
    public virtual SalesOrderDetail SalesOrderDetail { get; set; } = null!;
    public virtual OrderLineRouteStepInstance OrderLineRouteStepInstance { get; set; } = null!;
    public virtual WorkCenter WorkCenter { get; set; } = null!;
}
