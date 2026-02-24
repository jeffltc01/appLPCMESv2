using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface IOrderLineService
{
    Task<decimal?> GetDefaultPriceAsync(int orderId, int itemId, CancellationToken cancellationToken = default);

    Task<OrderLineDto> CreateAsync(int orderId, OrderLineCreateDto dto, CancellationToken cancellationToken = default);

    Task<OrderLineDto> UpdateAsync(int orderId, int lineId, OrderLineUpdateDto dto, CancellationToken cancellationToken = default);

    Task DeleteAsync(int orderId, int lineId, CancellationToken cancellationToken = default);
}

