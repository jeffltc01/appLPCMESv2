using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class ReceivingService(
    LpcAppsDbContext db,
    IOrderQueryService orderQueryService) : IReceivingService
{
    public async Task<ReceivingOrderDetailDto> CompleteReceivingAsync(
        int orderId,
        CompleteReceivingDto dto,
        CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        if (!CanCompleteReceiving(order))
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Order cannot be received from current state. LegacyStatus='{order.OrderStatus}', LifecycleStatus='{order.OrderLifecycleStatus ?? "(null)"}'.");
        }

        if (dto.Lines is null || dto.Lines.Count == 0)
        {
            throw new ServiceException(
                StatusCodes.Status400BadRequest,
                "At least one line update is required.");
        }

        var detailById = order.SalesOrderDetails.ToDictionary(d => d.Id);
        foreach (var line in dto.Lines)
        {
            if (!detailById.TryGetValue(line.LineId, out var detail))
                throw new ServiceException(StatusCodes.Status400BadRequest, $"Line {line.LineId} is invalid for this order.");

            if (line.QuantityAsReceived < 0)
                throw new ServiceException(StatusCodes.Status400BadRequest, "Quantity received cannot be negative.");

            detail.QuantityAsReceived = line.IsReceived ? line.QuantityAsReceived : 0;
        }

        var nextLineNo = order.SalesOrderDetails.Count == 0
            ? 1
            : order.SalesOrderDetails.Max(d => d.LineNo) + 1;

        if (dto.AddedLines is not null && dto.AddedLines.Count > 0)
        {
            var itemIds = dto.AddedLines.Select(a => a.ItemId).Distinct().ToList();
            var itemLookup = await db.Items
                .Where(i => itemIds.Contains(i.Id))
                .ToDictionaryAsync(i => i.Id, cancellationToken);

            foreach (var added in dto.AddedLines)
            {
                if (!itemLookup.TryGetValue(added.ItemId, out var item))
                    throw new ServiceException(StatusCodes.Status400BadRequest, $"Item {added.ItemId} is invalid.");

                if (added.QuantityAsReceived <= 0)
                {
                    throw new ServiceException(
                        StatusCodes.Status400BadRequest,
                        "Added lines must have quantity received greater than zero.");
                }

                var created = new SalesOrderDetail
                {
                    SalesOrderId = order.Id,
                    LineNo = nextLineNo,
                    ItemId = item.Id,
                    Item = item,
                    ItemName = item.ItemDescription ?? item.ItemNo,
                    QuantityAsOrdered = 0,
                    QuantityAsReceived = added.QuantityAsReceived,
                    SiteId = order.SiteId,
                };

                nextLineNo += 1;
                order.SalesOrderDetails.Add(created);
            }
        }

        order.ReceivedDate = dto.ReceivedDate;
        order.OrderStatus = OrderStatusCatalog.Received;
        order.OrderLifecycleStatus = OrderStatusCatalog.ReadyForProduction;
        order.StatusUpdatedUtc = DateTime.UtcNow;

        await RouteInstantiationService.EnsureRoutesForOrderAsync(
            db,
            order,
            order.SalesOrderDetails.ToList(),
            cancellationToken);

        await db.SaveChangesAsync(cancellationToken);

        var detailDto = await orderQueryService.GetReceivingDetailAsync(orderId, cancellationToken);
        return detailDto ?? throw new InvalidOperationException("Failed to load receiving detail after completion.");
    }

    private static bool CanCompleteReceiving(SalesOrder order)
    {
        if (string.Equals(order.OrderStatus, OrderStatusCatalog.PickupScheduled, StringComparison.Ordinal))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(order.OrderLifecycleStatus))
        {
            return false;
        }

        return string.Equals(order.OrderLifecycleStatus, OrderStatusCatalog.InboundInTransit, StringComparison.Ordinal) ||
               string.Equals(order.OrderLifecycleStatus, OrderStatusCatalog.InboundLogisticsPlanned, StringComparison.Ordinal) ||
               string.Equals(order.OrderLifecycleStatus, OrderStatusCatalog.ReceivedPendingReconciliation, StringComparison.Ordinal);
    }
}

