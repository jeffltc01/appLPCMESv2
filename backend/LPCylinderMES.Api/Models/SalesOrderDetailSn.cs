using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class SalesOrderDetailSn
{
    public int Id { get; set; }

    public string SerialNumber { get; set; } = null!;

    public bool Scrapped { get; set; }

    public string? Status { get; set; }

    public string? Mfg { get; set; }

    public string? MfgDate { get; set; }

    public string? MfgTestDate { get; set; }

    public int? ManufacturerId { get; set; }

    public int SalesOrderDetailId { get; set; }

    public int? ScrapReasonId { get; set; }

    public string? LidColor { get; set; }

    public string? LidSize { get; set; }

    public virtual Manufacturer? Manufacturer { get; set; }

    public virtual SalesOrderDetail SalesOrderDetail { get; set; } = null!;

    public virtual ScrapReason? ScrapReason { get; set; }
}
