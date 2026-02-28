using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;

namespace LPCylinderMES.Api.Tests;

public class OrderQueryServicePendingQueuesTests
{
    [Fact]
    public async Task GetPendingRouteReviewQueueAsync_ReturnsOnlyOrdersWithPendingRouteReviewState()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetPendingRouteReviewQueueAsync_ReturnsOnlyOrdersWithPendingRouteReviewState));
        SeedSharedLookupData(db);

        SeedOrderWithRoute(db, orderId: 1001, routeId: 51001, routeReviewState: "Pending", routeState: "Active", supervisorApprovalRequired: false, supervisorApprovedUtc: null);
        SeedOrderWithRoute(db, orderId: 1002, routeId: 51002, routeReviewState: "Validated", routeState: "Active", supervisorApprovalRequired: false, supervisorApprovedUtc: null);
        SeedOrderWithRoute(db, orderId: 1003, routeId: 51003, routeReviewState: "Pending", routeState: "Cancelled", supervisorApprovalRequired: false, supervisorApprovedUtc: null);
        SeedOrderWithoutRoutes(db, orderId: 1004);

        await db.SaveChangesAsync();

        var service = new OrderQueryService(db);
        var result = await service.GetPendingRouteReviewQueueAsync();

        Assert.Single(result);
        Assert.Equal(1001, result[0].Id);
    }

    [Fact]
    public async Task GetPendingSupervisorReviewQueueAsync_ReturnsOnlyOrdersAwaitingSupervisorGateDecision()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetPendingSupervisorReviewQueueAsync_ReturnsOnlyOrdersAwaitingSupervisorGateDecision));
        SeedSharedLookupData(db);

        SeedOrderWithRoute(db, orderId: 2001, routeId: 52001, routeReviewState: "Validated", routeState: "PendingSupervisorReview", supervisorApprovalRequired: true, supervisorApprovedUtc: null, lifecycleStatus: OrderStatusCatalog.ProductionCompletePendingApproval);
        SeedOrderWithRoute(db, orderId: 2002, routeId: 52002, routeReviewState: "Validated", routeState: "PendingSupervisorReview", supervisorApprovalRequired: true, supervisorApprovedUtc: DateTime.UtcNow, lifecycleStatus: OrderStatusCatalog.ProductionCompletePendingApproval);
        SeedOrderWithRoute(db, orderId: 2003, routeId: 52003, routeReviewState: "Validated", routeState: "PendingSupervisorReview", supervisorApprovalRequired: false, supervisorApprovedUtc: null, lifecycleStatus: OrderStatusCatalog.ProductionCompletePendingApproval);
        SeedOrderWithRoute(db, orderId: 2004, routeId: 52004, routeReviewState: "Validated", routeState: "Active", supervisorApprovalRequired: true, supervisorApprovedUtc: null, lifecycleStatus: OrderStatusCatalog.ProductionCompletePendingApproval);
        SeedOrderWithRoute(db, orderId: 2005, routeId: 52005, routeReviewState: "Validated", routeState: "PendingSupervisorReview", supervisorApprovalRequired: true, supervisorApprovedUtc: null, lifecycleStatus: OrderStatusCatalog.ProductionCompletePendingApproval);
        SeedSecondRouteForSameOrder(db, orderId: 2005, routeId: 52006, routeState: "PendingSupervisorReview");
        SeedOrderWithRoute(db, orderId: 2006, routeId: 52007, routeReviewState: "Validated", routeState: "PendingSupervisorReview", supervisorApprovalRequired: true, supervisorApprovedUtc: null, lifecycleStatus: OrderStatusCatalog.InProduction);

        await db.SaveChangesAsync();

        var service = new OrderQueryService(db);
        var result = await service.GetPendingSupervisorReviewQueueAsync();

        var orderIds = result.Select(r => r.Id).OrderBy(id => id).ToList();
        Assert.Equal([2001, 2005], orderIds);
    }

    private static void SeedSharedLookupData(Data.LpcAppsDbContext db)
    {
        db.Sites.Add(new Site
        {
            Id = 1,
            Name = "Main",
            SiteCode = "MAIN",
        });
        db.Customers.Add(new Customer
        {
            Id = 1,
            Name = "Customer A",
        });
        db.Items.Add(new Item
        {
            Id = 1,
            ItemNo = "ITEM-1",
            ItemType = "Tank",
            RequiresSerialNumbers = 0,
        });
    }

    private static void SeedOrderWithRoute(
        Data.LpcAppsDbContext db,
        int orderId,
        long routeId,
        string routeReviewState,
        string routeState,
        bool supervisorApprovalRequired,
        DateTime? supervisorApprovedUtc,
        string lifecycleStatus = OrderStatusCatalog.InProduction)
    {
        SeedOrderWithoutRoutes(db, orderId, lifecycleStatus);
        db.OrderLineRouteInstances.Add(new OrderLineRouteInstance
        {
            Id = routeId,
            SalesOrderId = orderId,
            SalesOrderDetailId = orderId * 10,
            RouteTemplateId = 1,
            RouteTemplateVersionNo = 1,
            State = routeState,
            StartedUtc = DateTime.UtcNow,
            RouteReviewState = routeReviewState,
            SupervisorApprovalRequired = supervisorApprovalRequired,
            SupervisorApprovedUtc = supervisorApprovedUtc,
        });
    }

    private static void SeedSecondRouteForSameOrder(Data.LpcAppsDbContext db, int orderId, long routeId, string routeState)
    {
        db.OrderLineRouteInstances.Add(new OrderLineRouteInstance
        {
            Id = routeId,
            SalesOrderId = orderId,
            SalesOrderDetailId = orderId * 10,
            RouteTemplateId = 1,
            RouteTemplateVersionNo = 1,
            State = routeState,
            StartedUtc = DateTime.UtcNow,
            RouteReviewState = "Validated",
            SupervisorApprovalRequired = true,
            SupervisorApprovedUtc = null,
        });
    }

    private static void SeedOrderWithoutRoutes(Data.LpcAppsDbContext db, int orderId, string lifecycleStatus = OrderStatusCatalog.InProduction)
    {
        db.SalesOrders.Add(new SalesOrder
        {
            Id = orderId,
            SalesOrderNo = $"SO-{orderId}",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.Received,
            OrderLifecycleStatus = lifecycleStatus,
            CustomerId = 1,
            SiteId = 1,
            ReceivedDate = DateTime.UtcNow.Date,
        });
        db.SalesOrderDetails.Add(new SalesOrderDetail
        {
            Id = orderId * 10,
            SalesOrderId = orderId,
            LineNo = 1,
            ItemId = 1,
            QuantityAsOrdered = 1,
            SiteId = 1,
        });
    }
}
