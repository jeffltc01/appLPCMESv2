using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public interface IScheduleService
{
    Task<ScheduleBoardDto> GetScheduleBoardAsync(
        DateOnly weekOf,
        int? siteId,
        int lookbackDays = 90,
        CancellationToken cancellationToken = default);

    Task BulkAssignScheduleAsync(
        BulkAssignScheduleDto dto,
        CancellationToken cancellationToken = default);
}

public sealed class ScheduleService(
    LpcAppsDbContext db,
    IScheduleThroughputService throughputService) : IScheduleService
{
    private static readonly HashSet<string> CompletedLifecycleStatuses =
    [
        OrderStatusCatalog.Invoiced,
        "Closed",
    ];

    public async Task<ScheduleBoardDto> GetScheduleBoardAsync(
        DateOnly weekOf,
        int? siteId,
        int lookbackDays = 90,
        CancellationToken cancellationToken = default)
    {
        var weekMonday = GetWeekMonday(weekOf);
        var weekEnd = weekMonday.AddDays(6);
        var weekStartUtc = weekMonday.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var weekEndUtc = weekEnd.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var ordersQuery = db.SalesOrders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.SalesOrderDetails)
            .ThenInclude(d => d.Item)
            .ThenInclude(i => i!.ProductLineNavigation)
            .AsQueryable();

        if (siteId.HasValue)
        {
            ordersQuery = ordersQuery.Where(o => o.SiteId == siteId.Value);
        }

        var relevantOrders = await ordersQuery
            .Where(o =>
                (o.ScheduleWeekOf == null && o.TargetDateUtc == null) ||
                (o.ScheduleWeekOf < weekMonday) ||
                (o.ScheduleWeekOf == weekMonday) ||
                (o.TargetDateUtc >= weekStartUtc && o.TargetDateUtc <= weekEndUtc))
            .ToListAsync(cancellationToken);

        var carryover = new List<ScheduleOrderCardDto>();
        var unscheduled = new List<ScheduleOrderCardDto>();
        var weekPool = new List<ScheduleOrderCardDto>();
        var dayAssigned = new List<ScheduleOrderCardDto>();

        foreach (var order in relevantOrders)
        {
            var card = ToScheduleOrderCard(order);

            if (order.ScheduleWeekOf == null && order.TargetDateUtc == null)
            {
                unscheduled.Add(card);
            }
            else if (order.ScheduleWeekOf < weekMonday)
            {
                if (!CompletedLifecycleStatuses.Contains(order.OrderLifecycleStatus ?? ""))
                {
                    carryover.Add(card);
                }
            }
            else if (order.ScheduleWeekOf == weekMonday)
            {
                if (order.TargetDateUtc.HasValue && order.TargetDateUtc >= weekStartUtc && order.TargetDateUtc <= weekEndUtc)
                {
                    dayAssigned.Add(card);
                }
                else
                {
                    weekPool.Add(card);
                }
            }
            else if (order.TargetDateUtc.HasValue && order.TargetDateUtc >= weekStartUtc && order.TargetDateUtc <= weekEndUtc)
            {
                dayAssigned.Add(card);
            }
        }

        carryover = carryover.OrderBy(c => c.OrderDate).ToList();
        unscheduled = unscheduled.OrderBy(c => c.OrderDate).ToList();
        weekPool = weekPool.OrderBy(c => c.OrderDate).ToList();
        dayAssigned = dayAssigned.OrderBy(c => c.TargetDateUtc).ThenBy(c => c.OrderDate).ToList();

        var productLines = await throughputService.GetThroughputAsync(siteId, lookbackDays, cancellationToken);

        return new ScheduleBoardDto(
            carryover,
            unscheduled,
            weekPool,
            dayAssigned,
            productLines.ToList(),
            lookbackDays);
    }

    public async Task BulkAssignScheduleAsync(
        BulkAssignScheduleDto dto,
        CancellationToken cancellationToken = default)
    {
        if (dto.OrderIds == null || dto.OrderIds.Count == 0)
            return;

        var orders = await db.SalesOrders
            .Where(o => dto.OrderIds.Contains(o.Id))
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;

        foreach (var order in orders)
        {
            var oldTarget = order.TargetDateUtc ?? (order.ScheduleWeekOf?.ToDateTime(TimeOnly.MinValue));
            var newTarget = dto.TargetDateUtc ?? (dto.ScheduleWeekOf?.ToDateTime(TimeOnly.MinValue));

            order.ScheduleWeekOf = dto.ScheduleWeekOf;
            order.TargetDateUtc = dto.TargetDateUtc;

            if (oldTarget != newTarget)
            {
                db.OrderPromiseChangeEvents.Add(new OrderPromiseChangeEvent
                {
                    OrderId = order.Id,
                    OldDateUtc = oldTarget,
                    NewDateUtc = newTarget,
                    ChangedByEmpNo = dto.ChangedByEmpNo?.Trim(),
                    OccurredUtc = now,
                    Note = dto.Note?.Trim(),
                });
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static ScheduleOrderCardDto ToScheduleOrderCard(SalesOrder order)
    {
        var totalQty = order.SalesOrderDetails.Sum(d => (int)(d.QuantityAsOrdered));
        var productLineSummary = order.SalesOrderDetails
            .GroupBy(d =>
            {
                var pl = d.Item?.ProductLineNavigation;
                var code = pl?.Code ?? d.Item?.ProductLine?.Trim() ?? "?";
                var name = pl?.Name ?? code;
                var color = pl?.ScheduleColorHex;
                return (Code: code, Name: name, Color: color);
            })
            .Select(g => new OrderLineProductLineSummaryDto(
                g.Key.Code,
                g.Key.Name,
                g.Key.Color,
                (int)g.Sum(d => d.QuantityAsOrdered)))
            .ToList();

        return new ScheduleOrderCardDto(
            order.Id,
            order.SalesOrderNo,
            order.Customer?.Name ?? "",
            order.OrderDate,
            order.RequestedDateUtc,
            order.ScheduleWeekOf,
            order.TargetDateUtc,
            totalQty,
            order.OrderLifecycleStatus ?? "",
            productLineSummary);
    }

    private static DateOnly GetWeekMonday(DateOnly date)
    {
        var dow = (int)date.DayOfWeek;
        var daysSinceMonday = dow == 0 ? 6 : dow - 1;
        return date.AddDays(-daysSinceMonday);
    }
}
