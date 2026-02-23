using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class Address
{
    public int Id { get; set; }

    public string Type { get; set; } = null!;

    public string Address1 { get; set; } = null!;

    public string? Address2 { get; set; }

    public string? City { get; set; }

    public string? State { get; set; }

    public string? PostalCode { get; set; }

    public string? Country { get; set; }

    public int? DefaultSalesEmployeeId { get; set; }

    public int CustomerId { get; set; }

    public int? ContactId { get; set; }

    public string? AddressName { get; set; }

    public virtual Contact? Contact { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual ICollection<SalesOrder> SalesOrderBillToAddresses { get; set; } = new List<SalesOrder>();

    public virtual ICollection<SalesOrder> SalesOrderPickUpAddresses { get; set; } = new List<SalesOrder>();

    public virtual ICollection<SalesOrder> SalesOrderShipToAddresses { get; set; } = new List<SalesOrder>();
}
