using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

public class WorkCenterWorkflowServiceTests
{
    [Fact]
    public async Task ScanInAsync_WhenPreviousRequiredStepIncomplete_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ScanInAsync_WhenPreviousRequiredStepIncomplete_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 500, lineId: 5001, routeId: 5100, firstStepState: "Pending", secondStepState: "Pending");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.ScanInAsync(500, 5001, 5102, new OperatorScanInDto("EMP001", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task CompleteStepAsync_WhenUsageRequiredWithoutUsage_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteStepAsync_WhenUsageRequiredWithoutUsage_ThrowsConflict));
        SeedRouteWithTwoSteps(db, orderId: 600, lineId: 6001, routeId: 6100, firstStepState: "Completed", secondStepState: "InProgress", requiresUsageForSecond: true);
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.CompleteStepAsync(600, 6001, 6102, new CompleteWorkCenterStepDto("EMP002", null)));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task CloseReworkAsync_ClearsOrderReworkOverlay()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CloseReworkAsync_ClearsOrderReworkOverlay));
        SeedRouteWithTwoSteps(db, orderId: 700, lineId: 7001, routeId: 7100, firstStepState: "Completed", secondStepState: "Blocked");
        await db.SaveChangesAsync();
        var order = await db.SalesOrders.FirstAsync(o => o.Id == 700);
        order.HoldOverlay = OrderStatusCatalog.ReworkOpen;
        order.HasOpenRework = true;
        order.ReworkBlockingInvoice = true;
        order.ReworkState = "VerificationPending";
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        await service.CloseReworkAsync(700, 7001, 7102, new ReworkStateChangeDto("EMP003", "Closed verification"));

        var updated = await db.SalesOrders.FirstAsync(o => o.Id == 700);
        Assert.Null(updated.HoldOverlay);
        Assert.False(updated.HasOpenRework);
    }

    [Fact]
    public async Task ReworkAsync_RejectsInvalidLifecycleJump()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ReworkAsync_RejectsInvalidLifecycleJump));
        SeedRouteWithTwoSteps(db, orderId: 710, lineId: 7101, routeId: 7200, firstStepState: "Completed", secondStepState: "InProgress");
        await db.SaveChangesAsync();

        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.StartReworkAsync(710, 7101, 7202, new ReworkStateChangeDto("EMP004", "skip approval")));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task ScanInAsync_UsesWorkflowServiceToWriteLifecycleAuditEvent()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ScanInAsync_UsesWorkflowServiceToWriteLifecycleAuditEvent));
        SeedRouteWithTwoSteps(db, orderId: 720, lineId: 7201, routeId: 7300, firstStepState: "Completed", secondStepState: "Pending");
        await db.SaveChangesAsync();
        var order = await db.SalesOrders.FirstAsync(o => o.Id == 720);
        order.OrderLifecycleStatus = OrderStatusCatalog.ReadyForProduction;
        order.OrderStatus = OrderStatusCatalog.Received;
        await db.SaveChangesAsync();

        var queryService = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(
                TestInfrastructure.CreateOrderDraftDetail(id, OrderStatusCatalog.Received)),
        };
        var workflowService = new OrderWorkflowService(db, queryService, new FakeOrderPolicyService());
        var service = new WorkCenterWorkflowService(db, new FakeOrderPolicyService(), workflowService);

        await service.ScanInAsync(720, 7201, 7302, new OperatorScanInDto("EMP720", null));

        var refreshedOrder = await db.SalesOrders.FirstAsync(o => o.Id == 720);
        Assert.Equal(OrderStatusCatalog.InProduction, refreshedOrder.OrderLifecycleStatus);
        var lifecycleEvent = await db.OrderLifecycleEvents
            .OrderByDescending(e => e.Id)
            .FirstAsync(e => e.OrderId == 720 && e.ToLifecycleStatus == OrderStatusCatalog.InProduction);
        Assert.Equal("EMP720", lifecycleEvent.ActorEmpNo);
        Assert.Equal("ProductionStarted", lifecycleEvent.ReasonCode);
    }

    private static void SeedRouteWithTwoSteps(
        LpcAppsDbContext db,
        int orderId,
        int lineId,
        long routeId,
        string firstStepState,
        string secondStepState,
        bool requiresUsageForSecond = false)
    {
        db.Sites.Add(new Site { Id = 1, Name = "Main", SiteCode = "MAIN" });
        db.Customers.Add(new Customer { Id = 1, Name = "Customer A" });
        db.Items.Add(new Item { Id = 1, ItemNo = "ITEM-1", ItemType = "Tank", RequiresSerialNumbers = 0 });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = orderId,
            SalesOrderNo = $"SO-{orderId}",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.Received,
            OrderLifecycleStatus = OrderStatusCatalog.InProduction,
            CustomerId = 1,
            SiteId = 1,
        });
        db.SalesOrderDetails.Add(new SalesOrderDetail
        {
            Id = lineId,
            SalesOrderId = orderId,
            LineNo = 1,
            ItemId = 1,
            QuantityAsOrdered = 1,
            QuantityAsReceived = 1,
            SiteId = 1,
        });
        db.WorkCenters.Add(new WorkCenter
        {
            Id = 10,
            WorkCenterCode = "WC-10",
            WorkCenterName = "Prep",
            SiteId = 1,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.RouteTemplates.Add(new RouteTemplate
        {
            Id = 20,
            RouteTemplateCode = "RT-20",
            RouteTemplateName = "Route 20",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.OrderLineRouteInstances.Add(new OrderLineRouteInstance
        {
            Id = routeId,
            SalesOrderId = orderId,
            SalesOrderDetailId = lineId,
            RouteTemplateId = 20,
            State = "Active",
            StartedUtc = DateTime.UtcNow,
        });
        db.OrderLineRouteStepInstances.AddRange(
            new OrderLineRouteStepInstance
            {
                Id = routeId + 1,
                OrderLineRouteInstanceId = routeId,
                SalesOrderDetailId = lineId,
                StepSequence = 1,
                StepCode = "STEP-1",
                StepName = "First",
                WorkCenterId = 10,
                State = firstStepState,
                IsRequired = true,
            },
            new OrderLineRouteStepInstance
            {
                Id = routeId + 2,
                OrderLineRouteInstanceId = routeId,
                SalesOrderDetailId = lineId,
                StepSequence = 2,
                StepCode = "STEP-2",
                StepName = "Second",
                WorkCenterId = 10,
                State = secondStepState,
                IsRequired = true,
                RequiresUsageEntry = requiresUsageForSecond,
            });
    }
}
