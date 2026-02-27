using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public class OrderQueryService(LpcAppsDbContext db) : IOrderQueryService
{
    public async Task<PaginatedResponse<OrderDraftListDto>> GetOrdersAsync(
        int page,
        int pageSize,
        string? search,
        string? status,
        int? customerId,
        DateOnly? dateFrom,
        DateOnly? dateTo,
        CancellationToken cancellationToken = default)
    {
        var query = db.SalesOrders.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(o =>
                o.SalesOrderNo.Contains(search) ||
                o.Customer.Name.Contains(search) ||
                (o.CustomerPoNo != null && o.CustomerPoNo.Contains(search)));
        }

        if (customerId.HasValue)
            query = query.Where(o => o.CustomerId == customerId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(o => o.OrderStatus == status || o.OrderLifecycleStatus == status);

        if (dateFrom.HasValue)
            query = query.Where(o => o.OrderDate >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(o => o.OrderDate <= dateTo.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(o => o.OrderDate)
            .ThenByDescending(o => o.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new OrderDraftListDto(
                o.Id,
                o.SalesOrderNo,
                o.OrderDate,
                o.OrderStatus,
                o.CustomerId,
                o.Customer.Name,
                o.SiteId,
                o.Site.Name,
                o.CustomerPoNo,
                o.Contact,
                o.SalesOrderDetails.Count(),
                o.SalesOrderDetails.Sum(d => d.QuantityAsOrdered),
                o.OrderLifecycleStatus))
            .ToListAsync(cancellationToken);

        return new PaginatedResponse<OrderDraftListDto>(items, totalCount, page, pageSize);
    }

    public async Task<OrderDraftDetailDto?> GetOrderDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders
            .Include(o => o.Customer)
            .Include(o => o.Site)
            .Include(o => o.BillToAddress)
            .Include(o => o.PickUpAddress)
            .Include(o => o.ShipToAddress)
            .Include(o => o.PickUpVia)
            .Include(o => o.ShipToVia)
            .Include(o => o.PaymentTerm)
            .Include(o => o.SalesPerson)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Color)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.LidColor)
            .Where(o => o.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        if (order is null)
            return null;

        var lines = order.SalesOrderDetails
            .OrderBy(d => d.LineNo)
            .Select(ToOrderLineDto)
            .ToList();

        return new OrderDraftDetailDto(
            order.Id,
            order.SalesOrderNo,
            order.OrderDate,
            order.OrderStatus,
            order.OrderDate,
            order.PickupDate,
            order.PickupScheduledDate,
            order.ReceivedDate,
            order.ReadyToShipDate,
            order.InvoiceDate,
            order.CustomerId,
            order.Customer.Name,
            order.SiteId,
            order.Site.Name,
            order.CustomerPoNo,
            order.Contact,
            order.Phone,
            order.Comments,
            order.Priority,
            order.SalesPersonId,
            order.SalesPerson?.Name,
            order.BillToAddressId,
            order.PickUpAddressId,
            order.ShipToAddressId,
            order.PickUpViaId,
            order.ShipToViaId,
            order.PaymentTermId,
            order.ReturnScrap,
            order.ReturnBrass,
            lines,
            order.OrderLifecycleStatus,
            order.HoldOverlay,
            order.StatusOwnerRole);
    }

    public async Task<PaginatedResponse<TransportBoardItemDto>> GetTransportBoardAsync(
        int page,
        int pageSize,
        string? search,
        string? movementType,
        string? status,
        int? siteId,
        string? carrier,
        CancellationToken cancellationToken = default)
    {
        var query = db.SalesOrders
            .Where(o => OrderStatusCatalog.TransportBoardVisibleStatuses.Contains(o.OrderStatus))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(o =>
                o.SalesOrderNo.Contains(search) ||
                o.Customer.Name.Contains(search) ||
                (o.Contact != null && o.Contact.Contains(search)) ||
                (o.Comments != null && o.Comments.Contains(search)) ||
                (o.TransportationStatus != null && o.TransportationStatus.Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(o => o.OrderStatus == status);

        if (siteId.HasValue)
            query = query.Where(o => o.SiteId == siteId.Value);

        if (!string.IsNullOrWhiteSpace(carrier))
            query = query.Where(o => o.Carrier != null && o.Carrier.Contains(carrier));

        if (!string.IsNullOrWhiteSpace(movementType))
        {
            if (movementType.Equals("Shipment", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(o => OrderStatusCatalog.ShipmentStatuses.Contains(o.OrderStatus));
            }
            else if (movementType.Equals("Pickup", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(o => !OrderStatusCatalog.ShipmentStatuses.Contains(o.OrderStatus));
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pageIds = await query
            .OrderByDescending(o => o.OrderDate)
            .ThenByDescending(o => o.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => o.Id)
            .ToListAsync(cancellationToken);

        var orders = await db.SalesOrders
            .Where(o => pageIds.Contains(o.Id))
            .Include(o => o.Customer)
            .Include(o => o.Site)
            .Include(o => o.PickUpAddress)
            .Include(o => o.ShipToAddress)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .ToListAsync(cancellationToken);

        var orderLookup = orders.ToDictionary(o => o.Id);
        var items = pageIds
            .Select(id => orderLookup[id])
            .Select(ToTransportBoardItemDto)
            .ToList();

        return new PaginatedResponse<TransportBoardItemDto>(items, totalCount, page, pageSize);
    }

    public Task<List<string>> GetStatusesAsync(CancellationToken cancellationToken = default)
    {
        return db.SalesOrders
            .Select(o => o.OrderStatus)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ReceivingOrderListItemDto>> GetReceivingQueueAsync(CancellationToken cancellationToken = default)
    {
        var orders = await db.SalesOrders
            .Where(o => o.OrderStatus == OrderStatusCatalog.PickupScheduled)
            .Include(o => o.Customer)
            .Include(o => o.Site)
            .Include(o => o.PickUpAddress)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .OrderByDescending(o => o.Id)
            .ToListAsync(cancellationToken);

        return orders
            .Select(o => new ReceivingOrderListItemDto(
                o.Id,
                o.SalesOrderNo,
                o.IpadOrderId.HasValue ? o.IpadOrderId.Value.ToString() : null,
                o.Customer.Name,
                o.Site.Name,
                string.IsNullOrWhiteSpace(o.TrailerNo) ? "Customer Drop Off" : "Trailer Pickup",
                o.Priority,
                FormatAddressLabel(o.PickUpAddress),
                TrimToNull(o.PickUpAddress?.City),
                TrimToNull(o.PickUpAddress?.State),
                TrimToNull(o.PickUpAddress?.PostalCode),
                TrimToNull(o.PickUpAddress?.Country),
                BuildLineSummary(o.SalesOrderDetails),
                o.TrailerNo,
                o.PickupScheduledDate,
                o.SalesOrderDetails.Count,
                o.SalesOrderDetails.Sum(d => d.QuantityAsOrdered)))
            .ToList();
    }

    public async Task<List<ProductionOrderListItemDto>> GetProductionQueueAsync(CancellationToken cancellationToken = default)
    {
        var orders = await db.SalesOrders
            .Where(o => o.OrderStatus == OrderStatusCatalog.Received)
            .Include(o => o.Customer)
            .Include(o => o.Site)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .OrderByDescending(o => o.ReceivedDate.HasValue)
            .ThenByDescending(o => o.ReceivedDate)
            .ThenByDescending(o => o.Id)
            .ToListAsync(cancellationToken);

        return orders
            .Select(o => new ProductionOrderListItemDto(
                o.Id,
                o.SalesOrderNo,
                o.Customer.Name,
                o.Site.Name,
                o.Priority,
                BuildLineSummary(o.SalesOrderDetails),
                o.ReceivedDate,
                o.SalesOrderDetails.Count,
                o.SalesOrderDetails.Sum(d => d.QuantityAsOrdered)))
            .ToList();
    }

    public async Task<ReceivingOrderDetailDto?> GetReceivingDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders
            .Include(o => o.Customer)
            .Include(o => o.PickUpAddress)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.SalesOrderDetailSns)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        if (order is null)
            return null;

        return ToReceivingDetailDto(order);
    }

    public async Task<ProductionOrderDetailDto?> GetProductionDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var order = await db.SalesOrders
            .Include(o => o.Customer)
            .Include(o => o.PickUpAddress)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.SalesOrderDetailSns)
                    .ThenInclude(sn => sn.ScrapReason)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        if (order is null)
            return null;

        return ToProductionDetailDto(order);
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

    private static TransportBoardItemDto ToTransportBoardItemDto(SalesOrder order)
    {
        var lineCount = order.SalesOrderDetails.Count;
        var totalQuantity = order.SalesOrderDetails.Sum(d => d.QuantityAsOrdered);
        var topLines = order.SalesOrderDetails
            .OrderBy(d => d.LineNo)
            .Take(3)
            .Select(d =>
            {
                var itemNo = d.Item?.ItemNo ?? d.ItemName ?? $"Item {d.ItemId}";
                return $"{itemNo} x {d.QuantityAsOrdered:0.##}";
            });
        var lineSummary = lineCount == 0
            ? "No lines"
            : string.Join("; ", topLines) + (lineCount > 3 ? "; ..." : string.Empty);

        return new TransportBoardItemDto(
            order.Id,
            order.SalesOrderNo,
            order.OrderStatus,
            OrderStatusCatalog.ShipmentStatuses.Contains(order.OrderStatus) ? "Shipment" : "Pickup",
            order.OrderDate,
            order.CustomerId,
            order.Customer.Name,
            order.SiteId,
            order.Site.Name,
            FormatAddressLabel(order.PickUpAddress),
            FormatAddressLabel(order.ShipToAddress),
            TrimToNull(order.PickUpAddress?.Address1),
            TrimToNull(order.ShipToAddress?.Address1),
            lineCount,
            totalQuantity,
            lineSummary,
            order.Contact,
            order.Phone,
            order.Comments,
            order.TrailerNo,
            order.Carrier,
            order.DispatchDate,
            order.PickupScheduledDate,
            order.TransportationStatus,
            order.TransportationNotes);
    }

    private static string? FormatAddressLabel(Address? address)
    {
        if (address is null) return null;
        var line1 = string.IsNullOrWhiteSpace(address.AddressName) ? address.Address1 : address.AddressName;
        line1 = string.IsNullOrWhiteSpace(line1) ? "(no address)" : line1.Trim();
        var cityStateZip = string.Join(" ",
            new[] { address.City, address.State, address.PostalCode }
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x!.Trim()));
        return string.IsNullOrWhiteSpace(cityStateZip) ? line1 : $"{line1}, {cityStateZip}";
    }

    private static string BuildLineSummary(IEnumerable<SalesOrderDetail> details)
    {
        var lines = details
            .OrderBy(d => d.LineNo)
            .Take(4)
            .Select(d =>
            {
                var itemNo = d.Item?.ItemNo ?? d.ItemName ?? $"Item {d.ItemId}";
                return $"{itemNo} ({d.QuantityAsOrdered:0.##})";
            })
            .ToList();

        if (lines.Count == 0)
            return "No items";

        var extraCount = details.Count() - lines.Count;
        return extraCount > 0
            ? $"{string.Join("; ", lines)}; +{extraCount} more"
            : string.Join("; ", lines);
    }

    private static string? TrimToNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.Trim();
    }

    private static ReceivingOrderDetailDto ToReceivingDetailDto(SalesOrder order)
    {
        var lines = order.SalesOrderDetails
            .OrderBy(d => d.LineNo)
            .Select(d =>
            {
                var qtyReceived = d.QuantityAsReceived ?? 0;
                return new ReceivingOrderLineDto(
                    d.Id,
                    d.LineNo,
                    d.ItemId,
                    d.Item.ItemNo,
                    d.Item.ItemDescription ?? d.Item.ItemNo,
                    d.QuantityAsOrdered,
                    qtyReceived,
                    qtyReceived > 0);
            })
            .ToList();

        return new ReceivingOrderDetailDto(
            order.Id,
            order.SalesOrderNo,
            order.OrderStatus,
            order.Customer.Name,
            FormatAddressLabel(order.PickUpAddress),
            order.TrailerNo,
            TrimToNull(order.Comments),
            order.ReceivedDate,
            lines);
    }

    private static ProductionOrderDetailDto ToProductionDetailDto(SalesOrder order)
    {
        var lines = order.SalesOrderDetails
            .OrderBy(d => d.LineNo)
            .Select(d =>
            {
                var qtyReceived = d.QuantityAsReceived ?? 0m;
                var qtyShipped = d.QuantityAsShipped ?? 0m;
                var qtyScrapped = d.QuantityAsScrapped ?? 0m;
                var serials = d.SalesOrderDetailSns
                    .OrderBy(sn => sn.Id)
                    .Select(sn =>
                    {
                        var statusName = TrimToNull(sn.ScrapReason?.Name)
                            ?? (string.Equals(sn.Status, "BAD", StringComparison.OrdinalIgnoreCase) ? "BAD" : "GOOD");
                        return new ProductionSerialNumberDto(
                            sn.Id,
                            sn.SerialNumber,
                            TrimToNull(sn.Mfg),
                            TrimToNull(sn.MfgDate),
                            TrimToNull(sn.MfgTestDate),
                            sn.ScrapReasonId,
                            statusName,
                            TrimToNull(sn.LidColor),
                            TrimToNull(sn.LidSize));
                    })
                    .ToList();

                return new ProductionOrderLineDto(
                    d.Id,
                    d.LineNo,
                    d.ItemId,
                    d.Item.ItemNo,
                    d.Item.ItemDescription ?? d.Item.ItemNo,
                    d.QuantityAsOrdered,
                    qtyReceived,
                    qtyShipped,
                    qtyScrapped,
                    d.Item.RequiresSerialNumbers == 1,
                    serials);
            })
            .ToList();

        return new ProductionOrderDetailDto(
            order.Id,
            order.SalesOrderNo,
            order.OrderStatus,
            order.Customer.Name,
            FormatAddressLabel(order.PickUpAddress),
            order.TrailerNo,
            TrimToNull(order.Comments),
            order.ReceivedDate,
            lines);
    }
}

