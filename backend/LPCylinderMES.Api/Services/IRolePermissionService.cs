namespace LPCylinderMES.Api.Services;

public interface IRolePermissionService
{
    void EnsureStatusTransitionAllowed(string actingRole, string currentStatus, string targetStatus, bool isManualOrEmergency);
    void EnsureApplyHoldAllowed(string actingRole, string holdOverlay);
    void EnsureClearHoldAllowed(string actingRole, string? activeHoldOverlay, string? holdOwnerRole);
    void EnsureAttachmentUploadAllowed(string actingRole);
    void EnsureAttachmentCategoryUpdateAllowed(string actingRole);
    void EnsureAttachmentDeleteAllowed(string actingRole);
    void EnsureAttachmentDownloadAllowed(string actingRole);
}
