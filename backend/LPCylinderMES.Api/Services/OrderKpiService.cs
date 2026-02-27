using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public sealed class OrderKpiService(LpcAppsDbContext db) : IOrderKpiService
{
    private const string LifecycleStatusChanged = "LifecycleStatusChanged";
    private const string HoldApplied = "HoldApplied";
    private const string HoldCleared = "HoldCleared";
    private const string CustomerCommitmentNotificationRecorded = "CustomerCommitmentNotificationRecorded";

    public async Task<OrderKpiSummaryDto> GetSummaryAsync(
        DateTime? fromUtc = null,
        DateTime? toUtc = null,
        int? siteId = null,
        CancellationToken cancellationToken = default)
    {
        var ordersQuery = db.SalesOrders.AsNoTracking().AsQueryable();
        if (siteId.HasValue)
        {
            ordersQuery = ordersQuery.Where(o => o.SiteId == siteId.Value);
        }

        if (fromUtc.HasValue)
        {
            var fromDate = DateOnly.FromDateTime(fromUtc.Value);
            ordersQuery = ordersQuery.Where(o =>
                (o.StatusUpdatedUtc.HasValue && o.StatusUpdatedUtc.Value >= fromUtc.Value) ||
                o.OrderDate >= fromDate);
        }

        if (toUtc.HasValue)
        {
            var toDate = DateOnly.FromDateTime(toUtc.Value);
            ordersQuery = ordersQuery.Where(o =>
                (o.StatusUpdatedUtc.HasValue && o.StatusUpdatedUtc.Value <= toUtc.Value) ||
                o.OrderDate <= toDate);
        }

        var orders = await ordersQuery.ToListAsync(cancellationToken);
        if (orders.Count == 0)
        {
            return new OrderKpiSummaryDto(
                DateTime.UtcNow,
                0,
                new List<KpiLeadTimeMetricDto>(),
                new HoldDurationMetricDto(0, 0, null, null),
                new PromiseReliabilityMetricDto(0, 0, null, null, 0, null, [], [], []),
                new KpiDataQualityDto(0, 0, 0, 0, []));
        }

        var orderIds = orders.Select(o => o.Id).ToList();
        var lifecycleEvents = await db.OrderLifecycleEvents
            .AsNoTracking()
            .Where(e => orderIds.Contains(e.OrderId))
            .OrderBy(e => e.OccurredUtc)
            .ToListAsync(cancellationToken);
        var promiseEvents = await db.OrderPromiseChangeEvents
            .AsNoTracking()
            .Where(e => orderIds.Contains(e.OrderId))
            .ToListAsync(cancellationToken);

        var lifecycleByOrder = lifecycleEvents
            .GroupBy(e => e.OrderId)
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.OccurredUtc).ToList());
        var promiseByOrder = promiseEvents
            .GroupBy(e => e.OrderId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var qualityIssues = new HashSet<int>();
        var missingTimestampCount = 0;
        var missingReasonCodeCount = 0;
        var missingOwnershipCount = 0;
        var invalidOrderingCount = 0;

        var leadTimeMetrics = new List<KpiLeadTimeMetricDto>
        {
            BuildLeadMetric(
                "sales_mobile_to_validation",
                "Draft (sales-mobile) -> validation lead time",
                orders,
                lifecycleByOrder,
                o => string.Equals(o.OrderOrigin, "SalesMobile", StringComparison.OrdinalIgnoreCase),
                OrderStatusCatalog.Draft,
                OrderStatusCatalog.PendingOrderEntryValidation,
                qualityIssues,
                ref missingTimestampCount,
                ref invalidOrderingCount),
            BuildLeadMetric(
                "inbound_planned_to_received",
                "Inbound planned -> received lead time",
                orders,
                lifecycleByOrder,
                _ => true,
                OrderStatusCatalog.InboundLogisticsPlanned,
                OrderStatusCatalog.ReceivedPendingReconciliation,
                qualityIssues,
                ref missingTimestampCount,
                ref invalidOrderingCount),
            BuildLeadMetric(
                "ready_for_production_to_complete",
                "Ready for production -> production complete lead time",
                orders,
                lifecycleByOrder,
                _ => true,
                OrderStatusCatalog.ReadyForProduction,
                OrderStatusCatalog.ProductionComplete,
                qualityIssues,
                ref missingTimestampCount,
                ref invalidOrderingCount),
            BuildLeadMetric(
                "production_complete_to_release_pickup",
                "Production complete -> pickup released lead time",
                orders,
                lifecycleByOrder,
                o => string.Equals(o.OutboundMode, "CustomerPickup", StringComparison.OrdinalIgnoreCase),
                OrderStatusCatalog.ProductionComplete,
                OrderStatusCatalog.DispatchedOrPickupReleased,
                qualityIssues,
                ref missingTimestampCount,
                ref invalidOrderingCount),
            BuildLeadMetric(
                "release_to_invoice_ready",
                "Release/dispatch -> invoice ready lead time",
                orders,
                lifecycleByOrder,
                _ => true,
                OrderStatusCatalog.DispatchedOrPickupReleased,
                OrderStatusCatalog.InvoiceReady,
                qualityIssues,
                ref missingTimestampCount,
                ref invalidOrderingCount),
            BuildLeadMetric(
                "invoice_ready_to_invoiced",
                "Invoice ready -> invoiced lead time",
                orders,
                lifecycleByOrder,
                _ => true,
                OrderStatusCatalog.InvoiceReady,
                OrderStatusCatalog.Invoiced,
                qualityIssues,
                ref missingTimestampCount,
                ref invalidOrderingCount),
        };

        var holdDuration = BuildHoldDuration(orders, lifecycleByOrder, qualityIssues, ref missingReasonCodeCount, ref missingOwnershipCount);
        var promiseReliability = BuildPromiseReliability(orders, lifecycleByOrder, promiseByOrder, qualityIssues, ref missingReasonCodeCount);

        foreach (var ev in lifecycleEvents)
        {
            if ((ev.EventType == HoldApplied || ev.EventType == HoldCleared) && string.IsNullOrWhiteSpace(ev.ReasonCode))
            {
                missingReasonCodeCount++;
                qualityIssues.Add(ev.OrderId);
            }

            if ((ev.EventType == LifecycleStatusChanged || ev.EventType == HoldApplied || ev.EventType == HoldCleared) &&
                (string.IsNullOrWhiteSpace(ev.StatusOwnerRole) || string.IsNullOrWhiteSpace(ev.ActorEmpNo)))
            {
                missingOwnershipCount++;
                qualityIssues.Add(ev.OrderId);
            }
        }

        return new OrderKpiSummaryDto(
            DateTime.UtcNow,
            orders.Count,
            leadTimeMetrics,
            holdDuration,
            promiseReliability,
            new KpiDataQualityDto(
                missingTimestampCount,
                missingReasonCodeCount,
                missingOwnershipCount,
                invalidOrderingCount,
                qualityIssues.Take(20).OrderBy(x => x).ToList()));
    }

    public async Task<OrderKpiDiagnosticsDto> GetDiagnosticsAsync(
        DateTime? fromUtc = null,
        DateTime? toUtc = null,
        int? siteId = null,
        string? issueType = null,
        CancellationToken cancellationToken = default)
    {
        var ordersQuery = db.SalesOrders.AsNoTracking().AsQueryable();
        if (siteId.HasValue)
        {
            ordersQuery = ordersQuery.Where(o => o.SiteId == siteId.Value);
        }

        if (fromUtc.HasValue)
        {
            var fromDate = DateOnly.FromDateTime(fromUtc.Value);
            ordersQuery = ordersQuery.Where(o =>
                (o.StatusUpdatedUtc.HasValue && o.StatusUpdatedUtc.Value >= fromUtc.Value) ||
                o.OrderDate >= fromDate);
        }

        if (toUtc.HasValue)
        {
            var toDate = DateOnly.FromDateTime(toUtc.Value);
            ordersQuery = ordersQuery.Where(o =>
                (o.StatusUpdatedUtc.HasValue && o.StatusUpdatedUtc.Value <= toUtc.Value) ||
                o.OrderDate <= toDate);
        }

        var orders = await ordersQuery.ToListAsync(cancellationToken);
        if (orders.Count == 0)
        {
            return new OrderKpiDiagnosticsDto(DateTime.UtcNow, 0, []);
        }

        var orderIds = orders.Select(o => o.Id).ToList();
        var lifecycleEvents = await db.OrderLifecycleEvents
            .AsNoTracking()
            .Where(e => orderIds.Contains(e.OrderId))
            .OrderBy(e => e.OccurredUtc)
            .ToListAsync(cancellationToken);
        var promiseEvents = await db.OrderPromiseChangeEvents
            .AsNoTracking()
            .Where(e => orderIds.Contains(e.OrderId))
            .ToListAsync(cancellationToken);

        var lifecycleByOrder = lifecycleEvents
            .GroupBy(e => e.OrderId)
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.OccurredUtc).ToList());
        var promiseByOrder = promiseEvents
            .GroupBy(e => e.OrderId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var normalizedIssueType = NormalizeIssueType(issueType);
        var diagnostics = orders
            .Select(order =>
            {
                lifecycleByOrder.TryGetValue(order.Id, out var orderLifecycleEvents);
                promiseByOrder.TryGetValue(order.Id, out var orderPromiseEvents);
                var quality = EvaluateOrderQuality(order, orderLifecycleEvents ?? [], orderPromiseEvents ?? []);
                return new OrderKpiDiagnosticsItemDto(
                    order.Id,
                    order.SalesOrderNo,
                    order.SiteId,
                    order.CustomerId,
                    ResolveLifecycle(order),
                    quality.MissingTimestampCount,
                    quality.MissingReasonCodeCount,
                    quality.MissingOwnershipCount,
                    quality.InvalidOrderingCount);
            })
            .Where(item => MatchesIssueFilter(item, normalizedIssueType))
            .OrderByDescending(item =>
                item.MissingTimestampCount + item.MissingReasonCodeCount + item.MissingOwnershipCount + item.InvalidOrderingCount)
            .ThenBy(item => item.OrderId)
            .Take(500)
            .ToList();

        return new OrderKpiDiagnosticsDto(
            DateTime.UtcNow,
            diagnostics.Count,
            diagnostics);
    }

    public async Task<WorkCenterKpiSummaryDto> GetWorkCenterSummaryAsync(
        DateTime? fromUtc = null,
        DateTime? toUtc = null,
        int? siteId = null,
        CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;

        var completedStepRows = await (
            from step in db.OrderLineRouteStepInstances.AsNoTracking()
            join workCenter in db.WorkCenters.AsNoTracking() on step.WorkCenterId equals workCenter.Id
            join route in db.OrderLineRouteInstances.AsNoTracking() on step.OrderLineRouteInstanceId equals route.Id
            join order in db.SalesOrders.AsNoTracking() on route.SalesOrderId equals order.Id
            where step.CompletedUtc.HasValue &&
                  (step.ManualDurationMinutes.HasValue || step.DurationMinutes.HasValue) &&
                  (!siteId.HasValue || order.SiteId == siteId.Value) &&
                  (!fromUtc.HasValue || step.CompletedUtc.Value >= fromUtc.Value) &&
                  (!toUtc.HasValue || step.CompletedUtc.Value <= toUtc.Value)
            select new
            {
                workCenter.Id,
                workCenter.WorkCenterCode,
                workCenter.WorkCenterName,
                Duration = (double?)(step.ManualDurationMinutes ?? step.DurationMinutes),
            })
            .ToListAsync(cancellationToken);

        var stepCycleTimeByWorkCenter = completedStepRows
            .GroupBy(x => new { x.Id, x.WorkCenterCode, x.WorkCenterName })
            .Select(group =>
            {
                var values = group.Select(x => x.Duration ?? 0d).OrderBy(x => x).ToList();
                return new WorkCenterCycleTimeMetricDto(
                    group.Key.Id,
                    group.Key.WorkCenterCode,
                    group.Key.WorkCenterName,
                    values.Count,
                    values.Count == 0 ? null : values.Average(),
                    Percentile(values, 0.50),
                    Percentile(values, 0.90));
            })
            .OrderBy(x => x.WorkCenterName)
            .ToList();

        var queueRows = await (
            from step in db.OrderLineRouteStepInstances.AsNoTracking()
            join workCenter in db.WorkCenters.AsNoTracking() on step.WorkCenterId equals workCenter.Id
            join route in db.OrderLineRouteInstances.AsNoTracking() on step.OrderLineRouteInstanceId equals route.Id
            join order in db.SalesOrders.AsNoTracking() on route.SalesOrderId equals order.Id
            let ageAnchorUtc = (DateTime?)(step.ScanInUtc ?? route.StartedUtc)
            where step.CompletedUtc == null &&
                  (step.State == "Pending" || step.State == "InProgress") &&
                  ageAnchorUtc.HasValue &&
                  (!siteId.HasValue || order.SiteId == siteId.Value) &&
                  (!fromUtc.HasValue || ageAnchorUtc.Value >= fromUtc.Value) &&
                  (!toUtc.HasValue || ageAnchorUtc.Value <= toUtc.Value)
            select new
            {
                workCenter.Id,
                workCenter.WorkCenterCode,
                workCenter.WorkCenterName,
                step.State,
                AgeAnchorUtc = ageAnchorUtc.Value,
            })
            .ToListAsync(cancellationToken);

        var queueAgingByWorkCenter = queueRows
            .GroupBy(x => new { x.Id, x.WorkCenterCode, x.WorkCenterName })
            .Select(group =>
            {
                var ages = group
                    .Select(x => Math.Max(0d, (nowUtc - x.AgeAnchorUtc).TotalMinutes))
                    .ToList();
                return new WorkCenterQueueAgingMetricDto(
                    group.Key.Id,
                    group.Key.WorkCenterCode,
                    group.Key.WorkCenterName,
                    group.Count(x => string.Equals(x.State, "Pending", StringComparison.Ordinal)),
                    group.Count(x => string.Equals(x.State, "InProgress", StringComparison.Ordinal)),
                    ages.Count == 0 ? null : ages.Average(),
                    ages.Count == 0 ? null : ages.Max());
            })
            .OrderBy(x => x.WorkCenterName)
            .ToList();

        var scrapRows = await (
            from scrap in db.StepScrapEntries.AsNoTracking()
            join step in db.OrderLineRouteStepInstances.AsNoTracking() on scrap.OrderLineRouteStepInstanceId equals step.Id
            join workCenter in db.WorkCenters.AsNoTracking() on step.WorkCenterId equals workCenter.Id
            join detail in db.SalesOrderDetails.AsNoTracking() on scrap.SalesOrderDetailId equals detail.Id
            join item in db.Items.AsNoTracking() on detail.ItemId equals item.Id
            join reason in db.ScrapReasons.AsNoTracking() on scrap.ScrapReasonId equals reason.Id
            join order in db.SalesOrders.AsNoTracking() on detail.SalesOrderId equals order.Id
            where (!siteId.HasValue || order.SiteId == siteId.Value) &&
                  (!fromUtc.HasValue || scrap.RecordedUtc >= fromUtc.Value) &&
                  (!toUtc.HasValue || scrap.RecordedUtc <= toUtc.Value)
            group scrap by new
            {
                WorkCenterId = workCenter.Id,
                workCenter.WorkCenterCode,
                workCenter.WorkCenterName,
                ScrapReasonId = reason.Id,
                ScrapReasonName = reason.Name,
                ItemId = item.Id,
                item.ItemNo,
                item.ItemDescription,
            }
            into grouped
            orderby grouped.Sum(x => x.QuantityScrapped) descending
            select new WorkCenterScrapMetricDto(
                grouped.Key.WorkCenterId,
                grouped.Key.WorkCenterCode,
                grouped.Key.WorkCenterName,
                grouped.Key.ScrapReasonId,
                grouped.Key.ScrapReasonName,
                grouped.Key.ItemId,
                grouped.Key.ItemNo,
                grouped.Key.ItemDescription ?? string.Empty,
                grouped.Sum(x => x.QuantityScrapped),
                grouped.Count()))
            .ToListAsync(cancellationToken);

        var supervisorRows = await db.SalesOrders
            .AsNoTracking()
            .Where(order =>
                order.PendingSupervisorReviewUtc.HasValue &&
                (!siteId.HasValue || order.SiteId == siteId.Value) &&
                (!fromUtc.HasValue || order.PendingSupervisorReviewUtc.Value >= fromUtc.Value) &&
                (!toUtc.HasValue || order.PendingSupervisorReviewUtc.Value <= toUtc.Value))
            .Select(order => new
            {
                order.PendingSupervisorReviewUtc,
                order.SupervisorReviewedUtc,
            })
            .ToListAsync(cancellationToken);

        var closedHoldHours = new List<double>();
        var activeHoldHours = new List<double>();
        foreach (var row in supervisorRows)
        {
            if (!row.PendingSupervisorReviewUtc.HasValue)
            {
                continue;
            }

            if (row.SupervisorReviewedUtc.HasValue && row.SupervisorReviewedUtc.Value >= row.PendingSupervisorReviewUtc.Value)
            {
                closedHoldHours.Add((row.SupervisorReviewedUtc.Value - row.PendingSupervisorReviewUtc.Value).TotalHours);
                continue;
            }

            activeHoldHours.Add((nowUtc - row.PendingSupervisorReviewUtc.Value).TotalHours);
        }

        var supervisorHoldTime = new SupervisorHoldTimeMetricDto(
            closedHoldHours.Count,
            activeHoldHours.Count,
            closedHoldHours.Count == 0 ? null : closedHoldHours.Average(),
            activeHoldHours.Count == 0 ? null : activeHoldHours.Average(),
            activeHoldHours.Count == 0 ? null : activeHoldHours.Max());

        var requiredUsageStepRows = await (
            from step in db.OrderLineRouteStepInstances.AsNoTracking()
            join route in db.OrderLineRouteInstances.AsNoTracking() on step.OrderLineRouteInstanceId equals route.Id
            join order in db.SalesOrders.AsNoTracking() on route.SalesOrderId equals order.Id
            let anchorUtc = (DateTime?)(step.CompletedUtc ?? step.ScanOutUtc ?? step.ScanInUtc ?? route.StartedUtc)
            where step.RequiresUsageEntry &&
                  (!siteId.HasValue || order.SiteId == siteId.Value) &&
                  (!fromUtc.HasValue || (anchorUtc.HasValue && anchorUtc.Value >= fromUtc.Value)) &&
                  (!toUtc.HasValue || (anchorUtc.HasValue && anchorUtc.Value <= toUtc.Value))
            select step.Id)
            .Distinct()
            .ToListAsync(cancellationToken);

        var usageRecordedStepRows = await (
            from usage in db.StepMaterialUsages.AsNoTracking()
            join step in db.OrderLineRouteStepInstances.AsNoTracking() on usage.OrderLineRouteStepInstanceId equals step.Id
            join route in db.OrderLineRouteInstances.AsNoTracking() on step.OrderLineRouteInstanceId equals route.Id
            join order in db.SalesOrders.AsNoTracking() on route.SalesOrderId equals order.Id
            where step.RequiresUsageEntry &&
                  (!siteId.HasValue || order.SiteId == siteId.Value) &&
                  (!fromUtc.HasValue || usage.RecordedUtc >= fromUtc.Value) &&
                  (!toUtc.HasValue || usage.RecordedUtc <= toUtc.Value)
            select usage.OrderLineRouteStepInstanceId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var requiredSet = requiredUsageStepRows.ToHashSet();
        var usageCoveredCount = usageRecordedStepRows.Count(requiredSet.Contains);
        var traceabilityCompleteness = new TraceabilityCompletenessMetricDto(
            requiredSet.Count,
            usageCoveredCount,
            requiredSet.Count == 0 ? null : (usageCoveredCount * 100.0) / requiredSet.Count,
            "Proxy: required usage-capture steps with at least one recorded usage row.");

        var allWorkCenterIds = new HashSet<int>(stepCycleTimeByWorkCenter.Select(x => x.WorkCenterId));
        foreach (var metric in queueAgingByWorkCenter)
        {
            allWorkCenterIds.Add(metric.WorkCenterId);
        }
        foreach (var metric in scrapRows)
        {
            allWorkCenterIds.Add(metric.WorkCenterId);
        }

        return new WorkCenterKpiSummaryDto(
            nowUtc,
            allWorkCenterIds.Count,
            stepCycleTimeByWorkCenter,
            queueAgingByWorkCenter,
            scrapRows,
            supervisorHoldTime,
            traceabilityCompleteness);
    }

    private static KpiLeadTimeMetricDto BuildLeadMetric(
        string metricKey,
        string label,
        List<SalesOrder> orders,
        Dictionary<int, List<OrderLifecycleEvent>> eventsByOrder,
        Func<SalesOrder, bool> orderFilter,
        string fromStatus,
        string toStatus,
        HashSet<int> qualityIssues,
        ref int missingTimestampCount,
        ref int invalidOrderingCount)
    {
        var durations = new List<double>();
        foreach (var order in orders.Where(orderFilter))
        {
            eventsByOrder.TryGetValue(order.Id, out var events);
            var fromTime = FirstReachedUtc(events, fromStatus);
            var toTime = FirstReachedUtc(events, toStatus, fromTime);

            var currentLifecycle = ResolveLifecycle(order);
            if (ShouldHaveReached(currentLifecycle, toStatus) && (!fromTime.HasValue || !toTime.HasValue))
            {
                missingTimestampCount++;
                qualityIssues.Add(order.Id);
            }

            if (!fromTime.HasValue || !toTime.HasValue)
            {
                continue;
            }

            var durationHours = (toTime.Value - fromTime.Value).TotalHours;
            if (durationHours < 0)
            {
                invalidOrderingCount++;
                qualityIssues.Add(order.Id);
                continue;
            }

            durations.Add(durationHours);
        }

        durations.Sort();
        return new KpiLeadTimeMetricDto(
            metricKey,
            label,
            durations.Count,
            durations.Count == 0 ? null : durations.Average(),
            Percentile(durations, 0.50),
            Percentile(durations, 0.90));
    }

    private static (int MissingTimestampCount, int MissingReasonCodeCount, int MissingOwnershipCount, int InvalidOrderingCount) EvaluateOrderQuality(
        SalesOrder order,
        List<OrderLifecycleEvent> lifecycleEvents,
        List<OrderPromiseChangeEvent> promiseEvents)
    {
        var missingTimestampCount = 0;
        var missingReasonCodeCount = 0;
        var missingOwnershipCount = 0;
        var invalidOrderingCount = 0;
        var currentLifecycle = ResolveLifecycle(order);

        EvaluateLeadPair(OrderStatusCatalog.Draft, OrderStatusCatalog.PendingOrderEntryValidation, lifecycleEvents, currentLifecycle, ref missingTimestampCount, ref invalidOrderingCount, requiredWhen: string.Equals(order.OrderOrigin, "SalesMobile", StringComparison.OrdinalIgnoreCase));
        EvaluateLeadPair(OrderStatusCatalog.InboundLogisticsPlanned, OrderStatusCatalog.ReceivedPendingReconciliation, lifecycleEvents, currentLifecycle, ref missingTimestampCount, ref invalidOrderingCount);
        EvaluateLeadPair(OrderStatusCatalog.ReadyForProduction, OrderStatusCatalog.ProductionComplete, lifecycleEvents, currentLifecycle, ref missingTimestampCount, ref invalidOrderingCount);
        if (string.Equals(order.OutboundMode, "CustomerPickup", StringComparison.OrdinalIgnoreCase))
        {
            EvaluateLeadPair(OrderStatusCatalog.ProductionComplete, OrderStatusCatalog.DispatchedOrPickupReleased, lifecycleEvents, currentLifecycle, ref missingTimestampCount, ref invalidOrderingCount);
        }
        EvaluateLeadPair(OrderStatusCatalog.DispatchedOrPickupReleased, OrderStatusCatalog.InvoiceReady, lifecycleEvents, currentLifecycle, ref missingTimestampCount, ref invalidOrderingCount);
        EvaluateLeadPair(OrderStatusCatalog.InvoiceReady, OrderStatusCatalog.Invoiced, lifecycleEvents, currentLifecycle, ref missingTimestampCount, ref invalidOrderingCount);

        foreach (var ev in lifecycleEvents)
        {
            if ((ev.EventType == HoldApplied || ev.EventType == HoldCleared) && string.IsNullOrWhiteSpace(ev.ReasonCode))
            {
                missingReasonCodeCount++;
            }

            if ((ev.EventType == LifecycleStatusChanged || ev.EventType == HoldApplied || ev.EventType == HoldCleared) &&
                (string.IsNullOrWhiteSpace(ev.StatusOwnerRole) || string.IsNullOrWhiteSpace(ev.ActorEmpNo)))
            {
                missingOwnershipCount++;
            }
        }

        missingReasonCodeCount += promiseEvents.Count(e =>
            string.Equals(e.EventType, "PromiseDateRevised", StringComparison.Ordinal) &&
            string.IsNullOrWhiteSpace(e.PromiseChangeReasonCode));

        return (missingTimestampCount, missingReasonCodeCount, missingOwnershipCount, invalidOrderingCount);
    }

    private static void EvaluateLeadPair(
        string fromStatus,
        string toStatus,
        List<OrderLifecycleEvent> lifecycleEvents,
        string currentLifecycle,
        ref int missingTimestampCount,
        ref int invalidOrderingCount,
        bool requiredWhen = true)
    {
        if (!requiredWhen)
        {
            return;
        }

        var fromTime = FirstReachedUtc(lifecycleEvents, fromStatus);
        var toTime = FirstReachedUtc(lifecycleEvents, toStatus, fromTime);
        if (ShouldHaveReached(currentLifecycle, toStatus) && (!fromTime.HasValue || !toTime.HasValue))
        {
            missingTimestampCount++;
        }

        if (fromTime.HasValue && toTime.HasValue && (toTime.Value - fromTime.Value).TotalHours < 0)
        {
            invalidOrderingCount++;
        }
    }

    private static HoldDurationMetricDto BuildHoldDuration(
        List<SalesOrder> orders,
        Dictionary<int, List<OrderLifecycleEvent>> eventsByOrder,
        HashSet<int> qualityIssues,
        ref int missingReasonCodeCount,
        ref int missingOwnershipCount)
    {
        var closedHours = new List<double>();
        var activeAges = new List<double>();
        var now = DateTime.UtcNow;
        var activeCount = 0;

        foreach (var order in orders)
        {
            if (!eventsByOrder.TryGetValue(order.Id, out var events))
            {
                continue;
            }

            var holds = events.Where(e =>
                    e.EventType == HoldApplied &&
                    string.Equals(e.HoldOverlay, OrderStatusCatalog.OnHoldCustomer, StringComparison.Ordinal))
                .OrderBy(e => e.OccurredUtc)
                .ToList();

            var clears = events.Where(e =>
                    e.EventType == HoldCleared &&
                    string.Equals(e.HoldOverlay, OrderStatusCatalog.OnHoldCustomer, StringComparison.Ordinal))
                .OrderBy(e => e.OccurredUtc)
                .ToList();

            foreach (var hold in holds)
            {
                if (string.IsNullOrWhiteSpace(hold.ReasonCode))
                {
                    missingReasonCodeCount++;
                    qualityIssues.Add(order.Id);
                }

                if (string.IsNullOrWhiteSpace(hold.StatusOwnerRole) || string.IsNullOrWhiteSpace(hold.ActorEmpNo))
                {
                    missingOwnershipCount++;
                    qualityIssues.Add(order.Id);
                }

                var clear = clears.FirstOrDefault(c => c.OccurredUtc >= hold.OccurredUtc);
                if (clear is null)
                {
                    activeCount++;
                    activeAges.Add((now - hold.OccurredUtc).TotalHours);
                    continue;
                }

                var hours = (clear.OccurredUtc - hold.OccurredUtc).TotalHours;
                if (hours >= 0)
                {
                    closedHours.Add(hours);
                }
            }
        }

        return new HoldDurationMetricDto(
            closedHours.Count,
            activeCount,
            closedHours.Count == 0 ? null : closedHours.Average(),
            activeAges.Count == 0 ? null : activeAges.Average());
    }

    private static PromiseReliabilityMetricDto BuildPromiseReliability(
        List<SalesOrder> orders,
        Dictionary<int, List<OrderLifecycleEvent>> lifecycleByOrder,
        Dictionary<int, List<OrderPromiseChangeEvent>> promiseByOrder,
        HashSet<int> qualityIssues,
        ref int missingReasonCodeCount)
    {
        var eligible = 0;
        var onTime = 0;
        var late = 0;
        var slipDays = new List<double>();
        var lateWithNotification = 0;

        foreach (var order in orders)
        {
            var releaseUtc = FirstReachedUtc(
                lifecycleByOrder.TryGetValue(order.Id, out var list) ? list : null,
                OrderStatusCatalog.DispatchedOrPickupReleased)
                ?? order.DispatchDate;
            if (!order.CurrentCommittedDateUtc.HasValue || !releaseUtc.HasValue)
            {
                continue;
            }

            eligible++;
            var deltaDays = (releaseUtc.Value - order.CurrentCommittedDateUtc.Value).TotalDays;
            if (deltaDays <= 0)
            {
                onTime++;
            }
            else
            {
                late++;
                slipDays.Add(deltaDays);
                var hasNotification = promiseByOrder.TryGetValue(order.Id, out var promiseEvents) &&
                                      promiseEvents.Any(e => string.Equals(e.EventType, CustomerCommitmentNotificationRecorded, StringComparison.Ordinal));
                if (hasNotification)
                {
                    lateWithNotification++;
                }
                else
                {
                    qualityIssues.Add(order.Id);
                }
            }
        }

        var revisionBySite = orders
            .Where(o => (o.PromiseRevisionCount ?? 0) > 0)
            .GroupBy(o => o.SiteId)
            .Select(g => new KpiGroupedCountDto($"Site:{g.Key}", g.Sum(x => x.PromiseRevisionCount ?? 0)))
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToList();
        var revisionByCustomer = orders
            .Where(o => (o.PromiseRevisionCount ?? 0) > 0)
            .GroupBy(o => o.CustomerId)
            .Select(g => new KpiGroupedCountDto($"Customer:{g.Key}", g.Sum(x => x.PromiseRevisionCount ?? 0)))
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToList();
        var revisionByReason = promiseByOrder
            .SelectMany(kvp => kvp.Value)
            .Where(e => string.Equals(e.EventType, "PromiseDateRevised", StringComparison.Ordinal))
            .Select(e => e.PromiseChangeReasonCode)
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .GroupBy(code => code!)
            .Select(g => new KpiGroupedCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToList();

        missingReasonCodeCount += promiseByOrder
            .SelectMany(kvp => kvp.Value)
            .Count(e => string.Equals(e.EventType, "PromiseDateRevised", StringComparison.Ordinal) &&
                        string.IsNullOrWhiteSpace(e.PromiseChangeReasonCode));

        return new PromiseReliabilityMetricDto(
            eligible,
            onTime,
            eligible == 0 ? null : (onTime * 100.0) / eligible,
            late == 0 ? null : slipDays.Average(),
            late,
            late == 0 ? null : (lateWithNotification * 100.0) / late,
            revisionBySite,
            revisionByCustomer,
            revisionByReason);
    }

    private static DateTime? FirstReachedUtc(List<OrderLifecycleEvent>? events, string targetStatus, DateTime? notBefore = null)
    {
        if (events is null || events.Count == 0)
        {
            return null;
        }

        return events
            .Where(e =>
                string.Equals(e.EventType, LifecycleStatusChanged, StringComparison.Ordinal) &&
                string.Equals(e.ToLifecycleStatus, targetStatus, StringComparison.Ordinal) &&
                (!notBefore.HasValue || e.OccurredUtc >= notBefore.Value))
            .Select(e => (DateTime?)e.OccurredUtc)
            .FirstOrDefault();
    }

    private static string ResolveLifecycle(SalesOrder order)
    {
        if (!string.IsNullOrWhiteSpace(order.OrderLifecycleStatus))
        {
            return order.OrderLifecycleStatus!;
        }

        return OrderStatusCatalog.MapLegacyToLifecycle(order.OrderStatus, order.OrderOrigin, order.ValidatedUtc);
    }

    private static bool ShouldHaveReached(string currentStatus, string expectedStatus)
    {
        var currentIndex = Array.IndexOf(OrderStatusCatalog.LifecycleWorkflowSteps, currentStatus);
        var expectedIndex = Array.IndexOf(OrderStatusCatalog.LifecycleWorkflowSteps, expectedStatus);
        return currentIndex >= 0 && expectedIndex >= 0 && currentIndex >= expectedIndex;
    }

    private static double? Percentile(List<double> sortedValues, double percentile)
    {
        if (sortedValues.Count == 0)
        {
            return null;
        }

        if (sortedValues.Count == 1)
        {
            return sortedValues[0];
        }

        var rank = percentile * (sortedValues.Count - 1);
        var lower = (int)Math.Floor(rank);
        var upper = (int)Math.Ceiling(rank);
        if (lower == upper)
        {
            return sortedValues[lower];
        }

        var fraction = rank - lower;
        return sortedValues[lower] + ((sortedValues[upper] - sortedValues[lower]) * fraction);
    }

    private static string NormalizeIssueType(string? issueType)
    {
        if (string.IsNullOrWhiteSpace(issueType))
        {
            return "all";
        }

        return issueType.Trim().ToLowerInvariant() switch
        {
            "missingtimestamp" => "missingtimestamp",
            "missingreasoncode" => "missingreasoncode",
            "missingownership" => "missingownership",
            "invalidordering" => "invalidordering",
            _ => "all",
        };
    }

    private static bool MatchesIssueFilter(OrderKpiDiagnosticsItemDto item, string issueType) => issueType switch
    {
        "missingtimestamp" => item.MissingTimestampCount > 0,
        "missingreasoncode" => item.MissingReasonCodeCount > 0,
        "missingownership" => item.MissingOwnershipCount > 0,
        "invalidordering" => item.InvalidOrderingCount > 0,
        _ => item.MissingTimestampCount > 0 ||
             item.MissingReasonCodeCount > 0 ||
             item.MissingOwnershipCount > 0 ||
             item.InvalidOrderingCount > 0,
    };
}
