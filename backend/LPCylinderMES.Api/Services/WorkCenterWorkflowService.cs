using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class WorkCenterWorkflowService(
    LpcAppsDbContext db,
    IOrderPolicyService orderPolicyService,
    IOrderWorkflowService? orderWorkflowService = null,
    IAttachmentStorage? attachmentStorage = null,
    IRolePermissionService? rolePermissionService = null) : IWorkCenterWorkflowService
{
    private static readonly Dictionary<string, string[]> ReworkStateTransitions = new(StringComparer.Ordinal)
    {
        ["Requested"] = ["Approved", "Cancelled", "Scrapped"],
        ["Approved"] = ["InProgress", "Cancelled", "Scrapped"],
        ["InProgress"] = ["VerificationPending", "Cancelled", "Scrapped"],
        ["VerificationPending"] = ["Closed", "Cancelled", "Scrapped"],
        ["Closed"] = [],
        ["Cancelled"] = [],
        ["Scrapped"] = [],
    };
    private readonly IOrderWorkflowService? _orderWorkflowService = orderWorkflowService;
    private readonly IAttachmentStorage? _attachmentStorage = attachmentStorage;
    private readonly IRolePermissionService _rolePermissionService = rolePermissionService ?? new RolePermissionService();
    private readonly StepCompletionValidationService _stepCompletionValidationService = new(db, rolePermissionService ?? new RolePermissionService());

    public async Task<OrderRouteExecutionDto> ScanInAsync(int orderId, int lineId, long stepId, OperatorScanInDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureWorkCenterOperationAllowed(dto.ActingRole!, "scan in work-center step");
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        EnsureOperatorAtRequiredWorkCenter(step, dto.WorkCenterId);
        await EnsurePreviousStepsCompletedAsync(step, cancellationToken);

        if (!string.Equals(step.State, "Pending", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(step.State, "Blocked", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(StatusCodes.Status409Conflict, $"Step cannot be started from state '{step.State}'.");
        }

        step.State = "InProgress";
        step.ScanInUtc = DateTime.UtcNow;
        step.StartedByEmpNo = dto.EmpNo;
        step.BlockedReason = null;

        var order = step.OrderLineRouteInstance.SalesOrder;
        var shouldAdvanceProduction = string.Equals(order.OrderLifecycleStatus, OrderStatusCatalog.ReadyForProduction, StringComparison.Ordinal);

        await AddActivityAsync(step, dto.EmpNo, "ScanIn", dto.DeviceId, null, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        if (shouldAdvanceProduction && _orderWorkflowService is not null)
        {
            await _orderWorkflowService.AdvanceStatusAsync(
                order.Id,
                OrderStatusCatalog.InProduction,
                actingRole: "Production",
                reasonCode: "ProductionStarted",
                note: "Route step scan-in started production.",
                actingEmpNo: dto.EmpNo,
                cancellationToken: cancellationToken);
        }
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> ScanOutAsync(int orderId, int lineId, long stepId, OperatorScanOutDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureWorkCenterOperationAllowed(dto.ActingRole!, "scan out work-center step");
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        EnsureOperatorAtRequiredWorkCenter(step, dto.WorkCenterId);
        if (!string.Equals(step.State, "InProgress", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Only in-progress steps can be scanned out.");
        }

        var now = DateTime.UtcNow;
        step.ScanOutUtc = now;
        if (step.ScanInUtc.HasValue && now >= step.ScanInUtc.Value)
        {
            step.DurationMinutes = (decimal)(now - step.ScanInUtc.Value).TotalMinutes;
            if (!string.Equals(step.TimeCaptureMode, "Manual", StringComparison.OrdinalIgnoreCase))
            {
                step.TimeCaptureSource = "SystemScan";
            }
        }

        await AddActivityAsync(step, dto.EmpNo, "ScanOut", dto.DeviceId, null, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> AddUsageAsync(int orderId, int lineId, long stepId, StepMaterialUsageCreateDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureWorkCenterOperationAllowed(dto.ActingRole!, "record material usage");
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        db.StepMaterialUsages.Add(new StepMaterialUsage
        {
            OrderLineRouteStepInstanceId = step.Id,
            SalesOrderDetailId = lineId,
            PartItemId = dto.PartItemId,
            QuantityUsed = dto.QuantityUsed,
            Uom = dto.Uom,
            RecordedByEmpNo = dto.RecordedByEmpNo,
            RecordedUtc = DateTime.UtcNow,
        });

        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> AddScrapAsync(int orderId, int lineId, long stepId, StepScrapEntryCreateDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureWorkCenterOperationAllowed(dto.ActingRole!, "record scrap");
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        db.StepScrapEntries.Add(new StepScrapEntry
        {
            OrderLineRouteStepInstanceId = step.Id,
            SalesOrderDetailId = lineId,
            QuantityScrapped = dto.QuantityScrapped,
            ScrapReasonId = dto.ScrapReasonId,
            Notes = dto.Notes,
            RecordedByEmpNo = dto.RecordedByEmpNo,
            RecordedUtc = DateTime.UtcNow,
        });

        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> AddSerialAsync(int orderId, int lineId, long stepId, StepSerialCaptureCreateDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureWorkCenterOperationAllowed(dto.ActingRole!, "record serial capture");
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        db.StepSerialCaptures.Add(new StepSerialCapture
        {
            OrderLineRouteStepInstanceId = step.Id,
            SalesOrderDetailId = lineId,
            SerialNo = dto.SerialNo,
            Manufacturer = dto.Manufacturer,
            ManufactureDate = dto.ManufactureDate,
            TestDate = dto.TestDate,
            LidColorId = dto.LidColorId,
            LidSizeId = dto.LidSizeId,
            ConditionStatus = dto.ConditionStatus,
            ScrapReasonId = dto.ScrapReasonId,
            RecordedByEmpNo = dto.RecordedByEmpNo,
            RecordedUtc = DateTime.UtcNow,
        });

        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> AddChecklistAsync(int orderId, int lineId, long stepId, StepChecklistResultCreateDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureWorkCenterOperationAllowed(dto.ActingRole!, "record checklist");
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        db.StepChecklistResults.Add(new StepChecklistResult
        {
            OrderLineRouteStepInstanceId = step.Id,
            ChecklistTemplateItemId = dto.ChecklistTemplateItemId,
            ItemLabel = dto.ItemLabel,
            IsRequiredItem = dto.IsRequiredItem,
            ResultStatus = dto.ResultStatus,
            ResultNotes = dto.ResultNotes,
            CompletedByEmpNo = dto.CompletedByEmpNo,
            CompletedUtc = DateTime.UtcNow,
        });

        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> CorrectDurationAsync(int orderId, int lineId, long stepId, CorrectStepDurationDto dto, CancellationToken cancellationToken = default)
    {
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        var mode = (step.TimeCaptureMode ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(mode))
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Step time capture mode is not configured.");
        }

        if (string.IsNullOrWhiteSpace(dto.ActingRole) || string.IsNullOrWhiteSpace(dto.ActingEmpNo))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "ActingRole and ActingEmpNo are required.");
        }

        if (string.Equals(mode, "Automated", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Duration correction is not allowed for automated time capture.");
        }

        _rolePermissionService.EnsureDurationCorrectionAllowed(dto.ActingRole, mode);

        if (!dto.ManualDurationMinutes.HasValue || dto.ManualDurationMinutes.Value <= 0)
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "ManualDurationMinutes must be greater than zero.");
        }

        var reason = string.IsNullOrWhiteSpace(dto.ManualDurationReason)
            ? null
            : dto.ManualDurationReason.Trim();
        if (string.Equals(mode, "Hybrid", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(reason))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "ManualDurationReason is required for hybrid override.");
        }

        var oldDuration = step.DurationMinutes;
        var oldSource = step.TimeCaptureSource;
        step.ManualDurationMinutes = dto.ManualDurationMinutes.Value;
        step.ManualDurationReason = reason;
        step.DurationMinutes = dto.ManualDurationMinutes.Value;
        step.TimeCaptureSource = string.Equals(mode, "Manual", StringComparison.OrdinalIgnoreCase)
            ? "ManualEntry"
            : "ManualOverride";

        var notes = $"mode={mode};oldDuration={oldDuration?.ToString() ?? "null"};newDuration={step.DurationMinutes};oldSource={oldSource};newSource={step.TimeCaptureSource};reason={reason ?? string.Empty};note={dto.Notes ?? string.Empty}";
        await AddActivityAsync(step, dto.ActingEmpNo.Trim(), "DurationCorrected", dto.DeviceId, notes, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> CaptureTrailerAsync(int orderId, int lineId, long stepId, CaptureTrailerDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureWorkCenterOperationAllowed(dto.ActingRole!, "capture loading trailer");
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        if (string.IsNullOrWhiteSpace(dto.EmpNo))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "EmpNo is required.");
        }

        var trailerNo = dto.TrailerNo?.Trim();
        if (string.IsNullOrWhiteSpace(trailerNo))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "TrailerNo is required.");
        }

        var order = step.OrderLineRouteInstance.SalesOrder;
        order.TrailerNo = trailerNo;
        await AddActivityAsync(
            step,
            dto.EmpNo.Trim(),
            "CaptureTrailer",
            null,
            $"trailerNo={trailerNo};note={dto.Notes ?? string.Empty}",
            cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> VerifySerialLoadAsync(int orderId, int lineId, long stepId, VerifySerialLoadDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureWorkCenterOperationAllowed(dto.ActingRole!, "verify serial load");
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        if (!step.RequiresSerialLoadVerification)
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Serial load verification is not required for this step.");
        }

        if (string.IsNullOrWhiteSpace(dto.EmpNo))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "EmpNo is required.");
        }

        var expectedSerials = await db.SalesOrderDetailSns
            .Where(sn => sn.SalesOrderDetailId == lineId && !sn.Scrapped)
            .Select(sn => sn.SerialNumber)
            .ToListAsync(cancellationToken);
        var expectedSet = expectedSerials
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var providedSet = dto.VerifiedSerialNos
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (providedSet.Count == 0)
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "At least one verified serial number is required.");
        }
        if (expectedSet.Count > 0 && !expectedSet.SetEquals(providedSet))
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Verified loaded serials must match expected shipped serials.");
        }

        await AddActivityAsync(
            step,
            dto.EmpNo,
            "SerialLoadVerified",
            null,
            $"serials={string.Join(",", providedSet.OrderBy(s => s, StringComparer.OrdinalIgnoreCase))};note={dto.Notes}",
            cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> GeneratePackingSlipAsync(int orderId, int lineId, long stepId, GenerateStepDocumentDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureWorkCenterOperationAllowed(dto.ActingRole!, "generate packing slip");
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        var order = step.OrderLineRouteInstance.SalesOrder;
        if (string.IsNullOrWhiteSpace(dto.EmpNo))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "EmpNo is required.");
        }

        var documentNo = BuildDocumentNumber("PS", order.SalesOrderNo, order.PackingSlipNo, dto.Regenerate);
        var blobPath = await GenerateAndStoreDocumentAsync(
            order,
            lineId,
            dto.EmpNo,
            "PackingSlip",
            documentNo,
            dto.Notes,
            cancellationToken);
        order.PackingSlipNo = documentNo;
        order.PackingSlipGeneratedUtc = DateTime.UtcNow;
        order.PackingSlipDocumentUri = blobPath;
        await AddActivityAsync(step, dto.EmpNo, "GeneratePackingSlip", null, dto.Notes, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> GenerateBolAsync(int orderId, int lineId, long stepId, GenerateStepDocumentDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureWorkCenterOperationAllowed(dto.ActingRole!, "generate bill of lading");
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        var order = step.OrderLineRouteInstance.SalesOrder;
        if (string.IsNullOrWhiteSpace(dto.EmpNo))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "EmpNo is required.");
        }

        var documentNo = BuildDocumentNumber("BOL", order.SalesOrderNo, order.BolNo, dto.Regenerate);
        var blobPath = await GenerateAndStoreDocumentAsync(
            order,
            lineId,
            dto.EmpNo,
            "BillOfLading",
            documentNo,
            dto.Notes,
            cancellationToken);
        order.BolNo = documentNo;
        order.BolGeneratedUtc = DateTime.UtcNow;
        order.BolDocumentUri = blobPath;
        await AddActivityAsync(step, dto.EmpNo, "GenerateBol", null, dto.Notes, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> CompleteStepAsync(int orderId, int lineId, long stepId, CompleteWorkCenterStepDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureWorkCenterOperationAllowed(dto.ActingRole!, "complete work-center step");
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        await _stepCompletionValidationService.ValidateAsync(step, dto, cancellationToken);

        var isManualMode = string.Equals(step.TimeCaptureMode, "Manual", StringComparison.OrdinalIgnoreCase);
        var isManualPendingCompletion = isManualMode && string.Equals(step.State, "Pending", StringComparison.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(step.State) ||
            (!string.Equals(step.State, "InProgress", StringComparison.OrdinalIgnoreCase) && !isManualPendingCompletion))
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Step must be in progress before completion.");
        }

        if (isManualMode)
        {
            if (dto.ManualDurationMinutes.HasValue)
            {
                step.ManualDurationMinutes = dto.ManualDurationMinutes.Value;
            }

            if (!string.IsNullOrWhiteSpace(dto.ManualDurationReason))
            {
                step.ManualDurationReason = dto.ManualDurationReason.Trim();
            }

            var effectiveDuration = step.ManualDurationMinutes ?? step.DurationMinutes;
            if (effectiveDuration.HasValue)
            {
                step.DurationMinutes = effectiveDuration.Value;
                step.TimeCaptureSource = "ManualEntry";
            }
        }

        step.State = "Completed";
        step.CompletedByEmpNo = dto.EmpNo;
        step.CompletedUtc = DateTime.UtcNow;

        await AddActivityAsync(step, dto.EmpNo, "Complete", null, dto.Notes, cancellationToken);
        await UpdateRouteAndOrderCompletionAsync(step.OrderLineRouteInstanceId, dto.EmpNo, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<List<WorkCenterQueueItemDto>> GetQueueAsync(int workCenterId, CancellationToken cancellationToken = default)
    {
        return await db.OrderLineRouteStepInstances
            .AsNoTracking()
            .Include(s => s.OrderLineRouteInstance)
                .ThenInclude(r => r.SalesOrder)
                    .ThenInclude(o => o.Customer)
            .Include(s => s.OrderLineRouteInstance)
                .ThenInclude(r => r.SalesOrderDetail)
                    .ThenInclude(d => d.Item)
            .Where(s => s.WorkCenterId == workCenterId && (s.State == "Pending" || s.State == "InProgress"))
            .OrderBy(s => s.State)
            .ThenBy(s => s.StepSequence)
            .Select(s => new WorkCenterQueueItemDto(
                s.Id,
                s.OrderLineRouteInstance.SalesOrderId,
                s.SalesOrderDetailId,
                s.OrderLineRouteInstance.SalesOrder.SalesOrderNo,
                s.StepCode,
                s.StepName,
                s.StepSequence,
                s.State,
                s.ScanInUtc,
                s.OrderLineRouteInstance.SalesOrder.Customer.Name,
                s.OrderLineRouteInstance.SalesOrderDetail.Item.ItemNo,
                s.OrderLineRouteInstance.SalesOrderDetail.ItemName ?? s.OrderLineRouteInstance.SalesOrderDetail.Item.ItemDescription,
                s.OrderLineRouteInstance.SalesOrder.PromisedDateUtc,
                s.OrderLineRouteInstance.SalesOrder.Priority,
                s.OrderLineRouteInstance.SalesOrderDetail.Notes,
                s.OrderLineRouteInstance.SalesOrder.Comments))
            .ToListAsync(cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> GetOrderRouteExecutionAsync(int orderId, int? lineId = null, CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken)
            ?? throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        var routesQuery = db.OrderLineRouteInstances
            .AsNoTracking()
            .Include(r => r.Steps)
            .Where(r => r.SalesOrderId == orderId);
        if (lineId.HasValue)
        {
            routesQuery = routesQuery.Where(r => r.SalesOrderDetailId == lineId.Value);
        }

        var routes = await routesQuery
            .OrderBy(r => r.SalesOrderDetailId)
            .Select(r => new LineRouteExecutionDto(
                r.Id,
                r.SalesOrderDetailId,
                r.State,
                r.SalesOrderDetail.QuantityAsOrdered,
                r.SalesOrderDetail.QuantityAsReceived,
                r.SalesOrderDetail.QuantityAsShipped,
                r.SalesOrderDetail.QuantityAsScrapped,
                r.Steps
                    .OrderBy(s => s.StepSequence)
                    .Select(s => new RouteStepExecutionDto(
                        s.Id,
                        s.StepSequence,
                        s.StepCode,
                        s.StepName,
                        s.WorkCenterId,
                        s.WorkCenter.WorkCenterName,
                        s.State,
                        s.IsRequired,
                        s.RequiresScan,
                        s.DataCaptureMode,
                        s.TimeCaptureMode,
                        s.ScanInUtc,
                        s.ScanOutUtc,
                        s.CompletedUtc,
                        s.DurationMinutes,
                        s.ManualDurationMinutes,
                        s.ManualDurationReason,
                        s.TimeCaptureSource,
                        s.RequiresUsageEntry,
                        s.RequiresScrapEntry,
                        s.RequiresSerialCapture,
                        s.RequiresChecklistCompletion,
                        s.ChecklistTemplateId,
                        s.ChecklistFailurePolicy,
                        s.RequireScrapReasonWhenBad,
                        s.RequiresTrailerCapture,
                        s.RequiresSerialLoadVerification,
                        s.GeneratePackingSlipOnComplete,
                        s.GenerateBolOnComplete,
                        s.RequiresAttachment,
                        s.RequiresSupervisorApproval,
                        s.BlockedReason))
                    .ToList()))
            .ToListAsync(cancellationToken);

        return new OrderRouteExecutionDto(
            orderId,
            order.OrderLifecycleStatus,
            order.HasOpenRework ?? false,
            routes);
    }

    public async Task<List<OperatorActivityLogDto>> GetOrderActivityLogAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var orderExists = await db.SalesOrders.AnyAsync(o => o.Id == orderId, cancellationToken);
        if (!orderExists)
        {
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        }

        return await db.OperatorActivityLogs
            .AsNoTracking()
            .Where(l => l.SalesOrderId == orderId)
            .OrderByDescending(l => l.ActionUtc)
            .ThenByDescending(l => l.Id)
            .Take(250)
            .Select(l => new OperatorActivityLogDto(
                l.Id,
                l.SalesOrderId,
                l.SalesOrderDetailId,
                l.OrderLineRouteStepInstanceId,
                l.WorkCenterId,
                l.OperatorEmpNo,
                l.ActionType,
                l.ActionUtc,
                l.DeviceId,
                l.Notes))
            .ToListAsync(cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> ValidateRouteAsync(int orderId, SupervisorRouteReviewDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureRouteReviewAllowed(dto.ActingRole!, "validate route");
        await UpdateRouteReviewAsync(orderId, dto, "Validated", cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, null, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> AdjustRouteAsync(int orderId, SupervisorRouteReviewDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureRouteReviewAllowed(dto.ActingRole!, "adjust route");
        if (string.IsNullOrWhiteSpace(dto.Notes))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "Route adjustment requires reason notes.");
        }

        var routes = await db.OrderLineRouteInstances
            .Include(r => r.Steps)
            .Where(r => r.SalesOrderId == orderId)
            .ToListAsync(cancellationToken);
        if (routes.Count == 0)
        {
            throw new ServiceException(StatusCodes.Status404NotFound, "No route instances found for order.");
        }

        await ApplyRouteAdjustmentsAsync(routes, dto, cancellationToken);
        await UpdateRouteReviewAsync(orderId, dto, "Adjusted", cancellationToken, saveChanges: false, routes);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, null, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> ReopenRouteAsync(int orderId, SupervisorRouteReviewDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureRouteReviewAllowed(dto.ActingRole!, "reopen route");
        if (string.IsNullOrWhiteSpace(dto.Notes))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "Route reopen requires reason notes.");
        }

        await UpdateRouteReviewAsync(orderId, dto, "Reopened", cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, null, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> ApproveOrderAsync(int orderId, SupervisorDecisionDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureSupervisorGateDecisionAllowed(dto.ActingRole!);
        var pendingRoutes = await db.OrderLineRouteInstances
            .Where(r =>
                r.SalesOrderId == orderId &&
                r.SupervisorApprovalRequired &&
                !r.SupervisorApprovedUtc.HasValue &&
                r.State == "PendingSupervisorReview")
            .ToListAsync(cancellationToken);
        if (pendingRoutes.Count == 0)
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Order has no routes pending supervisor review.");
        }

        var nowUtc = DateTime.UtcNow;
        var actorEmpNo = dto.EmpNo.Trim();
        foreach (var route in pendingRoutes)
        {
            route.SupervisorApprovedBy = actorEmpNo;
            route.SupervisorApprovedUtc = nowUtc;
            route.State = "Completed";
            route.CompletedUtc ??= nowUtc;
        }

        var order = await db.SalesOrders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken)
            ?? throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        order.SupervisorReviewedBy = actorEmpNo;
        order.SupervisorReviewedUtc = nowUtc;

        await db.SaveChangesAsync(cancellationToken);
        if (_orderWorkflowService is not null)
        {
            await _orderWorkflowService.AdvanceStatusAsync(
                orderId,
                OrderStatusCatalog.ProductionComplete,
                actingRole: dto.ActingRole,
                reasonCode: "SupervisorApproved",
                note: dto.Notes,
                actingEmpNo: actorEmpNo,
                cancellationToken: cancellationToken);
        }
        else
        {
            order.OrderLifecycleStatus = OrderStatusCatalog.ProductionComplete;
            order.StatusOwnerRole = dto.ActingRole;
            order.StatusNote = dto.Notes;
            order.StatusReasonCode = "SupervisorApproved";
            order.StatusUpdatedUtc = nowUtc;
            await db.SaveChangesAsync(cancellationToken);
        }
        return await GetOrderRouteExecutionAsync(orderId, null, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> RejectOrderAsync(int orderId, SupervisorDecisionDto dto, CancellationToken cancellationToken = default)
    {
        EnsureRoleProvided(dto.ActingRole);
        _rolePermissionService.EnsureSupervisorGateDecisionAllowed(dto.ActingRole!);
        var pendingRoutes = await db.OrderLineRouteInstances
            .Where(r =>
                r.SalesOrderId == orderId &&
                r.SupervisorApprovalRequired &&
                !r.SupervisorApprovedUtc.HasValue &&
                r.State == "PendingSupervisorReview")
            .ToListAsync(cancellationToken);
        if (pendingRoutes.Count == 0)
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Order has no routes pending supervisor review.");
        }

        var nowUtc = DateTime.UtcNow;
        var actorEmpNo = dto.EmpNo.Trim();
        foreach (var route in pendingRoutes)
        {
            route.State = "Active";
            route.CompletedUtc = null;
            route.SupervisorApprovedBy = null;
            route.SupervisorApprovedUtc = null;
        }

        var order = await db.SalesOrders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken)
            ?? throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        order.SupervisorReviewedBy = actorEmpNo;
        order.SupervisorReviewedUtc = nowUtc;

        await db.SaveChangesAsync(cancellationToken);
        if (_orderWorkflowService is not null)
        {
            await _orderWorkflowService.AdvanceStatusAsync(
                orderId,
                OrderStatusCatalog.InProduction,
                actingRole: dto.ActingRole,
                reasonCode: "SupervisorRejected",
                note: dto.Notes,
                actingEmpNo: actorEmpNo,
                cancellationToken: cancellationToken);
        }
        else
        {
            order.OrderLifecycleStatus = OrderStatusCatalog.InProduction;
            order.StatusOwnerRole = dto.ActingRole;
            order.StatusNote = dto.Notes;
            order.StatusReasonCode = "SupervisorRejected";
            order.StatusUpdatedUtc = nowUtc;
            await db.SaveChangesAsync(cancellationToken);
        }
        return await GetOrderRouteExecutionAsync(orderId, null, cancellationToken);
    }

    public Task<OrderRouteExecutionDto> RequestReworkAsync(int orderId, int lineId, long stepId, ReworkRequestDto dto, CancellationToken cancellationToken = default) =>
        ApplyReworkStateAsync(orderId, lineId, stepId, dto.RequestedByEmpNo, dto.ActingRole!, "Request", "Requested", dto.ReasonCode, dto.Notes, cancellationToken);

    public Task<OrderRouteExecutionDto> ApproveReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default) =>
        ApplyReworkStateAsync(orderId, lineId, stepId, dto.EmpNo, dto.ActingRole!, "Approve", "Approved", dto.ReasonCode, dto.Notes, cancellationToken);

    public Task<OrderRouteExecutionDto> StartReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default) =>
        ApplyReworkStateAsync(orderId, lineId, stepId, dto.EmpNo, dto.ActingRole!, "Start", "InProgress", dto.ReasonCode, dto.Notes, cancellationToken);

    public Task<OrderRouteExecutionDto> SubmitReworkVerificationAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default) =>
        ApplyReworkStateAsync(orderId, lineId, stepId, dto.EmpNo, dto.ActingRole!, "SubmitVerification", "VerificationPending", dto.ReasonCode, dto.Notes, cancellationToken);

    public Task<OrderRouteExecutionDto> CloseReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default) =>
        ApplyReworkStateAsync(orderId, lineId, stepId, dto.EmpNo, dto.ActingRole!, "Close", "Closed", dto.ReasonCode, dto.Notes, cancellationToken);

    public Task<OrderRouteExecutionDto> CancelReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default) =>
        ApplyReworkStateAsync(orderId, lineId, stepId, dto.EmpNo, dto.ActingRole!, "Cancel", "Cancelled", dto.ReasonCode, dto.Notes, cancellationToken);

    public Task<OrderRouteExecutionDto> ScrapReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default) =>
        ApplyReworkStateAsync(orderId, lineId, stepId, dto.EmpNo, dto.ActingRole!, "Scrap", "Scrapped", dto.ReasonCode, dto.Notes, cancellationToken);

    private async Task<OrderRouteExecutionDto> ApplyReworkStateAsync(
        int orderId,
        int lineId,
        long stepId,
        string actorEmpNo,
        string actingRole,
        string actionName,
        string reworkState,
        string? reasonCode,
        string? notes,
        CancellationToken cancellationToken)
    {
        EnsureRoleProvided(actingRole);
        _rolePermissionService.EnsureReworkActionAllowed(actingRole, actionName);
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        var order = step.OrderLineRouteInstance.SalesOrder;
        var currentReworkState = string.IsNullOrWhiteSpace(order.ReworkState) ? null : order.ReworkState.Trim();

        if (currentReworkState is null)
        {
            if (!string.Equals(reworkState, "Requested", StringComparison.Ordinal))
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    "Rework must start with Requested state.");
            }

            if (string.IsNullOrWhiteSpace(reasonCode))
            {
                throw new ServiceException(
                    StatusCodes.Status400BadRequest,
                    "Rework reason code is required when requesting rework.");
            }
        }
        else if (ReworkStateTransitions.TryGetValue(currentReworkState, out var allowedStates))
        {
            if (!allowedStates.Contains(reworkState, StringComparer.Ordinal))
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    $"Invalid rework transition '{currentReworkState}' -> '{reworkState}'.");
            }
        }

        var requiresElevatedReason =
            string.Equals(actionName, "Approve", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(actionName, "Close", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(actionName, "Cancel", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(actionName, "Scrap", StringComparison.OrdinalIgnoreCase);
        if (requiresElevatedReason && string.IsNullOrWhiteSpace(reasonCode))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, $"{actionName} rework action requires reason code.");
        }

        var isTerminal = string.Equals(reworkState, "Closed", StringComparison.Ordinal) ||
                         string.Equals(reworkState, "Cancelled", StringComparison.Ordinal) ||
                         string.Equals(reworkState, "Scrapped", StringComparison.Ordinal);
        var now = DateTime.UtcNow;
        order.HoldOverlay = isTerminal ? null : OrderStatusCatalog.ReworkOpen;
        order.HasOpenRework = !isTerminal;
        order.ReworkBlockingInvoice = order.HasOpenRework;
        order.ReworkState = reworkState;
        order.ReworkLastUpdatedByEmpNo = actorEmpNo;
        if (string.Equals(reworkState, "Requested", StringComparison.Ordinal))
        {
            order.ReworkRequestedUtc = now;
            order.ReworkReasonCode = string.IsNullOrWhiteSpace(reasonCode) ? null : reasonCode.Trim();
        }
        else if (string.Equals(reworkState, "Approved", StringComparison.Ordinal))
        {
            order.ReworkApprovedUtc = now;
        }
        else if (string.Equals(reworkState, "InProgress", StringComparison.Ordinal))
        {
            order.ReworkInProgressUtc = now;
        }
        else if (string.Equals(reworkState, "VerificationPending", StringComparison.Ordinal))
        {
            order.ReworkVerificationPendingUtc = now;
        }
        else if (isTerminal)
        {
            order.ReworkClosedUtc = now;
            order.ReworkDisposition = reworkState;
        }

        order.StatusReasonCode = $"Rework:{reworkState}";
        order.StatusNote = notes;
        order.StatusOwnerRole = "Quality";
        order.StatusUpdatedUtc = now;

        var currentLifecycleStatus = string.IsNullOrWhiteSpace(order.OrderLifecycleStatus)
            ? OrderStatusCatalog.MapLegacyToLifecycle(order.OrderStatus, order.OrderOrigin, order.ValidatedUtc)
            : order.OrderLifecycleStatus!;
        if (!isTerminal && string.Equals(currentLifecycleStatus, OrderStatusCatalog.InvoiceReady, StringComparison.Ordinal))
        {
            var target = await orderPolicyService.GetDecisionValueAsync(
                OrderPolicyKeys.ReworkRevertTargetStatus,
                order.SiteId,
                order.CustomerId,
                OrderStatusCatalog.InProduction,
                cancellationToken);
            if (!string.Equals(target, OrderStatusCatalog.InProduction, StringComparison.Ordinal) &&
                !string.Equals(target, OrderStatusCatalog.ProductionCompletePendingApproval, StringComparison.Ordinal))
            {
                target = OrderStatusCatalog.InProduction;
            }

            order.OrderLifecycleStatus = target;
            order.OrderStatus = OrderStatusCatalog.MapLifecycleToLegacy(target);
        }

        if (!isTerminal)
        {
            step.State = "Blocked";
            step.BlockedReason = $"Rework-{reworkState}";
        }
        else if (string.Equals(step.State, "Blocked", StringComparison.OrdinalIgnoreCase))
        {
            step.State = "InProgress";
            step.BlockedReason = null;
        }

        await AddActivityAsync(step, actorEmpNo, $"Rework{reworkState}", null, notes, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    private static void EnsureRoleProvided(string? actingRole)
    {
        if (string.IsNullOrWhiteSpace(actingRole))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "ActingRole is required.");
        }
    }

    private static void EnsureOperatorAtRequiredWorkCenter(OrderLineRouteStepInstance step, int operatorWorkCenterId)
    {
        if (operatorWorkCenterId != step.WorkCenterId)
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Wrong work center. Step requires work center '{step.WorkCenterId}' but operator is at '{operatorWorkCenterId}'.");
        }
    }

    private async Task<OrderLineRouteStepInstance> GetStepAsync(int orderId, int lineId, long stepId, CancellationToken cancellationToken)
    {
        var step = await db.OrderLineRouteStepInstances
            .Include(s => s.OrderLineRouteInstance)
                .ThenInclude(r => r.SalesOrder)
            .FirstOrDefaultAsync(s => s.Id == stepId, cancellationToken)
            ?? throw new ServiceException(StatusCodes.Status404NotFound, "Step not found.");

        if (step.SalesOrderDetailId != lineId || step.OrderLineRouteInstance.SalesOrderId != orderId)
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "Step does not belong to the specified order and line.");
        }

        return step;
    }

    private async Task EnsurePreviousStepsCompletedAsync(OrderLineRouteStepInstance currentStep, CancellationToken cancellationToken)
    {
        var blocked = await db.OrderLineRouteStepInstances
            .AnyAsync(s =>
                s.OrderLineRouteInstanceId == currentStep.OrderLineRouteInstanceId &&
                s.StepSequence < currentStep.StepSequence &&
                s.IsRequired &&
                s.State != "Completed",
                cancellationToken);

        if (blocked)
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "A prior required step is not complete.");
        }
    }

    private async Task UpdateRouteAndOrderCompletionAsync(long routeInstanceId, string actorEmpNo, CancellationToken cancellationToken)
    {
        var route = await db.OrderLineRouteInstances
            .Include(r => r.SalesOrder)
            .FirstAsync(r => r.Id == routeInstanceId, cancellationToken);

        var routeSteps = await db.OrderLineRouteStepInstances
            .Where(s => s.OrderLineRouteInstanceId == routeInstanceId)
            .ToListAsync(cancellationToken);
        var hasPendingRequiredStep = routeSteps.Any(s =>
            s.IsRequired &&
            !string.Equals(s.State, "Completed", StringComparison.OrdinalIgnoreCase));
        if (!hasPendingRequiredStep)
        {
            if (route.SupervisorApprovalRequired && !route.SupervisorApprovedUtc.HasValue)
            {
                route.State = "PendingSupervisorReview";
                route.CompletedUtc = null;
                route.SalesOrder.PendingSupervisorReviewUtc ??= DateTime.UtcNow;
                route.SalesOrder.SupervisorReviewedBy = null;
                route.SalesOrder.SupervisorReviewedUtc = null;
            }
            else
            {
                route.State = "Completed";
                route.CompletedUtc = DateTime.UtcNow;
            }
        }

        var siblingRoutes = await db.OrderLineRouteInstances
            .Where(r => r.SalesOrderId == route.SalesOrderId)
            .ToListAsync(cancellationToken);
        var hasActiveRoutes = siblingRoutes.Any(r => string.Equals(r.State, "Active", StringComparison.OrdinalIgnoreCase));
        var hasPendingSupervisorReviewRoutes = siblingRoutes.Any(r => string.Equals(r.State, "PendingSupervisorReview", StringComparison.OrdinalIgnoreCase));
        if (!hasActiveRoutes && _orderWorkflowService is not null)
        {
            var targetStatus = hasPendingSupervisorReviewRoutes
                ? OrderStatusCatalog.ProductionCompletePendingApproval
                : OrderStatusCatalog.ProductionComplete;
            await _orderWorkflowService.AdvanceStatusAsync(
                route.SalesOrderId,
                targetStatus,
                actingRole: hasPendingSupervisorReviewRoutes ? "Supervisor" : "Production",
                reasonCode: hasPendingSupervisorReviewRoutes ? "SupervisorGateEntered" : "ProductionCompleted",
                note: hasPendingSupervisorReviewRoutes
                    ? "Awaiting required supervisor or quality approvals."
                    : "All required route instances completed.",
                actingEmpNo: actorEmpNo,
                cancellationToken: cancellationToken);
        }
    }

    private async Task UpdateRouteReviewAsync(int orderId, SupervisorRouteReviewDto dto, string state, CancellationToken cancellationToken)
    {
        await UpdateRouteReviewAsync(orderId, dto, state, cancellationToken, saveChanges: true);
    }

    private async Task UpdateRouteReviewAsync(
        int orderId,
        SupervisorRouteReviewDto dto,
        string state,
        CancellationToken cancellationToken,
        bool saveChanges,
        List<OrderLineRouteInstance>? existingRoutes = null)
    {
        var routes = existingRoutes ?? await db.OrderLineRouteInstances
            .Where(r => r.SalesOrderId == orderId)
            .ToListAsync(cancellationToken);
        if (routes.Count == 0)
        {
            throw new ServiceException(StatusCodes.Status404NotFound, "No route instances found for order.");
        }

        foreach (var route in routes)
        {
            route.RouteReviewState = state;
            route.RouteReviewedBy = dto.ReviewerEmpNo;
            route.RouteReviewedUtc = DateTime.UtcNow;
            route.RouteReviewNotes = dto.Notes;
        }

        if (saveChanges)
        {
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task ApplyRouteAdjustmentsAsync(
        List<OrderLineRouteInstance> routes,
        SupervisorRouteReviewDto dto,
        CancellationToken cancellationToken)
    {
        var adjustments = dto.Adjustments ?? [];
        if (adjustments.Count == 0)
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "Route adjustment requires at least one step adjustment.");
        }

        var reviewerEmpNo = dto.ReviewerEmpNo?.Trim();
        if (string.IsNullOrWhiteSpace(reviewerEmpNo))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "ReviewerEmpNo is required.");
        }

        var hasStartedExecution = routes.SelectMany(r => r.Steps).Any(IsStartedOrCompletedStep);
        var hasFormalReopen = routes.All(r => string.Equals(r.RouteReviewState, "Reopened", StringComparison.OrdinalIgnoreCase));
        if (hasStartedExecution && !hasFormalReopen)
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "Route adjustment is locked after execution start. A formal reopen is required before post-start corrections.");
        }

        var routeByLineId = routes.ToDictionary(r => r.SalesOrderDetailId);
        var stepById = routes
            .SelectMany(r => r.Steps)
            .ToDictionary(s => s.Id);

        var requestedWorkCenterIds = adjustments
            .Where(a => (a.Remove ?? false) == false && a.WorkCenterId.HasValue)
            .Select(a => a.WorkCenterId!.Value)
            .Distinct()
            .ToList();
        var validWorkCenterIds = await db.WorkCenters
            .Where(wc => requestedWorkCenterIds.Contains(wc.Id) && wc.IsActive)
            .Select(wc => wc.Id)
            .ToListAsync(cancellationToken);
        var validWorkCenterSet = validWorkCenterIds.ToHashSet();

        var now = DateTime.UtcNow;
        var defaultReason = dto.Notes?.Trim();

        foreach (var adjustment in adjustments)
        {
            var isRemoval = adjustment.Remove ?? false;
            var reason = string.IsNullOrWhiteSpace(adjustment.Reason) ? defaultReason : adjustment.Reason.Trim();

            if (isRemoval)
            {
                if (!adjustment.StepInstanceId.HasValue || !stepById.TryGetValue(adjustment.StepInstanceId.Value, out var stepToRemove))
                {
                    throw new ServiceException(StatusCodes.Status400BadRequest, "Remove operation requires a valid StepInstanceId.");
                }

                EnsureStepMutableForRouteAdjustment(stepToRemove);
                if (stepToRemove.IsRequired)
                {
                    throw new ServiceException(StatusCodes.Status409Conflict, $"Step '{stepToRemove.StepCode}' is protected and cannot be removed.");
                }

                stepToRemove.State = "Skipped";
                stepToRemove.BlockedReason = "RouteAdjustedRemoved";
                stepToRemove.StepAdjustedBy = reviewerEmpNo;
                stepToRemove.StepAdjustedUtc = now;
                stepToRemove.StepAdjustmentReason = reason;
                continue;
            }

            if (adjustment.StepInstanceId.HasValue)
            {
                if (!stepById.TryGetValue(adjustment.StepInstanceId.Value, out var existingStep))
                {
                    throw new ServiceException(StatusCodes.Status400BadRequest, $"Step '{adjustment.StepInstanceId.Value}' was not found for this order.");
                }

                EnsureStepMutableForRouteAdjustment(existingStep);
                if (adjustment.StepSequence.HasValue)
                {
                    existingStep.StepSequence = ValidatePositiveSequence(adjustment.StepSequence.Value);
                }

                if (adjustment.WorkCenterId.HasValue)
                {
                    var requestedWorkCenterId = adjustment.WorkCenterId.Value;
                    if (!validWorkCenterSet.Contains(requestedWorkCenterId))
                    {
                        throw new ServiceException(StatusCodes.Status400BadRequest, $"WorkCenterId '{requestedWorkCenterId}' is invalid or inactive.");
                    }

                    existingStep.WorkCenterId = requestedWorkCenterId;
                }

                existingStep.StepAdjustedBy = reviewerEmpNo;
                existingStep.StepAdjustedUtc = now;
                existingStep.StepAdjustmentReason = reason;
                continue;
            }

            if (!adjustment.LineId.HasValue)
            {
                throw new ServiceException(StatusCodes.Status400BadRequest, "Add operation requires LineId when StepInstanceId is not provided.");
            }

            if (!routeByLineId.TryGetValue(adjustment.LineId.Value, out var lineRoute))
            {
                throw new ServiceException(StatusCodes.Status400BadRequest, $"Line '{adjustment.LineId.Value}' does not have an active route instance.");
            }

            if (!adjustment.StepSequence.HasValue || !adjustment.WorkCenterId.HasValue)
            {
                throw new ServiceException(StatusCodes.Status400BadRequest, "Add operation requires StepSequence and WorkCenterId.");
            }

            if (string.IsNullOrWhiteSpace(adjustment.StepCode) || string.IsNullOrWhiteSpace(adjustment.StepName))
            {
                throw new ServiceException(StatusCodes.Status400BadRequest, "Add operation requires StepCode and StepName.");
            }

            var newWorkCenterId = adjustment.WorkCenterId.Value;
            if (!validWorkCenterSet.Contains(newWorkCenterId))
            {
                throw new ServiceException(StatusCodes.Status400BadRequest, $"WorkCenterId '{newWorkCenterId}' is invalid or inactive.");
            }

            var newStep = new OrderLineRouteStepInstance
            {
                OrderLineRouteInstanceId = lineRoute.Id,
                SalesOrderDetailId = lineRoute.SalesOrderDetailId,
                StepSequence = ValidatePositiveSequence(adjustment.StepSequence.Value),
                StepCode = adjustment.StepCode.Trim(),
                StepName = adjustment.StepName.Trim(),
                WorkCenterId = newWorkCenterId,
                State = "Pending",
                IsRequired = adjustment.IsRequired ?? false,
                DataCaptureMode = "ElectronicRequired",
                TimeCaptureMode = "Automated",
                RequiresScan = true,
                StepAdjustedBy = reviewerEmpNo,
                StepAdjustedUtc = now,
                StepAdjustmentReason = reason,
            };

            db.OrderLineRouteStepInstances.Add(newStep);
        }

        foreach (var route in routes)
        {
            NormalizeRouteStepSequence(route, reviewerEmpNo, now, defaultReason);
        }
    }

    private static void NormalizeRouteStepSequence(
        OrderLineRouteInstance route,
        string reviewerEmpNo,
        DateTime adjustedUtc,
        string? defaultReason)
    {
        var activeSteps = route.Steps
            .Where(s => !string.Equals(s.State, "Skipped", StringComparison.OrdinalIgnoreCase))
            .OrderBy(s => s.StepSequence)
            .ThenBy(s => s.Id)
            .ToList();
        var expected = 1;
        foreach (var step in activeSteps)
        {
            if (step.StepSequence != expected)
            {
                step.StepSequence = expected;
                step.StepAdjustedBy ??= reviewerEmpNo;
                step.StepAdjustedUtc ??= adjustedUtc;
                step.StepAdjustmentReason ??= defaultReason;
            }

            expected++;
        }

        var duplicateSequence = activeSteps
            .GroupBy(s => s.StepSequence)
            .Any(g => g.Count() > 1);
        if (duplicateSequence)
        {
            throw new ServiceException(StatusCodes.Status409Conflict, $"Route line '{route.SalesOrderDetailId}' has duplicate step sequence values after adjustment.");
        }
    }

    private static bool IsStartedOrCompletedStep(OrderLineRouteStepInstance step) =>
        step.ScanInUtc.HasValue ||
        step.ScanOutUtc.HasValue ||
        step.CompletedUtc.HasValue ||
        string.Equals(step.State, "InProgress", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(step.State, "Completed", StringComparison.OrdinalIgnoreCase);

    private static void EnsureStepMutableForRouteAdjustment(OrderLineRouteStepInstance step)
    {
        if (IsStartedOrCompletedStep(step))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Step '{step.StepCode}' cannot be adjusted because execution has already started.");
        }
    }

    private static int ValidatePositiveSequence(int sequence)
    {
        if (sequence <= 0)
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "StepSequence must be greater than zero.");
        }

        return sequence;
    }

    private async Task AddActivityAsync(
        OrderLineRouteStepInstance step,
        string empNo,
        string actionType,
        string? deviceId,
        string? notes,
        CancellationToken cancellationToken)
    {
        db.OperatorActivityLogs.Add(new OperatorActivityLog
        {
            SalesOrderId = step.OrderLineRouteInstance.SalesOrderId,
            SalesOrderDetailId = step.SalesOrderDetailId,
            OrderLineRouteStepInstanceId = step.Id,
            WorkCenterId = step.WorkCenterId,
            OperatorEmpNo = empNo,
            ActionType = actionType,
            DeviceId = deviceId,
            Notes = notes,
            ActionUtc = DateTime.UtcNow,
        });
        await Task.CompletedTask;
    }

    private static string BuildDocumentNumber(string prefix, string salesOrderNo, string? existingNo, bool regenerate)
    {
        var baseNo = $"{prefix}-{salesOrderNo}";
        if (string.IsNullOrWhiteSpace(existingNo))
        {
            return baseNo;
        }

        var current = existingNo.Trim();
        if (!regenerate)
        {
            return current;
        }

        var marker = $"{baseNo}-R";
        if (current.StartsWith(marker, StringComparison.OrdinalIgnoreCase) &&
            int.TryParse(current[marker.Length..], out var currentRevision) &&
            currentRevision >= 1)
        {
            return $"{baseNo}-R{currentRevision + 1}";
        }

        return $"{baseNo}-R1";
    }

    private async Task<string> GenerateAndStoreDocumentAsync(
        SalesOrder order,
        int lineId,
        string actorEmpNo,
        string category,
        string documentNo,
        string? notes,
        CancellationToken cancellationToken)
    {
        var storage = _attachmentStorage
            ?? throw new ServiceException(
                StatusCodes.Status500InternalServerError,
                "Attachment storage is not configured. Document generation is unavailable.");

        var utcNow = DateTime.UtcNow;
        var fileName = $"{documentNo}.pdf";
        var blobPath = $"orders/{order.Id}/generated/{Guid.NewGuid():N}-{fileName}";
        var bytes = WorkCenterDocumentPdfBuilder.BuildDocument(order, lineId, category, documentNo, utcNow, actorEmpNo, notes);
        await using (var stream = new MemoryStream(bytes))
        {
            await storage.UploadAsync(blobPath, stream, "application/pdf", cancellationToken);
        }

        var attachment = new OrderAttachment
        {
            OrderId = order.Id,
            FileName = fileName,
            BlobPath = blobPath,
            ContentType = "application/pdf",
            SizeBytes = bytes.LongLength,
            Category = category,
            UploadedByEmpNo = actorEmpNo,
            UploadedUtc = utcNow,
            CreatedAtUtc = utcNow,
        };
        db.OrderAttachments.Add(attachment);
        db.OrderAttachmentAudits.Add(new OrderAttachmentAudit
        {
            OrderId = order.Id,
            Attachment = attachment,
            ActionType = "Generated",
            ActingRole = "Production",
            ActorEmpNo = actorEmpNo,
            OccurredUtc = utcNow,
            Details = $"category={category};documentNo={documentNo};lineId={lineId}",
        });

        return blobPath;
    }
}
