using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface IOrderLineLookupService
{
    Task<OrderLineLookupBundleDto> GetOrderLineLookupsAsync(CancellationToken cancellationToken = default);
}
