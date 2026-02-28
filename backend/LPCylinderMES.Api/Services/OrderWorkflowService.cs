using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class OrderWorkflowService(
    LpcAppsDbContext db,
    IOrderQueryService orderQueryService,
    IOrderPolicyService orderPolicyService,
    IInvoiceStagingService? invoiceStagingService = null,
    IRolePermissionService? rolePermissionService = null) : IOrderWorkflowService
{
    private const string LifecycleStatusChangedEventType = "LifecycleStatusChanged";
    private const string HoldAppliedEventType = "HoldApplied";
    private const string HoldClearedEventType = "HoldCleared";

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
        (OrderStatusCatalog.ProductionCompletePendingApproval, OrderStatusCatalog.InProduction),
        (OrderStatusCatalog.ProductionComplete, OrderStatusCatalog.OutboundLogisticsPlanned),
        (OrderStatusCatalog.ProductionComplete, OrderStatusCatalog.DispatchedOrPickupReleased),
        (OrderStatusCatalog.OutboundLogisticsPlanned, OrderStatusCatalog.DispatchedOrPickupReleased),
        (OrderStatusCatalog.DispatchedOrPickupReleased, OrderStatusCatalog.InvoiceReady),
        (OrderStatusCatalog.InvoiceReady, OrderStatusCatalog.Invoiced),
        // Rework guardrail default from spec.
        (OrderStatusCatalog.InvoiceReady, OrderStatusCatalog.InProduction),
        (OrderStatusCatalog.InvoiceReady, OrderStatusCatalog.ProductionCompletePendingApproval),
    };

    private static readonly HashSet<string> AllowedNotificationStatuses = new(StringComparer.Ordinal)
    {
        "Notified",
        "DeferredNotification",
        "InternalOnly",
    };

    private sealed record LifecycleProposal(string ProposedLifecycleStatus, string RuleApplied);
    private readonly IRolePermissionService _rolePermissionService = rolePermissionService ?? new RolePermissionService();

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

        var isRegisteredStatusReason = await db.StatusReasonCodes
            .AsNoTracking()
            .AnyAsync(
                row => row.OverlayType == holdOverlay &&
                       row.CodeName == reasonCode,
                cancellationToken);
        if (!isRegisteredStatusReason)
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                $"ReasonCode '{reasonCode}' is not configured for overlay '{holdOverlay}'.");
        }
        _rolePermissionService.EnsureApplyHoldAllowed(actingRole, holdOverlay);

        var lifecycleStatus = string.IsNullOrWhiteSpace(order.OrderLifecycleStatus)
            ? OrderStatusCatalog.MapLegacyToLifecycle(order.OrderStatus, order.OrderOrigin, order.ValidatedUtc)
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

        var nowUtc = DateTime.UtcNow;
        order.HoldOverlay = holdOverlay;
        order.StatusReasonCode = reasonCode;
        order.StatusNote = note;
        order.StatusOwnerRole = actingRole;
        order.StatusUpdatedUtc = nowUtc;
        if (string.Equals(holdOverlay, OrderStatusCatalog.Cancelled, StringComparison.Ordinal))
        {
            order.HasOpenRework = false;
            order.ReworkBlockingInvoice = false;
            order.ReworkState = "Cancelled";
            order.ReworkDisposition = "Cancelled";
            order.ReworkLastUpdatedByEmpNo = appliedByEmpNo;
            order.ReworkClosedUtc = nowUtc;
        }

        AppendLifecycleEvent(
            order,
            HoldAppliedEventType,
            holdOverlay: holdOverlay,
            reasonCode: reasonCode,
            statusOwnerRole: actingRole,
            actorEmpNo: appliedByEmpNo,
            occurredUtc: nowUtc);

        await db.SaveChangesAsync(cancellationToken);
        var detail = await orderQueryService.GetOrderDetailAsync(orderId, cancellationToken);
        return detail ?? throw new InvalidOperationException("Failed to load order detail after hold apply.");
    }

    public async Task<OrderDraftDetailDto> ClearHoldAsync(
        int orderId,
        ClearHoldDto dto,
        CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        }

        if (string.IsNullOrWhiteSpace(order.HoldOverlay))
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "No active hold overlay exists.");
        }

        var actingRole = TrimToNull(dto.ActingRole);
        var clearedByEmpNo = TrimToNull(dto.ClearedByEmpNo);
        var note = TrimToNull(dto.Note);
        if (actingRole is null || clearedByEmpNo is null)
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "ActingRole and ClearedByEmpNo are required.");
        }
        _rolePermissionService.EnsureClearHoldAllowed(actingRole, order.HoldOverlay, order.StatusOwnerRole);

        var requiredRole = await orderPolicyService.GetDecisionValueAsync(
            OrderPolicyKeys.HoldReleaseAuthorityRole,
            order.SiteId,
            order.CustomerId,
            "Supervisor",
            cancellationToken);
        if (!string.Equals(actingRole, requiredRole, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(actingRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(actingRole, "PlantManager", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(
                StatusCodes.Status403Forbidden,
                $"Role '{actingRole}' is not authorized to clear hold. Required: {requiredRole}, Admin, or PlantManager.");
        }

        if (string.Equals(order.HoldOverlay, OrderStatusCatalog.OnHoldCustomer, StringComparison.Ordinal) &&
            (!order.CustomerReadyRetryUtc.HasValue || !order.CustomerReadyLastContactUtc.HasValue))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "OnHoldCustomer can only be cleared after customer readiness confirmation fields are recorded.");
        }

        var nowUtc = DateTime.UtcNow;
        var clearedOverlay = order.HoldOverlay;
        order.HoldOverlay = null;
        order.StatusReasonCode = "HoldCleared";
        order.StatusNote = note;
        order.StatusOwnerRole = actingRole;
        order.StatusUpdatedUtc = nowUtc;

        AppendLifecycleEvent(
            order,
            HoldClearedEventType,
            holdOverlay: clearedOverlay,
            reasonCode: "HoldCleared",
            statusOwnerRole: actingRole,
            actorEmpNo: clearedByEmpNo,
            occurredUtc: nowUtc);

        await db.SaveChangesAsync(cancellationToken);
        var detail = await orderQueryService.GetOrderDetailAsync(orderId, cancellationToken);
        return detail ?? throw new InvalidOperationException("Failed to load order detail after hold clear.");
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
            .Include(o => o.SalesOrderDetails)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        }

        var lifecycleStatus = string.IsNullOrWhiteSpace(order.OrderLifecycleStatus)
            ? OrderStatusCatalog.MapLegacyToLifecycle(order.OrderStatus, order.OrderOrigin, order.ValidatedUtc)
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
                order.InvoiceSubmissionChannel = existingSuccessfulAttempt.InvoiceSubmissionChannel ?? "PowerAutomateHttp";
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
        foreach (var line in order.SalesOrderDetails)
        {
            var effectiveQuantityShipped = line.QuantityAsShipped ?? line.QuantityAsReceived ?? 0m;
            line.Extension = (line.UnitPrice ?? 0m) * effectiveQuantityShipped;
        }

        order.InvoiceReviewCompletedUtc = now;
        order.InvoiceReviewCompletedByEmpNo = TrimToNull(dto.ReviewCompletedByEmpNo) ?? TrimToNull(dto.SubmittedByEmpNo);
        order.InvoiceSubmissionRequestedUtc = now;
        order.InvoiceSubmissionRequestedByEmpNo = TrimToNull(dto.SubmittedByEmpNo);
        order.InvoiceSubmissionChannel = "PowerAutomateHttp";
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

    public async Task<OrderDraftDetailDto> UpsertPromiseCommitmentAsync(
        int orderId,
        UpsertPromiseCommitmentDto dto,
        CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        }

        var actingRole = TrimToNull(dto.ActingRole);
        var changedBy = TrimToNull(dto.ChangedByEmpNo);
        var reasonCode = TrimToNull(dto.PromiseChangeReasonCode);
        var reasonNote = TrimToNull(dto.PromiseChangeReasonNote);
        var notificationStatus = TrimToNull(dto.CustomerNotificationStatus);
        var notificationChannel = TrimToNull(dto.CustomerNotificationChannel);
        var notificationBy = TrimToNull(dto.CustomerNotificationByEmpNo) ?? changedBy;
        var notificationUtc = dto.CustomerNotificationUtc ?? DateTime.UtcNow;

        if (actingRole is null || changedBy is null)
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                "ActingRole and ChangedByEmpNo are required.");
        }

        ValidatePromiseActingRole(actingRole);
        if (dto.RequestedDateUtc.HasValue)
        {
            order.RequestedDateUtc = dto.RequestedDateUtc.Value;
        }

        var now = DateTime.UtcNow;
        var isFirstCommit = !order.CurrentCommittedDateUtc.HasValue;
        var oldCommitted = order.CurrentCommittedDateUtc;

        if (isFirstCommit)
        {
            order.PromisedDateUtc = dto.NewCommittedDateUtc;
            order.CurrentCommittedDateUtc = dto.NewCommittedDateUtc;
            order.PromiseRevisionCount = 0;
            order.PromiseDateLastChangedUtc = now;
            order.PromiseDateLastChangedByEmpNo = changedBy;
            order.PromiseMissReasonCode = null;

            db.OrderPromiseChangeEvents.Add(new OrderPromiseChangeEvent
            {
                OrderId = order.Id,
                EventType = "PromiseDateCommitted",
                OldCommittedDateUtc = null,
                NewCommittedDateUtc = dto.NewCommittedDateUtc,
                PromiseChangeReasonCode = reasonCode,
                PromiseChangeReasonNote = reasonNote,
                ChangedByEmpNo = changedBy,
                OccurredUtc = now,
            });
        }
        else
        {
            var oldCommittedUtc = oldCommitted ?? dto.NewCommittedDateUtc;
            if (string.IsNullOrWhiteSpace(reasonCode))
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    "PromiseChangeReasonCode is required after first commitment.");
            }

            ValidateReasonCodePolicy(reasonCode!, actingRole, notificationStatus);
            if (dto.NewCommittedDateUtc > oldCommittedUtc && string.IsNullOrWhiteSpace(notificationStatus))
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    "CustomerNotificationStatus is required when commitment date is moved later.");
            }

            if (!string.IsNullOrWhiteSpace(notificationStatus))
            {
                ValidateNotificationStatus(notificationStatus!);
            }

            order.CurrentCommittedDateUtc = dto.NewCommittedDateUtc;
            order.PromiseRevisionCount = (order.PromiseRevisionCount ?? 0) + 1;
            order.PromiseDateLastChangedUtc = now;
            order.PromiseDateLastChangedByEmpNo = changedBy;
            order.PromiseMissReasonCode = null;

            db.OrderPromiseChangeEvents.Add(new OrderPromiseChangeEvent
            {
                OrderId = order.Id,
                EventType = "PromiseDateRevised",
                OldCommittedDateUtc = oldCommitted,
                NewCommittedDateUtc = dto.NewCommittedDateUtc,
                PromiseChangeReasonCode = reasonCode,
                PromiseChangeReasonNote = reasonNote,
                ChangedByEmpNo = changedBy,
                OccurredUtc = now,
                CustomerNotificationStatus = notificationStatus,
                CustomerNotificationChannel = notificationChannel,
                CustomerNotificationUtc = notificationStatus is null ? null : notificationUtc,
                CustomerNotificationByEmpNo = notificationStatus is null ? null : notificationBy,
            });
        }

        if (!string.IsNullOrWhiteSpace(notificationStatus))
        {
            db.OrderPromiseChangeEvents.Add(new OrderPromiseChangeEvent
            {
                OrderId = order.Id,
                EventType = "CustomerCommitmentNotificationRecorded",
                OldCommittedDateUtc = oldCommitted,
                NewCommittedDateUtc = order.CurrentCommittedDateUtc,
                PromiseChangeReasonCode = reasonCode,
                PromiseChangeReasonNote = reasonNote,
                ChangedByEmpNo = changedBy,
                OccurredUtc = now,
                CustomerNotificationStatus = notificationStatus,
                CustomerNotificationChannel = notificationChannel,
                CustomerNotificationUtc = notificationUtc,
                CustomerNotificationByEmpNo = notificationBy,
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        return await orderQueryService.GetOrderDetailAsync(orderId, cancellationToken)
               ?? throw new InvalidOperationException("Failed to load order detail after promise update.");
    }

    public async Task<OrderDraftDetailDto> ClassifyPromiseMissAsync(
        int orderId,
        ClassifyPromiseMissDto dto,
        CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        }

        var missReason = TrimToNull(dto.MissReasonCode);
        var actingRole = TrimToNull(dto.ActingRole);
        var changedBy = TrimToNull(dto.ChangedByEmpNo);
        var note = TrimToNull(dto.Note);
        var notificationStatus = TrimToNull(dto.CustomerNotificationStatus);
        var notificationChannel = TrimToNull(dto.CustomerNotificationChannel);
        var notificationBy = TrimToNull(dto.CustomerNotificationByEmpNo) ?? changedBy;
        var notificationUtc = dto.CustomerNotificationUtc ?? DateTime.UtcNow;
        if (missReason is null || actingRole is null || changedBy is null)
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                "MissReasonCode, ActingRole, and ChangedByEmpNo are required.");
        }

        order.PromiseMissReasonCode = missReason;
        var now = DateTime.UtcNow;
        db.OrderPromiseChangeEvents.Add(new OrderPromiseChangeEvent
        {
            OrderId = order.Id,
            EventType = "PromiseMissClassified",
            OldCommittedDateUtc = order.CurrentCommittedDateUtc,
            NewCommittedDateUtc = order.CurrentCommittedDateUtc,
            PromiseChangeReasonCode = missReason,
            PromiseChangeReasonNote = note,
            ChangedByEmpNo = changedBy,
            OccurredUtc = now,
            MissReasonCode = missReason,
            CustomerNotificationStatus = notificationStatus,
            CustomerNotificationChannel = notificationChannel,
            CustomerNotificationUtc = notificationStatus is null ? null : notificationUtc,
            CustomerNotificationByEmpNo = notificationStatus is null ? null : notificationBy,
        });

        if (!string.IsNullOrWhiteSpace(notificationStatus))
        {
            ValidateNotificationStatus(notificationStatus!);
            db.OrderPromiseChangeEvents.Add(new OrderPromiseChangeEvent
            {
                OrderId = order.Id,
                EventType = "CustomerCommitmentNotificationRecorded",
                OldCommittedDateUtc = order.CurrentCommittedDateUtc,
                NewCommittedDateUtc = order.CurrentCommittedDateUtc,
                PromiseChangeReasonCode = missReason,
                PromiseChangeReasonNote = note,
                ChangedByEmpNo = changedBy,
                OccurredUtc = now,
                CustomerNotificationStatus = notificationStatus,
                CustomerNotificationChannel = notificationChannel,
                CustomerNotificationUtc = notificationUtc,
                CustomerNotificationByEmpNo = notificationBy,
                MissReasonCode = missReason,
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        return await orderQueryService.GetOrderDetailAsync(orderId, cancellationToken)
               ?? throw new InvalidOperationException("Failed to load order detail after miss classification.");
    }

    public async Task<OrderDraftDetailDto> RecordPromiseNotificationAsync(
        int orderId,
        RecordPromiseNotificationDto dto,
        CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        }

        var reasonCode = TrimToNull(dto.PromiseChangeReasonCode);
        var actingRole = TrimToNull(dto.ActingRole);
        var changedBy = TrimToNull(dto.ChangedByEmpNo);
        var status = TrimToNull(dto.CustomerNotificationStatus);
        var channel = TrimToNull(dto.CustomerNotificationChannel);
        var note = TrimToNull(dto.Note);
        var notificationBy = TrimToNull(dto.CustomerNotificationByEmpNo) ?? changedBy;
        if (reasonCode is null || actingRole is null || changedBy is null || status is null)
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                "PromiseChangeReasonCode, ActingRole, ChangedByEmpNo, and CustomerNotificationStatus are required.");
        }

        ValidateReasonCodePolicy(reasonCode, actingRole, status);
        ValidateNotificationStatus(status);
        db.OrderPromiseChangeEvents.Add(new OrderPromiseChangeEvent
        {
            OrderId = order.Id,
            EventType = "CustomerCommitmentNotificationRecorded",
            OldCommittedDateUtc = order.CurrentCommittedDateUtc,
            NewCommittedDateUtc = order.CurrentCommittedDateUtc,
            PromiseChangeReasonCode = reasonCode,
            PromiseChangeReasonNote = note,
            ChangedByEmpNo = changedBy,
            OccurredUtc = DateTime.UtcNow,
            CustomerNotificationStatus = status,
            CustomerNotificationChannel = channel,
            CustomerNotificationUtc = dto.CustomerNotificationUtc ?? DateTime.UtcNow,
            CustomerNotificationByEmpNo = notificationBy,
            MissReasonCode = order.PromiseMissReasonCode,
        });

        await db.SaveChangesAsync(cancellationToken);
        return await orderQueryService.GetOrderDetailAsync(orderId, cancellationToken)
               ?? throw new InvalidOperationException("Failed to load order detail after notification event.");
    }

    public async Task<List<OrderPromiseChangeEventDto>> GetPromiseHistoryAsync(
        int orderId,
        CancellationToken cancellationToken = default)
    {
        var orderExists = await db.SalesOrders.AnyAsync(o => o.Id == orderId, cancellationToken);
        if (!orderExists)
        {
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        }

        return await db.OrderPromiseChangeEvents
            .AsNoTracking()
            .Where(e => e.OrderId == orderId)
            .OrderByDescending(e => e.OccurredUtc)
            .ThenByDescending(e => e.Id)
            .Select(e => new OrderPromiseChangeEventDto(
                e.Id,
                e.OrderId,
                e.EventType,
                e.OldCommittedDateUtc,
                e.NewCommittedDateUtc,
                e.PromiseChangeReasonCode,
                e.PromiseChangeReasonNote,
                e.ChangedByEmpNo,
                e.OccurredUtc,
                e.CustomerNotificationStatus,
                e.CustomerNotificationChannel,
                e.CustomerNotificationUtc,
                e.CustomerNotificationByEmpNo,
                e.MissReasonCode))
            .ToListAsync(cancellationToken);
    }

    public async Task<OrderLifecycleMigrationResultDto> BackfillLifecycleStatusesAsync(
        bool dryRun = false,
        string? migratedBy = null,
        string? migrationBatchId = null,
        int batchSize = 500,
        CancellationToken cancellationToken = default)
    {
        var effectiveBatchSize = Math.Clamp(batchSize, 50, 5000);
        var normalizedBatchId = string.IsNullOrWhiteSpace(migrationBatchId)
            ? Guid.NewGuid().ToString("N")
            : migrationBatchId.Trim();
        var normalizedMigratedBy = TrimToNull(migratedBy) ?? "system";
        var dryRunActor = dryRun ? $"{normalizedMigratedBy}:dry-run" : normalizedMigratedBy;

        var totalOrdersScanned = 0;
        var ordersAlreadyInitialized = 0;
        var candidateOrders = 0;
        var proposedChanges = 0;
        var auditRecordsWritten = 0;
        var sampleDeltas = new List<OrderLifecycleMigrationDeltaDto>();
        var nowUtc = DateTime.UtcNow;
        var lastOrderId = 0;

        while (true)
        {
            var batchQuery = db.SalesOrders
                .Where(o => o.Id > lastOrderId)
                .OrderBy(o => o.Id)
                .Take(effectiveBatchSize);

            var batch = dryRun
                ? await batchQuery.AsNoTracking().ToListAsync(cancellationToken)
                : await batchQuery.AsTracking().ToListAsync(cancellationToken);
            if (batch.Count == 0)
            {
                break;
            }

            lastOrderId = batch[^1].Id;
            totalOrdersScanned += batch.Count;
            ordersAlreadyInitialized += batch.Count(o => !string.IsNullOrWhiteSpace(o.OrderLifecycleStatus));
            candidateOrders += batch.Count;

            var orderIds = batch.Select(o => o.Id).ToList();
            var routeAggregates = await db.OrderLineRouteInstances
                .AsNoTracking()
                .Where(r => orderIds.Contains(r.SalesOrderId))
                .GroupBy(r => r.SalesOrderId)
                .Select(g => new
                {
                    OrderId = g.Key,
                    HasRoutes = g.Any(),
                    AllRoutesComplete = g.All(r => r.State == "Completed"),
                    AllRequiredApprovalsComplete = g.All(r => !r.SupervisorApprovalRequired || r.SupervisorApprovedUtc.HasValue),
                })
                .ToDictionaryAsync(row => row.OrderId, cancellationToken);

            var startedRouteOrderIds = await db.OrderLineRouteStepInstances
                .AsNoTracking()
                .Where(step => orderIds.Contains(step.OrderLineRouteInstance.SalesOrderId) &&
                               (step.ScanInUtc.HasValue ||
                                step.ScanOutUtc.HasValue ||
                                step.CompletedUtc.HasValue ||
                                step.State == "InProgress" ||
                                step.State == "Completed"))
                .Select(step => step.OrderLineRouteInstance.SalesOrderId)
                .Distinct()
                .ToListAsync(cancellationToken);
            var startedRouteOrderSet = startedRouteOrderIds.ToHashSet();

            var requiredLineOrderIds = await db.SalesOrderDetails
                .AsNoTracking()
                .Where(d => orderIds.Contains(d.SalesOrderId) && d.QuantityAsOrdered > 0)
                .Select(d => d.SalesOrderId)
                .Distinct()
                .ToListAsync(cancellationToken);
            var requiredLineOrderSet = requiredLineOrderIds.ToHashSet();

            var unreconciledOrderIds = await db.SalesOrderDetails
                .AsNoTracking()
                .Where(d => orderIds.Contains(d.SalesOrderId) &&
                            d.QuantityAsOrdered > 0 &&
                            (d.QuantityAsReceived ?? 0m) <= 0m)
                .Select(d => d.SalesOrderId)
                .Distinct()
                .ToListAsync(cancellationToken);
            var unreconciledOrderSet = unreconciledOrderIds.ToHashSet();

            var migrationAudits = new List<OrderLifecycleMigrationAudit>();
            foreach (var order in batch)
            {
                var hasRoutes = routeAggregates.TryGetValue(order.Id, out var routeAgg) && routeAgg.HasRoutes;
                var allRoutesComplete = routeAgg?.AllRoutesComplete ?? false;
                var approvalsComplete = routeAgg?.AllRequiredApprovalsComplete ?? false;
                var hasProductionStartedEvidence = startedRouteOrderSet.Contains(order.Id);
                var hasReconciliationCompleteEvidence =
                    requiredLineOrderSet.Contains(order.Id) &&
                    !unreconciledOrderSet.Contains(order.Id);
                var proposal = BuildLifecycleProposal(
                    order,
                    hasRoutes,
                    allRoutesComplete,
                    approvalsComplete,
                    hasProductionStartedEvidence,
                    hasReconciliationCompleteEvidence);

                var currentLifecycle = TrimToNull(order.OrderLifecycleStatus);
                if (string.Equals(currentLifecycle, proposal.ProposedLifecycleStatus, StringComparison.Ordinal))
                {
                    continue;
                }

                proposedChanges += 1;
                if (sampleDeltas.Count < 25)
                {
                    sampleDeltas.Add(new OrderLifecycleMigrationDeltaDto(
                        order.Id,
                        order.OrderStatus,
                        currentLifecycle,
                        proposal.ProposedLifecycleStatus,
                        proposal.RuleApplied));
                }

                migrationAudits.Add(new OrderLifecycleMigrationAudit
                {
                    MigrationBatchId = normalizedBatchId,
                    OrderId = order.Id,
                    LegacyStatus = order.OrderStatus,
                    PreviousLifecycleStatus = currentLifecycle,
                    ProposedLifecycleStatus = proposal.ProposedLifecycleStatus,
                    RuleApplied = proposal.RuleApplied,
                    DryRun = dryRun,
                    WasUpdated = !dryRun,
                    MigratedBy = dryRunActor,
                    ComputedUtc = nowUtc,
                    AppliedUtc = dryRun ? null : nowUtc,
                });

                if (!dryRun)
                {
                    order.OrderLifecycleStatus = proposal.ProposedLifecycleStatus;
                    order.StatusUpdatedUtc ??= nowUtc;
                }
            }

            if (!dryRun && migrationAudits.Count > 0)
            {
                db.OrderLifecycleMigrationAudits.AddRange(migrationAudits);
                auditRecordsWritten += migrationAudits.Count;
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        return new OrderLifecycleMigrationResultDto(
            totalOrdersScanned,
            ordersAlreadyInitialized,
            proposedChanges,
            dryRun,
            normalizedBatchId,
            candidateOrders,
            auditRecordsWritten,
            sampleDeltas);
    }

    private static LifecycleProposal BuildLifecycleProposal(
        SalesOrder order,
        bool hasRoutes,
        bool allRoutesComplete,
        bool allRequiredApprovalsComplete,
        bool hasProductionStartedEvidence,
        bool hasReconciliationCompleteEvidence)
    {
        var defaultStatus = OrderStatusCatalog.MapLegacyToLifecycle(order.OrderStatus, order.OrderOrigin, order.ValidatedUtc);
        var defaultRule = $"LegacyMap:{order.OrderStatus}";
        var hasBlockingHold = !string.IsNullOrWhiteSpace(order.HoldOverlay) &&
                              !string.Equals(order.HoldOverlay, OrderStatusCatalog.Cancelled, StringComparison.Ordinal);
        var hasDispatchOrReleaseEvidence = order.DispatchDate.HasValue ||
                                           string.Equals(order.OrderStatus, OrderStatusCatalog.ReadyToInvoice, StringComparison.Ordinal) ||
                                           string.Equals(order.OrderStatus, "Invoiced", StringComparison.OrdinalIgnoreCase) ||
                                           string.Equals(order.OrderStatus, "Complete", StringComparison.OrdinalIgnoreCase);
        var hasOutboundPlanEvidence = !string.IsNullOrWhiteSpace(order.Carrier) ||
                                      order.ReadyToShipDate.HasValue;
        var hasProductionCompleteEvidence = (hasRoutes && allRoutesComplete && allRequiredApprovalsComplete) ||
                                            order.ReadyToShipDate.HasValue;
        var hasReceiveEvidence = order.ReceivedDate.HasValue ||
                                 string.Equals(order.OrderStatus, OrderStatusCatalog.Received, StringComparison.Ordinal) ||
                                 hasReconciliationCompleteEvidence;
        var hasInboundTransitEvidence = order.PickupScheduledDate.HasValue ||
                                        string.Equals(order.OrderStatus, OrderStatusCatalog.PickupScheduled, StringComparison.Ordinal);
        var hasInboundPlanningEvidence = order.PickupDate.HasValue ||
                                         string.Equals(order.OrderStatus, OrderStatusCatalog.ReadyForPickup, StringComparison.Ordinal) ||
                                         hasInboundTransitEvidence;
        var invoiceStagingSucceeded =
            string.Equals(order.InvoiceStagingResult, "Success", StringComparison.OrdinalIgnoreCase) ||
            !string.IsNullOrWhiteSpace(order.ErpInvoiceReference) ||
            string.Equals(order.OrderStatus, "Invoiced", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(order.OrderStatus, "Complete", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(order.OrderStatus, "Closed", StringComparison.OrdinalIgnoreCase);

        if (invoiceStagingSucceeded)
            return new LifecycleProposal(OrderStatusCatalog.Invoiced, "Rule1:InvoiceStagingSucceeded");
        if (hasDispatchOrReleaseEvidence && !hasBlockingHold)
            return new LifecycleProposal(OrderStatusCatalog.InvoiceReady, "Rule2:DispatchOrReleaseNoBlockingHold");
        if (hasDispatchOrReleaseEvidence)
            return new LifecycleProposal(OrderStatusCatalog.DispatchedOrPickupReleased, "Rule3:DispatchOrReleaseEvent");
        if (hasOutboundPlanEvidence)
            return new LifecycleProposal(OrderStatusCatalog.OutboundLogisticsPlanned, "Rule4:OutboundPlanEvidence");
        if (hasProductionCompleteEvidence)
            return new LifecycleProposal(OrderStatusCatalog.ProductionComplete, "Rule5:ProductionCompleteEvidence");
        if (hasProductionStartedEvidence)
            return new LifecycleProposal(OrderStatusCatalog.InProduction, "Rule6:ProductionStartedEvidence");
        if (hasReconciliationCompleteEvidence)
            return new LifecycleProposal(OrderStatusCatalog.ReadyForProduction, "Rule7:ReconciliationComplete");
        if (hasReceiveEvidence)
            return new LifecycleProposal(OrderStatusCatalog.ReceivedPendingReconciliation, "Rule8:ReceiveEventExists");
        if (hasInboundTransitEvidence)
            return new LifecycleProposal(OrderStatusCatalog.InboundInTransit, "Rule9:InboundTransitEventExists");
        if (hasInboundPlanningEvidence)
            return new LifecycleProposal(OrderStatusCatalog.InboundLogisticsPlanned, "Rule10:InboundPlanningExists");
        if (string.Equals(order.OrderOrigin, "SalesMobile", StringComparison.OrdinalIgnoreCase) && !order.ValidatedUtc.HasValue)
            return new LifecycleProposal(OrderStatusCatalog.PendingOrderEntryValidation, "Rule11:SalesMobileNotValidated");

        return new LifecycleProposal(defaultStatus, defaultRule);
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
            ? OrderStatusCatalog.MapLegacyToLifecycle(order.OrderStatus, order.OrderOrigin, order.ValidatedUtc)
            : order.OrderLifecycleStatus!;
        var targetStatus = OrderStatusCatalog.IsLifecycleStatus(requestedTargetStatus)
            ? requestedTargetStatus
            : OrderStatusCatalog.MapLegacyToLifecycle(requestedTargetStatus);
        var normalizedRole = TrimToNull(actingRole);
        var normalizedReasonCode = TrimToNull(reasonCode);
        var normalizedNote = TrimToNull(note);
        var normalizedActingEmpNo = TrimToNull(actingEmpNo);
        var effectiveRole = normalizedRole ?? ResolveStatusOwnerRole(targetStatus, null);

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
        var isBackward = targetIdx < currentIdx;
        if ((isDirectImmediateDropoffReceive || isBackward) &&
            (string.IsNullOrWhiteSpace(normalizedReasonCode) || string.IsNullOrWhiteSpace(normalizedNote)))
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                "Manual/emergency transitions require reason code and status note.");
        }
        _rolePermissionService.EnsureStatusTransitionAllowed(
            effectiveRole,
            currentStatus,
            targetStatus,
            isManualOrEmergency: isBackward);
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
        if (requiresCommitment && (!order.PromisedDateUtc.HasValue || !order.CurrentCommittedDateUtc.HasValue))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "PromisedDateUtc and CurrentCommittedDateUtc must be set before outbound release planning.");
        }

        if (string.Equals(currentStatus, OrderStatusCatalog.DispatchedOrPickupReleased, StringComparison.Ordinal) &&
            string.Equals(targetStatus, OrderStatusCatalog.InvoiceReady, StringComparison.Ordinal))
        {
            if (order.CurrentCommittedDateUtc.HasValue &&
                order.CurrentCommittedDateUtc.Value < DateTime.UtcNow &&
                string.IsNullOrWhiteSpace(order.PromiseMissReasonCode))
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "Promise miss classification is required before transitioning to InvoiceReady.");
            }

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
            var hasSuccessfulStagingHandoff =
                string.Equals(order.InvoiceStagingResult, "PendingAck", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(order.InvoiceStagingResult, "Success", StringComparison.OrdinalIgnoreCase);
            if (!order.InvoiceReviewCompletedUtc.HasValue ||
                !attachmentStepCompleted ||
                string.IsNullOrWhiteSpace(order.InvoiceSubmissionCorrelationId) ||
                !hasSuccessfulStagingHandoff)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "InvoiceReady -> Invoiced requires review completion, attachment step completion, successful ERP staging handoff, and ERP correlation id.");
            }
        }

        var nowUtc = DateTime.UtcNow;
        order.OrderLifecycleStatus = targetStatus;
        order.OrderStatus = OrderStatusCatalog.MapLifecycleToLegacy(targetStatus);
        order.StatusUpdatedUtc = nowUtc;
        order.StatusOwnerRole = ResolveStatusOwnerRole(targetStatus, normalizedRole);
        if (normalizedReasonCode is not null)
        {
            order.StatusReasonCode = normalizedReasonCode;
        }

        if (normalizedNote is not null)
        {
            order.StatusNote = normalizedNote;
        }

        AppendLifecycleEvent(
            order,
            LifecycleStatusChangedEventType,
            fromLifecycleStatus: currentStatus,
            toLifecycleStatus: targetStatus,
            reasonCode: normalizedReasonCode,
            statusOwnerRole: order.StatusOwnerRole,
            actorEmpNo: normalizedActingEmpNo,
            occurredUtc: nowUtc);

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

    private void AppendLifecycleEvent(
        SalesOrder order,
        string eventType,
        string? fromLifecycleStatus = null,
        string? toLifecycleStatus = null,
        string? holdOverlay = null,
        string? reasonCode = null,
        string? statusOwnerRole = null,
        string? actorEmpNo = null,
        DateTime? occurredUtc = null)
    {
        db.OrderLifecycleEvents.Add(new OrderLifecycleEvent
        {
            OrderId = order.Id,
            EventType = eventType,
            FromLifecycleStatus = fromLifecycleStatus,
            ToLifecycleStatus = toLifecycleStatus,
            HoldOverlay = holdOverlay,
            ReasonCode = reasonCode,
            StatusOwnerRole = statusOwnerRole,
            ActorEmpNo = actorEmpNo,
            OccurredUtc = occurredUtc ?? DateTime.UtcNow,
        });
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

    private static void ValidatePromiseActingRole(string actingRole)
    {
        var allowed = string.Equals(actingRole, "Office", StringComparison.OrdinalIgnoreCase) ||
                      string.Equals(actingRole, "Supervisor", StringComparison.OrdinalIgnoreCase) ||
                      string.Equals(actingRole, "PlantManager", StringComparison.OrdinalIgnoreCase) ||
                      string.Equals(actingRole, "Admin", StringComparison.OrdinalIgnoreCase);
        if (!allowed)
        {
            throw new ServiceException(
                StatusCodes.Status403Forbidden,
                "Role is not authorized to commit or revise customer promise dates.");
        }
    }

    private void ValidateReasonCodePolicy(string reasonCode, string actingRole, string? notificationStatus)
    {
        var reason = db.PromiseReasonPolicies
            .AsNoTracking()
            .FirstOrDefault(policy => policy.IsActive && policy.ReasonCode == reasonCode);
        if (reason is null)
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                $"Promise reason code '{reasonCode}' is not active.");
        }

        if (!string.Equals(reason.OwnerRole, actingRole, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(actingRole, "Supervisor", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(actingRole, "PlantManager", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(actingRole, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(
                StatusCodes.Status403Forbidden,
                $"Role '{actingRole}' is not authorized for promise reason '{reasonCode}'.");
        }

        if (!string.IsNullOrWhiteSpace(notificationStatus))
        {
            var allowedPolicies = ParseCsv(reason.AllowedNotificationPolicies ?? string.Empty);
            if (allowedPolicies.Count > 0 && !allowedPolicies.Contains(notificationStatus))
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    $"Notification status '{notificationStatus}' is not allowed for reason '{reasonCode}'.");
            }
        }
    }

    private static void ValidateNotificationStatus(string status)
    {
        if (!AllowedNotificationStatuses.Contains(status))
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                $"Invalid CustomerNotificationStatus '{status}'.");
        }
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

