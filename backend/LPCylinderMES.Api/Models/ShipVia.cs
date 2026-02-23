using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class ShipVia
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? SystemCode { get; set; }

    public string? ErpCode { get; set; }

    public virtual ICollection<Customer> Customers { get; set; } = new List<Customer>();

    public virtual ICollection<SalesOrder> SalesOrderPickUpVia { get; set; } = new List<SalesOrder>();

    public virtual ICollection<SalesOrder> SalesOrderShipToVia { get; set; } = new List<SalesOrder>();
}
