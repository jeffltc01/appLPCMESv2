using System;

namespace LPCylinderMES.Api.Models;

public partial class OrderPromiseChangeEvent
{
    public long Id { get; set; }

    public int OrderId { get; set; }

    public string EventType { get; set; } = null!;

    public DateTime? OldCommittedDateUtc { get; set; }

    public DateTime? NewCommittedDateUtc { get; set; }

    public string? PromiseChangeReasonCode { get; set; }

    public string? PromiseChangeReasonNote { get; set; }

    public string? ChangedByEmpNo { get; set; }

    public DateTime OccurredUtc { get; set; }

    public string? CustomerNotificationStatus { get; set; }

    public string? CustomerNotificationChannel { get; set; }

    public DateTime? CustomerNotificationUtc { get; set; }

    public string? CustomerNotificationByEmpNo { get; set; }

    public string? MissReasonCode { get; set; }

    public virtual SalesOrder Order { get; set; } = null!;
}
