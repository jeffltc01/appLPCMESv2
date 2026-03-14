using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
namespace LPCylinderMES.Api.Services;

public interface IScheduleThroughputService
{
    Task<IReadOnlyList<ProductLineScheduleInfoDto>> GetThroughputAsync(
        int? siteId = null,
        int lookbackDays = 90,
        CancellationToken cancellationToken = default);
}

public sealed class ScheduleThroughputService(
    LpcAppsDbContext db,
    IMemoryCache cache) : IScheduleThroughputService
{
    private const string CacheKeyPrefix = "ScheduleThroughput:";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    public async Task<IReadOnlyList<ProductLineScheduleInfoDto>> GetThroughputAsync(
        int? siteId = null,
        int lookbackDays = 90,
        CancellationToken cancellationToken = default)
    {
        var effectiveLookback = Math.Clamp(lookbackDays, 7, 365);
        var cacheKey = $"{CacheKeyPrefix}{siteId ?? 0}:{effectiveLookback}";

        return await cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;
            return await ComputeThroughputAsync(siteId, effectiveLookback, cancellationToken);
        }) ?? [];
    }

    private static readonly HashSet<string> CompletedLifecycleStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        OrderStatusCatalog.ProductionComplete,
        OrderStatusCatalog.ProductionCompletePendingApproval,
        OrderStatusCatalog.InvoiceReady,
        OrderStatusCatalog.Invoiced,
        "Closed",
    };

    private async Task<List<ProductLineScheduleInfoDto>> ComputeThroughputAsync(
        int? siteId,
        int lookbackDays,
        CancellationToken cancellationToken)
    {
        var fromUtc = DateTime.UtcNow.Date.AddDays(-lookbackDays);

        var completedOrdersQuery = db.SalesOrders
            .AsNoTracking()
            .Where(o => CompletedLifecycleStatuses.Contains(o.OrderLifecycleStatus ?? ""));

        if (siteId.HasValue)
        {
            completedOrdersQuery = completedOrdersQuery.Where(o => o.SiteId == siteId.Value);
        }

        var ordersWithDates = await completedOrdersQuery
            .Select(o => new
            {
                o.Id,
                o.ProductionCompletedUtc,
                o.StatusUpdatedUtc,
                o.InvoiceDate,
                o.ClosedDate,
            })
            .ToListAsync(cancellationToken);

        var orderCompletionDates = new Dictionary<int, DateTime>();
        foreach (var o in ordersWithDates)
        {
            var completedUtc = o.ProductionCompletedUtc
                ?? o.StatusUpdatedUtc
                ?? (o.InvoiceDate.HasValue ? DateTime.SpecifyKind(o.InvoiceDate.Value, DateTimeKind.Utc) : (DateTime?)null)
                ?? (o.ClosedDate.HasValue ? DateTime.SpecifyKind(o.ClosedDate.Value, DateTimeKind.Utc) : (DateTime?)null);
            if (completedUtc.HasValue && completedUtc.Value >= fromUtc)
            {
                orderCompletionDates[o.Id] = completedUtc.Value;
            }
        }

        var orderIds = orderCompletionDates.Keys.ToList();
        if (orderIds.Count == 0)
        {
            return await GetProductLineInfosWithZeroThroughputAsync(cancellationToken);
        }

        var linesWithProductLine = await db.SalesOrderDetails
            .AsNoTracking()
            .Where(d => orderIds.Contains(d.SalesOrderId))
            .Select(d => new
            {
                d.SalesOrderId,
                d.ItemId,
                d.QuantityAsOrdered,
                d.QuantityAsShipped,
                d.QuantityAsReceived,
            })
            .ToListAsync(cancellationToken);

        var itemProductLines = await db.Items
            .AsNoTracking()
            .Where(i => linesWithProductLine.Select(l => l.ItemId).Distinct().Contains(i.Id))
            .Select(i => new { i.Id, i.ProductLineId, i.ProductLine })
            .ToListAsync(cancellationToken);

        var productLines = await db.ProductLines
            .AsNoTracking()
            .Where(pl => pl.IsFinishedGood && pl.IsActive)
            .Select(pl => new { pl.Id, pl.Code, pl.Name, pl.ScheduleColorHex, pl.WeeklyCapacityTarget })
            .ToListAsync(cancellationToken);

        var plById = productLines.ToDictionary(p => p.Id);
        var plByCode = productLines.ToDictionary(p => p.Code, StringComparer.OrdinalIgnoreCase);

        var weeklyQtyByProductLine = new Dictionary<int, Dictionary<DateOnly, decimal>>();

        foreach (var line in linesWithProductLine)
        {
            if (!orderCompletionDates.TryGetValue(line.SalesOrderId, out var completedUtc))
                continue;

            var qty = (line.QuantityAsShipped ?? line.QuantityAsReceived ?? line.QuantityAsOrdered);
            if (qty <= 0) continue;

            var weekMonday = GetWeekMonday(DateOnly.FromDateTime(completedUtc));
            int? productLineId = null;

            var itemInfo = itemProductLines.FirstOrDefault(i => i.Id == line.ItemId);
            if (itemInfo != null)
            {
                if (itemInfo.ProductLineId.HasValue && plById.ContainsKey(itemInfo.ProductLineId.Value))
                    productLineId = itemInfo.ProductLineId;
                else if (!string.IsNullOrWhiteSpace(itemInfo.ProductLine) &&
                         plByCode.TryGetValue(itemInfo.ProductLine.Trim(), out var pl))
                    productLineId = pl.Id;
            }

            if (!productLineId.HasValue) continue;

            if (!weeklyQtyByProductLine.TryGetValue(productLineId.Value, out var byWeek))
            {
                byWeek = new Dictionary<DateOnly, decimal>();
                weeklyQtyByProductLine[productLineId.Value] = byWeek;
            }

            if (!byWeek.TryGetValue(weekMonday, out var existing))
                existing = 0;
            byWeek[weekMonday] = existing + qty;
        }

        var result = new List<ProductLineScheduleInfoDto>();
        foreach (var pl in productLines.OrderBy(p => p.Code))
        {
            decimal avgPerWeek = 0;
            int peakPerWeek = 0;

            if (weeklyQtyByProductLine.TryGetValue(pl.Id, out var byWeek) && byWeek.Count > 0)
            {
                avgPerWeek = (decimal)byWeek.Values.Sum() / byWeek.Count;
                peakPerWeek = (int)Math.Ceiling(byWeek.Values.Max());
            }

            result.Add(new ProductLineScheduleInfoDto(
                pl.Code,
                pl.Name,
                pl.ScheduleColorHex,
                pl.WeeklyCapacityTarget,
                avgPerWeek,
                peakPerWeek));
        }

        return result;
    }

    private async Task<List<ProductLineScheduleInfoDto>> GetProductLineInfosWithZeroThroughputAsync(
        CancellationToken cancellationToken)
    {
        var productLines = await db.ProductLines
            .AsNoTracking()
            .Where(pl => pl.IsFinishedGood && pl.IsActive)
            .OrderBy(pl => pl.Code)
            .Select(pl => new ProductLineScheduleInfoDto(
                pl.Code,
                pl.Name,
                pl.ScheduleColorHex,
                pl.WeeklyCapacityTarget,
                0,
                0))
            .ToListAsync(cancellationToken);
        return productLines;
    }

    private static DateOnly GetWeekMonday(DateOnly date)
    {
        var dow = (int)date.DayOfWeek;
        var daysSinceMonday = dow == 0 ? 6 : dow - 1;
        return date.AddDays(-daysSinceMonday);
    }
}
