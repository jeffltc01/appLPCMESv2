using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Tests;

public class OrderAuditTrailTests
{
    [Fact]
    public async Task SaveChangesAsync_WhenOrderAndLineUpdated_WritesFieldAuditRows()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(SaveChangesAsync_WhenOrderAndLineUpdated_WritesFieldAuditRows));

        db.Items.Add(new Item
        {
            Id = 8101,
            ItemNo = "TNK-8101",
            ItemType = "Tank",
            RequiresSerialNumbers = 0,
        });

        db.SalesOrders.Add(new SalesOrder
        {
            Id = 8100,
            SalesOrderNo = "SO-8100",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = "New",
            CustomerId = 1,
            SiteId = 1,
            Phone = "111-222-3333",
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 81001,
                    SalesOrderId = 8100,
                    LineNo = 1,
                    ItemId = 8101,
                    SiteId = 1,
                    QuantityAsOrdered = 1,
                },
            },
        });
        await db.SaveChangesAsync();

        db.OrderFieldAudits.RemoveRange(await db.OrderFieldAudits.ToListAsync());
        await db.SaveChangesAsync();

        var order = await db.SalesOrders.Include(o => o.SalesOrderDetails).FirstAsync(o => o.Id == 8100);
        var line = order.SalesOrderDetails.Single();

        order.Phone = "999-888-7777";
        line.QuantityAsOrdered = 3;
        await db.SaveChangesAsync();

        var auditRows = await db.OrderFieldAudits
            .Where(a => a.OrderId == 8100 && a.ActionType == "Update")
            .OrderBy(a => a.EntityName)
            .ThenBy(a => a.FieldName)
            .ToListAsync();

        Assert.Contains(auditRows, row =>
            row.EntityName == nameof(SalesOrder) &&
            row.FieldName == nameof(SalesOrder.Phone) &&
            row.OldValue == "111-222-3333" &&
            row.NewValue == "999-888-7777");

        Assert.Contains(auditRows, row =>
            row.EntityName == nameof(SalesOrderDetail) &&
            row.FieldName == nameof(SalesOrderDetail.QuantityAsOrdered) &&
            row.OldValue == "1" &&
            row.NewValue == "3");
    }
}
