using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using LPCylinderMES.Api.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace LPCylinderMES.Api.Tests;

public class OrderAttachmentServiceTests
{
    [Fact]
    public async Task UploadAttachmentAsync_PersistsMetadata_And_WritesAudit()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(UploadAttachmentAsync_PersistsMetadata_And_WritesAudit));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 901,
            SalesOrderNo = "SO-901",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            OrderLifecycleStatus = OrderStatusCatalog.Draft,
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await using var stream = new MemoryStream(new byte[] { 1, 2, 3, 4 });
        IFormFile file = new FormFile(stream, 0, stream.Length, "file", "packing-slip.pdf")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/pdf",
        };

        var result = await service.UploadAttachmentAsync(901, file, "PackingSlip", "Office", "EMP900");

        Assert.Equal("PackingSlip", result.Category);
        Assert.Equal("EMP900", result.UploadedByEmpNo);
        Assert.True(result.UploadedUtc > DateTime.MinValue);

        var audit = await db.OrderAttachmentAudits.SingleAsync(a => a.OrderId == 901);
        Assert.Equal("Upload", audit.ActionType);
        Assert.Equal("Office", audit.ActingRole);
        Assert.Equal("EMP900", audit.ActorEmpNo);
    }

    [Fact]
    public async Task DeleteAttachmentAsync_ReadOnlyRole_IsForbidden()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(DeleteAttachmentAsync_ReadOnlyRole_IsForbidden));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 902,
            SalesOrderNo = "SO-902",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            OrderLifecycleStatus = OrderStatusCatalog.Draft,
            CustomerId = 1,
            SiteId = 1,
            OrderAttachments =
            {
                new OrderAttachment
                {
                    Id = 9902,
                    FileName = "serials.pdf",
                    BlobPath = "orders/902/serials.pdf",
                    ContentType = "application/pdf",
                    SizeBytes = 32,
                    Category = "SerialReport",
                    CreatedAtUtc = DateTime.UtcNow,
                    UploadedUtc = DateTime.UtcNow,
                    UploadedByEmpNo = "EMP902",
                },
            },
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var ex = await Assert.ThrowsAsync<ServiceException>(() =>
            service.DeleteAttachmentAsync(
                902,
                9902,
                new DeleteOrderAttachmentDto("ReadOnly", "EMP902", "NoPermission")));

        Assert.Equal(StatusCodes.Status403Forbidden, ex.StatusCode);
    }

    [Fact]
    public async Task UpdateAttachmentCategoryAsync_UpdatesCategory_And_WritesAudit()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(UpdateAttachmentCategoryAsync_UpdatesCategory_And_WritesAudit));
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 903,
            SalesOrderNo = "SO-903",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.New,
            OrderLifecycleStatus = OrderStatusCatalog.Draft,
            CustomerId = 1,
            SiteId = 1,
            OrderAttachments =
            {
                new OrderAttachment
                {
                    Id = 9903,
                    FileName = "test.png",
                    BlobPath = "orders/903/test.png",
                    ContentType = "image/png",
                    SizeBytes = 128,
                    Category = "Other",
                    CreatedAtUtc = DateTime.UtcNow,
                    UploadedUtc = DateTime.UtcNow,
                    UploadedByEmpNo = "EMP903",
                },
            },
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var updated = await service.UpdateAttachmentCategoryAsync(
            903,
            9903,
            new UpdateOrderAttachmentCategoryDto("TestResult", "Office", "EMP903"));

        Assert.Equal("TestResult", updated.Category);
        var audit = await db.OrderAttachmentAudits.SingleAsync(a => a.OrderId == 903);
        Assert.Equal("CategoryUpdated", audit.ActionType);
        Assert.Contains("oldCategory=Other", audit.Details);
    }

    private static OrderAttachmentService CreateService(LPCylinderMES.Api.Data.LpcAppsDbContext db)
    {
        var settings = new Dictionary<string, string?>
        {
            ["AttachmentValidation:MaxSizeMb"] = "25",
            ["AttachmentValidation:MaxCountPerOrder"] = "50",
            ["AttachmentValidation:AllowedExtensions:0"] = ".pdf",
            ["AttachmentValidation:AllowedExtensions:1"] = ".png",
            ["AttachmentValidation:AllowedCategories:0"] = "TestResult",
            ["AttachmentValidation:AllowedCategories:1"] = "SerialReport",
            ["AttachmentValidation:AllowedCategories:2"] = "PackingSlip",
            ["AttachmentValidation:AllowedCategories:3"] = "BillOfLading",
            ["AttachmentValidation:AllowedCategories:4"] = "CustomerDocument",
            ["AttachmentValidation:AllowedCategories:5"] = "Other",
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
        return new OrderAttachmentService(
            db,
            new InMemoryAttachmentStorage(),
            configuration,
            new FakeOrderPolicyService());
    }

    private sealed class InMemoryAttachmentStorage : IAttachmentStorage
    {
        private readonly Dictionary<string, byte[]> _store = new(StringComparer.OrdinalIgnoreCase);

        public async Task UploadAsync(string blobPath, Stream content, string contentType, CancellationToken cancellationToken = default)
        {
            await using var ms = new MemoryStream();
            await content.CopyToAsync(ms, cancellationToken);
            _store[blobPath] = ms.ToArray();
        }

        public Task<Stream?> OpenReadAsync(string blobPath, CancellationToken cancellationToken = default)
        {
            if (!_store.TryGetValue(blobPath, out var bytes))
            {
                return Task.FromResult<Stream?>(null);
            }

            return Task.FromResult<Stream?>(new MemoryStream(bytes));
        }

        public Task DeleteIfExistsAsync(string blobPath, CancellationToken cancellationToken = default)
        {
            _store.Remove(blobPath);
            return Task.CompletedTask;
        }
    }
}
