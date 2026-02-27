using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Http;

namespace LPCylinderMES.Api.Services;

public class RolePermissionService : IRolePermissionService
{
    private static readonly HashSet<string> PrivilegedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Admin",
        "Supervisor",
        "PlantManager",
    };

    private static readonly HashSet<string> LifecycleMutatingRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Office",
        "Transportation",
        "Receiving",
        "Production",
        "Supervisor",
        "Quality",
        "PlantManager",
        "Admin",
    };
    
    private static readonly Dictionary<string, HashSet<string>> TransitionAllowedRoles = new(StringComparer.Ordinal)
    {
        [OrderStatusCatalog.PendingOrderEntryValidation] = RoleSet("Office", "Supervisor", "PlantManager", "Admin"),
        [OrderStatusCatalog.InboundLogisticsPlanned] = RoleSet("Office", "Transportation", "Supervisor", "PlantManager", "Admin"),
        [OrderStatusCatalog.InboundInTransit] = RoleSet("Transportation", "Supervisor", "PlantManager", "Admin"),
        [OrderStatusCatalog.ReceivedPendingReconciliation] = RoleSet("Receiving", "Supervisor", "PlantManager", "Admin"),
        [OrderStatusCatalog.ReadyForProduction] = RoleSet("Receiving", "Production", "Supervisor", "PlantManager", "Admin"),
        [OrderStatusCatalog.InProduction] = RoleSet("Production", "Supervisor", "PlantManager", "Admin"),
        [OrderStatusCatalog.ProductionCompletePendingApproval] = RoleSet("Supervisor", "Quality", "PlantManager", "Admin"),
        [OrderStatusCatalog.ProductionComplete] = RoleSet("Production", "Supervisor", "PlantManager", "Admin"),
        [OrderStatusCatalog.OutboundLogisticsPlanned] = RoleSet("Transportation", "Office", "Supervisor", "PlantManager", "Admin"),
        [OrderStatusCatalog.DispatchedOrPickupReleased] = RoleSet("Transportation", "Supervisor", "PlantManager", "Admin"),
        [OrderStatusCatalog.InvoiceReady] = RoleSet("Office", "Supervisor", "PlantManager", "Admin"),
        [OrderStatusCatalog.Invoiced] = RoleSet("Office", "Supervisor", "PlantManager", "Admin"),
    };

    private static readonly HashSet<string> QualityHoldApplyRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Quality",
        "Supervisor",
        "PlantManager",
        "Admin",
    };

    private static readonly HashSet<string> HoldApplyRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Office",
        "Transportation",
        "Receiving",
        "Production",
        "Supervisor",
        "Quality",
        "PlantManager",
        "Admin",
    };

    private static readonly HashSet<string> AttachmentReadRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Office",
        "Transportation",
        "Receiving",
        "Production",
        "Supervisor",
        "Quality",
        "PlantManager",
        "Admin",
        "ReadOnly",
        "Setup",
    };

    // SECURITY_ROLES.md: evidence linkage excludes Transportation.
    private static readonly HashSet<string> AttachmentMutatingRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Office",
        "Receiving",
        "Production",
        "Supervisor",
        "Quality",
        "PlantManager",
        "Admin",
    };

    private static readonly HashSet<string> WorkCenterOperatorRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Production",
        "Supervisor",
        "PlantManager",
        "Admin",
    };

    private static readonly HashSet<string> SupervisorGateRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Supervisor",
        "Quality",
        "PlantManager",
        "Admin",
    };

    private static readonly HashSet<string> RouteReviewRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Supervisor",
        "PlantManager",
        "Admin",
    };

    private static readonly HashSet<string> ReworkRequestRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Production",
        "Supervisor",
        "Quality",
        "PlantManager",
        "Admin",
    };

    private static readonly HashSet<string> ReworkElevatedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Supervisor",
        "Quality",
        "PlantManager",
        "Admin",
    };

    public void EnsureStatusTransitionAllowed(string actingRole, string currentStatus, string targetStatus, bool isManualOrEmergency)
    {
        EnsureInSet(actingRole, LifecycleMutatingRoles, "status transition");
        if (TransitionAllowedRoles.TryGetValue(targetStatus, out var allowedRoles))
        {
            EnsureInSet(actingRole, allowedRoles, $"transition to '{targetStatus}'");
        }

        if (isManualOrEmergency && !PrivilegedRoles.Contains(actingRole))
        {
            throw new ServiceException(
                StatusCodes.Status403Forbidden,
                $"Manual/emergency transition '{currentStatus}' -> '{targetStatus}' requires privileged role.");
        }
    }

    public void EnsureApplyHoldAllowed(string actingRole, string holdOverlay)
    {
        if (string.Equals(holdOverlay, OrderStatusCatalog.OnHoldQuality, StringComparison.Ordinal))
        {
            EnsureInSet(actingRole, QualityHoldApplyRoles, "apply quality hold");
            return;
        }

        EnsureInSet(actingRole, HoldApplyRoles, "apply hold");
    }

    public void EnsureClearHoldAllowed(string actingRole, string? activeHoldOverlay, string? holdOwnerRole)
    {
        if (string.IsNullOrWhiteSpace(holdOwnerRole) ||
            string.Equals(actingRole, holdOwnerRole, StringComparison.OrdinalIgnoreCase))
        {
            EnsureInSet(actingRole, HoldApplyRoles, "clear hold");
            return;
        }

        if (!PrivilegedRoles.Contains(actingRole) && !string.Equals(actingRole, "Quality", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(
                StatusCodes.Status403Forbidden,
                $"Cross-function hold clear for '{activeHoldOverlay ?? "Unknown"}' requires privileged role.");
        }
    }

    public void EnsureAttachmentUploadAllowed(string actingRole) =>
        EnsureInSet(actingRole, AttachmentMutatingRoles, "upload attachments");

    public void EnsureAttachmentCategoryUpdateAllowed(string actingRole) =>
        EnsureInSet(actingRole, AttachmentMutatingRoles, "update attachment category");

    public void EnsureAttachmentDeleteAllowed(string actingRole) =>
        EnsureInSet(actingRole, AttachmentMutatingRoles, "delete attachments");

    public void EnsureAttachmentDownloadAllowed(string actingRole) =>
        EnsureInSet(actingRole, AttachmentReadRoles, "download attachments");

    public void EnsureDurationCorrectionAllowed(string actingRole, string timeCaptureMode)
    {
        if (string.Equals(timeCaptureMode, "Manual", StringComparison.OrdinalIgnoreCase))
        {
            EnsureInSet(actingRole, LifecycleMutatingRoles, "correct manual duration");
            return;
        }

        if (string.Equals(timeCaptureMode, "Hybrid", StringComparison.OrdinalIgnoreCase))
        {
            EnsureInSet(actingRole, PrivilegedRoles, "correct hybrid duration");
            return;
        }

        throw new ServiceException(
            StatusCodes.Status403Forbidden,
            $"Duration correction is not allowed for time capture mode '{timeCaptureMode}'.");
    }

    public void EnsureWorkCenterOperationAllowed(string actingRole, string operation) =>
        EnsureInSet(actingRole, WorkCenterOperatorRoles, operation);

    public void EnsureSupervisorGateDecisionAllowed(string actingRole) =>
        EnsureInSet(actingRole, SupervisorGateRoles, "approve/reject supervisor gate");

    public void EnsureRouteReviewAllowed(string actingRole, string operation) =>
        EnsureInSet(actingRole, RouteReviewRoles, operation);

    public void EnsureReworkActionAllowed(string actingRole, string action)
    {
        if (string.Equals(action, "Request", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(action, "Start", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(action, "SubmitVerification", StringComparison.OrdinalIgnoreCase))
        {
            EnsureInSet(actingRole, ReworkRequestRoles, $"perform rework action '{action}'");
            return;
        }

        EnsureInSet(actingRole, ReworkElevatedRoles, $"perform elevated rework action '{action}'");
    }

    public void EnsureChecklistOverrideAllowed(string actingRole) =>
        EnsureInSet(actingRole, RouteReviewRoles, "perform checklist supervisor override");

    private static void EnsureInSet(string actingRole, HashSet<string> allowedRoles, string action)
    {
        if (string.IsNullOrWhiteSpace(actingRole) || !allowedRoles.Contains(actingRole))
        {
            throw new ServiceException(
                StatusCodes.Status403Forbidden,
                $"Role '{actingRole}' is not authorized to {action}.");
        }
    }

    private static HashSet<string> RoleSet(params string[] roles) =>
        new(roles, StringComparer.OrdinalIgnoreCase);
}
