using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;

namespace LPCylinderMES.Api.Tests;

public class OrderQueryServiceTransportBoardTests
{
    [Fact]
    public async Task GetTransportBoardAsync_IncludesExpandedLineDetailsForEachOrder()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetTransportBoardAsync_IncludesExpandedLineDetailsForEachOrder));
        SeedSharedLookupData(db);

        db.SalesOrders.Add(new SalesOrder
        {
            Id = 7001,
            SalesOrderNo = "SO-7001",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyToShip,
            CustomerId = 1,
            SiteId = 1,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 70011,
                    SalesOrderId = 7001,
                    LineNo = 1,
                    ItemId = 101,
                    QuantityAsOrdered = 8,
                    SiteId = 1,
                },
                new SalesOrderDetail
                {
                    Id = 70012,
                    SalesOrderId = 7001,
                    LineNo = 2,
                    ItemId = 102,
                    QuantityAsOrdered = 3,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var service = new OrderQueryService(db);
        var result = await service.GetTransportBoardAsync(
            page: 1,
            pageSize: 20,
            search: null,
            movementType: null,
            status: null,
            siteId: null,
            carrier: null);

        var order = Assert.Single(result.Items);
        Assert.Equal("Shipment", order.MovementType);
        Assert.Equal(2, order.Lines.Count);

        var firstLine = order.Lines[0];
        Assert.Equal(70011, firstLine.LineId);
        Assert.Equal("TNK-101", firstLine.ItemNo);
        Assert.Equal("Acetylene Cylinder", firstLine.ItemDescription);
        Assert.Equal("Refurb", firstLine.ProductLine);
        Assert.Equal(8, firstLine.QuantityOrdered);
    }

    private static void SeedSharedLookupData(Data.LpcAppsDbContext db)
    {
        db.Sites.Add(new Site
        {
            Id = 1,
            Name = "Main",
            SiteCode = "MAIN",
        });
        db.Customers.Add(new Customer
        {
            Id = 1,
            Name = "Acme Industrial",
        });
        db.Items.AddRange(
            new Item
            {
                Id = 101,
                ItemNo = "TNK-101",
                ItemDescription = "Acetylene Cylinder",
                ItemType = "Tank",
                ProductLine = "Refurb",
                RequiresSerialNumbers = 0,
            },
            new Item
            {
                Id = 102,
                ItemNo = "TNK-102",
                ItemDescription = "Oxygen Cylinder",
                ItemType = "Tank",
                ProductLine = "Refurb",
                RequiresSerialNumbers = 0,
            });
    }
}
