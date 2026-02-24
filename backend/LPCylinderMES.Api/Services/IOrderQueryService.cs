using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface IOrderQueryService
{
    Task<PaginatedResponse<OrderDraftListDto>> GetOrdersAsync(
        int page,
        int pageSize,
        string? search,
        int? customerId,
        DateOnly? dateFrom,
        DateOnly? dateTo,
        CancellationToken cancellationToken = default);

    Task<OrderDraftDetailDto?> GetOrderDetailAsync(int id, CancellationToken cancellationToken = default);

    Task<PaginatedResponse<TransportBoardItemDto>> GetTransportBoardAsync(
        int page,
        int pageSize,
        string? search,
        string? movementType,
        string? status,
        int? siteId,
        string? carrier,
        CancellationToken cancellationToken = default);

    Task<List<string>> GetStatusesAsync(CancellationToken cancellationToken = default);

    Task<List<ReceivingOrderListItemDto>> GetReceivingQueueAsync(CancellationToken cancellationToken = default);

    Task<List<ProductionOrderListItemDto>> GetProductionQueueAsync(CancellationToken cancellationToken = default);

    Task<ReceivingOrderDetailDto?> GetReceivingDetailAsync(int id, CancellationToken cancellationToken = default);

    Task<ProductionOrderDetailDto?> GetProductionDetailAsync(int id, CancellationToken cancellationToken = default);
}

