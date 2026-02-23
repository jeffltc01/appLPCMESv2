using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class Customer
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Notes { get; set; }

    public int? DefaultNeedCollars { get; set; }

    public int? DefaultNeedFillers { get; set; }

    public int? DefaultNeedFootRings { get; set; }

    public int? DefaultReturnScrap { get; set; }

    public int? DefaultReturnBrass { get; set; }

    public string? DefaultValveType { get; set; }

    public string? DefaultGauges { get; set; }

    public string? CustomerCode { get; set; }

    public string? Status { get; set; }

    public int? TankColorId { get; set; }

    public int? LidColorId { get; set; }

    public int? CustomerParentId { get; set; }

    public int? DefaultPickUpId { get; set; }

    public int? DefaultBillToId { get; set; }

    public int? DefaultShipToId { get; set; }

    public int? DefaultSalesEmployeeId { get; set; }

    public int? DefaultPaymentTermId { get; set; }

    public int? DefaultShipViaId { get; set; }

    public string? Email { get; set; }

    public virtual ICollection<Address> Addresses { get; set; } = new List<Address>();

    public virtual ICollection<Contact> Contacts { get; set; } = new List<Contact>();

    public virtual ICollection<CustomerItem> CustomerItems { get; set; } = new List<CustomerItem>();

    public virtual Customer? CustomerParent { get; set; }

    public virtual PaymentTerm? DefaultPaymentTerm { get; set; }

    public virtual ShipVia? DefaultShipVia { get; set; }

    public virtual ICollection<Customer> InverseCustomerParent { get; set; } = new List<Customer>();

    public virtual Color? LidColor { get; set; }

    public virtual ICollection<Pricing> Pricings { get; set; } = new List<Pricing>();

    public virtual ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();

    public virtual Color? TankColor { get; set; }
}
