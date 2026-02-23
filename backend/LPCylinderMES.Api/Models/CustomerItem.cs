using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class CustomerItem
{
    public int Id { get; set; }

    public int ItemId { get; set; }

    public int CustomerId { get; set; }

    public int? TankColorId { get; set; }

    public int? LidColorId { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual Item Item { get; set; } = null!;

    public virtual Color? LidColor { get; set; }

    public virtual Color? TankColor { get; set; }
}
