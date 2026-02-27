using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class OrderAttachmentService(
    LpcAppsDbContext db,
    IAttachmentStorage attachmentStorage,
    IConfiguration configuration,
    IOrderPolicyService orderPolicyService) : IOrderAttachmentService
{
    private const long DefaultMaxAttachmentSizeBytes = 25 * 1024 * 1024;
    private const int DefaultMaxAttachmentCountPerOrder = 50;
    private static readonly HashSet<string> DefaultBlockedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".exe", ".dll", ".bat", ".cmd", ".ps1", ".vbs", ".js", ".msi", ".sh", ".com", ".scr", ".jar",
    };
    private static readonly HashSet<string> DefaultAllowedCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        "TestResult", "SerialReport", "PackingSlip", "BillOfLading", "CustomerDocument", "Other",
    };
    private static readonly HashSet<string> MutatingRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Office", "Transportation", "Receiving", "Production", "Supervisor", "Quality", "PlantManager", "Admin",
    };
    private static readonly HashSet<string> ReadRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Office", "Transportation", "Receiving", "Production", "Supervisor", "Quality", "PlantManager", "Admin", "ReadOnly", "Setup",
    };

    private readonly long _maxAttachmentSizeBytes = ResolveMaxAttachmentSizeBytes(configuration);
    private readonly int _maxAttachmentCountPerOrder = ResolveMaxAttachmentCount(configuration);
    private readonly HashSet<string> _allowedAttachmentExtensions =
        ResolveAllowedAttachmentExtensions(configuration);
    private readonly HashSet<string> _blockedAttachmentExtensions =
        ResolveBlockedAttachmentExtensions(configuration);
    private readonly HashSet<string> _allowedAttachmentCategories =
        ResolveAllowedAttachmentCategories(configuration);

    public async Task<List<OrderAttachmentDto>> GetAttachmentsAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        var invoiceRelevantCategories = await ResolveInvoiceRelevantCategoriesAsync(order, cancellationToken);
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
                a.UploadedUtc ?? a.CreatedAtUtc,
                a.UploadedByEmpNo,
                a.Category,
                invoiceRelevantCategories.Contains(a.Category)))
            .ToListAsync(cancellationToken);
    }

    public async Task<OrderAttachmentDto> UploadAttachmentAsync(
        int orderId,
        IFormFile? file,
        string? category,
        string? actingRole,
        string? actingEmpNo,
        CancellationToken cancellationToken = default)
    {
        var normalizedRole = RequireRole(actingRole, allowReadOnly: false);
        var normalizedEmpNo = RequireEmpNo(actingEmpNo);

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

        var existingCount = await db.OrderAttachments.CountAsync(a => a.OrderId == orderId, cancellationToken);
        if (existingCount >= _maxAttachmentCountPerOrder)
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"This order already has the maximum of {_maxAttachmentCountPerOrder} attachments.");
        }

        var lifecycleStatus = string.IsNullOrWhiteSpace(order.OrderLifecycleStatus)
            ? OrderStatusCatalog.MapLegacyToLifecycle(order.OrderStatus, order.OrderOrigin, order.ValidatedUtc)
            : order.OrderLifecycleStatus!;
        if (string.Equals(lifecycleStatus, OrderStatusCatalog.Invoiced, StringComparison.Ordinal))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                "Attachments cannot be added once an order is invoiced.");
        }

        var safeFileName = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(safeFileName))
            throw new ServiceException(StatusCodes.Status400BadRequest, "Invalid file name.");

        var extension = Path.GetExtension(safeFileName).Trim().ToLowerInvariant();
        if (_blockedAttachmentExtensions.Contains(extension))
            throw new ServiceException(StatusCodes.Status400BadRequest, $"Blocked file type '{extension}'.");

        if (_allowedAttachmentExtensions.Count > 0 && !_allowedAttachmentExtensions.Contains(extension))
            throw new ServiceException(StatusCodes.Status400BadRequest, $"File type '{extension}' is not allowed.");

        var normalizedCategory = NormalizeAndValidateCategory(category);
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
            Category = normalizedCategory,
            UploadedByEmpNo = normalizedEmpNo,
            UploadedUtc = DateTime.UtcNow,
            CreatedAtUtc = DateTime.UtcNow,
        };

        db.OrderAttachments.Add(attachment);
        db.OrderAttachmentAudits.Add(new OrderAttachmentAudit
        {
            OrderId = orderId,
            Attachment = attachment,
            ActionType = "Upload",
            ActingRole = normalizedRole,
            ActorEmpNo = normalizedEmpNo,
            OccurredUtc = DateTime.UtcNow,
            Details = $"fileName={attachment.FileName};category={attachment.Category};sizeBytes={attachment.SizeBytes}",
        });
        await db.SaveChangesAsync(cancellationToken);

        return await ToAttachmentDtoAsync(order, attachment, cancellationToken);
    }

    public async Task<(Stream Stream, string ContentType, string FileName)> DownloadAttachmentAsync(
        int orderId,
        int attachmentId,
        string? actingRole,
        string? actingEmpNo,
        CancellationToken cancellationToken = default)
    {
        var normalizedRole = RequireRole(actingRole, allowReadOnly: true);
        var normalizedEmpNo = RequireEmpNo(actingEmpNo);
        var attachment = await db.OrderAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.OrderId == orderId, cancellationToken);
        if (attachment is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Attachment not found.");

        var stream = await attachmentStorage.OpenReadAsync(attachment.BlobPath, cancellationToken);
        if (stream is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Attachment file not found in storage.");

        db.OrderAttachmentAudits.Add(new OrderAttachmentAudit
        {
            OrderId = orderId,
            AttachmentId = attachment.Id,
            ActionType = "Download",
            ActingRole = normalizedRole,
            ActorEmpNo = normalizedEmpNo,
            OccurredUtc = DateTime.UtcNow,
            Details = $"fileName={attachment.FileName}",
        });
        await db.SaveChangesAsync(cancellationToken);

        return (stream, attachment.ContentType, attachment.FileName);
    }

    public async Task<OrderAttachmentDto> UpdateAttachmentCategoryAsync(
        int orderId,
        int attachmentId,
        UpdateOrderAttachmentCategoryDto dto,
        CancellationToken cancellationToken = default)
    {
        var normalizedRole = RequireRole(dto.ActingRole, allowReadOnly: false);
        var normalizedEmpNo = RequireEmpNo(dto.ActingEmpNo);
        var normalizedCategory = NormalizeAndValidateCategory(dto.Category);

        var order = await db.SalesOrders
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        var attachment = await db.OrderAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.OrderId == orderId, cancellationToken);
        if (attachment is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Attachment not found.");

        var previousCategory = attachment.Category;
        attachment.Category = normalizedCategory;
        db.OrderAttachmentAudits.Add(new OrderAttachmentAudit
        {
            OrderId = orderId,
            AttachmentId = attachment.Id,
            ActionType = "CategoryUpdated",
            ActingRole = normalizedRole,
            ActorEmpNo = normalizedEmpNo,
            OccurredUtc = DateTime.UtcNow,
            Details = $"oldCategory={previousCategory};newCategory={normalizedCategory}",
        });
        await db.SaveChangesAsync(cancellationToken);

        return await ToAttachmentDtoAsync(order, attachment, cancellationToken);
    }

    public async Task DeleteAttachmentAsync(
        int orderId,
        int attachmentId,
        DeleteOrderAttachmentDto dto,
        CancellationToken cancellationToken = default)
    {
        var normalizedRole = RequireRole(dto.ActingRole, allowReadOnly: false);
        var normalizedEmpNo = RequireEmpNo(dto.ActingEmpNo);
        var attachment = await db.OrderAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.OrderId == orderId, cancellationToken);
        if (attachment is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Attachment not found.");

        db.OrderAttachmentAudits.Add(new OrderAttachmentAudit
        {
            OrderId = orderId,
            AttachmentId = null,
            ActionType = "Delete",
            ActingRole = normalizedRole,
            ActorEmpNo = normalizedEmpNo,
            OccurredUtc = DateTime.UtcNow,
            Details = $"attachmentId={attachment.Id};fileName={attachment.FileName};reasonCode={TrimToNull(dto.ReasonCode) ?? "None"}",
        });
        await attachmentStorage.DeleteIfExistsAsync(attachment.BlobPath, cancellationToken);
        db.OrderAttachments.Remove(attachment);
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<OrderAttachmentDto> ToAttachmentDtoAsync(
        SalesOrder order,
        OrderAttachment attachment,
        CancellationToken cancellationToken)
    {
        var invoiceRelevantCategories = await ResolveInvoiceRelevantCategoriesAsync(order, cancellationToken);
        return new OrderAttachmentDto(
            attachment.Id,
            attachment.OrderId,
            attachment.FileName,
            attachment.ContentType,
            attachment.SizeBytes,
            attachment.UploadedUtc ?? attachment.CreatedAtUtc,
            attachment.UploadedByEmpNo,
            attachment.Category,
            invoiceRelevantCategories.Contains(attachment.Category));
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

    private static int ResolveMaxAttachmentCount(IConfiguration configuration)
    {
        if (!int.TryParse(configuration["AttachmentValidation:MaxCountPerOrder"], out var configuredCount) ||
            configuredCount <= 0)
        {
            return DefaultMaxAttachmentCountPerOrder;
        }

        return configuredCount;
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

    private static HashSet<string> ResolveBlockedAttachmentExtensions(IConfiguration configuration)
    {
        var values = configuration
            .GetSection("AttachmentValidation:BlockedExtensions")
            .GetChildren()
            .Select(child => child.Value?.Trim().ToLowerInvariant())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!.StartsWith('.') ? value : $".{value}")
            .ToList();
        if (values.Count == 0)
        {
            return new HashSet<string>(DefaultBlockedExtensions, StringComparer.OrdinalIgnoreCase);
        }

        return new HashSet<string>(values, StringComparer.OrdinalIgnoreCase);
    }

    private static HashSet<string> ResolveAllowedAttachmentCategories(IConfiguration configuration)
    {
        var values = configuration
            .GetSection("AttachmentValidation:AllowedCategories")
            .GetChildren()
            .Select(child => child.Value?.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!)
            .ToList();
        if (values.Count == 0)
        {
            return new HashSet<string>(DefaultAllowedCategories, StringComparer.OrdinalIgnoreCase);
        }

        return new HashSet<string>(values, StringComparer.OrdinalIgnoreCase);
    }

    private async Task<HashSet<string>> ResolveInvoiceRelevantCategoriesAsync(SalesOrder order, CancellationToken cancellationToken)
    {
        var csv = await orderPolicyService.GetDecisionValueAsync(
            OrderPolicyKeys.RequiredAttachmentCategoriesCsv,
            order.SiteId,
            order.CustomerId,
            string.Empty,
            cancellationToken);

        var fromPolicy = csv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (fromPolicy.Count > 0)
        {
            return fromPolicy;
        }

        return new HashSet<string>(new[] { "TestResult", "SerialReport", "PackingSlip", "BillOfLading" }, StringComparer.OrdinalIgnoreCase);
    }

    private string NormalizeAndValidateCategory(string? category)
    {
        var normalized = string.IsNullOrWhiteSpace(category) ? "Other" : category.Trim();
        if (!_allowedAttachmentCategories.Contains(normalized))
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, $"Attachment category '{normalized}' is not allowed.");
        }

        return normalized;
    }

    private static string RequireEmpNo(string? actingEmpNo)
    {
        var normalized = TrimToNull(actingEmpNo);
        if (normalized is null)
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "ActingEmpNo is required.");
        }

        return normalized;
    }

    private string RequireRole(string? actingRole, bool allowReadOnly)
    {
        var normalized = TrimToNull(actingRole);
        if (normalized is null)
        {
            throw new ServiceException(StatusCodes.Status400BadRequest, "ActingRole is required.");
        }

        var allowedSet = allowReadOnly ? ReadRoles : MutatingRoles;
        if (!allowedSet.Contains(normalized))
        {
            throw new ServiceException(StatusCodes.Status403Forbidden, $"Role '{normalized}' is not authorized for this action.");
        }

        return normalized;
    }

    private static string? TrimToNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }
}

