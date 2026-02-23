using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class Color
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<CustomerItem> CustomerItemLidColors { get; set; } = new List<CustomerItem>();

    public virtual ICollection<CustomerItem> CustomerItemTankColors { get; set; } = new List<CustomerItem>();

    public virtual ICollection<Customer> CustomerLidColors { get; set; } = new List<Customer>();

    public virtual ICollection<Customer> CustomerTankColors { get; set; } = new List<Customer>();

    public virtual ICollection<SalesOrderDetail> SalesOrderDetailColors { get; set; } = new List<SalesOrderDetail>();

    public virtual ICollection<SalesOrderDetail> SalesOrderDetailLidColors { get; set; } = new List<SalesOrderDetail>();
}
