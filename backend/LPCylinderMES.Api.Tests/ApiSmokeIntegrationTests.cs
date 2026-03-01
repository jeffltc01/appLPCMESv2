using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LPCylinderMES.Api.Tests;

public class ApiSmokeIntegrationTests : IClassFixture<ApiSmokeWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ApiSmokeIntegrationTests(ApiSmokeWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Theory]
    [InlineData("/api/sites")]
    [InlineData("/api/lookups/colors")]
    [InlineData("/api/lookups/sites")]
    [InlineData("/api/lookups/product-lines")]
    [InlineData("/api/lookups/product-lines?showWhere=OrderReceiving")]
    [InlineData("/api/orders/statuses")]
    [InlineData("/api/orders/receiving")]
    [InlineData("/api/orders/production")]
    [InlineData("/api/setup/production-lines")]
    [InlineData("/api/setup/feature-flags")]
    [InlineData("/api/setup/site-policies")]
    [InlineData("/api/setup/config-audit")]
    [InlineData("/api/help/topics?route=/orders")]
    public async Task Get_EndpointRespondsSuccessfully(string endpoint)
    {
        var response = await _client.GetAsync(endpoint);
        var payload = await response.Content.ReadAsStringAsync();

        Assert.True(response.IsSuccessStatusCode, $"Expected success for {endpoint} but got {(int)response.StatusCode}. Payload: {payload}");
        Assert.False(string.IsNullOrWhiteSpace(payload));
        Assert.True(payload.TrimStart().StartsWith("[", StringComparison.Ordinal) || payload.TrimStart().StartsWith("{", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Get_SiteById_ReturnsSeededSite()
    {
        var response = await _client.GetAsync("/api/sites/1");
        var payload = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("\"id\":1", payload, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Get_HelpTopics_WithoutRoute_ReturnsBadRequest()
    {
        var response = await _client.GetAsync("/api/help/topics");
        var payload = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("InvalidQuery", payload, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Get_HelpTopicById_ReturnsNotFound_WhenUnknown()
    {
        var response = await _client.GetAsync("/api/help/topics/unknown-topic");
        var payload = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Contains("TopicNotFound", payload, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Post_CreateOrder_CanAdvanceToInboundPlanned()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/orders", new
        {
            customerId = 1,
            siteId = 1,
            inboundMode = "LpcArrangedPickup",
            outboundMode = "LpcArrangedDelivery",
        });
        var createPayload = await createResponse.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        using var createDoc = JsonDocument.Parse(createPayload);
        var orderId = createDoc.RootElement.GetProperty("id").GetInt32();
        var salesOrderNo = createDoc.RootElement.GetProperty("salesOrderNo").GetString();
        Assert.NotNull(salesOrderNo);
        Assert.Matches(@"^\d{7}$", salesOrderNo!);

        var advanceResponse = await _client.PostAsJsonAsync($"/api/orders/{orderId}/advance-status", new
        {
            targetStatus = "InboundLogisticsPlanned",
            actingRole = "Office",
            actingEmpNo = "EMP001",
        });
        var advancePayload = await advanceResponse.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, advanceResponse.StatusCode);
        Assert.Contains("\"orderLifecycleStatus\":\"InboundLogisticsPlanned\"", advancePayload, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Post_CreateOrder_AssignsSequentialLegacyOrderNumbers()
    {
        async Task<string> CreateOrderAndGetNo()
        {
            var response = await _client.PostAsJsonAsync("/api/orders", new
            {
                customerId = 1,
                siteId = 1,
                inboundMode = "LpcArrangedPickup",
                outboundMode = "LpcArrangedDelivery",
            });
            var payload = await response.Content.ReadAsStringAsync();
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            using var doc = JsonDocument.Parse(payload);
            var orderNo = doc.RootElement.GetProperty("salesOrderNo").GetString();
            Assert.NotNull(orderNo);
            return orderNo!;
        }

        var first = await CreateOrderAndGetNo();
        var second = await CreateOrderAndGetNo();

        Assert.Matches(@"^\d{7}$", first);
        Assert.Matches(@"^\d{7}$", second);
        Assert.Equal(int.Parse(first) + 1, int.Parse(second));
    }
}

public sealed class ApiSmokeWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"api-smoke-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Testing:UseInMemoryDatabase"] = "true",
                ["Testing:InMemoryDatabaseName"] = _databaseName,
                ["HelpContent:SourceType"] = "File",
                ["HelpContent:BasePath"] = ResolveHelpTopicPath(),
                ["HelpContent:EnableSchemaValidation"] = "true",
            });
        });

        builder.ConfigureServices(services =>
        {
            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<LpcAppsDbContext>();
            db.Database.EnsureCreated();
            Seed(db);
        });
    }

    private static void Seed(LpcAppsDbContext db)
    {
        if (db.Sites.Any())
        {
            return;
        }

        db.Sites.Add(new Site
        {
            Id = 1,
            Name = "Main Site",
            SiteCode = "MAIN",
        });
        db.Customers.Add(new Customer
        {
            Id = 1,
            Name = "Test Customer",
        });
        db.Colors.Add(new Color
        {
            Id = 1,
            Name = "Blue",
        });
        db.ScrapReasons.Add(new ScrapReason
        {
            Id = 1,
            Name = "Damaged",
        });
        db.SaveChanges();
    }

    private static string ResolveHelpTopicPath()
    {
        var root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        return Path.Combine(root, "frontend", "src", "help", "topics");
    }
}
