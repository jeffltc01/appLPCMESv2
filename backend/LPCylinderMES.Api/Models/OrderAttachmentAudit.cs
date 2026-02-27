namespace LPCylinderMES.Api.Models;

public class OrderAttachmentAudit
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int? AttachmentId { get; set; }
    public string ActionType { get; set; } = null!;
    public string? ActingRole { get; set; }
    public string? ActorEmpNo { get; set; }
    public DateTime OccurredUtc { get; set; }
    public string? Details { get; set; }

    public virtual SalesOrder Order { get; set; } = null!;
    public virtual OrderAttachment? Attachment { get; set; }
}
