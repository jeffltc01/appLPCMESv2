using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class ScrapReason
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<SalesOrderDetailSn> SalesOrderDetailSns { get; set; } = new List<SalesOrderDetailSn>();
}
