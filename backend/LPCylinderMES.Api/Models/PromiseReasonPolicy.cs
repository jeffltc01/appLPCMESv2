namespace LPCylinderMES.Api.Models;

public partial class PromiseReasonPolicy
{
    public int Id { get; set; }
    public string ReasonCode { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string OwnerRole { get; set; } = null!;
    public string AllowedNotificationPolicies { get; set; } = "Notified,DeferredNotification,InternalOnly";
    public bool IsActive { get; set; }
    public DateTime UpdatedUtc { get; set; }
    public string? UpdatedByEmpNo { get; set; }
}
