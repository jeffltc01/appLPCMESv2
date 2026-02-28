namespace LPCylinderMES.Api.Services;

public interface IInvoiceStagingAccessTokenProvider
{
    Task<string?> GetAccessTokenAsync(CancellationToken cancellationToken = default);
}
