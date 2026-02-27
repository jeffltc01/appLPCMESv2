using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

public class OrderKpiServiceTests
{
    [Fact]
    public async Task GetSummaryAsync_ComputesLeadHoldAndPromiseMetrics()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetSummaryAsync_ComputesLeadHoldAndPromiseMetrics));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 501,
            SalesOrderNo = "SO-501",
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow.Date),
            OrderStatus = OrderStatusCatalog.ReadyToInvoice,
            OrderLifecycleStatus = OrderStatusCatalog.Invoiced,
            OrderOrigin = "SalesMobile",
            OutboundMode = "CustomerPickup",
            SiteId = 1,
            CustomerId = 10,
            CurrentCommittedDateUtc = new DateTime(2026, 02, 26, 10, 0, 0, DateTimeKind.Utc),
            PromiseRevisionCount = 2,
        });
        db.OrderLifecycleEvents.AddRange(
            new OrderLifecycleEvent
            {
                OrderId = 501,
                EventType = "LifecycleStatusChanged",
                ToLifecycleStatus = OrderStatusCatalog.Draft,
                StatusOwnerRole = "Office",
                ActorEmpNo = "EMP1",
                OccurredUtc = new DateTime(2026, 02, 20, 10, 0, 0, DateTimeKind.Utc),
            },
            new OrderLifecycleEvent
            {
                OrderId = 501,
                EventType = "LifecycleStatusChanged",
                ToLifecycleStatus = OrderStatusCatalog.PendingOrderEntryValidation,
                StatusOwnerRole = "Office",
                ActorEmpNo = "EMP1",
                OccurredUtc = new DateTime(2026, 02, 20, 14, 0, 0, DateTimeKind.Utc),
            },
            new OrderLifecycleEvent
            {
                OrderId = 501,
                EventType = "LifecycleStatusChanged",
                ToLifecycleStatus = OrderStatusCatalog.InboundLogisticsPlanned,
                StatusOwnerRole = "Transportation",
                ActorEmpNo = "EMP2",
                OccurredUtc = new DateTime(2026, 02, 21, 10, 0, 0, DateTimeKind.Utc),
            },
            new OrderLifecycleEvent
            {
                OrderId = 501,
                EventType = "LifecycleStatusChanged",
                ToLifecycleStatus = OrderStatusCatalog.ReceivedPendingReconciliation,
                StatusOwnerRole = "Receiving",
                ActorEmpNo = "EMP3",
                OccurredUtc = new DateTime(2026, 02, 22, 10, 0, 0, DateTimeKind.Utc),
            },
            new OrderLifecycleEvent
            {
                OrderId = 501,
                EventType = "LifecycleStatusChanged",
                ToLifecycleStatus = OrderStatusCatalog.ReadyForProduction,
                StatusOwnerRole = "Receiving",
                ActorEmpNo = "EMP3",
                OccurredUtc = new DateTime(2026, 02, 22, 12, 0, 0, DateTimeKind.Utc),
            },
            new OrderLifecycleEvent
            {
                OrderId = 501,
                EventType = "LifecycleStatusChanged",
                ToLifecycleStatus = OrderStatusCatalog.ProductionComplete,
                StatusOwnerRole = "Production",
                ActorEmpNo = "EMP4",
                OccurredUtc = new DateTime(2026, 02, 24, 12, 0, 0, DateTimeKind.Utc),
            },
            new OrderLifecycleEvent
            {
                OrderId = 501,
                EventType = "HoldApplied",
                HoldOverlay = OrderStatusCatalog.OnHoldCustomer,
                ReasonCode = "CustomerNotReadyForPickup",
                StatusOwnerRole = "Transportation",
                ActorEmpNo = "EMP2",
                OccurredUtc = new DateTime(2026, 02, 25, 8, 0, 0, DateTimeKind.Utc),
            },
            new OrderLifecycleEvent
            {
                OrderId = 501,
                EventType = "HoldCleared",
                HoldOverlay = OrderStatusCatalog.OnHoldCustomer,
                ReasonCode = "HoldCleared",
                StatusOwnerRole = "Supervisor",
                ActorEmpNo = "EMP5",
                OccurredUtc = new DateTime(2026, 02, 25, 11, 0, 0, DateTimeKind.Utc),
            },
            new OrderLifecycleEvent
            {
                OrderId = 501,
                EventType = "LifecycleStatusChanged",
                ToLifecycleStatus = OrderStatusCatalog.DispatchedOrPickupReleased,
                StatusOwnerRole = "Transportation",
                ActorEmpNo = "EMP2",
                OccurredUtc = new DateTime(2026, 02, 26, 12, 0, 0, DateTimeKind.Utc),
            },
            new OrderLifecycleEvent
            {
                OrderId = 501,
                EventType = "LifecycleStatusChanged",
                ToLifecycleStatus = OrderStatusCatalog.InvoiceReady,
                StatusOwnerRole = "Office",
                ActorEmpNo = "EMP1",
                OccurredUtc = new DateTime(2026, 02, 26, 18, 0, 0, DateTimeKind.Utc),
            },
            new OrderLifecycleEvent
            {
                OrderId = 501,
                EventType = "LifecycleStatusChanged",
                ToLifecycleStatus = OrderStatusCatalog.Invoiced,
                StatusOwnerRole = "Office",
                ActorEmpNo = "EMP1",
                OccurredUtc = new DateTime(2026, 02, 27, 11, 0, 0, DateTimeKind.Utc),
            });
        db.OrderPromiseChangeEvents.AddRange(
            new OrderPromiseChangeEvent
            {
                OrderId = 501,
                EventType = "PromiseDateRevised",
                PromiseChangeReasonCode = "Logistics",
                OccurredUtc = new DateTime(2026, 02, 23, 13, 0, 0, DateTimeKind.Utc),
            },
            new OrderPromiseChangeEvent
            {
                OrderId = 501,
                EventType = "CustomerCommitmentNotificationRecorded",
                PromiseChangeReasonCode = "Logistics",
                OccurredUtc = new DateTime(2026, 02, 26, 9, 0, 0, DateTimeKind.Utc),
            });
        await db.SaveChangesAsync();

        var service = new OrderKpiService(db);
        var result = await service.GetSummaryAsync();

        Assert.Equal(1, result.TotalOrdersEvaluated);
        Assert.Equal(6, result.LeadTimeMetrics.Count);
        Assert.Equal(1, result.HoldDuration.ClosedCount);
        Assert.Equal(3d, result.HoldDuration.AverageClosedHours);
        Assert.Equal(1, result.PromiseReliability.EligibleCount);
        Assert.Equal(0, result.PromiseReliability.OnTimeCount);
        Assert.Equal(1, result.PromiseReliability.LateOrderCount);
        Assert.Equal(100d, result.PromiseReliability.SlippedWithNotificationPercent);
        Assert.Equal(0, result.DataQuality.MissingReasonCodeCount);
        Assert.Equal(0, result.DataQuality.MissingOwnershipCount);
    }

    [Fact]
    public async Task GetSummaryAsync_FlagsDataQualityIssues()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetSummaryAsync_FlagsDataQualityIssues));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 777,
            SalesOrderNo = "SO-777",
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow.Date),
            OrderStatus = OrderStatusCatalog.ReadyToShip,
            OrderLifecycleStatus = OrderStatusCatalog.ProductionComplete,
            SiteId = 1,
            CustomerId = 2,
        });
        db.OrderLifecycleEvents.Add(new OrderLifecycleEvent
        {
            OrderId = 777,
            EventType = "LifecycleStatusChanged",
            ToLifecycleStatus = OrderStatusCatalog.ProductionComplete,
            OccurredUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new OrderKpiService(db);
        var result = await service.GetSummaryAsync();

        Assert.True(result.DataQuality.MissingTimestampCount > 0);
        Assert.True(result.DataQuality.MissingOwnershipCount > 0);
        Assert.Contains(777, result.DataQuality.SampleOrderIds);
    }

    [Fact]
    public async Task GetDiagnosticsAsync_ReturnsAffectedOrdersAndSupportsIssueFilter()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetDiagnosticsAsync_ReturnsAffectedOrdersAndSupportsIssueFilter));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 888,
            SalesOrderNo = "SO-888",
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow.Date),
            OrderStatus = OrderStatusCatalog.ReadyToInvoice,
            OrderLifecycleStatus = OrderStatusCatalog.InvoiceReady,
            SiteId = 1,
            CustomerId = 2,
        });
        db.OrderLifecycleEvents.Add(new OrderLifecycleEvent
        {
            OrderId = 888,
            EventType = "HoldApplied",
            HoldOverlay = OrderStatusCatalog.OnHoldCustomer,
            OccurredUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new OrderKpiService(db);
        var allIssues = await service.GetDiagnosticsAsync();
        var missingOwnershipOnly = await service.GetDiagnosticsAsync(issueType: "missingOwnership");

        Assert.True(allIssues.TotalAffectedOrders >= 1);
        Assert.Contains(allIssues.Items, i => i.OrderId == 888);
        Assert.Contains(missingOwnershipOnly.Items, i => i.OrderId == 888 && i.MissingOwnershipCount > 0);
    }
}
