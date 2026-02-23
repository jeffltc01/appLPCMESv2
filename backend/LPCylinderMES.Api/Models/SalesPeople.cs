using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class SalesPeople
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string EmployeeNumber { get; set; } = null!;

    public string ErpNo { get; set; } = null!;

    public virtual ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
}
