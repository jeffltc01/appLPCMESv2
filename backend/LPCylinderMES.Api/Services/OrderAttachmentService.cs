using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class OrderAttachmentService(
    LpcAppsDbContext db,
    IAttachmentStorage attachmentStorage,
    IConfiguration configuration) : IOrderAttachmentService
{
    private const long DefaultMaxAttachmentSizeBytes = 25 * 1024 * 1024;
    private readonly long _maxAttachmentSizeBytes = ResolveMaxAttachmentSizeBytes(configuration);
    private readonly HashSet<string> _allowedAttachmentExtensions =
        ResolveAllowedAttachmentExtensions(configuration);

    public async Task<List<OrderAttachmentDto>> GetAttachmentsAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var orderExists = await db.SalesOrders.AnyAsync(o => o.Id == orderId, cancellationToken);
        if (!orderExists)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        return await db.OrderAttachments
            .Where(a => a.OrderId == orderId)
            .OrderByDescending(a => a.CreatedAtUtc)
            .ThenByDescending(a => a.Id)
            .Select(a => new OrderAttachmentDto(
                a.Id,
                a.OrderId,
                a.FileName,
                a.ContentType,
                a.SizeBytes,
                a.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<OrderAttachmentDto> UploadAttachmentAsync(
        int orderId,
        IFormFile? file,
        CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
            throw new ServiceException(StatusCodes.Status400BadRequest, "A non-empty file is required.");

        if (file.Length > _maxAttachmentSizeBytes)
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                $"Attachment exceeds the maximum size of {_maxAttachmentSizeBytes / (1024 * 1024)} MB.");
        }

        var order = await db.SalesOrders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        if (order.OrderStatus != OrderStatusCatalog.Received)
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Attachments can only be added for orders in status '{OrderStatusCatalog.Received}'.");
        }

        var safeFileName = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(safeFileName))
            throw new ServiceException(StatusCodes.Status400BadRequest, "Invalid file name.");

        var extension = Path.GetExtension(safeFileName).Trim().ToLowerInvariant();
        if (_allowedAttachmentExtensions.Count > 0 && !_allowedAttachmentExtensions.Contains(extension))
            throw new ServiceException(StatusCodes.Status400BadRequest, $"File type '{extension}' is not allowed.");

        var blobPath = $"orders/{orderId}/{Guid.NewGuid():N}-{safeFileName}";
        var contentType = string.IsNullOrWhiteSpace(file.ContentType)
            ? "application/octet-stream"
            : file.ContentType;

        await using (var stream = file.OpenReadStream())
        {
            await attachmentStorage.UploadAsync(blobPath, stream, contentType, cancellationToken);
        }

        var attachment = new OrderAttachment
        {
            OrderId = orderId,
            FileName = safeFileName,
            BlobPath = blobPath,
            ContentType = contentType,
            SizeBytes = file.Length,
            CreatedAtUtc = DateTime.UtcNow,
        };

        db.OrderAttachments.Add(attachment);
        await db.SaveChangesAsync(cancellationToken);

        return ToAttachmentDto(attachment);
    }

    public async Task<(Stream Stream, string ContentType, string FileName)> DownloadAttachmentAsync(
        int orderId,
        int attachmentId,
        CancellationToken cancellationToken = default)
    {
        var attachment = await db.OrderAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.OrderId == orderId, cancellationToken);
        if (attachment is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Attachment not found.");

        var stream = await attachmentStorage.OpenReadAsync(attachment.BlobPath, cancellationToken);
        if (stream is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Attachment file not found in storage.");

        return (stream, attachment.ContentType, attachment.FileName);
    }

    public async Task DeleteAttachmentAsync(
        int orderId,
        int attachmentId,
        CancellationToken cancellationToken = default)
    {
        var attachment = await db.OrderAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.OrderId == orderId, cancellationToken);
        if (attachment is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Attachment not found.");

        await attachmentStorage.DeleteIfExistsAsync(attachment.BlobPath, cancellationToken);
        db.OrderAttachments.Remove(attachment);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static OrderAttachmentDto ToAttachmentDto(OrderAttachment attachment)
    {
        return new OrderAttachmentDto(
            attachment.Id,
            attachment.OrderId,
            attachment.FileName,
            attachment.ContentType,
            attachment.SizeBytes,
            attachment.CreatedAtUtc);
    }

    private static long ResolveMaxAttachmentSizeBytes(IConfiguration configuration)
    {
        if (!int.TryParse(configuration["AttachmentValidation:MaxSizeMb"], out var configuredMb) ||
            configuredMb <= 0)
        {
            return DefaultMaxAttachmentSizeBytes;
        }

        return configuredMb * 1024L * 1024L;
    }

    private static HashSet<string> ResolveAllowedAttachmentExtensions(IConfiguration configuration)
    {
        var values = configuration
            .GetSection("AttachmentValidation:AllowedExtensions")
            .GetChildren()
            .Select(child => child.Value?.Trim().ToLowerInvariant())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!.StartsWith('.') ? value : $".{value}")
            .ToList();

        return new HashSet<string>(values, StringComparer.OrdinalIgnoreCase);
    }
}

