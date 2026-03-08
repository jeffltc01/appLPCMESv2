using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Http;

namespace LPCylinderMES.Api.Tests;

public class SetupRoutingServiceLookupTests
{
    [Fact]
    public async Task ValveTypeDelete_InUse_ThrowsConflict()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(ValveTypeDelete_InUse_ThrowsConflict));
        db.ValveTypeLookups.Add(new ValveTypeLookup
        {
            Id = 1,
            Code = "STD",
            DisplayName = "Standard",
            IsActive = true,
            SortOrder = 10,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        db.Items.Add(new Item { Id = 100, ItemNo = "I-100", ItemType = "Tank", RequiresSerialNumbers = 0 });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 100,
            SalesOrderNo = "SO-100",
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow),
            OrderStatus = OrderStatusCatalog.New,
            CustomerId = 1,
            SiteId = 1,
        });
        db.SalesOrderDetails.Add(new SalesOrderDetail
        {
            Id = 1000,
            SalesOrderId = 100,
            ItemId = 100,
            LineNo = 1,
            QuantityAsOrdered = 1,
            ValveTypeId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var service = new SetupRoutingService(db);
        var ex = await Assert.ThrowsAsync<ServiceException>(() => service.DeleteValveTypeLookupAsync(1));
        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
    }

    [Fact]
    public async Task GaugeCrud_Succeeds_AndReportsInUse()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GaugeCrud_Succeeds_AndReportsInUse));
        var service = new SetupRoutingService(db);

        var created = await service.CreateGaugeLookupAsync(new LookupOptionUpsertDto("YES", "Yes", true, 10));
        Assert.Equal("YES", created.Code);

        db.Items.Add(new Item { Id = 200, ItemNo = "I-200", ItemType = "Tank", RequiresSerialNumbers = 0 });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 200,
            SalesOrderNo = "SO-200",
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow),
            OrderStatus = OrderStatusCatalog.New,
            CustomerId = 1,
            SiteId = 1,
        });
        db.SalesOrderDetails.Add(new SalesOrderDetail
        {
            Id = 2000,
            SalesOrderId = 200,
            ItemId = 200,
            LineNo = 1,
            QuantityAsOrdered = 1,
            GaugeId = created.Id,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var all = await service.GetGaugeLookupsAsync();
        Assert.True(all.Single(x => x.Id == created.Id).IsInUse);

        var updated = await service.UpdateGaugeLookupAsync(created.Id, new LookupOptionUpsertDto("YES", "Yes", false, 20));
        Assert.False(updated.IsActive);
        Assert.Equal(20, updated.SortOrder);
    }
}
