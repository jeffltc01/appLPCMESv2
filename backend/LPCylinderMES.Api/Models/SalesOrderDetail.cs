using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class SalesOrderDetail
{
    public int Id { get; set; }

    public decimal LineNo { get; set; }

    public string? Notes { get; set; }

    public decimal QuantityAsOrdered { get; set; }

    public decimal? QuantityAsReceived { get; set; }

    public string ReceiptStatus { get; set; } = ReceiptStatusCatalog.Unknown;

    public decimal? QuantityAsShipped { get; set; }

    public decimal? QuantityAsScrapped { get; set; }

    public decimal? UnitPrice { get; set; }

    public decimal? Extension { get; set; }

    public bool? NeedCollars { get; set; }

    public bool? NeedFillers { get; set; }

    public bool? NeedFootRings { get; set; }

    public bool? NeedDecals { get; set; }

    public string? ValveType { get; set; }

    public string? ItemName { get; set; }

    public string? Gauges { get; set; }

    public int SalesOrderId { get; set; }

    public int ItemId { get; set; }

    public int? ColorId { get; set; }

    public int? SiteId { get; set; }

    public int? LidColorId { get; set; }

    public long? ActiveLineRouteInstanceId { get; set; }

    public int? PrimaryWorkCenterId { get; set; }

    public int? LastCompletedStepSequence { get; set; }

    public DateTime? LastCompletedStepUtc { get; set; }

    public int? OpenReworkCount { get; set; }

    public virtual Color? Color { get; set; }

    public virtual Item Item { get; set; } = null!;

    public virtual Color? LidColor { get; set; }

    public virtual SalesOrder SalesOrder { get; set; } = null!;

    public virtual ICollection<SalesOrderDetailCharge> SalesOrderDetailCharges { get; set; } = new List<SalesOrderDetailCharge>();

    public virtual ICollection<SalesOrderDetailSn> SalesOrderDetailSns { get; set; } = new List<SalesOrderDetailSn>();

    public virtual Site? Site { get; set; }
}
