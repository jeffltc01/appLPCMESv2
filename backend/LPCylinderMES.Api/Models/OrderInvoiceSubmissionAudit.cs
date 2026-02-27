namespace LPCylinderMES.Api.Models;

public class OrderInvoiceSubmissionAudit
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public DateTime AttemptUtc { get; set; }
    public string? ReviewCompletedByEmpNo { get; set; }
    public string? SubmissionActorEmpNo { get; set; }
    public bool FinalReviewConfirmed { get; set; }
    public bool ReviewPaperworkConfirmed { get; set; }
    public bool ReviewPricingConfirmed { get; set; }
    public bool ReviewBillingConfirmed { get; set; }
    public bool AttachmentEmailPrompted { get; set; }
    public bool AttachmentEmailSent { get; set; }
    public string? AttachmentRecipientSummary { get; set; }
    public string? AttachmentSkipReason { get; set; }
    public string? SelectedAttachmentIdsCsv { get; set; }
    public string? InvoiceSubmissionChannel { get; set; }
    public string InvoiceSubmissionCorrelationId { get; set; } = null!;
    public string? InvoiceStagingResult { get; set; }
    public string? InvoiceStagingError { get; set; }
    public string? ErpInvoiceReference { get; set; }
    public bool IsSuccessHandoff { get; set; }

    public virtual SalesOrder Order { get; set; } = null!;
}
