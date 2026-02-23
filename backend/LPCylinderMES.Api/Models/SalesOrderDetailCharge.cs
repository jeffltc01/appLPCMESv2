using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class SalesOrderDetailCharge
{
    public int Id { get; set; }

    public decimal Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Extension { get; set; }

    public int SalesOrderDetailId { get; set; }

    public int ItemId { get; set; }

    public virtual Item Item { get; set; } = null!;

    public virtual SalesOrderDetail SalesOrderDetail { get; set; } = null!;
}
