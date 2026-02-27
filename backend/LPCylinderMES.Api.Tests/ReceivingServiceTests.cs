using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

public class ReceivingServiceTests
{
    [Fact]
    public async Task CompleteReceivingAsync_SameTierPrefersLowerPriorityNumber()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteReceivingAsync_SameTierPrefersLowerPriorityNumber));
        db.Items.Add(new Item { Id = 71, ItemNo = "TNK-71", ItemType = "Tank", RequiresSerialNumbers = 0 });
        SeedRoutingTemplate(db, routeTemplateId: 7110, workCenterId: 7111);
        SeedRoutingTemplate(db, routeTemplateId: 7120, workCenterId: 7121);
        db.RouteTemplateAssignments.AddRange(
            new RouteTemplateAssignment
            {
                Id = 7112,
                AssignmentName = "Exact lower precedence",
                CustomerId = 1,
                ItemId = 71,
                SiteId = 1,
                RouteTemplateId = 7110,
                IsActive = true,
                Priority = 25,
                RevisionNo = 1,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            new RouteTemplateAssignment
            {
                Id = 7122,
                AssignmentName = "Exact higher precedence",
                CustomerId = 1,
                ItemId = 71,
                SiteId = 1,
                RouteTemplateId = 7120,
                IsActive = true,
                Priority = 1,
                RevisionNo = 1,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 70,
            SalesOrderNo = "SO-70",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.PickupScheduled,
            OrderLifecycleStatus = OrderStatusCatalog.InboundInTransit,
            CustomerId = 1,
            SiteId = 1,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 701,
                    LineNo = 1,
                    ItemId = 71,
                    QuantityAsOrdered = 1,
                    QuantityAsReceived = 0,
                    SalesOrderId = 70,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetReceivingDetailHandler = (id, _) => Task.FromResult<ReceivingOrderDetailDto?>(
                new ReceivingOrderDetailDto(
                    id,
                    "SO-70",
                    OrderStatusCatalog.Received,
                    "Customer",
                    "Pickup",
                    "TR-1",
                    null,
                    DateTime.UtcNow,
                    [])),
        };

        var service = new ReceivingService(db, queries);
        await service.CompleteReceivingAsync(
            70,
            new CompleteReceivingDto(DateTime.UtcNow, [new ReceivingLineUpdateDto(701, true, 1)], null));

        var route = await db.OrderLineRouteInstances.SingleAsync(r => r.SalesOrderId == 70 && r.SalesOrderDetailId == 701);
        Assert.Equal(7120, route.RouteTemplateId);
        Assert.Equal(7122, route.RouteTemplateAssignmentId);
    }

    [Fact]
    public async Task CompleteReceivingAsync_RouteResolutionPrefersExactMatchOverGlobal()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteReceivingAsync_RouteResolutionPrefersExactMatchOverGlobal));
        db.Items.Add(new Item { Id = 81, ItemNo = "TNK-81", ItemType = "Tank", RequiresSerialNumbers = 0 });
        SeedRoutingTemplate(db, routeTemplateId: 8110, workCenterId: 8111);
        SeedRoutingTemplate(db, routeTemplateId: 8120, workCenterId: 8121);
        db.RouteTemplateAssignments.AddRange(
            new RouteTemplateAssignment
            {
                Id = 8112,
                AssignmentName = "Exact customer+item+site",
                CustomerId = 1,
                ItemId = 81,
                SiteId = 1,
                RouteTemplateId = 8110,
                IsActive = true,
                Priority = 5,
                RevisionNo = 1,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            new RouteTemplateAssignment
            {
                Id = 8122,
                AssignmentName = "Global route",
                RouteTemplateId = 8120,
                IsActive = true,
                Priority = 999,
                RevisionNo = 999,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 80,
            SalesOrderNo = "SO-80",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.PickupScheduled,
            OrderLifecycleStatus = OrderStatusCatalog.InboundInTransit,
            CustomerId = 1,
            SiteId = 1,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 801,
                    LineNo = 1,
                    ItemId = 81,
                    QuantityAsOrdered = 1,
                    QuantityAsReceived = 0,
                    SalesOrderId = 80,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetReceivingDetailHandler = (id, _) => Task.FromResult<ReceivingOrderDetailDto?>(
                new ReceivingOrderDetailDto(
                    id,
                    "SO-80",
                    OrderStatusCatalog.Received,
                    "Customer",
                    "Pickup",
                    "TR-1",
                    null,
                    DateTime.UtcNow,
                    [])),
        };

        var service = new ReceivingService(db, queries);
        await service.CompleteReceivingAsync(
            80,
            new CompleteReceivingDto(DateTime.UtcNow, [new ReceivingLineUpdateDto(801, true, 1)], null));

        var route = await db.OrderLineRouteInstances.SingleAsync(r => r.SalesOrderId == 80 && r.SalesOrderDetailId == 801);
        Assert.Equal(8110, route.RouteTemplateId);
        Assert.Equal(8112, route.RouteTemplateAssignmentId);
    }

    [Fact]
    public async Task CompleteReceivingAsync_LifecycleInboundState_TransitionsToReadyForProduction()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteReceivingAsync_LifecycleInboundState_TransitionsToReadyForProduction));
        db.Items.Add(new Item { Id = 91, ItemNo = "TNK-91", ItemType = "Tank", RequiresSerialNumbers = 0 });
        SeedRoutingTemplate(db, routeTemplateId: 9010, workCenterId: 9011);
        db.RouteTemplateAssignments.Add(new RouteTemplateAssignment
        {
            Id = 9012,
            AssignmentName = "Global route",
            RouteTemplateId = 9010,
            IsActive = true,
            Priority = 1,
            RevisionNo = 1,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 90,
            SalesOrderNo = "SO-90",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.PickupScheduled,
            OrderLifecycleStatus = OrderStatusCatalog.InboundInTransit,
            CustomerId = 1,
            SiteId = 1,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 901,
                    LineNo = 1,
                    ItemId = 91,
                    QuantityAsOrdered = 2,
                    QuantityAsReceived = 0,
                    SalesOrderId = 90,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetReceivingDetailHandler = (id, _) => Task.FromResult<ReceivingOrderDetailDto?>(
                new ReceivingOrderDetailDto(
                    id,
                    "SO-90",
                    OrderStatusCatalog.Received,
                    "Customer",
                    "Pickup",
                    "TR-1",
                    null,
                    DateTime.UtcNow,
                    [])),
        };

        var service = new ReceivingService(db, queries);
        var dto = new CompleteReceivingDto(DateTime.UtcNow, [new ReceivingLineUpdateDto(901, true, 2)], null);
        await service.CompleteReceivingAsync(90, dto);

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 90);
        var routes = await db.OrderLineRouteInstances.Where(r => r.SalesOrderId == 90).ToListAsync();
        Assert.Equal(OrderStatusCatalog.ReadyForProduction, order.OrderLifecycleStatus);
        Assert.Single(routes);
    }

    [Fact]
    public async Task CompleteReceivingAsync_InvalidStatus_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteReceivingAsync_InvalidStatus_ThrowsConflict));
        db.Items.Add(new Item { Id = 40, ItemNo = "TNK-40", ItemType = "Tank", RequiresSerialNumbers = 0 });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 40,
            SalesOrderNo = "SO-40",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            CustomerId = 1,
            SiteId = 1,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 401,
                    LineNo = 1,
                    ItemId = 40,
                    QuantityAsOrdered = 2,
                    SalesOrderId = 40,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var service = new ReceivingService(db, new FakeOrderQueryService());
        var dto = new CompleteReceivingDto(
            DateTime.UtcNow,
            [new ReceivingLineUpdateDto(401, true, 2)],
            null);

        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.CompleteReceivingAsync(40, dto));
        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task CompleteReceivingAsync_SetsReceivedStatus_AndAddsLines()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteReceivingAsync_SetsReceivedStatus_AndAddsLines));
        db.Items.AddRange(
            new Item { Id = 51, ItemNo = "TNK-51", ItemType = "Tank", RequiresSerialNumbers = 0, ItemDescription = "Tank 51" },
            new Item { Id = 52, ItemNo = "TNK-52", ItemType = "Tank", RequiresSerialNumbers = 0, ItemDescription = "Tank 52" }
        );
        SeedRoutingTemplate(db, routeTemplateId: 5010, workCenterId: 5011);
        db.RouteTemplateAssignments.Add(new RouteTemplateAssignment
        {
            Id = 5012,
            AssignmentName = "Global route",
            RouteTemplateId = 5010,
            IsActive = true,
            Priority = 1,
            RevisionNo = 1,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 50,
            SalesOrderNo = "SO-50",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.PickupScheduled,
            CustomerId = 1,
            SiteId = 1,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 501,
                    LineNo = 1,
                    ItemId = 51,
                    QuantityAsOrdered = 5,
                    QuantityAsReceived = 0,
                    SalesOrderId = 50,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetReceivingDetailHandler = (id, _) => Task.FromResult<ReceivingOrderDetailDto?>(
                new ReceivingOrderDetailDto(
                    id,
                    "SO-50",
                    OrderStatusCatalog.Received,
                    "Customer",
                    "Pickup",
                    "TR-1",
                    null,
                    DateTime.UtcNow,
                    [])),
        };

        var service = new ReceivingService(db, queries);
        var receivedAt = new DateTime(2026, 2, 24, 0, 0, 0, DateTimeKind.Utc);
        var dto = new CompleteReceivingDto(
            receivedAt,
            [new ReceivingLineUpdateDto(501, false, 3)],
            [new ReceivingAddLineDto(52, 2)]);

        var result = await service.CompleteReceivingAsync(50, dto);
        var order = await db.SalesOrders.Include(o => o.SalesOrderDetails).FirstAsync(o => o.Id == 50);
        var routes = await db.OrderLineRouteInstances
            .Where(r => r.SalesOrderId == 50)
            .ToListAsync();

        Assert.Equal(OrderStatusCatalog.Received, order.OrderStatus);
        Assert.Equal(receivedAt, order.ReceivedDate);
        Assert.Equal(OrderStatusCatalog.Received, result.OrderStatus);
        Assert.Equal(2, routes.Count);

        var originalLine = order.SalesOrderDetails.Single(l => l.Id == 501);
        Assert.Equal(0, originalLine.QuantityAsReceived);

        var addedLine = order.SalesOrderDetails.Single(l => l.ItemId == 52);
        Assert.Equal(2, addedLine.QuantityAsReceived);
        Assert.Equal(2, addedLine.LineNo);
    }

    private static void SeedRoutingTemplate(LpcAppsDbContext db, int routeTemplateId, int workCenterId)
    {
        db.WorkCenters.Add(new WorkCenter
        {
            Id = workCenterId,
            WorkCenterCode = $"WC-{workCenterId}",
            WorkCenterName = "Routing WC",
            SiteId = 1,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.RouteTemplates.Add(new RouteTemplate
        {
            Id = routeTemplateId,
            RouteTemplateCode = $"RT-{routeTemplateId}",
            RouteTemplateName = "Routing template",
            IsActive = true,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
            Steps =
            {
                new RouteTemplateStep
                {
                    Id = routeTemplateId + 1,
                    StepSequence = 1,
                    StepCode = "STEP-1",
                    StepName = "Prep",
                    WorkCenterId = workCenterId,
                    IsRequired = true,
                },
            },
        });
    }
}

