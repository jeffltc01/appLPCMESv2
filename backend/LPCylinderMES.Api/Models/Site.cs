using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class Site
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string SiteCode { get; set; } = null!;

    public virtual ICollection<SalesOrderDetail> SalesOrderDetails { get; set; } = new List<SalesOrderDetail>();

    public virtual ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
}
