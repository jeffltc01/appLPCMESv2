using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class PaymentTerm
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int? NoOfDays { get; set; }

    public string? TermsCode { get; set; }

    public virtual ICollection<Customer> Customers { get; set; } = new List<Customer>();

    public virtual ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
}
