using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;

namespace LPCylinderMES.Api.Tests;

public class OrderQueryServicePlantManagerBoardTests
{
    [Fact]
    public async Task GetPlantManagerBoardAsync_UsesShipToCityStateAndPickupFlag()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetPlantManagerBoardAsync_UsesShipToCityStateAndPickupFlag));
        SeedSharedLookupData(db);

        db.SalesOrders.Add(new SalesOrder
        {
            Id = 8101,
            SalesOrderNo = "SO-8101",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.ReadyToShip,
            OrderLifecycleStatus = OrderStatusCatalog.ProductionComplete,
            CustomerId = 1,
            SiteId = 1,
            ShipToAddressId = 1001,
            OutboundMode = "CustomerPickup",
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 81011,
                    SalesOrderId = 8101,
                    LineNo = 1,
                    ItemId = 101,
                    QuantityAsOrdered = 10,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var service = new OrderQueryService(db);
        var result = await service.GetPlantManagerBoardAsync();

        var order = Assert.Single(result);
        Assert.Equal("Albany", order.CustomerCity);
        Assert.Equal("NY", order.CustomerState);
        Assert.True(order.IsPickup);
    }

    [Fact]
    public async Task GetPlantManagerBoardAsync_ShowsReceivedQuantityAfterReceivingLifecycle()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(GetPlantManagerBoardAsync_ShowsReceivedQuantityAfterReceivingLifecycle));
        SeedSharedLookupData(db);

        db.SalesOrders.Add(new SalesOrder
        {
            Id = 8102,
            SalesOrderNo = "SO-8102",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = OrderStatusCatalog.Received,
            OrderLifecycleStatus = OrderStatusCatalog.ReceivedPendingReconciliation,
            CustomerId = 1,
            SiteId = 1,
            ShipToAddressId = 1001,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 81021,
                    SalesOrderId = 8102,
                    LineNo = 1,
                    ItemId = 101,
                    QuantityAsOrdered = 10,
                    QuantityAsReceived = 7,
                    SiteId = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        var service = new OrderQueryService(db);
        var result = await service.GetPlantManagerBoardAsync();

        var line = Assert.Single(Assert.Single(result).Lines);
        Assert.Equal(7m, line.DisplayQuantity);
        Assert.Equal("Received", line.DisplayQuantityLabel);
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
        db.Addresses.Add(new Address
        {
            Id = 1001,
            CustomerId = 1,
            Type = "SHIP_TO",
            Address1 = "123 Water St",
            City = "Albany",
            State = "NY",
            AddressName = "Albany Yard",
        });
        db.Items.Add(new Item
        {
            Id = 101,
            ItemNo = "TNK-101",
            ItemDescription = "Acetylene Cylinder",
            ItemType = "Tank",
            ProductLine = "Refurb",
            RequiresSerialNumbers = 0,
        });
    }
}
