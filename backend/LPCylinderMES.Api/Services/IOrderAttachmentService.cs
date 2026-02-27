using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface IOrderAttachmentService
{
    Task<List<OrderAttachmentDto>> GetAttachmentsAsync(int orderId, CancellationToken cancellationToken = default);

    Task<OrderAttachmentDto> UploadAttachmentAsync(
        int orderId,
        IFormFile? file,
        string? category,
        string? actingRole,
        string? actingEmpNo,
        CancellationToken cancellationToken = default);

    Task<(Stream Stream, string ContentType, string FileName)> DownloadAttachmentAsync(
        int orderId,
        int attachmentId,
        string? actingRole,
        string? actingEmpNo,
        CancellationToken cancellationToken = default);

    Task<OrderAttachmentDto> UpdateAttachmentCategoryAsync(
        int orderId,
        int attachmentId,
        UpdateOrderAttachmentCategoryDto dto,
        CancellationToken cancellationToken = default);

    Task DeleteAttachmentAsync(
        int orderId,
        int attachmentId,
        DeleteOrderAttachmentDto dto,
        CancellationToken cancellationToken = default);
}

