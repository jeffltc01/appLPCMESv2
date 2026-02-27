namespace LPCylinderMES.Api.Models;

public partial class OrderLifecycleEvent
{
    public long Id { get; set; }
    public int OrderId { get; set; }
    public string EventType { get; set; } = null!;
    public string? FromLifecycleStatus { get; set; }
    public string? ToLifecycleStatus { get; set; }
    public string? HoldOverlay { get; set; }
    public string? ReasonCode { get; set; }
    public string? StatusOwnerRole { get; set; }
    public string? ActorEmpNo { get; set; }
    public DateTime OccurredUtc { get; set; }

    public virtual SalesOrder Order { get; set; } = null!;
}
