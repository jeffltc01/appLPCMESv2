using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class OrderWorkflowService(
    LpcAppsDbContext db,
    IOrderQueryService orderQueryService,
    IOrderPolicyService orderPolicyService,
    IInvoiceStagingService? invoiceStagingService = null) : IOrderWorkflowService
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
        (OrderStatusCatalog.InvoiceReady, OrderStatusCatalog.ProductionCompletePendingApproval),
    };

    public async Task<OrderDraftDetailDto> ApplyHoldAsync(
        int orderId,
        ApplyHoldDto dto,
        CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        }

        var holdOverlay = TrimToNull(dto.HoldOverlay);
        var actingRole = TrimToNull(dto.ActingRole);
        var reasonCode = TrimToNull(dto.ReasonCode);
        var note = TrimToNull(dto.Note);
        var appliedByEmpNo = TrimToNull(dto.AppliedByEmpNo);
        if (holdOverlay is null || !OrderStatusCatalog.HoldOverlays.Contains(holdOverlay))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "Invalid hold overlay.");
        }

        if (actingRole is null || reasonCode is null || appliedByEmpNo is null)
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                "ActingRole, AppliedByEmpNo, and ReasonCode are required.");
        }

        var lifecycleStatus = string.IsNullOrWhiteSpace(order.OrderLifecycleStatus)
            ? OrderStatusCatalog.MapLegacyToLifecycle(order.OrderStatus)
            : order.OrderLifecycleStatus!;
        if (string.Equals(lifecycleStatus, OrderStatusCatalog.Invoiced, StringComparison.Ordinal))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "Cannot apply hold overlays to invoiced orders.");
        }

        if (string.Equals(holdOverlay, OrderStatusCatalog.OnHoldCustomer, StringComparison.Ordinal))
        {
            if (!string.Equals(reasonCode, "CustomerNotReadyForPickup", StringComparison.Ordinal))
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    "OnHoldCustomer requires ReasonCode 'CustomerNotReadyForPickup'.");
            }

            if (!string.Equals(actingRole, "Transportation", StringComparison.OrdinalIgnoreCase))
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    "OnHoldCustomer can only be applied by Transportation role.");
            }

            if (!dto.CustomerReadyRetryUtc.HasValue || !dto.CustomerReadyLastContactUtc.HasValue)
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    "CustomerReadyRetryUtc and CustomerReadyLastContactUtc are required for OnHoldCustomer.");
            }

            if (string.IsNullOrWhiteSpace(note))
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    "Status note is required for OnHoldCustomer.");
            }

            order.CustomerReadyRetryUtc = dto.CustomerReadyRetryUtc;
            order.CustomerReadyLastContactUtc = dto.CustomerReadyLastContactUtc;
            order.CustomerReadyContactName = TrimToNull(dto.CustomerReadyContactName);
        }

        order.HoldOverlay = holdOverlay;
        order.StatusReasonCode = reasonCode;
        order.StatusNote = note;
        order.StatusOwnerRole = actingRole;
        order.StatusUpdatedUtc = DateTime.UtcNow;
        if (string.Equals(holdOverlay, OrderStatusCatalog.Cancelled, StringComparison.Ordinal))
        {
            order.HasOpenRework = false;
            order.ReworkBlockingInvoice = false;
            order.ReworkState = "Cancelled";
            order.ReworkDisposition = "Cancelled";
            order.ReworkLastUpdatedByEmpNo = appliedByEmpNo;
            order.ReworkClosedUtc = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        var detail = await orderQueryService.GetOrderDetailAsync(orderId, cancellationToken);
        return detail ?? throw new InvalidOperationException("Failed to load order detail after hold apply.");
    }

    public async Task<OrderDraftDetailDto> AdvanceStatusAsync(
        int orderId,
        string targetStatus,
        string? actingRole = null,
        string? reasonCode = null,
        string? note = null,
        string? actingEmpNo = null,
        CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FindAsync([orderId], cancellationToken);
        if (order is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        if (ShouldUseLifecycleFlow(order, targetStatus))
        {
            await AdvanceLifecycleStatusAsync(order, targetStatus, actingRole, reasonCode, note, actingEmpNo, cancellationToken);
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
        var finalReviewConfirmed = dto.FinalReviewConfirmed &&
                                   dto.ReviewPaperworkConfirmed &&
                                   dto.ReviewPricingConfirmed &&
                                   dto.ReviewBillingConfirmed;
        if (!finalReviewConfirmed)
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                "All final review confirmations are required before invoice submission.");
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

        var normalizedCorrelationId = string.IsNullOrWhiteSpace(dto.CorrelationId)
            ? Guid.NewGuid().ToString("N")
            : dto.CorrelationId.Trim();

        if (string.Equals(order.HoldOverlay, OrderStatusCatalog.ReworkOpen, StringComparison.Ordinal) ||
            (order.HasOpenRework ?? false) ||
            (order.ReworkBlockingInvoice ?? false))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "Cannot submit invoice while rework overlay is open.");
        }

        var existingSuccessfulAttempt = await db.OrderInvoiceSubmissionAudits
            .AsNoTracking()
            .Where(a => a.OrderId == orderId && a.InvoiceSubmissionCorrelationId == normalizedCorrelationId && a.IsSuccessHandoff)
            .OrderByDescending(a => a.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (existingSuccessfulAttempt is not null)
        {
            if (!string.Equals(order.OrderLifecycleStatus, OrderStatusCatalog.Invoiced, StringComparison.Ordinal))
            {
                order.InvoiceSubmissionCorrelationId = existingSuccessfulAttempt.InvoiceSubmissionCorrelationId;
                order.InvoiceStagingResult = existingSuccessfulAttempt.InvoiceStagingResult;
                order.InvoiceStagingError = existingSuccessfulAttempt.InvoiceStagingError;
                order.ErpInvoiceReference = existingSuccessfulAttempt.ErpInvoiceReference;
                order.InvoiceSubmissionChannel = existingSuccessfulAttempt.InvoiceSubmissionChannel ?? "PowerAutomateSqlSp";
                await db.SaveChangesAsync(cancellationToken);
                return await AdvanceStatusAsync(orderId, OrderStatusCatalog.Invoiced, cancellationToken: cancellationToken);
            }

            var alreadySubmitted = await orderQueryService.GetOrderDetailAsync(orderId, cancellationToken);
            return alreadySubmitted ?? throw new InvalidOperationException("Failed to load order detail after idempotent invoice submit.");
        }

        var hasAttachments = order.OrderAttachments.Count > 0;
        var attachmentPolicy = await orderPolicyService.GetDecisionValueAsync(
            OrderPolicyKeys.AttachmentEmailPolicy,
            order.SiteId,
            order.CustomerId,
            "AlwaysOptional",
            cancellationToken);
        var requiredEmail = string.Equals(attachmentPolicy, "MandatoryForAll", StringComparison.OrdinalIgnoreCase);
        if (string.Equals(attachmentPolicy, "MandatoryForConfiguredCustomers", StringComparison.OrdinalIgnoreCase))
        {
            var requiredCustomerCsv = await orderPolicyService.GetDecisionValueAsync(
                OrderPolicyKeys.AttachmentEmailRequiredCustomerIdsCsv,
                order.SiteId,
                order.CustomerId,
                string.Empty,
                cancellationToken);
            requiredEmail = ParseCsvInts(requiredCustomerCsv).Contains(order.CustomerId);
        }

        var requiredAttachmentCategoriesCsv = await orderPolicyService.GetDecisionValueAsync(
            OrderPolicyKeys.RequiredAttachmentCategoriesCsv,
            order.SiteId,
            order.CustomerId,
            string.Empty,
            cancellationToken);
        var requiredAttachmentCategories = ParseCsv(requiredAttachmentCategoriesCsv);
        if (requiredAttachmentCategories.Count > 0)
        {
            var attachmentCategories = order.OrderAttachments
                .Select(a => a.Category)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            var missingCategories = requiredAttachmentCategories
                .Where(category => !attachmentCategories.Contains(category))
                .ToList();
            if (missingCategories.Count > 0)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    $"Missing required attachment categories: {string.Join(", ", missingCategories)}.");
            }
        }

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
                if (requiredEmail)
                {
                    throw new ServiceException(
                        StatusCodes.Status409Conflict,
                        "Attachment email is mandatory by policy for this order.");
                }

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
            if (requiredEmail)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "Attachment email is mandatory by policy, but no attachments are available.");
            }

            order.AttachmentEmailPrompted = false;
            order.AttachmentEmailSent = false;
            order.AttachmentEmailSkipReason = "NoAttachmentsAvailable";
            order.AttachmentEmailRecipientSummary = null;
        }

        var now = DateTime.UtcNow;
        order.InvoiceReviewCompletedUtc = now;
        order.InvoiceReviewCompletedByEmpNo = TrimToNull(dto.ReviewCompletedByEmpNo) ?? TrimToNull(dto.SubmittedByEmpNo);
        order.InvoiceSubmissionRequestedUtc = now;
        order.InvoiceSubmissionRequestedByEmpNo = TrimToNull(dto.SubmittedByEmpNo);
        order.InvoiceSubmissionChannel = "PowerAutomateSqlSp";
        order.InvoiceSubmissionCorrelationId = normalizedCorrelationId;

        var stagingService = invoiceStagingService;
        if (stagingService is null)
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "Invoice staging service is unavailable.");
        }

        var stagingResult = await stagingService.SubmitToStagingAsync(
            order,
            normalizedCorrelationId,
            dto.SubmittedByEmpNo,
            cancellationToken);
        order.InvoiceStagingResult = stagingResult.StagingResult;
        order.InvoiceStagingError = TrimToNull(stagingResult.ErrorMessage);
        order.ErpInvoiceReference = TrimToNull(stagingResult.ErpInvoiceReference);
        order.ErpReconcileStatus = stagingResult.IsSuccessHandoff ? "Pending" : "Failed";

        db.OrderInvoiceSubmissionAudits.Add(new OrderInvoiceSubmissionAudit
        {
            OrderId = order.Id,
            AttemptUtc = now,
            ReviewCompletedByEmpNo = order.InvoiceReviewCompletedByEmpNo,
            SubmissionActorEmpNo = TrimToNull(dto.SubmittedByEmpNo),
            FinalReviewConfirmed = dto.FinalReviewConfirmed,
            ReviewPaperworkConfirmed = dto.ReviewPaperworkConfirmed,
            ReviewPricingConfirmed = dto.ReviewPricingConfirmed,
            ReviewBillingConfirmed = dto.ReviewBillingConfirmed,
            AttachmentEmailPrompted = order.AttachmentEmailPrompted ?? false,
            AttachmentEmailSent = order.AttachmentEmailSent ?? false,
            AttachmentRecipientSummary = TrimToNull(order.AttachmentEmailRecipientSummary),
            AttachmentSkipReason = TrimToNull(order.AttachmentEmailSkipReason),
            SelectedAttachmentIdsCsv = dto.SelectedAttachmentIds is null || dto.SelectedAttachmentIds.Count == 0
                ? null
                : string.Join(",", dto.SelectedAttachmentIds.Distinct().OrderBy(id => id)),
            InvoiceSubmissionChannel = order.InvoiceSubmissionChannel,
            InvoiceSubmissionCorrelationId = normalizedCorrelationId,
            InvoiceStagingResult = stagingResult.StagingResult,
            InvoiceStagingError = TrimToNull(stagingResult.ErrorMessage),
            ErpInvoiceReference = TrimToNull(stagingResult.ErpInvoiceReference),
            IsSuccessHandoff = stagingResult.IsSuccessHandoff,
        });

        if (!stagingResult.IsSuccessHandoff)
        {
            await db.SaveChangesAsync(cancellationToken);
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"ERP staging handoff failed. CorrelationId={normalizedCorrelationId}; TimestampUtc={now:O}; Error={order.InvoiceStagingError ?? "Unknown"}");
        }

        await db.SaveChangesAsync(cancellationToken);
        return await AdvanceStatusAsync(orderId, OrderStatusCatalog.Invoiced, cancellationToken: cancellationToken);
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

    private async Task AdvanceLifecycleStatusAsync(
        SalesOrder order,
        string requestedTargetStatus,
        string? actingRole,
        string? reasonCode,
        string? note,
        string? actingEmpNo,
        CancellationToken cancellationToken)
    {
        var currentStatus = string.IsNullOrWhiteSpace(order.OrderLifecycleStatus)
            ? OrderStatusCatalog.MapLegacyToLifecycle(order.OrderStatus)
            : order.OrderLifecycleStatus!;
        var targetStatus = OrderStatusCatalog.IsLifecycleStatus(requestedTargetStatus)
            ? requestedTargetStatus
            : OrderStatusCatalog.MapLegacyToLifecycle(requestedTargetStatus);
        var normalizedRole = TrimToNull(actingRole);
        var normalizedReasonCode = TrimToNull(reasonCode);
        var normalizedNote = TrimToNull(note);
        var normalizedActingEmpNo = TrimToNull(actingEmpNo);

        if (!AllowedLifecycleTransitions.Contains((currentStatus, targetStatus)))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Transition '{currentStatus}' -> '{targetStatus}' is not allowed.");
        }

        if (string.Equals(currentStatus, OrderStatusCatalog.Draft, StringComparison.Ordinal) &&
            string.Equals(targetStatus, OrderStatusCatalog.PendingOrderEntryValidation, StringComparison.Ordinal) &&
            !string.Equals(order.OrderOrigin, "SalesMobile", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "Draft -> PendingOrderEntryValidation requires SalesMobile order origin.");
        }

        if (string.Equals(currentStatus, OrderStatusCatalog.Draft, StringComparison.Ordinal) &&
            string.Equals(targetStatus, OrderStatusCatalog.InboundLogisticsPlanned, StringComparison.Ordinal))
        {
            if (!string.Equals(order.OrderOrigin, "OfficeEntry", StringComparison.OrdinalIgnoreCase))
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "Draft -> InboundLogisticsPlanned requires OfficeEntry order origin.");
            }

            if (string.IsNullOrWhiteSpace(order.InboundMode))
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "Draft -> InboundLogisticsPlanned requires InboundMode to be set.");
            }
        }

        var isDirectImmediateDropoffReceive =
            string.Equals(targetStatus, OrderStatusCatalog.ReceivedPendingReconciliation, StringComparison.Ordinal) &&
            (string.Equals(currentStatus, OrderStatusCatalog.Draft, StringComparison.Ordinal) ||
             string.Equals(currentStatus, OrderStatusCatalog.PendingOrderEntryValidation, StringComparison.Ordinal));
        if (isDirectImmediateDropoffReceive)
        {
            if (!string.Equals(order.InboundMode, "CustomerDropoff", StringComparison.OrdinalIgnoreCase))
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    $"{currentStatus} -> ReceivedPendingReconciliation requires CustomerDropoff inbound mode.");
            }

            if (string.IsNullOrWhiteSpace(normalizedReasonCode) || string.IsNullOrWhiteSpace(normalizedNote))
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    "Immediate customer dropoff receive requires reason code and status note for audit.");
            }
        }

        var currentIdx = Array.IndexOf(OrderStatusCatalog.LifecycleWorkflowSteps, currentStatus);
        var targetIdx = Array.IndexOf(OrderStatusCatalog.LifecycleWorkflowSteps, targetStatus);
        var isForward = targetIdx > currentIdx;
        var hasBlockingHold = !string.IsNullOrWhiteSpace(order.HoldOverlay) &&
                              !string.Equals(order.HoldOverlay, OrderStatusCatalog.Cancelled, StringComparison.Ordinal);

        if (string.Equals(order.HoldOverlay, OrderStatusCatalog.Cancelled, StringComparison.Ordinal) &&
            !string.Equals(currentStatus, targetStatus, StringComparison.Ordinal))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "Cancelled orders are terminal and cannot transition.");
        }

        if (hasBlockingHold &&
            isForward &&
            !await IsHoldExceptionAllowedAsync(order, order.HoldOverlay!, currentStatus, targetStatus, cancellationToken))
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

        if (string.Equals(currentStatus, OrderStatusCatalog.InboundLogisticsPlanned, StringComparison.Ordinal) &&
            string.Equals(targetStatus, OrderStatusCatalog.InboundInTransit, StringComparison.Ordinal) &&
            string.Equals(order.InboundMode, "CustomerDropoff", StringComparison.OrdinalIgnoreCase))
        {
            var allowDropoffTransit = await orderPolicyService.GetDecisionFlagAsync(
                OrderPolicyKeys.AllowCustomerDropoffTransitWithAppointment,
                order.SiteId,
                order.CustomerId,
                false,
                cancellationToken);
            if (!allowDropoffTransit || !order.ScheduledReceiptDate.HasValue)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "Customer dropoff transition to InboundInTransit requires policy enablement and check-in appointment evidence.");
            }
        }

        if (string.Equals(currentStatus, OrderStatusCatalog.InboundLogisticsPlanned, StringComparison.Ordinal) &&
            string.Equals(targetStatus, OrderStatusCatalog.ReceivedPendingReconciliation, StringComparison.Ordinal) &&
            !string.Equals(order.InboundMode, "CustomerDropoff", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "InboundLogisticsPlanned -> ReceivedPendingReconciliation is reserved for customer dropoff arrivals.");
        }

        if (string.Equals(currentStatus, OrderStatusCatalog.ReceivedPendingReconciliation, StringComparison.Ordinal) &&
            string.Equals(targetStatus, OrderStatusCatalog.ReadyForProduction, StringComparison.Ordinal))
        {
            var hasUnreconciledRequiredLine = await db.SalesOrderDetails
                .Where(d => d.SalesOrderId == order.Id && d.QuantityAsOrdered > 0)
                .AnyAsync(d => (d.QuantityAsReceived ?? 0m) <= 0m, cancellationToken);
            if (hasUnreconciledRequiredLine)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "ReceivedPendingReconciliation -> ReadyForProduction requires reconciliation for all required lines.");
            }
        }

        if (string.Equals(currentStatus, OrderStatusCatalog.ReadyForProduction, StringComparison.Ordinal) &&
            string.Equals(targetStatus, OrderStatusCatalog.InProduction, StringComparison.Ordinal))
        {
            var hasStartedRouteStep = await db.OrderLineRouteStepInstances
                .AnyAsync(
                    step => step.OrderLineRouteInstance.SalesOrderId == order.Id &&
                            (step.ScanInUtc.HasValue ||
                             step.State == "InProgress" ||
                             step.State == "Completed"),
                    cancellationToken);
            if (!hasStartedRouteStep)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "ReadyForProduction -> InProduction requires at least one route step start event.");
            }
        }

        if (string.Equals(currentStatus, OrderStatusCatalog.InProduction, StringComparison.Ordinal) &&
            string.Equals(targetStatus, OrderStatusCatalog.ProductionComplete, StringComparison.Ordinal))
        {
            var hasRoutes = await db.OrderLineRouteInstances.AnyAsync(r => r.SalesOrderId == order.Id, cancellationToken);
            if (!hasRoutes)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "InProduction -> ProductionComplete requires route instances.");
            }

            var hasIncompleteRoutes = await db.OrderLineRouteInstances
                .AnyAsync(r => r.SalesOrderId == order.Id && r.State != "Completed", cancellationToken);
            if (hasIncompleteRoutes)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "InProduction -> ProductionComplete requires all required routes to be completed.");
            }

            var hasPendingApprovals = await db.OrderLineRouteInstances
                .AnyAsync(r => r.SalesOrderId == order.Id && r.SupervisorApprovalRequired && !r.SupervisorApprovedUtc.HasValue, cancellationToken);
            if (hasPendingApprovals)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "InProduction -> ProductionComplete requires supervisor/quality approvals; use ProductionCompletePendingApproval first.");
            }
        }

        if (string.Equals(currentStatus, OrderStatusCatalog.ProductionComplete, StringComparison.Ordinal) &&
            string.Equals(targetStatus, OrderStatusCatalog.DispatchedOrPickupReleased, StringComparison.Ordinal) &&
            string.Equals(order.OutboundMode, "CustomerPickup", StringComparison.OrdinalIgnoreCase))
        {
            var requireOutboundPlanned = await orderPolicyService.GetDecisionFlagAsync(
                OrderPolicyKeys.RequireOutboundPlannedForCustomerPickup,
                order.SiteId,
                order.CustomerId,
                false,
                cancellationToken);
            if (requireOutboundPlanned)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "Customer pickup requires OutboundLogisticsPlanned before release by active site policy.");
            }
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

        if (string.Equals(currentStatus, OrderStatusCatalog.InvoiceReady, StringComparison.Ordinal) &&
            (string.Equals(targetStatus, OrderStatusCatalog.InProduction, StringComparison.Ordinal) ||
             string.Equals(targetStatus, OrderStatusCatalog.ProductionCompletePendingApproval, StringComparison.Ordinal)))
        {
            var reworkRevertTarget = await orderPolicyService.GetDecisionValueAsync(
                OrderPolicyKeys.ReworkRevertTargetStatus,
                order.SiteId,
                order.CustomerId,
                OrderStatusCatalog.InProduction,
                cancellationToken);
            if (!string.Equals(targetStatus, reworkRevertTarget, StringComparison.Ordinal))
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    $"Rework reversion target is configured as '{reworkRevertTarget}'.");
            }
        }

        var requiresCommitment = string.Equals(targetStatus, OrderStatusCatalog.OutboundLogisticsPlanned, StringComparison.Ordinal) ||
                                 string.Equals(targetStatus, OrderStatusCatalog.DispatchedOrPickupReleased, StringComparison.Ordinal);
        if (requiresCommitment && !order.CurrentCommittedDateUtc.HasValue)
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "CurrentCommittedDateUtc must be set before outbound release planning.");
        }

        if (string.Equals(currentStatus, OrderStatusCatalog.DispatchedOrPickupReleased, StringComparison.Ordinal) &&
            string.Equals(targetStatus, OrderStatusCatalog.InvoiceReady, StringComparison.Ordinal))
        {
            var missingEvidenceBehavior = await orderPolicyService.GetDecisionValueAsync(
                OrderPolicyKeys.MissingDeliveryEvidenceBehavior,
                order.SiteId,
                order.CustomerId,
                "ReportingOnly",
                cancellationToken);
            if (string.Equals(missingEvidenceBehavior, "AutoExceptionDocumentation", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(order.DeliveryEvidenceStatus, "Received", StringComparison.OrdinalIgnoreCase))
            {
                order.HoldOverlay = OrderStatusCatalog.ExceptionDocumentation;
                order.StatusReasonCode = "MissingDeliveryEvidence";
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "Missing delivery evidence auto-raises ExceptionDocumentation by policy.");
            }
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
        order.StatusOwnerRole = ResolveStatusOwnerRole(targetStatus, normalizedRole);
        if (normalizedReasonCode is not null)
        {
            order.StatusReasonCode = normalizedReasonCode;
        }

        if (normalizedNote is not null)
        {
            order.StatusNote = normalizedNote;
        }

        if (string.Equals(currentStatus, OrderStatusCatalog.PendingOrderEntryValidation, StringComparison.Ordinal) &&
            string.Equals(targetStatus, OrderStatusCatalog.InboundLogisticsPlanned, StringComparison.Ordinal))
        {
            order.ValidatedUtc = DateTime.UtcNow;
            order.ValidatedByEmpNo = normalizedActingEmpNo;
        }

        ApplyTransitionTimestamp(order, order.OrderStatus);
        if (string.Equals(targetStatus, OrderStatusCatalog.ReadyForProduction, StringComparison.Ordinal))
        {
            await RouteInstantiationService.EnsureRoutesForOrderAsync(db, order, null, cancellationToken);
            return;
        }

        return;
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

    private static string ResolveStatusOwnerRole(string targetStatus, string? actingRole)
    {
        if (!string.IsNullOrWhiteSpace(actingRole))
        {
            return actingRole;
        }

        return targetStatus switch
        {
            OrderStatusCatalog.Draft => "Office",
            OrderStatusCatalog.PendingOrderEntryValidation => "Office",
            OrderStatusCatalog.InboundLogisticsPlanned => "Transportation",
            OrderStatusCatalog.InboundInTransit => "Transportation",
            OrderStatusCatalog.ReceivedPendingReconciliation => "Receiving",
            OrderStatusCatalog.ReadyForProduction => "Receiving",
            OrderStatusCatalog.InProduction => "Production",
            OrderStatusCatalog.ProductionCompletePendingApproval => "Supervisor",
            OrderStatusCatalog.ProductionComplete => "Production",
            OrderStatusCatalog.OutboundLogisticsPlanned => "Transportation",
            OrderStatusCatalog.DispatchedOrPickupReleased => "Transportation",
            OrderStatusCatalog.InvoiceReady => "Office",
            OrderStatusCatalog.Invoiced => "Office",
            _ => "Office",
        };
    }

    private static HashSet<string> ParseCsv(string csv)
    {
        return csv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private static HashSet<int> ParseCsvInts(string csv)
    {
        return csv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(value => int.TryParse(value, out var parsed) ? parsed : -1)
            .Where(value => value > 0)
            .ToHashSet();
    }

    private async Task<bool> IsHoldExceptionAllowedAsync(
        SalesOrder order,
        string holdOverlay,
        string fromStatus,
        string toStatus,
        CancellationToken cancellationToken)
    {
        var configured = await orderPolicyService.GetDecisionValueAsync(
            OrderPolicyKeys.HoldForwardAllowTransitionsCsv,
            order.SiteId,
            order.CustomerId,
            string.Empty,
            cancellationToken);
        if (string.IsNullOrWhiteSpace(configured))
        {
            return false;
        }

        var ruleSet = ParseCsv(configured);
        return ruleSet.Contains($"{holdOverlay}:{fromStatus}->{toStatus}") ||
               ruleSet.Contains($"{holdOverlay}:*->{toStatus}") ||
               ruleSet.Contains($"{holdOverlay}:{fromStatus}->*") ||
               ruleSet.Contains($"{holdOverlay}:*->*");
    }
}

