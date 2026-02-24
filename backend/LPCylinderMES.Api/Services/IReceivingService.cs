using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface IReceivingService
{
    Task<ReceivingOrderDetailDto> CompleteReceivingAsync(
        int orderId,
        CompleteReceivingDto dto,
        CancellationToken cancellationToken = default);
}

