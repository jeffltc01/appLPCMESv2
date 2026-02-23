using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class Pricing
{
    public int Id { get; set; }

    public DateOnly EffectiveDate { get; set; }

    public string? Notes { get; set; }

    public double? UnitPrice { get; set; }

    public int? CustomerId { get; set; }

    public int ItemId { get; set; }

    public virtual Customer? Customer { get; set; }

    public virtual Item Item { get; set; } = null!;
}
