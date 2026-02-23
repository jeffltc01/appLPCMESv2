using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class Item
{
    public int Id { get; set; }

    public string ItemNo { get; set; } = null!;

    public string? ItemDescription { get; set; }

    public string ItemType { get; set; } = null!;

    public int RequiresSerialNumbers { get; set; }

    public string? ProductLine { get; set; }

    public bool? RequiresGaugeOption { get; set; }

    public bool? RequiresFillerOption { get; set; }

    public bool? RequiresCollarOption { get; set; }

    public bool? RequiresFootRingOption { get; set; }

    public bool? RequiresValveTypeOption { get; set; }

    public string? SystemCode { get; set; }

    public int? ItemSize { get; set; }

    public virtual ICollection<CustomerItem> CustomerItems { get; set; } = new List<CustomerItem>();

    public virtual ItemSize? ItemSizeNavigation { get; set; }

    public virtual ICollection<Pricing> Pricings { get; set; } = new List<Pricing>();

    public virtual ICollection<SalesOrderDetailCharge> SalesOrderDetailCharges { get; set; } = new List<SalesOrderDetailCharge>();

    public virtual ICollection<SalesOrderDetail> SalesOrderDetails { get; set; } = new List<SalesOrderDetail>();
}
