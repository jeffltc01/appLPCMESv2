using System;

namespace LPCylinderMES.Api.Models;

public partial class OrderPromiseChangeEvent
{
    public long Id { get; set; }

    public int OrderId { get; set; }

    public DateTime? OldDateUtc { get; set; }

    public DateTime? NewDateUtc { get; set; }

    public string? ChangedByEmpNo { get; set; }

    public DateTime OccurredUtc { get; set; }

    public string? Note { get; set; }

    public virtual SalesOrder Order { get; set; } = null!;
}
