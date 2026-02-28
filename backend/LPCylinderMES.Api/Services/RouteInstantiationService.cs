using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

internal static class RouteInstantiationService
{
    public static async Task EnsureRoutesForOrderAsync(
        LpcAppsDbContext db,
        SalesOrder order,
        IReadOnlyCollection<SalesOrderDetail>? preloadedLines,
        CancellationToken cancellationToken)
    {
        var lines = preloadedLines is { Count: > 0 }
            ? preloadedLines.ToList()
            : await db.SalesOrderDetails
                .Include(d => d.Item)
                .Where(d => d.SalesOrderId == order.Id)
                .ToListAsync(cancellationToken);

        if (lines.Count == 0)
        {
            return;
        }

        var itemIdsWithoutNavigation = lines
            .Where(l => l.Item is null)
            .Select(l => l.ItemId)
            .Distinct()
            .ToList();
        if (itemIdsWithoutNavigation.Count > 0)
        {
            var itemById = await db.Items
                .Where(i => itemIdsWithoutNavigation.Contains(i.Id))
                .ToDictionaryAsync(i => i.Id, cancellationToken);
            foreach (var line in lines.Where(l => l.Item is null))
            {
                if (itemById.TryGetValue(line.ItemId, out var item))
                {
                    line.Item = item;
                }
            }
        }

        var lineIds = lines.Select(l => l.Id).ToList();
        var routedLineIds = await db.OrderLineRouteInstances
            .Where(r => r.SalesOrderId == order.Id &&
                        lineIds.Contains(r.SalesOrderDetailId) &&
                        r.State != "Completed")
            .Select(r => r.SalesOrderDetailId)
            .ToHashSetAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var candidateAssignments = await db.RouteTemplateAssignments
            .AsNoTracking()
            .Include(a => a.RouteTemplate)
                .ThenInclude(t => t.Steps)
            .Where(a =>
                a.IsActive &&
                a.RouteTemplate.IsActive &&
                (!a.EffectiveFromUtc.HasValue || a.EffectiveFromUtc <= now) &&
                (!a.EffectiveToUtc.HasValue || a.EffectiveToUtc >= now))
            .ToListAsync(cancellationToken);

        foreach (var line in lines)
        {
            if (routedLineIds.Contains(line.Id))
            {
                continue;
            }

            var match = ResolveAssignmentWithTier(
                candidateAssignments,
                order.CustomerId,
                order.SiteId,
                line.ItemId,
                line.Item?.ItemType,
                order.Priority,
                order.PickUpViaId,
                order.ShipToViaId);
            if (match.Assignment is null)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    $"Route template assignment not found for line {line.Id}.");
            }

            var assignment = match.Assignment;
            var templateSteps = assignment.RouteTemplate.Steps
                .OrderBy(s => s.StepSequence)
                .ToList();
            if (templateSteps.Count == 0)
            {
                throw new ServiceException(
                    StatusCodes.Status409Conflict,
                    $"Route template '{assignment.RouteTemplate.RouteTemplateCode}' has no configured steps.");
            }

            var route = new OrderLineRouteInstance
            {
                SalesOrderId = order.Id,
                SalesOrderDetailId = line.Id,
                RouteTemplateId = assignment.RouteTemplateId,
                RouteTemplateVersionNo = assignment.RouteTemplate.VersionNo,
                RouteTemplateAssignmentId = assignment.Id,
                State = "Active",
                StartedUtc = now,
                RouteReviewState = "Pending",
                SupervisorApprovalRequired = assignment.SupervisorGateOverride ?? templateSteps.Any(s => s.RequiresSupervisorApproval),
            };

