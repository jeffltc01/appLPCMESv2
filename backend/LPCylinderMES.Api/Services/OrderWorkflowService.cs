using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class OrderWorkflowService(
    LpcAppsDbContext db,
    IOrderQueryService orderQueryService) : IOrderWorkflowService
{
    private static readonly HashSet<(string From, string To)> AllowedLifecycleTransitions = new()
    {
        (OrderStatusCatalog.Draft, OrderStatusCatalog.PendingOrderEntryValidation),
        (OrderStatusCatalog.Draft, OrderStatusCatalog.InboundLogisticsPlanned),
        (OrderStatusCatalog.Draft, OrderStatusCatalog.ReceivedPendingReconciliation),
        (OrderStatusCatalog.PendingOrderEntryValidation, OrderStatusCatalog.InboundLogisticsPlanned),
        (OrderStatusCatalog.PendingOrderEntryValidation, OrderStatusCatalog.ReceivedPendingReconciliation),
        (OrderStatusCatalog.InboundLogisticsPlanned, OrderStatusCatalog.InboundInTransit),
        (OrderStatusCatalog.InboundLogisticsPlanned, OrderStatusCatalog.ReceivedPendingReconciliation),
        (OrderStatusCatalog.InboundInTransit, OrderStatusCatalog.ReceivedPendingReconciliation),
        (OrderStatusCatalog.ReceivedPendingReconciliation, OrderStatusCatalog.ReadyForProduction),
        (OrderStatusCatalog.ReadyForProduction, OrderStatusCatalog.InProduction),
        (OrderStatusCatalog.InProduction, OrderStatusCatalog.ProductionCompletePendingApproval),
        (OrderStatusCatalog.InProduction, OrderStatusCatalog.ProductionComplete),
        (OrderStatusCatalog.ProductionCompletePendingApproval, OrderStatusCatalog.ProductionComplete),
        (OrderStatusCatalog.ProductionComplete, OrderStatusCatalog.OutboundLogisticsPlanned),
        (OrderStatusCatalog.ProductionComplete, OrderStatusCatalog.DispatchedOrPickupReleased),
        (OrderStatusCatalog.OutboundLogisticsPlanned, OrderStatusCatalog.DispatchedOrPickupReleased),
        (OrderStatusCatalog.DispatchedOrPickupReleased, OrderStatusCatalog.InvoiceReady),
        (OrderStatusCatalog.InvoiceReady, OrderStatusCatalog.Invoiced),
        // Rework guardrail default from spec.
        (OrderStatusCatalog.InvoiceReady, OrderStatusCatalog.InProduction),
    };

    public async Task<OrderDraftDetailDto> AdvanceStatusAsync(
        int orderId,
        string targetStatus,
        CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FindAsync([orderId], cancellationToken);
        if (order is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        if (ShouldUseLifecycleFlow(order, targetStatus))
        {
            await AdvanceLifecycleStatusAsync(order, targetStatus, cancellationToken);
        }
        else
        {
            AdvanceLegacyStatus(order, targetStatus);
        }

        await db.SaveChangesAsync(cancellationToken);

        var detail = await orderQueryService.GetOrderDetailAsync(orderId, cancellationToken);
        return detail ?? throw new InvalidOperationException("Failed to load order detail after status update.");
    }

    public async Task<OrderDraftDetailDto> SubmitInvoiceAsync(
        int orderId,
        SubmitInvoiceDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!dto.FinalReviewConfirmed)
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                "Final review confirmation is required before invoice submission.");
        }

        var order = await db.SalesOrders
            .Include(o => o.OrderAttachments)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        }

        var lifecycleStatus = string.IsNullOrWhiteSpace(order.OrderLifecycleStatus)
            ? OrderStatusCatalog.MapLegacyToLifecycle(order.OrderStatus)
            : order.OrderLifecycleStatus!;
        if (!string.Equals(lifecycleStatus, OrderStatusCatalog.InvoiceReady, StringComparison.Ordinal))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Only '{OrderStatusCatalog.InvoiceReady}' orders can be submitted to invoicing.");
        }

        var hasAttachments = order.OrderAttachments.Count > 0;
        if (hasAttachments)
        {
            if (dto.SendAttachmentEmail)
            {
                if (dto.SelectedAttachmentIds is null || dto.SelectedAttachmentIds.Count == 0)
                {
                    throw new ServiceException(
                        StatusCodes.Status400BadRequest,
                        "At least one attachment must be selected when sending attachment email.");
                }

                var existingAttachmentIds = order.OrderAttachments.Select(a => a.Id).ToHashSet();
                var unknown = dto.SelectedAttachmentIds.FirstOrDefault(id => !existingAttachmentIds.Contains(id));
                if (unknown != 0)
                {
                    throw new ServiceException(
                        StatusCodes.Status400BadRequest,
                        $"Attachment id {unknown} is invalid for this order.");
                }

                if (string.IsNullOrWhiteSpace(dto.AttachmentRecipientSummary))
                {
                    throw new ServiceException(
                        StatusCodes.Status400BadRequest,
                        "Recipient summary is required when sending attachment email.");
                }

                order.AttachmentEmailSent = true;
                order.AttachmentEmailSentUtc = DateTime.UtcNow;
                order.AttachmentEmailRecipientSummary = dto.AttachmentRecipientSummary.Trim();
                order.AttachmentEmailSkipReason = null;
            }
            else
            {
                if (string.IsNullOrWhiteSpace(dto.AttachmentSkipReason))
                {
                    throw new ServiceException(
                        StatusCodes.Status400BadRequest,
                        "Attachment skip reason is required when email step is skipped.");
                }

                order.AttachmentEmailSent = false;
                order.AttachmentEmailSkipReason = dto.AttachmentSkipReason.Trim();
            }

            order.AttachmentEmailPrompted = true;
        }
        else
        {
            order.AttachmentEmailPrompted = false;
            order.AttachmentEmailSent = false;
        }

        var now = DateTime.UtcNow;
        order.InvoiceReviewCompletedUtc = now;
        order.InvoiceReviewCompletedByEmpNo = TrimToNull(dto.SubmittedByEmpNo);
        order.InvoiceSubmissionRequestedUtc = now;
        order.InvoiceSubmissionRequestedByEmpNo = TrimToNull(dto.SubmittedByEmpNo);
        order.InvoiceSubmissionChannel = "PowerAutomateSqlSp";
        order.InvoiceSubmissionCorrelationId = string.IsNullOrWhiteSpace(dto.CorrelationId)
            ? Guid.NewGuid().ToString("N")
            : dto.CorrelationId.Trim();

        return await AdvanceStatusAsync(orderId, OrderStatusCatalog.Invoiced, cancellationToken);
    }

    public async Task<OrderLifecycleMigrationResultDto> BackfillLifecycleStatusesAsync(
        bool dryRun = false,
        CancellationToken cancellationToken = default)
    {
        var orders = await db.SalesOrders
            .AsTracking()
            .ToListAsync(cancellationToken);

        var alreadyInitialized = orders.Count(o => !string.IsNullOrWhiteSpace(o.OrderLifecycleStatus));
        var needsBackfill = orders.Where(o => string.IsNullOrWhiteSpace(o.OrderLifecycleStatus)).ToList();

        foreach (var order in needsBackfill)
        {
            order.OrderLifecycleStatus = OrderStatusCatalog.MapLegacyToLifecycle(order.OrderStatus);
            if (!order.StatusUpdatedUtc.HasValue)
            {
                order.StatusUpdatedUtc = DateTime.UtcNow;
            }
        }

        if (!dryRun && needsBackfill.Count > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
        }

        return new OrderLifecycleMigrationResultDto(
            orders.Count,
            alreadyInitialized,
            needsBackfill.Count,
            dryRun);
    }

    private static bool ShouldUseLifecycleFlow(SalesOrder order, string targetStatus) =>
        !string.IsNullOrWhiteSpace(order.OrderLifecycleStatus) ||
        OrderStatusCatalog.IsLifecycleStatus(targetStatus);

    private void AdvanceLegacyStatus(SalesOrder order, string targetStatus)
    {
        var currentIdx = Array.IndexOf(OrderStatusCatalog.WorkflowSteps, order.OrderStatus);
        if (currentIdx < 0)
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Order is in unsupported status '{order.OrderStatus}'.");
        }

        var expectedNext = currentIdx < OrderStatusCatalog.WorkflowSteps.Length - 1
            ? OrderStatusCatalog.WorkflowSteps[currentIdx + 1]
            : null;
        var expectedPrevious = currentIdx > 0
            ? OrderStatusCatalog.WorkflowSteps[currentIdx - 1]
            : null;

        var isImmediateNext = expectedNext is not null &&
            string.Equals(targetStatus, expectedNext, StringComparison.Ordinal);
        var isImmediatePrevious = expectedPrevious is not null &&
            string.Equals(targetStatus, expectedPrevious, StringComparison.Ordinal);

        if (!isImmediateNext && !isImmediatePrevious)
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Only immediate adjacent step is allowed. Current='{order.OrderStatus}', " +
                $"previous='{expectedPrevious ?? "(none)"}', next='{expectedNext ?? "(none)"}'.");
        }

        var previousStatus = order.OrderStatus;
        order.OrderStatus = targetStatus;

        if (isImmediateNext)
        {
            ApplyTransitionTimestamp(order, targetStatus);
        }
        else if (isImmediatePrevious)
        {
            ClearTransitionTimestamp(order, previousStatus);
        }
    }

    private Task AdvanceLifecycleStatusAsync(
        SalesOrder order,
        string requestedTargetStatus,
        CancellationToken cancellationToken)
    {
        var currentStatus = string.IsNullOrWhiteSpace(order.OrderLifecycleStatus)
            ? OrderStatusCatalog.MapLegacyToLifecycle(order.OrderStatus)
            : order.OrderLifecycleStatus!;
        var targetStatus = OrderStatusCatalog.IsLifecycleStatus(requestedTargetStatus)
            ? requestedTargetStatus
            : OrderStatusCatalog.MapLegacyToLifecycle(requestedTargetStatus);

        if (!AllowedLifecycleTransitions.Contains((currentStatus, targetStatus)))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Transition '{currentStatus}' -> '{targetStatus}' is not allowed.");
        }

        var currentIdx = Array.IndexOf(OrderStatusCatalog.LifecycleWorkflowSteps, currentStatus);
        var targetIdx = Array.IndexOf(OrderStatusCatalog.LifecycleWorkflowSteps, targetStatus);
        var isForward = targetIdx > currentIdx;
        var hasBlockingHold = !string.IsNullOrWhiteSpace(order.HoldOverlay) &&
                              !string.Equals(order.HoldOverlay, OrderStatusCatalog.Cancelled, StringComparison.Ordinal);

        if (hasBlockingHold && isForward)
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Cannot advance while hold overlay '{order.HoldOverlay}' is active.");
        }

        if (string.Equals(order.HoldOverlay, OrderStatusCatalog.OnHoldCustomer, StringComparison.Ordinal) &&
            string.Equals(currentStatus, OrderStatusCatalog.InboundLogisticsPlanned, StringComparison.Ordinal) &&
            string.Equals(targetStatus, OrderStatusCatalog.InboundInTransit, StringComparison.Ordinal))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "Cannot move to InboundInTransit while OnHoldCustomer is active.");
        }

        var blocksInvoice =
            string.Equals(order.HoldOverlay, OrderStatusCatalog.ReworkOpen, StringComparison.Ordinal) ||
            (order.HasOpenRework ?? false) ||
            (order.ReworkBlockingInvoice ?? false);
        if (blocksInvoice &&
            (string.Equals(targetStatus, OrderStatusCatalog.InvoiceReady, StringComparison.Ordinal) ||
             string.Equals(targetStatus, OrderStatusCatalog.Invoiced, StringComparison.Ordinal)))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "Cannot transition to invoice statuses while rework is open.");
        }

        var requiresCommitment = string.Equals(targetStatus, OrderStatusCatalog.OutboundLogisticsPlanned, StringComparison.Ordinal) ||
                                 string.Equals(targetStatus, OrderStatusCatalog.DispatchedOrPickupReleased, StringComparison.Ordinal);
        if (requiresCommitment && !order.CurrentCommittedDateUtc.HasValue)
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "CurrentCommittedDateUtc must be set before outbound release planning.");
        }

        if (string.Equals(targetStatus, OrderStatusCatalog.Invoiced, StringComparison.Ordinal))
        {
            var attachmentStepCompleted = (order.AttachmentEmailSent ?? false) ||
                                          !string.IsNullOrWhiteSpace(order.AttachmentEmailSkipReason);
            if (!order.InvoiceReviewCompletedUtc.HasValue ||
                !attachmentStepCompleted ||
                string.IsNullOrWhiteSpace(order.InvoiceSubmissionCorrelationId))
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "InvoiceReady -> Invoiced requires review completion, attachment step completion, and ERP correlation id.");
            }
        }

        order.OrderLifecycleStatus = targetStatus;
        order.OrderStatus = OrderStatusCatalog.MapLifecycleToLegacy(targetStatus);
        order.StatusUpdatedUtc = DateTime.UtcNow;
        ApplyTransitionTimestamp(order, order.OrderStatus);
        if (string.Equals(targetStatus, OrderStatusCatalog.ReadyForProduction, StringComparison.Ordinal))
        {
            return RouteInstantiationService.EnsureRoutesForOrderAsync(db, order, null, cancellationToken);
        }

        return Task.CompletedTask;
    }

    private static void ApplyTransitionTimestamp(SalesOrder order, string targetStatus)
    {
        var now = DateTime.Now;
        switch (targetStatus)
        {
            case OrderStatusCatalog.ReadyForPickup:
                order.PickupDate = now;
                break;
            case OrderStatusCatalog.PickupScheduled:
                order.PickupScheduledDate = now;
                break;
            case OrderStatusCatalog.Received:
                order.ReceivedDate = now;
                break;
            case OrderStatusCatalog.ReadyToShip:
                order.ReadyToShipDate = now;
                break;
            case OrderStatusCatalog.ReadyToInvoice:
                order.InvoiceDate = now;
                break;
        }
    }

    private static void ClearTransitionTimestamp(SalesOrder order, string fromStatus)
    {
        switch (fromStatus)
        {
            case OrderStatusCatalog.ReadyForPickup:
                order.PickupDate = null;
                break;
            case OrderStatusCatalog.PickupScheduled:
                order.PickupScheduledDate = null;
                break;
            case OrderStatusCatalog.Received:
                order.ReceivedDate = null;
                break;
            case OrderStatusCatalog.ReadyToShip:
                order.ReadyToShipDate = null;
                break;
            case OrderStatusCatalog.ReadyToInvoice:
                order.InvoiceDate = null;
                break;
        }
    }

    private static string? TrimToNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }
}

