using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface IOrderWorkflowService
{
    Task<OrderDraftDetailDto> AdvanceStatusAsync(
        int orderId,
        string targetStatus,
        CancellationToken cancellationToken = default);

    Task<OrderDraftDetailDto> SubmitInvoiceAsync(
        int orderId,
        SubmitInvoiceDto dto,
        CancellationToken cancellationToken = default);
}

