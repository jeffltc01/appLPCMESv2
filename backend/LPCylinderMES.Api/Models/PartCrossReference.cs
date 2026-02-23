using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class PartCrossReference
{
    public int Id { get; set; }

    public string LpcItemNumber { get; set; } = null!;

    public string ErpItemNumber { get; set; } = null!;
}
