using System;
using System.Collections.Generic;

namespace LPCylinderMES.Api.Models;

public partial class SalesOrder
{
    public int Id { get; set; }

    public string SalesOrderNo { get; set; } = null!;

    public string? CustomerPoNo { get; set; }

    public DateOnly OrderDate { get; set; }

    public string OrderStatus { get; set; } = null!;

    public string? TrailerNo { get; set; }

    public string? Comments { get; set; }

    public decimal? Commision { get; set; }

    public string? Phone { get; set; }

    public string? Contact { get; set; }

    public decimal? FreightAmount { get; set; }

    public string? SalesPersonEmpNo { get; set; }

    public DateTime? ReceivedDate { get; set; }

    public DateTime? ReadyToShipDate { get; set; }

    public int? ReturnScrap { get; set; }

    public int? ReturnBrass { get; set; }

    public int? Priority { get; set; }

    public int? IpadOrderId { get; set; }

    public DateTime? PickupScheduledDate { get; set; }

    public DateTime? ScheduledReceiptDate { get; set; }

    public DateTime? InvoiceDate { get; set; }

    public int? SalesPersonId { get; set; }

    public int SiteId { get; set; }

    public int CustomerId { get; set; }

    public int? PickUpViaId { get; set; }

    public int? ShipToViaId { get; set; }

    public int? BillToAddressId { get; set; }

    public int? PickUpAddressId { get; set; }

    public int? ShipToAddressId { get; set; }

    public int? PaymentTermId { get; set; }

    public DateTime? PickupDate { get; set; }

    public string? TransportationStatus { get; set; }

    public DateTime? DispatchDate { get; set; }

    public string? Carrier { get; set; }

    public string? TransportationNotes { get; set; }

    public DateTime? EmailSentDate { get; set; }

    public DateTime? ClosedDate { get; set; }

    public DateTime? EstDeliveryDate { get; set; }

    public virtual Address? BillToAddress { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual PaymentTerm? PaymentTerm { get; set; }

    public virtual Address? PickUpAddress { get; set; }

    public virtual ShipVia? PickUpVia { get; set; }

    public virtual ICollection<SalesOrderDetail> SalesOrderDetails { get; set; } = new List<SalesOrderDetail>();
    public virtual ICollection<OrderAttachment> OrderAttachments { get; set; } = new List<OrderAttachment>();

    public virtual SalesPeople? SalesPerson { get; set; }

    public virtual Address? ShipToAddress { get; set; }

    public virtual ShipVia? ShipToVia { get; set; }

    public virtual Site Site { get; set; } = null!;
}
