using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class OrderLineService(LpcAppsDbContext db) : IOrderLineService
{
    public async Task<decimal?> GetDefaultPriceAsync(int orderId, int itemId, CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FindAsync([orderId], cancellationToken);
        if (order is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        var itemExists = await db.Items.AnyAsync(i => i.Id == itemId, cancellationToken);
        if (!itemExists)
            throw new ServiceException(StatusCodes.Status400BadRequest, "Invalid itemId.");

        return await GetDefaultUnitPrice(itemId, order.CustomerId, cancellationToken);
    }

    public async Task<OrderLineDto> CreateAsync(int orderId, OrderLineCreateDto dto, CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders
            .Include(o => o.SalesOrderDetails)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        EnsureOrderEditable(order);

        var item = await db.Items.FindAsync([dto.ItemId], cancellationToken);
        if (item is null)
            throw new ServiceException(StatusCodes.Status400BadRequest, "Invalid itemId.");

        var nextLineNo = order.SalesOrderDetails.Count == 0
            ? 1
            : order.SalesOrderDetails.Max(d => d.LineNo) + 1;

        var unitPrice = dto.UnitPrice ?? await GetDefaultUnitPrice(dto.ItemId, order.CustomerId, cancellationToken);

        var detail = new SalesOrderDetail
        {
            SalesOrderId = orderId,
            LineNo = nextLineNo,
            ItemId = dto.ItemId,
            ItemName = item.ItemDescription ?? item.ItemNo,
            QuantityAsOrdered = dto.QuantityAsOrdered,
            QuantityAsReceived = 0,
            UnitPrice = unitPrice,
            Extension = unitPrice.HasValue ? dto.QuantityAsOrdered * unitPrice.Value : null,
            Notes = dto.Notes,
            ColorId = dto.ColorId,
            LidColorId = dto.LidColorId,
            NeedCollars = dto.NeedCollars,
            NeedFillers = dto.NeedFillers,
            NeedFootRings = dto.NeedFootRings,
            NeedDecals = dto.NeedDecals,
            ValveType = dto.ValveType,
            Gauges = dto.Gauges,
            SiteId = order.SiteId,
            ReceiptStatus = ReceiptStatusCatalog.Unknown,
        };

        db.SalesOrderDetails.Add(detail);
        await db.SaveChangesAsync(cancellationToken);

        var created = await db.SalesOrderDetails
            .Include(d => d.Item)
            .Include(d => d.Color)
            .Include(d => d.LidColor)
            .FirstAsync(d => d.Id == detail.Id, cancellationToken);

        return ToOrderLineDto(created);
    }

    public async Task<OrderLineDto> UpdateAsync(int orderId, int lineId, OrderLineUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FindAsync([orderId], cancellationToken);
        if (order is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        EnsureOrderEditable(order);

        var detail = await db.SalesOrderDetails
            .FirstOrDefaultAsync(d => d.Id == lineId && d.SalesOrderId == orderId, cancellationToken);
        if (detail is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order line not found.");

        var item = await db.Items.FindAsync([dto.ItemId], cancellationToken);
        if (item is null)
            throw new ServiceException(StatusCodes.Status400BadRequest, "Invalid itemId.");

        detail.ItemId = dto.ItemId;
        detail.ItemName = item.ItemDescription ?? item.ItemNo;
        detail.QuantityAsOrdered = dto.QuantityAsOrdered;
        var resolvedUnitPrice = dto.UnitPrice ?? await GetDefaultUnitPrice(dto.ItemId, order.CustomerId, cancellationToken);
        detail.UnitPrice = resolvedUnitPrice;
        detail.Extension = resolvedUnitPrice.HasValue
            ? dto.QuantityAsOrdered * resolvedUnitPrice.Value
            : null;
        detail.Notes = dto.Notes;
        detail.ColorId = dto.ColorId;
        detail.LidColorId = dto.LidColorId;
        detail.NeedCollars = dto.NeedCollars;
        detail.NeedFillers = dto.NeedFillers;
        detail.NeedFootRings = dto.NeedFootRings;
        detail.NeedDecals = dto.NeedDecals;
        detail.ValveType = dto.ValveType;
        detail.Gauges = dto.Gauges;

        await db.SaveChangesAsync(cancellationToken);

        var updated = await db.SalesOrderDetails
            .Include(d => d.Item)
            .Include(d => d.Color)
            .Include(d => d.LidColor)
            .FirstAsync(d => d.Id == detail.Id, cancellationToken);

        return ToOrderLineDto(updated);
    }

    public async Task DeleteAsync(int orderId, int lineId, CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders.FindAsync([orderId], cancellationToken);
        if (order is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order not found.");

        EnsureOrderEditable(order);

        var detail = await db.SalesOrderDetails
            .FirstOrDefaultAsync(d => d.Id == lineId && d.SalesOrderId == orderId, cancellationToken);
        if (detail is null)
            throw new ServiceException(StatusCodes.Status404NotFound, "Order line not found.");

        db.SalesOrderDetails.Remove(detail);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static void EnsureOrderEditable(SalesOrder order)
    {
        var canEditDraftLines = string.Equals(order.OrderStatus, OrderStatusCatalog.New, StringComparison.Ordinal);
        var canEditInvoiceLines =
            string.Equals(order.OrderStatus, OrderStatusCatalog.ReadyToInvoice, StringComparison.Ordinal) ||
            string.Equals(order.OrderLifecycleStatus, OrderStatusCatalog.DispatchedOrPickupReleased, StringComparison.Ordinal) ||
            string.Equals(order.OrderLifecycleStatus, OrderStatusCatalog.InvoiceReady, StringComparison.Ordinal);

        if (!canEditDraftLines && !canEditInvoiceLines)
        {
            throw new ServiceException(
                StatusCodes.Status409Conflict,
                $"Only orders in statuses '{OrderStatusCatalog.New}', '{OrderStatusCatalog.ReadyToInvoice}', '{OrderStatusCatalog.DispatchedOrPickupReleased}', or '{OrderStatusCatalog.InvoiceReady}' can be edited.");
        }
    }

    private async Task<decimal?> GetDefaultUnitPrice(int itemId, int customerId, CancellationToken cancellationToken)
    {
        var customerSpecific = await db.Pricings
            .Where(p => p.ItemId == itemId && p.CustomerId == customerId)
            .OrderByDescending(p => p.EffectiveDate)
            .Select(p => p.UnitPrice)
            .FirstOrDefaultAsync(cancellationToken);
        if (customerSpecific.HasValue)
            return (decimal?)customerSpecific.Value;

        var baseUnitPrice = await db.Pricings
            .Where(p => p.ItemId == itemId && p.CustomerId == null)
            .OrderByDescending(p => p.EffectiveDate)
            .Select(p => p.UnitPrice)
            .FirstOrDefaultAsync(cancellationToken);
        return baseUnitPrice.HasValue ? (decimal?)baseUnitPrice.Value : null;
    }

    private static OrderLineDto ToOrderLineDto(SalesOrderDetail detail)
    {
        return new OrderLineDto(
            detail.Id,
            detail.LineNo,
            detail.ItemId,
            detail.Item.ItemNo,
            detail.Item.ItemDescription ?? detail.Item.ItemNo,
            detail.QuantityAsOrdered,
            detail.QuantityAsReceived,
            detail.QuantityAsShipped,
            detail.UnitPrice,
            detail.Extension,
            detail.Notes,
            detail.ColorId,
            detail.Color?.Name,
            detail.LidColorId,
            detail.LidColor?.Name,
            detail.NeedCollars,
            detail.NeedFillers,
            detail.NeedFootRings,
            detail.NeedDecals,
            detail.ValveType,
            detail.Gauges);
    }
}

