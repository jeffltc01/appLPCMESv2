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