            db.OrderLineRouteInstances.Add(route);
            foreach (var step in templateSteps)
            {
                db.OrderLineRouteStepInstances.Add(new OrderLineRouteStepInstance
                {
                    OrderLineRouteInstance = route,
                    SalesOrderDetailId = line.Id,
                    StepSequence = step.StepSequence,
                    StepCode = step.StepCode,
                    StepName = step.StepName,
                    WorkCenterId = step.WorkCenterId,
                    State = "Pending",
                    IsRequired = step.IsRequired,
                    DataCaptureMode = step.DataCaptureMode,
                    TimeCaptureMode = step.TimeCaptureMode,
                    RequiresScan = step.RequiresScan,
                    RequiresUsageEntry = step.RequiresUsageEntry,
                    RequiresScrapEntry = step.RequiresScrapEntry,
                    RequiresSerialCapture = step.RequiresSerialCapture,
                    RequiresChecklistCompletion = step.RequiresChecklistCompletion,
                    ChecklistTemplateId = step.ChecklistTemplateId,
                    ChecklistFailurePolicy = step.ChecklistFailurePolicy,
                    RequireScrapReasonWhenBad = step.RequireScrapReasonWhenBad,
                    RequiresTrailerCapture = step.RequiresTrailerCapture,
                    RequiresSerialLoadVerification = step.RequiresSerialLoadVerification,
                    GeneratePackingSlipOnComplete = step.GeneratePackingSlipOnComplete,
                    GenerateBolOnComplete = step.GenerateBolOnComplete,
                    RequiresAttachment = step.RequiresAttachment,
                    RequiresSupervisorApproval = step.RequiresSupervisorApproval,
                    TimeCaptureSource = "SystemScan",
                });
            }
        }
    }

    internal static (RouteTemplateAssignment? Assignment, int? Tier) ResolveAssignmentWithTier(
        IReadOnlyCollection<RouteTemplateAssignment> candidates,
        int customerId,
        int siteId,
        int itemId,
        string? itemType,
        int? orderPriority,
        int? pickUpViaId,
        int? shipToViaId)
    {
        var matches = candidates
            .Select(a => new
            {
                Assignment = a,
                Tier = MatchTier(a, customerId, siteId, itemId, itemType, orderPriority, pickUpViaId, shipToViaId),
            })
            .Where(x => x.Tier.HasValue)
            .ToList();

        if (matches.Count == 0)
        {
            return (null, null);
        }

        var selected = matches
            .OrderBy(x => x.Tier!.Value)
            .ThenBy(x => x.Assignment.Priority)
            .ThenByDescending(x => x.Assignment.RevisionNo)
            .ThenByDescending(x => x.Assignment.EffectiveFromUtc ?? DateTime.MinValue)
            .ThenByDescending(x => x.Assignment.Id)
            .First();

        return (selected.Assignment, selected.Tier);
    }

    internal static int? MatchTier(
        RouteTemplateAssignment assignment,
        int customerId,
        int siteId,
        int itemId,
        string? itemType,
        int? orderPriority,
        int? pickUpViaId,
        int? shipToViaId)
    {
        if (assignment.OrderPriorityMin.HasValue && (!orderPriority.HasValue || orderPriority.Value < assignment.OrderPriorityMin.Value))
        {
            return null;
        }

        if (assignment.OrderPriorityMax.HasValue && (!orderPriority.HasValue || orderPriority.Value > assignment.OrderPriorityMax.Value))
        {
            return null;
        }

        if (assignment.PickUpViaId.HasValue && assignment.PickUpViaId != pickUpViaId)
        {
            return null;
        }

        if (assignment.ShipToViaId.HasValue && assignment.ShipToViaId != shipToViaId)
        {
            return null;
        }

        var matchesCustomer = assignment.CustomerId == customerId;
        var matchesSite = assignment.SiteId == siteId;
        var matchesItem = assignment.ItemId == itemId;
        var matchesItemType = !string.IsNullOrWhiteSpace(itemType) &&
                              !string.IsNullOrWhiteSpace(assignment.ItemType) &&
                              string.Equals(assignment.ItemType, itemType, StringComparison.OrdinalIgnoreCase);

        if (matchesCustomer && matchesItem && matchesSite)
        {
            return 1;
        }

        if (matchesCustomer && matchesItemType && matchesSite && assignment.ItemId is null)
        {
            return 2;
        }

        if (matchesItem && matchesSite && assignment.CustomerId is null)
        {
            return 3;
        }

        if (matchesItemType && matchesSite && assignment.CustomerId is null && assignment.ItemId is null)
        {
            return 4;
        }

        if (matchesCustomer && matchesSite && assignment.ItemId is null && string.IsNullOrWhiteSpace(assignment.ItemType))
        {
            return 5;
        }

        if (matchesSite && assignment.CustomerId is null && assignment.ItemId is null && string.IsNullOrWhiteSpace(assignment.ItemType))
        {
            return 6;
        }

        if (assignment.CustomerId is null && assignment.SiteId is null && assignment.ItemId is null && string.IsNullOrWhiteSpace(assignment.ItemType))
        {
            return 7;
        }

        return null;
    }
}
