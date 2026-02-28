using System.Net;
using System.Text;
using LPCylinderMES.Api.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace LPCylinderMES.Api.Tests;

public class InvoiceStagingAccessTokenProviderTests
{
    [Fact]
    public async Task GetAccessTokenAsync_WhenAuthDisabled_ReturnsNull()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["InvoiceStaging:Auth:Enabled"] = "false",
            })
            .Build();
        var clientFactory = new CountingHttpClientFactory(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"access_token\":\"abc\",\"expires_in\":3600}", Encoding.UTF8, "application/json"),
            });
        var provider = new InvoiceStagingAccessTokenProvider(
            configuration,
            clientFactory,
            NullLogger<InvoiceStagingAccessTokenProvider>.Instance);

        var token = await provider.GetAccessTokenAsync();

        Assert.Null(token);
        Assert.Equal(0, clientFactory.CallCount);
    }

    [Fact]
    public async Task GetAccessTokenAsync_WhenEnabled_CachesTokenUntilNearExpiry()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["InvoiceStaging:Auth:Enabled"] = "true",
                ["InvoiceStaging:Auth:Mode"] = "ClientSecret",
                ["InvoiceStaging:Auth:TenantId"] = "tenant-id",
                ["InvoiceStaging:Auth:ClientId"] = "client-id",
                ["InvoiceStaging:Auth:ClientSecret"] = "secret",
                ["InvoiceStaging:Auth:Scope"] = "https://service.flow.microsoft.com/.default",
            })
            .Build();
        var clientFactory = new CountingHttpClientFactory(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"access_token\":\"abc123\",\"expires_in\":3600}", Encoding.UTF8, "application/json"),
            });
        var provider = new InvoiceStagingAccessTokenProvider(
            configuration,
            clientFactory,
            NullLogger<InvoiceStagingAccessTokenProvider>.Instance);

        var tokenOne = await provider.GetAccessTokenAsync();
        var tokenTwo = await provider.GetAccessTokenAsync();

        Assert.Equal("abc123", tokenOne);
        Assert.Equal("abc123", tokenTwo);
        Assert.Equal(1, clientFactory.CallCount);
    }

    private sealed class CountingHttpClientFactory(Func<HttpRequestMessage, HttpResponseMessage> responder) : IHttpClientFactory
    {
        public int CallCount { get; private set; }

        public HttpClient CreateClient(string name)
        {
            return new HttpClient(new StubHandler(request =>
            {
                CallCount++;
                return responder(request);
            }));
        }
    }

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(responder(request));
    }
}
