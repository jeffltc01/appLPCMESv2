using System.Reflection;
using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Migrations;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;

namespace LPCylinderMES.Api.Tests;

public class SalesOrderDetailQuantityAsShippedTests
{
    [Fact]
    public void Model_Maps_QuantityAsShipped_ToExpectedColumn()
    {
        var options = new DbContextOptionsBuilder<LpcAppsDbContext>()
            .UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=LpcApps_Test_ModelOnly;Trusted_Connection=True;")
            .Options;

        using var db = new LpcAppsDbContext(options);

        var entityType = db.Model.FindEntityType(typeof(SalesOrderDetail));
        Assert.NotNull(entityType);

        var property = entityType!.FindProperty(nameof(SalesOrderDetail.QuantityAsShipped));
        Assert.NotNull(property);
        Assert.Equal("numeric(18,6)", property!.GetColumnType());

        var table = StoreObjectIdentifier.Table("sales_order_details", null);
        Assert.Equal("quantity_as_shipped", property.GetColumnName(table));
    }

    [Fact]
    public void Migration_AddsQuantityAsShipped_AndBackfillsFromReceived()
    {
        var migration = new AddQuantityAsShippedToSalesOrderDetails();
        var builder = new MigrationBuilder("Microsoft.EntityFrameworkCore.SqlServer");

        var upMethod = typeof(AddQuantityAsShippedToSalesOrderDetails)
            .GetMethod("Up", BindingFlags.Instance | BindingFlags.NonPublic);
        Assert.NotNull(upMethod);

        upMethod!.Invoke(migration, [builder]);

        var addColumn = builder.Operations.OfType<AddColumnOperation>().SingleOrDefault();
        Assert.NotNull(addColumn);
        Assert.Equal("sales_order_details", addColumn!.Table);
        Assert.Equal("quantity_as_shipped", addColumn.Name);
        Assert.Equal("numeric(18,6)", addColumn.ColumnType);
        Assert.True(addColumn.IsNullable);

        var sqlOp = builder.Operations.OfType<SqlOperation>().SingleOrDefault();
        Assert.NotNull(sqlOp);
        Assert.Contains("UPDATE sales_order_details", sqlOp!.Sql);
        Assert.Contains("SET quantity_as_shipped = quantity_as_received", sqlOp.Sql);
        Assert.Contains("WHERE quantity_as_received IS NOT NULL", sqlOp.Sql);
    }
}
