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
    void EnsureDurationCorrectionAllowed(string actingRole, string timeCaptureMode);
    void EnsureWorkCenterOperationAllowed(string actingRole, string operation);
    void EnsureSupervisorGateDecisionAllowed(string actingRole);
    void EnsureRouteReviewAllowed(string actingRole, string operation);
    void EnsureReworkActionAllowed(string actingRole, string action);
    void EnsureChecklistOverrideAllowed(string actingRole);
}
