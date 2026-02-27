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

    public string? OrderLifecycleStatus { get; set; }

    public string? OrderOrigin { get; set; }

    public string? InboundMode { get; set; }

    public string? OutboundMode { get; set; }

    public DateTime? StatusUpdatedUtc { get; set; }

    public string? StatusOwnerRole { get; set; }

    public string? StatusReasonCode { get; set; }

    public string? StatusNote { get; set; }

    public string? ValidatedByEmpNo { get; set; }

    public DateTime? ValidatedUtc { get; set; }

    public string? HoldOverlay { get; set; }

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

    public DateTime? CustomerReadyRetryUtc { get; set; }

    public DateTime? CustomerReadyLastContactUtc { get; set; }

    public string? CustomerReadyContactName { get; set; }

    public bool? HasOpenRework { get; set; }

    public bool? ReworkBlockingInvoice { get; set; }

    public string? ReworkState { get; set; }

    public string? ReworkReasonCode { get; set; }

    public string? ReworkDisposition { get; set; }

    public DateTime? ReworkRequestedUtc { get; set; }

    public DateTime? ReworkApprovedUtc { get; set; }

    public DateTime? ReworkInProgressUtc { get; set; }

    public DateTime? ReworkVerificationPendingUtc { get; set; }

    public DateTime? ReworkClosedUtc { get; set; }

    public string? ReworkLastUpdatedByEmpNo { get; set; }

    public DateTime? RequestedDateUtc { get; set; }

    public DateTime? PromisedDateUtc { get; set; }

    public DateTime? CurrentCommittedDateUtc { get; set; }

    public DateTime? PromiseDateLastChangedUtc { get; set; }

    public string? PromiseDateLastChangedByEmpNo { get; set; }

    public int? PromiseRevisionCount { get; set; }

    public string? PromiseMissReasonCode { get; set; }

    public string? InvoiceReviewCompletedByEmpNo { get; set; }

    public DateTime? InvoiceReviewCompletedUtc { get; set; }

    public bool? AttachmentEmailPrompted { get; set; }

    public bool? AttachmentEmailSent { get; set; }

    public DateTime? AttachmentEmailSentUtc { get; set; }

    public string? AttachmentEmailRecipientSummary { get; set; }

    public string? AttachmentEmailSkipReason { get; set; }

    public string? InvoiceSubmissionRequestedByEmpNo { get; set; }

    public DateTime? InvoiceSubmissionRequestedUtc { get; set; }

    public string? InvoiceSubmissionChannel { get; set; }

    public string? InvoiceSubmissionCorrelationId { get; set; }

    public string? InvoiceStagingResult { get; set; }

    public string? InvoiceStagingError { get; set; }

    public string? ErpInvoiceReference { get; set; }

    public string? DeliveryEvidenceStatus { get; set; }

    public DateTime? DeliveryEvidenceReceivedUtc { get; set; }

    public string? ErpReconcileStatus { get; set; }

    public string? ErpReconcileNote { get; set; }

    public virtual Address? BillToAddress { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual PaymentTerm? PaymentTerm { get; set; }

    public virtual Address? PickUpAddress { get; set; }

    public virtual ShipVia? PickUpVia { get; set; }

    public virtual ICollection<SalesOrderDetail> SalesOrderDetails { get; set; } = new List<SalesOrderDetail>();
    public virtual ICollection<OrderAttachment> OrderAttachments { get; set; } = new List<OrderAttachment>();
    public virtual ICollection<OrderAttachmentAudit> OrderAttachmentAudits { get; set; } = new List<OrderAttachmentAudit>();
    public virtual ICollection<OrderInvoiceSubmissionAudit> OrderInvoiceSubmissionAudits { get; set; } = new List<OrderInvoiceSubmissionAudit>();
    public virtual ICollection<OrderPromiseChangeEvent> OrderPromiseChangeEvents { get; set; } = new List<OrderPromiseChangeEvent>();

    public virtual SalesPeople? SalesPerson { get; set; }

    public virtual Address? ShipToAddress { get; set; }

    public virtual ShipVia? ShipToVia { get; set; }

    public virtual Site Site { get; set; } = null!;
}
