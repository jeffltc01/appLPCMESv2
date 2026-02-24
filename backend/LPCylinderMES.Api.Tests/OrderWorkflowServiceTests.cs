using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

public class OrderWorkflowServiceTests
{
    [Fact]
    public async Task AdvanceStatusAsync_ImmediateNext_SetsStatusAndTimestamp()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_ImmediateNext_SetsStatusAndTimestamp));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 1,
            SalesOrderNo = "SO-1",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = "New",
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, "Ready for Pickup")),
        };

        var service = new OrderWorkflowService(db, queries);
        var result = await service.AdvanceStatusAsync(1, "Ready for Pickup");

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 1);
        Assert.Equal("Ready for Pickup", order.OrderStatus);
        Assert.NotNull(order.PickupDate);
        Assert.Equal("Ready for Pickup", result.OrderStatus);
    }

    [Fact]
    public async Task AdvanceStatusAsync_NonAdjacent_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_NonAdjacent_ThrowsConflict));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 2,
            SalesOrderNo = "SO-2",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = "New",
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new OrderWorkflowService(db, new FakeOrderQueryService());
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.AdvanceStatusAsync(2, "Received"));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task AdvanceStatusAsync_MoveBack_ClearsPreviousStatusTimestamp()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(AdvanceStatusAsync_MoveBack_ClearsPreviousStatusTimestamp));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 3,
            SalesOrderNo = "SO-3",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = "Ready to Ship",
            ReadyToShipDate = DateTime.UtcNow,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var queries = new FakeOrderQueryService
        {
            GetOrderDetailHandler = (id, _) => Task.FromResult<OrderDraftDetailDto?>(TestInfrastructure.CreateOrderDraftDetail(id, "Received")),
        };

        var service = new OrderWorkflowService(db, queries);
        await service.AdvanceStatusAsync(3, "Received");

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 3);
        Assert.Equal("Received", order.OrderStatus);
        Assert.Null(order.ReadyToShipDate);
    }
}

