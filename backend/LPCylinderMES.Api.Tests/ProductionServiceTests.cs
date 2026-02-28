using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

public class ProductionServiceTests
{
    [Fact]
    public async Task CompleteProductionAsync_LifecycleReadyForProduction_SetsProductionComplete()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteProductionAsync_LifecycleReadyForProduction_SetsProductionComplete));
        db.Items.Add(new Item { Id = 81, ItemNo = "TNK-81", ItemType = "Tank", RequiresSerialNumbers = 0 });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 80,
            SalesOrderNo = "SO-80",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.Received,
            OrderLifecycleStatus = OrderStatusCatalog.ReadyForProduction,
            CustomerId = 1,
            SiteId = 1,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 801,
                    LineNo = 1,
                    ItemId = 81,
                    QuantityAsOrdered = 2,
                    QuantityAsReceived = 2,
                    QuantityAsShipped = 0,
                    QuantityAsScrapped = 0,
                    SalesOrderId = 80,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var service = new ProductionService(db, new FakeProductionOrderQueryService());
        await service.CompleteProductionAsync(80, new CompleteProductionDto([new ProductionLineUpdateDto(801, 2, 0, null)]));

        var order = await db.SalesOrders.FirstAsync(o => o.Id == 80);
        Assert.Equal(OrderStatusCatalog.ProductionComplete, order.OrderLifecycleStatus);
        Assert.Equal(OrderStatusCatalog.ReadyToShip, order.OrderStatus);
    }

    [Fact]
    public async Task CompleteProductionAsync_NonSerialLine_UpdatesBalancedQuantities()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteProductionAsync_NonSerialLine_UpdatesBalancedQuantities));
        db.Items.Add(new Item { Id = 61, ItemNo = "TNK-61", ItemType = "Tank", RequiresSerialNumbers = 0 });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 60,
            SalesOrderNo = "SO-60",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.Received,
            CustomerId = 1,
            SiteId = 1,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 601,
                    LineNo = 1,
                    ItemId = 61,
                    QuantityAsOrdered = 10,
                    QuantityAsReceived = 6,
                    QuantityAsShipped = 0,
                    QuantityAsScrapped = 0,
                    SalesOrderId = 60,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var service = new ProductionService(db, new FakeProductionOrderQueryService());
        var dto = new CompleteProductionDto([
            new ProductionLineUpdateDto(
                601,
                5,
                1,
                null),
        ]);

        var result = await service.CompleteProductionAsync(60, dto);
        var order = await db.SalesOrders.Include(o => o.SalesOrderDetails).FirstAsync(o => o.Id == 60);
        var line = order.SalesOrderDetails.Single(l => l.Id == 601);

        Assert.Equal(5, line.QuantityAsShipped);
        Assert.Equal(1, line.QuantityAsScrapped);
        Assert.Equal(60, result.Id);
    }

    [Fact]
    public async Task CompleteProductionAsync_SerialLine_RejectsMismatchedGoodCount()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(CompleteProductionAsync_SerialLine_RejectsMismatchedGoodCount));
        db.Items.Add(new Item { Id = 71, ItemNo = "TNK-71", ItemType = "Tank", RequiresSerialNumbers = 1 });
        db.ScrapReasons.AddRange(
            new ScrapReason { Id = 1, Name = "GOOD" },
            new ScrapReason { Id = 2, Name = "BAD" });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 70,
            SalesOrderNo = "SO-70",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.Received,
            CustomerId = 1,
            SiteId = 1,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 701,
                    LineNo = 1,
                    ItemId = 71,
                    QuantityAsOrdered = 4,
                    QuantityAsReceived = 2,
                    QuantityAsShipped = 0,
                    QuantityAsScrapped = 0,
                    SalesOrderId = 70,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var service = new ProductionService(db, new FakeProductionOrderQueryService());
        var dto = new CompleteProductionDto([
            new ProductionLineUpdateDto(
                701,
                2,
                0,
                [
                    new ProductionSerialNumberUpsertDto(null, "SN-1", null, null, null, 1, null, null),
                    new ProductionSerialNumberUpsertDto(null, "SN-2", null, null, null, 2, null, null),
                ]),
        ]);

        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.CompleteProductionAsync(70, dto));
        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }
}

internal sealed class FakeProductionOrderQueryService : IOrderQueryService
{
    public Task<PaginatedResponse<OrderDraftListDto>> GetOrdersAsync(
        int page,
        int pageSize,
        string? search,
        string? status,
        int? customerId,
        DateOnly? dateFrom,
        DateOnly? dateTo,
        CancellationToken cancellationToken = default) => throw new NotImplementedException();

    public Task<OrderDraftDetailDto?> GetOrderDetailAsync(int id, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<PaginatedResponse<TransportBoardItemDto>> GetTransportBoardAsync(
        int page,
        int pageSize,
        string? search,
        string? movementType,
        string? status,
        int? siteId,
        string? carrier,
        CancellationToken cancellationToken = default) => throw new NotImplementedException();

    public Task<List<string>> GetStatusesAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<List<ReceivingOrderListItemDto>> GetReceivingQueueAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<List<ProductionOrderListItemDto>> GetProductionQueueAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();
    public Task<List<ProductionOrderListItemDto>> GetPendingRouteReviewQueueAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();
    public Task<List<ProductionOrderListItemDto>> GetPendingSupervisorReviewQueueAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<ReceivingOrderDetailDto?> GetReceivingDetailAsync(int id, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<ProductionOrderDetailDto?> GetProductionDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var detail = new ProductionOrderDetailDto(
            id,
            $"SO-{id}",
            OrderStatusCatalog.Received,
            "Customer",
            null,
            null,
            null,
            DateTime.UtcNow,
            []);
        return Task.FromResult<ProductionOrderDetailDto?>(detail);
    }
}
