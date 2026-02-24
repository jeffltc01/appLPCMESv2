using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface IProductionService
{
    Task<ProductionOrderDetailDto> CompleteProductionAsync(
        int orderId,
        CompleteProductionDto dto,
        CancellationToken cancellationToken = default);
}
