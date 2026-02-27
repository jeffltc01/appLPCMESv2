using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface IOrderWorkflowService
{
    Task<OrderDraftDetailDto> ApplyHoldAsync(
        int orderId,
        ApplyHoldDto dto,
        CancellationToken cancellationToken = default);

    Task<OrderDraftDetailDto> AdvanceStatusAsync(
        int orderId,
        string targetStatus,
        string? actingRole = null,
        string? reasonCode = null,
        string? note = null,
        string? actingEmpNo = null,
        CancellationToken cancellationToken = default);

    Task<OrderDraftDetailDto> SubmitInvoiceAsync(
        int orderId,
        SubmitInvoiceDto dto,
        CancellationToken cancellationToken = default);

    Task<OrderDraftDetailDto> UpsertPromiseCommitmentAsync(
        int orderId,
        UpsertPromiseCommitmentDto dto,
        CancellationToken cancellationToken = default);

    Task<OrderDraftDetailDto> ClassifyPromiseMissAsync(
        int orderId,
        ClassifyPromiseMissDto dto,
        CancellationToken cancellationToken = default);

    Task<OrderDraftDetailDto> RecordPromiseNotificationAsync(
        int orderId,
        RecordPromiseNotificationDto dto,
        CancellationToken cancellationToken = default);

    Task<List<OrderPromiseChangeEventDto>> GetPromiseHistoryAsync(
        int orderId,
        CancellationToken cancellationToken = default);

    Task<OrderLifecycleMigrationResultDto> BackfillLifecycleStatusesAsync(
        bool dryRun = false,
        CancellationToken cancellationToken = default);
}

