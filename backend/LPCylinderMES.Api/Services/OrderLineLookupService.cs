using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class OrderLineLookupService(LpcAppsDbContext db) : IOrderLineLookupService
{
    public async Task<OrderLineLookupBundleDto> GetOrderLineLookupsAsync(CancellationToken cancellationToken = default)
    {
        var valveTypes = await db.ValveTypeLookups
            .AsNoTracking()
            .Where(v => v.IsActive)
            .OrderBy(v => v.SortOrder)
            .ThenBy(v => v.DisplayName)
            .Select(v => new OrderLineLookupOptionDto(v.Id, v.Code, v.DisplayName, v.IsActive, v.SortOrder))
            .ToListAsync(cancellationToken);

        var gauges = await db.GaugeLookups
            .AsNoTracking()
            .Where(g => g.IsActive)
            .OrderBy(g => g.SortOrder)
            .ThenBy(g => g.DisplayName)
            .Select(g => new OrderLineLookupOptionDto(g.Id, g.Code, g.DisplayName, g.IsActive, g.SortOrder))
            .ToListAsync(cancellationToken);

        return new OrderLineLookupBundleDto(valveTypes, gauges);
    }
}
