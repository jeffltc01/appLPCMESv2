using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

internal static class TestInfrastructure
{
    public static LpcAppsDbContext CreateDbContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<LpcAppsDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        return new LpcAppsDbContext(options);
    }

    public static OrderDraftDetailDto CreateOrderDraftDetail(int id, string status) =>
        new(
            id,
            $"SO-{id}",
            DateOnly.FromDateTime(DateTime.Today),
            status,
            DateOnly.FromDateTime(DateTime.Today),
            null,
            null,
            null,
            null,
            null,
            1,
            "Customer",
            1,
            "Site",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            new List<OrderLineDto>(),
            null,
            null,
            null);
}

internal sealed class FakeOrderQueryService : IOrderQueryService
{
    public Func<int, CancellationToken, Task<OrderDraftDetailDto?>>? GetOrderDetailHandler { get; set; }
    public Func<int, CancellationToken, Task<ReceivingOrderDetailDto?>>? GetReceivingDetailHandler { get; set; }

    public Task<PaginatedResponse<OrderDraftListDto>> GetOrdersAsync(
        int page, int pageSize, string? search, string? status, int? customerId, DateOnly? dateFrom, DateOnly? dateTo, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<OrderDraftDetailDto?> GetOrderDetailAsync(int id, CancellationToken cancellationToken = default) =>
        GetOrderDetailHandler?.Invoke(id, cancellationToken) ?? Task.FromResult<OrderDraftDetailDto?>(null);

    public Task<PaginatedResponse<TransportBoardItemDto>> GetTransportBoardAsync(
        int page, int pageSize, string? search, string? movementType, string? status, int? siteId, string? carrier, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<List<string>> GetStatusesAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<List<ReceivingOrderListItemDto>> GetReceivingQueueAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<List<ProductionOrderListItemDto>> GetProductionQueueAsync(CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<ReceivingOrderDetailDto?> GetReceivingDetailAsync(int id, CancellationToken cancellationToken = default) =>
        GetReceivingDetailHandler?.Invoke(id, cancellationToken) ?? Task.FromResult<ReceivingOrderDetailDto?>(null);

    public Task<ProductionOrderDetailDto?> GetProductionDetailAsync(int id, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();
}

