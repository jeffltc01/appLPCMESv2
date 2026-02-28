using System.Net;
using System.Text;
using System.Text.Json;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace LPCylinderMES.Api.Tests;

public class InvoiceStagingServiceTests
{
    [Fact]
    public async Task SubmitToStagingAsync_PostsExpectedPayload_AndReturnsPendingAck()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(SubmitToStagingAsync_PostsExpectedPayload_AndReturnsPendingAck));

        db.Sites.Add(new Site { Id = 1, Name = "LPC Main", SiteCode = "LPC" });
        db.Customers.Add(new Customer
        {
            Id = 1,
            Name = "Customer Name",
            CustomerCode = "AR500",
            Email = "customer@example.com",
        });
        db.Addresses.AddRange(
            new Address
            {
                Id = 11,
                Type = "BillTo",
                AddressName = "Customer Name",
                Address1 = "111 Address",
                Address2 = string.Empty,
                City = "Ann Arbor",
                State = "MI",
                PostalCode = "49887",
                Country = "USA",
                CustomerId = 1,
            },
            new Address
            {
                Id = 12,
                Type = "ShipTo",
                AddressName = "Traverse City",
                Address1 = "111 Address",
                Address2 = string.Empty,
                City = "Traverse City",
                State = "MI",
                PostalCode = "48778",
                Country = "USA",
                CustomerId = 1,
            });
        db.PaymentTerms.Add(new PaymentTerm { Id = 21, Name = "Net 30", TermsCode = "N30" });
        db.SalesPeople.Add(new SalesPeople { Id = 31, Name = "Rep", EmployeeNumber = "0023", ErpNo = "0023" });
        db.ShipVias.Add(new ShipVia { Id = 41, Name = "Best Way", ErpCode = "Best Way" });
        db.Items.Add(new Item
        {
            Id = 51,
            ItemNo = "61184",
            ItemDescription = "500 gallon ASME",
            ItemType = "1",
            ProductLine = "TANK",
            RequiresSerialNumbers = 1,
        });
        db.Items.Add(new Item
        {
            Id = 52,
            ItemNo = "71184",
            ItemDescription = "Non-serial item for flow payload rule",
            ItemType = "1",
            ProductLine = "TANK",
            RequiresSerialNumbers = 1,
        });
        db.PartCrossReferences.Add(new PartCrossReference
        {
            Id = 61,
            LpcItemNumber = "61184",
            ErpItemNumber = "61184-ERP",
        });

        db.SalesOrders.Add(new SalesOrder
        {
            Id = 1001,
            SalesOrderNo = "0111604",
            IpadOrderId = 12345,
            OrderDate = new DateOnly(2025, 6, 24),
            InvoiceDate = new DateTime(2025, 7, 3),
            DispatchDate = new DateTime(2025, 7, 3),
            OrderStatus = "Ready to Invoice",
            CustomerId = 1,
            SiteId = 1,
            BillToAddressId = 11,
            ShipToAddressId = 12,
            PaymentTermId = 21,
            SalesPersonId = 31,
            ShipToViaId = 41,
            CustomerPoNo = "x123456",
            Contact = "John Smith",
            Comments = string.Empty,
            FreightAmount = 345.22m,
            SalesOrderDetails =
            {
                new SalesOrderDetail
                {
                    Id = 2001,
                    LineNo = 1,
                    ItemId = 51,
                    QuantityAsOrdered = 15,
                    QuantityAsShipped = 15,
                    UnitPrice = 34.55m,
                    Extension = 456.12m,
                    Notes = string.Empty,
                    SalesOrderDetailSns =
                    {
                        new SalesOrderDetailSn { Id = 3001, SerialNumber = "W00123456", Status = "GOOD" },
                        new SalesOrderDetailSn { Id = 3002, SerialNumber = "W00123457", Status = "GOOD" },
                    },
                },
                new SalesOrderDetail
                {
                    Id = 2002,
                    LineNo = 2,
                    ItemId = 52,
                    QuantityAsOrdered = 10,
                    QuantityAsShipped = 10,
                    UnitPrice = 12.34m,
                    Extension = 123.40m,
                    Notes = string.Empty,
                    SalesOrderDetailSns =
                    {
                        new SalesOrderDetailSn { Id = 3003, SerialNumber = "X00123456", Status = "GOOD" },
                    },
                },
            },
        });
        await db.SaveChangesAsync();

        var capturedBody = string.Empty;
        var clientFactory = new StubHttpClientFactory(_ => new HttpResponseMessage(HttpStatusCode.Accepted))
        {
            OnRequest = request => capturedBody = request.Content is null
                ? string.Empty
                : request.Content.ReadAsStringAsync().GetAwaiter().GetResult(),
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["InvoiceStaging:PowerAutomateUrl"] = "https://example.test/flow",
                ["InvoiceStaging:CommandTimeoutSeconds"] = "30",
            })
            .Build();

        var service = new InvoiceStagingService(db, configuration, NullLogger<InvoiceStagingService>.Instance, clientFactory);
        var result = await service.SubmitToStagingAsync(new SalesOrder { Id = 1001 }, "corr-1001", "EMP001");

        Assert.True(result.IsSuccessHandoff);
        Assert.Equal("PendingAck", result.StagingResult);

        using var json = JsonDocument.Parse(capturedBody);
        var root = json.RootElement;
        Assert.Equal("LPC", root.GetProperty("SiteCode").GetString());
        Assert.Equal("0111604-12345", root.GetProperty("OrderId").GetString());

        var invoiceJson = root.GetProperty("InvoiceJSON");
        Assert.Equal("0111604", invoiceJson.GetProperty("salesorderno").GetString());
        Assert.Equal("12345", invoiceJson.GetProperty("ipadno").GetString());
        Assert.Equal("AR500", invoiceJson.GetProperty("customerno").GetString());
        Assert.Equal("N30", invoiceJson.GetProperty("termscode").GetString());
        Assert.Equal("0023", invoiceJson.GetProperty("salespersonno").GetString());
        Assert.Equal("customer@example.com", invoiceJson.GetProperty("emailaddress").GetString());
        Assert.Equal("LPC", invoiceJson.GetProperty("warehousecode").GetString());

        var lines = invoiceJson.GetProperty("lines");
        Assert.Equal(2, lines.GetArrayLength());
        var lineOne = lines[0];
        Assert.Equal("61184-ERP", lineOne.GetProperty("itemcode").GetString());
        Assert.Equal(456.12m, lineOne.GetProperty("extensionamt").GetDecimal());
        var lineOneSerials = lineOne.GetProperty("serialnumbers");
        Assert.Equal(2, lineOneSerials.GetArrayLength());

        var lineTwo = lines[1];
        Assert.Equal("71184", lineTwo.GetProperty("itemcode").GetString());
        Assert.Equal(123.40m, lineTwo.GetProperty("extensionamt").GetDecimal());
        Assert.True(!lineTwo.TryGetProperty("serialnumbers", out var lineTwoSerials) || lineTwoSerials.ValueKind is JsonValueKind.Null);
    }

    [Fact]
    public async Task SubmitToStagingAsync_NonSuccessStatus_ReturnsFailed()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(SubmitToStagingAsync_NonSuccessStatus_ReturnsFailed));
        db.Sites.Add(new Site { Id = 1, Name = "LPC Main", SiteCode = "LPC" });
        db.Customers.Add(new Customer { Id = 1, Name = "Customer", CustomerCode = "AR500" });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 2001,
            SalesOrderNo = "SO-2001",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = "Ready to Invoice",
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var clientFactory = new StubHttpClientFactory(_ =>
            new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent("validation failed", Encoding.UTF8, "text/plain"),
            });
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["InvoiceStaging:PowerAutomateUrl"] = "https://example.test/flow",
            })
            .Build();
        var service = new InvoiceStagingService(db, configuration, NullLogger<InvoiceStagingService>.Instance, clientFactory);

        var result = await service.SubmitToStagingAsync(new SalesOrder { Id = 2001 }, "corr-2001", "EMP001");

        Assert.False(result.IsSuccessHandoff);
        Assert.Equal("Failed", result.StagingResult);
        Assert.Contains("400", result.ErrorMessage);
    }

    [Fact]
    public async Task SubmitToStagingAsync_WhenPowerAutomateUrlMissing_ReturnsFailedConfigurationError()
    {
        await using var db = TestInfrastructure.CreateDbContext(nameof(SubmitToStagingAsync_WhenPowerAutomateUrlMissing_ReturnsFailedConfigurationError));
        db.Sites.Add(new Site { Id = 1, Name = "LPC Main", SiteCode = "LPC" });
        db.Customers.Add(new Customer { Id = 1, Name = "Customer", CustomerCode = "AR500" });
        db.SalesOrders.Add(new SalesOrder
        {
            Id = 3001,
            SalesOrderNo = "SO-3001",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = "Ready to Invoice",
            CustomerId = 1,
            SiteId = 1,
        });
        await db.SaveChangesAsync();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        var service = new InvoiceStagingService(
            db,
            configuration,
            NullLogger<InvoiceStagingService>.Instance,
            new StubHttpClientFactory(_ => new HttpResponseMessage(HttpStatusCode.Accepted)));

        var result = await service.SubmitToStagingAsync(new SalesOrder { Id = 3001 }, "corr-3001", "EMP001");

        Assert.False(result.IsSuccessHandoff);
        Assert.Equal("Failed", result.StagingResult);
        Assert.Equal("InvoiceStaging:PowerAutomateUrl is not configured.", result.ErrorMessage);
    }

    private sealed class StubHttpClientFactory(Func<HttpRequestMessage, HttpResponseMessage> responder) : IHttpClientFactory
    {
        public Action<HttpRequestMessage>? OnRequest { get; init; }

        public HttpClient CreateClient(string name)
        {
            return new HttpClient(new StubHandler(message =>
            {
                OnRequest?.Invoke(message);
                return responder(message);
            }));
        }
    }

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(responder(request));
    }
}
