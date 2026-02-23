using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class ItemSize
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int Size { get; set; }

    public virtual ICollection<Item> Items { get; set; } = new List<Item>();
}
