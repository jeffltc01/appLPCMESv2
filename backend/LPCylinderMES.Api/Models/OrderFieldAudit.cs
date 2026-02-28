namespace LPCylinderMES.Api.Models;

public partial class OrderFieldAudit
{
    public long Id { get; set; }
    public int OrderId { get; set; }
    public string EntityName { get; set; } = null!;
    public int? EntityId { get; set; }
    public string FieldName { get; set; } = null!;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string ActionType { get; set; } = null!;
    public string? ActorEmpNo { get; set; }
    public string? ActorRole { get; set; }
    public string? Source { get; set; }
    public string? CorrelationId { get; set; }
    public DateTime OccurredUtc { get; set; }

    public virtual SalesOrder Order { get; set; } = null!;
}
