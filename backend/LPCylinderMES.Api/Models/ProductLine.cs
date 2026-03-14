using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class ProductLine
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public bool IsFinishedGood { get; set; }

    public int? WeeklyCapacityTarget { get; set; }

    public string? ScheduleColorHex { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public int ShowWhereMask { get; set; }

    public DateTime CreatedUtc { get; set; }

    public DateTime UpdatedUtc { get; set; }

    public virtual ICollection<Item> Items { get; set; } = new List<Item>();
}
