using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class WorkCenterWorkflowService(LpcAppsDbContext db) : IWorkCenterWorkflowService
{
    public async Task<OrderRouteExecutionDto> ScanInAsync(int orderId, int lineId, long stepId, OperatorScanInDto dto, CancellationToken cancellationToken = default)
    {
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
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
        if (string.Equals(order.OrderLifecycleStatus, OrderStatusCatalog.ReadyForProduction, StringComparison.Ordinal))
        {
            order.OrderLifecycleStatus = OrderStatusCatalog.InProduction;
            order.StatusUpdatedUtc = DateTime.UtcNow;
        }

        await AddActivityAsync(step, dto.EmpNo, "ScanIn", dto.DeviceId, null, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> ScanOutAsync(int orderId, int lineId, long stepId, OperatorScanOutDto dto, CancellationToken cancellationToken = default)
    {
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        if (!string.Equals(step.State, "InProgress", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Only in-progress steps can be scanned out.");
        }

        var now = DateTime.UtcNow;
        step.ScanOutUtc = now;
        if (step.ScanInUtc.HasValue && now >= step.ScanInUtc.Value)
        {
            step.DurationMinutes = (decimal)(now - step.ScanInUtc.Value).TotalMinutes;
        }

        await AddActivityAsync(step, dto.EmpNo, "ScanOut", dto.DeviceId, null, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> AddUsageAsync(int orderId, int lineId, long stepId, StepMaterialUsageCreateDto dto, CancellationToken cancellationToken = default)
    {
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

    public async Task<OrderRouteExecutionDto> CompleteStepAsync(int orderId, int lineId, long stepId, CompleteWorkCenterStepDto dto, CancellationToken cancellationToken = default)
    {
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        await ValidateStepCompletionAsync(step, cancellationToken);

        if (string.IsNullOrWhiteSpace(step.State) || !string.Equals(step.State, "InProgress", StringComparison.OrdinalIgnoreCase))
        {
            throw new ServiceException(StatusCodes.Status409Conflict, "Step must be in progress before completion.");
        }

        step.State = "Completed";
        step.CompletedByEmpNo = dto.EmpNo;
        step.CompletedUtc = DateTime.UtcNow;

        await AddActivityAsync(step, dto.EmpNo, "Complete", null, dto.Notes, cancellationToken);
        await UpdateRouteAndOrderCompletionAsync(step.OrderLineRouteInstanceId, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, lineId, cancellationToken);
    }

    public async Task<List<WorkCenterQueueItemDto>> GetQueueAsync(int workCenterId, CancellationToken cancellationToken = default)
    {
        return await db.OrderLineRouteStepInstances
            .AsNoTracking()
            .Include(s => s.OrderLineRouteInstance)
                .ThenInclude(r => r.SalesOrder)
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
                s.ScanInUtc))
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
                r.Steps
                    .OrderBy(s => s.StepSequence)
                    .Select(s => new RouteStepExecutionDto(
                        s.Id,
                        s.StepSequence,
                        s.StepCode,
                        s.StepName,
                        s.State,
                        s.ScanInUtc,
                        s.ScanOutUtc,
                        s.CompletedUtc))
                    .ToList()))
            .ToListAsync(cancellationToken);

        return new OrderRouteExecutionDto(
            orderId,
            order.OrderLifecycleStatus,
            order.HasOpenRework ?? false,
            routes);
    }

    public async Task<OrderRouteExecutionDto> ValidateRouteAsync(int orderId, SupervisorRouteReviewDto dto, CancellationToken cancellationToken = default)
    {
        await UpdateRouteReviewAsync(orderId, dto, "Validated", cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, null, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> AdjustRouteAsync(int orderId, SupervisorRouteReviewDto dto, CancellationToken cancellationToken = default)
    {
        await UpdateRouteReviewAsync(orderId, dto, "Adjusted", cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, null, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> ReopenRouteAsync(int orderId, SupervisorRouteReviewDto dto, CancellationToken cancellationToken = default)
    {
        await UpdateRouteReviewAsync(orderId, dto, "Pending", cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, null, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> ApproveOrderAsync(int orderId, SupervisorDecisionDto dto, CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken)
            ?? throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        order.OrderLifecycleStatus = OrderStatusCatalog.ProductionComplete;
        order.StatusOwnerRole = "Supervisor";
        order.StatusNote = dto.Notes;
        order.StatusUpdatedUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, null, cancellationToken);
    }

    public async Task<OrderRouteExecutionDto> RejectOrderAsync(int orderId, SupervisorDecisionDto dto, CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken)
            ?? throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");
        order.OrderLifecycleStatus = OrderStatusCatalog.InProduction;
        order.StatusOwnerRole = "Supervisor";
        order.StatusNote = dto.Notes;
        order.StatusUpdatedUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return await GetOrderRouteExecutionAsync(orderId, null, cancellationToken);
    }

    public Task<OrderRouteExecutionDto> RequestReworkAsync(int orderId, int lineId, long stepId, ReworkRequestDto dto, CancellationToken cancellationToken = default) =>
        ApplyReworkStateAsync(orderId, lineId, stepId, dto.RequestedByEmpNo, "Requested", dto.Notes, cancellationToken);

    public Task<OrderRouteExecutionDto> ApproveReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default) =>
        ApplyReworkStateAsync(orderId, lineId, stepId, dto.EmpNo, "Approved", dto.Notes, cancellationToken);

    public Task<OrderRouteExecutionDto> StartReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default) =>
        ApplyReworkStateAsync(orderId, lineId, stepId, dto.EmpNo, "InProgress", dto.Notes, cancellationToken);

    public Task<OrderRouteExecutionDto> SubmitReworkVerificationAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default) =>
        ApplyReworkStateAsync(orderId, lineId, stepId, dto.EmpNo, "VerificationPending", dto.Notes, cancellationToken);

    public Task<OrderRouteExecutionDto> CloseReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default) =>
        ApplyReworkStateAsync(orderId, lineId, stepId, dto.EmpNo, "Closed", dto.Notes, cancellationToken);

    private async Task<OrderRouteExecutionDto> ApplyReworkStateAsync(int orderId, int lineId, long stepId, string actorEmpNo, string reworkState, string? notes, CancellationToken cancellationToken)
    {
        var step = await GetStepAsync(orderId, lineId, stepId, cancellationToken);
        var order = step.OrderLineRouteInstance.SalesOrder;

        order.HoldOverlay = string.Equals(reworkState, "Closed", StringComparison.Ordinal) ? null : OrderStatusCatalog.ReworkOpen;
        order.HasOpenRework = !string.Equals(reworkState, "Closed", StringComparison.Ordinal);
        order.ReworkBlockingInvoice = order.HasOpenRework;
        order.StatusReasonCode = $"Rework:{reworkState}";
        order.StatusNote = notes;
        order.StatusUpdatedUtc = DateTime.UtcNow;

        if (!string.Equals(reworkState, "Closed", StringComparison.Ordinal))
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

    private async Task ValidateStepCompletionAsync(OrderLineRouteStepInstance step, CancellationToken cancellationToken)
    {
        if (step.RequiresUsageEntry)
        {
            var hasUsage = await db.StepMaterialUsages.AnyAsync(u => u.OrderLineRouteStepInstanceId == step.Id, cancellationToken);
            if (!hasUsage)
            {
                throw new ServiceException(StatusCodes.Status409Conflict, "Usage entry is required before completion.");
            }
        }

        if (step.RequiresScrapEntry)
        {
            var hasScrap = await db.StepScrapEntries.AnyAsync(u => u.OrderLineRouteStepInstanceId == step.Id, cancellationToken);
            if (!hasScrap)
            {
                throw new ServiceException(StatusCodes.Status409Conflict, "Scrap entry is required before completion.");
            }
        }

        if (step.RequiresSerialCapture)
        {
            var hasSerials = await db.StepSerialCaptures.AnyAsync(u => u.OrderLineRouteStepInstanceId == step.Id, cancellationToken);
            if (!hasSerials)
            {
                throw new ServiceException(StatusCodes.Status409Conflict, "Serial capture is required before completion.");
            }
        }

        if (step.RequiresChecklistCompletion)
        {
            var hasChecklist = await db.StepChecklistResults.AnyAsync(u => u.OrderLineRouteStepInstanceId == step.Id, cancellationToken);
            if (!hasChecklist)
            {
                throw new ServiceException(StatusCodes.Status409Conflict, "Checklist completion is required before completion.");
            }
        }
    }

    private async Task UpdateRouteAndOrderCompletionAsync(long routeInstanceId, CancellationToken cancellationToken)
    {
        var route = await db.OrderLineRouteInstances
            .Include(r => r.SalesOrder)
            .FirstAsync(r => r.Id == routeInstanceId, cancellationToken);

        var hasPendingRequiredStep = await db.OrderLineRouteStepInstances
            .AnyAsync(s => s.OrderLineRouteInstanceId == routeInstanceId && s.IsRequired && s.State != "Completed", cancellationToken);
        if (!hasPendingRequiredStep)
        {
            route.State = "Completed";
            route.CompletedUtc = DateTime.UtcNow;
        }

        var hasIncompleteRequiredRoutes = await db.OrderLineRouteInstances
            .AnyAsync(r => r.SalesOrderId == route.SalesOrderId && r.State != "Completed", cancellationToken);
        if (!hasIncompleteRequiredRoutes)
        {
            route.SalesOrder.OrderLifecycleStatus = OrderStatusCatalog.ProductionComplete;
            route.SalesOrder.OrderStatus = OrderStatusCatalog.ReadyToShip;
            route.SalesOrder.StatusUpdatedUtc = DateTime.UtcNow;
        }
    }

    private async Task UpdateRouteReviewAsync(int orderId, SupervisorRouteReviewDto dto, string state, CancellationToken cancellationToken)
    {
        var routes = await db.OrderLineRouteInstances
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

        await db.SaveChangesAsync(cancellationToken);
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
}
