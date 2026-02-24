using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

public class ReceivingServiceTests
{
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
            OrderStatus = "New",
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
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 50,
            SalesOrderNo = "SO-50",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = "Pickup Scheduled",
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
                    "Received",
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

        Assert.Equal("Received", order.OrderStatus);
        Assert.Equal(receivedAt, order.ReceivedDate);
        Assert.Equal("Received", result.OrderStatus);

        var originalLine = order.SalesOrderDetails.Single(l => l.Id == 501);
        Assert.Equal(0, originalLine.QuantityAsReceived);

        var addedLine = order.SalesOrderDetails.Single(l => l.ItemId == 52);
        Assert.Equal(2, addedLine.QuantityAsReceived);
        Assert.Equal(2, addedLine.LineNo);
    }
}

