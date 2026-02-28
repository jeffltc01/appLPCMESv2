using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

public class OrderLineServiceTests
{
    [Fact]
    public async Task GetDefaultPriceAsync_PrefersCustomerSpecificPrice()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetDefaultPriceAsync_PrefersCustomerSpecificPrice));

        db.Items.Add(new Item
        {
            Id = 11,
            ItemNo = "TNK-11",
            ItemType = "Tank",
            RequiresSerialNumbers = 0,
        });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 10,
            SalesOrderNo = "SO-10",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            CustomerId = 7,
            SiteId = 1,
        });
        db.Pricings.AddRange(
            new Pricing { Id = 1, ItemId = 11, CustomerId = null, EffectiveDate = new DateOnly(2026, 1, 1), UnitPrice = 12.5 },
            new Pricing { Id = 2, ItemId = 11, CustomerId = 7, EffectiveDate = new DateOnly(2026, 2, 1), UnitPrice = 18.75 }
        );
        await db.SaveChangesAsync();

        var service = new OrderLineService(db);
        var price = await service.GetDefaultPriceAsync(10, 11);

        Assert.Equal(18.75m, price);
    }

    [Fact]
    public async Task CreateAsync_NonNewOrder_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CreateAsync_NonNewOrder_ThrowsConflict));

        db.Items.Add(new Item
        {
            Id = 21,
            ItemNo = "TNK-21",
            ItemType = "Tank",
            RequiresSerialNumbers = 0,
        });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 20,
            SalesOrderNo = "SO-20",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.Received,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new OrderLineService(db);
        var dto = new OrderLineCreateDto(21, 2, null, null, null, null, null, null, null, null, null, null);

        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.CreateAsync(20, dto));
        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task CreateAsync_AssignsNextLineNoAndCalculatesExtension()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CreateAsync_AssignsNextLineNoAndCalculatesExtension));

        db.Items.AddRange(
            new Item
            {
                Id = 31,
                ItemNo = "TNK-31",
                ItemType = "Tank",
                RequiresSerialNumbers = 0,
                ItemDescription = "Tank 31",
            },
            new Item
            {
                Id = 32,
                ItemNo = "TNK-32",
                ItemType = "Tank",
                RequiresSerialNumbers = 0,
                ItemDescription = "Tank 32",
            });

        db.SalesOrders.Add(new SalesOrder
        {
            Id = 30,
            SalesOrderNo = "SO-30",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            CustomerId = 1,
            SiteId = 1,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 301,
                    LineNo = 1,
                    ItemId = 31,
                    QuantityAsOrdered = 1,
                    SalesOrderId = 30,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var service = new OrderLineService(db);
        var dto = new OrderLineCreateDto(32, 3, 4.5m, null, null, null, null, null, null, null, null, null);
        var created = await service.CreateAsync(30, dto);
        var createdDetail = await db.SalesOrderDetails.SingleAsync(d => d.SalesOrderId == 30 && d.LineNo == 2);

        Assert.Equal(2m, created.LineNo);
        Assert.Equal(4.5m, created.UnitPrice);
        Assert.Equal(13.5m, created.Extension);
        Assert.Equal(0m, createdDetail.QuantityAsReceived);
        Assert.Equal(ReceiptStatusCatalog.Unknown, createdDetail.ReceiptStatus);
    }

    [Fact]
    public async Task CreateAsync_InvoiceWorkflowOrder_AllowsLineMutation()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CreateAsync_InvoiceWorkflowOrder_AllowsLineMutation));

        db.Items.Add(new Item
        {
            Id = 41,
            ItemNo = "TNK-41",
            ItemType = "Tank",
            RequiresSerialNumbers = 0,
            ItemDescription = "Tank 41",
        });

        db.SalesOrders.Add(new SalesOrder
        {
            Id = 40,
            SalesOrderNo = "SO-40",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyToInvoice,
            OrderLifecycleStatus = OrderStatusCatalog.InvoiceReady,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new OrderLineService(db);
        var dto = new OrderLineCreateDto(41, 2, 10m, null, null, null, null, null, null, null, null, null);

        var created = await service.CreateAsync(40, dto);

        Assert.Equal(1m, created.LineNo);
        Assert.Equal(20m, created.Extension);
    }
}

