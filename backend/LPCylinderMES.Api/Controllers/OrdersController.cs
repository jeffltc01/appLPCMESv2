using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController(LpcAppsDbContext db) : ControllerBase
{
    private static readonly string[] WorkflowSteps =
    {
        "New",
        "Ready for Pickup",
        "Pickup Scheduled",
        "Received",
        "Ready to Ship",
        "Ready to Invoice",
    };
    private static readonly HashSet<string> ShipmentStatuses = new(StringComparer.Ordinal)
    {
        "Ready to Ship",
        "Ready to Invoice",
    };
    private static readonly HashSet<string> TransportBoardVisibleStatuses = new(StringComparer.Ordinal)
    {
        "Ready for Pickup",
        "Ready to Ship",
    };
    private static readonly HashSet<string> TransportEditableStatuses = new(StringComparer.Ordinal)
    {
        "Ready for Pickup",
        "Pickup Scheduled",
        "Ready to Ship",
        "Ready to Invoice",
    };

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<OrderDraftListDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] int? customerId = null,
        [FromQuery] DateOnly? dateFrom = null,
        [FromQuery] DateOnly? dateTo = null)
    {
        var query = db.SalesOrders
            .Where(o => o.OrderStatus == "New")
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(o =>
                o.SalesOrderNo.Contains(search) ||
                o.Customer.Name.Contains(search) ||
                (o.CustomerPoNo != null && o.CustomerPoNo.Contains(search)));
        }

        if (customerId.HasValue)
            query = query.Where(o => o.CustomerId == customerId.Value);

        if (dateFrom.HasValue)
            query = query.Where(o => o.OrderDate >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(o => o.OrderDate <= dateTo.Value);

        var totalCount = await query.CountAsync();

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
                o.SalesOrderDetails.Sum(d => d.QuantityAsOrdered)))
            .ToListAsync();

        return Ok(new PaginatedResponse<OrderDraftListDto>(items, totalCount, page, pageSize));
    }

    [HttpGet("transport-board")]
    public async Task<ActionResult<PaginatedResponse<TransportBoardItemDto>>> GetTransportBoard(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] string? movementType = null,
        [FromQuery] string? status = null,
        [FromQuery] int? siteId = null,
        [FromQuery] string? carrier = null)
    {
        var query = db.SalesOrders
            .Where(o => TransportBoardVisibleStatuses.Contains(o.OrderStatus))
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
                query = query.Where(o => ShipmentStatuses.Contains(o.OrderStatus));
            }
            else if (movementType.Equals("Pickup", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(o => !ShipmentStatuses.Contains(o.OrderStatus));
            }
        }

        var totalCount = await query.CountAsync();

        var pageIds = await query
            .OrderByDescending(o => o.OrderDate)
            .ThenByDescending(o => o.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => o.Id)
            .ToListAsync();

        var orders = await db.SalesOrders
            .Where(o => pageIds.Contains(o.Id))
            .Include(o => o.Customer)
            .Include(o => o.Site)
            .Include(o => o.PickUpAddress)
            .Include(o => o.ShipToAddress)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .ToListAsync();

        var orderLookup = orders.ToDictionary(o => o.Id);
        var items = pageIds
            .Select(id => orderLookup[id])
            .Select(ToTransportBoardItemDto)
            .ToList();

        return Ok(new PaginatedResponse<TransportBoardItemDto>(items, totalCount, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDraftDetailDto>> Get(int id)
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
            .FirstOrDefaultAsync();

        if (order is null)
            return NotFound();

        var lines = order.SalesOrderDetails
            .OrderBy(d => d.LineNo)
            .Select(d => ToOrderLineDto(d))
            .ToList();

        return Ok(new OrderDraftDetailDto(
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
            lines));
    }

    [HttpPost]
    public async Task<ActionResult<OrderDraftDetailDto>> Create(OrderDraftCreateDto dto)
    {
        var customer = await db.Customers.FindAsync(dto.CustomerId);
        if (customer is null)
            return BadRequest(new { message = "Invalid customerId." });

        var siteExists = await db.Sites.AnyAsync(s => s.Id == dto.SiteId);
        if (!siteExists)
            return BadRequest(new { message = "Invalid siteId." });

        Contact? defaultOrderContact = null;
        if (customer.DefaultOrderContactId.HasValue)
        {
            defaultOrderContact = await db.Contacts.FirstOrDefaultAsync(c =>
                c.Id == customer.DefaultOrderContactId.Value &&
                c.CustomerId == customer.Id);
        }

        var defaultContactName = FormatContactName(defaultOrderContact);
        var defaultOfficePhone = defaultOrderContact?.OfficePhone;
        var resolvedDefaultShipToId = customer.DefaultShipToId ?? customer.DefaultPickUpId;
        var resolvedDefaultPickUpId = customer.DefaultPickUpId ?? customer.DefaultShipToId;

        var order = new SalesOrder
        {
            SalesOrderNo = await GenerateOrderNumber(),
            CustomerId = dto.CustomerId,
            SiteId = dto.SiteId,
            OrderDate = dto.OrderDate ?? DateOnly.FromDateTime(DateTime.Today),
            OrderStatus = "New",
            CustomerPoNo = dto.CustomerPoNo,
            Contact = string.IsNullOrWhiteSpace(dto.Contact) ? defaultContactName : dto.Contact,
            Phone = string.IsNullOrWhiteSpace(dto.Phone) ? defaultOfficePhone : dto.Phone,
            Comments = dto.Comments,
            Priority = dto.Priority,
            SalesPersonId = dto.SalesPersonId ?? customer.DefaultSalesEmployeeId,
            BillToAddressId = dto.BillToAddressId ?? customer.DefaultBillToId,
            PickUpAddressId = dto.PickUpAddressId ?? resolvedDefaultPickUpId,
            ShipToAddressId = dto.ShipToAddressId ?? resolvedDefaultShipToId,
            PickUpViaId = dto.PickUpViaId ?? customer.DefaultShipViaId,
            ShipToViaId = dto.ShipToViaId ?? customer.DefaultShipViaId,
            PaymentTermId = dto.PaymentTermId ?? customer.DefaultPaymentTermId,
            ReturnScrap = dto.ReturnScrap ?? customer.DefaultReturnScrap,
            ReturnBrass = dto.ReturnBrass ?? customer.DefaultReturnBrass,
        };

        db.SalesOrders.Add(order);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = order.Id }, await GetDetailDto(order.Id));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<OrderDraftDetailDto>> Update(int id, OrderDraftUpdateDto dto)
    {
        var order = await db.SalesOrders.FindAsync(id);
        if (order is null)
            return NotFound();

        if (order.OrderStatus != "New")
            return Conflict(new { message = "Only orders in status 'New' can be edited in this sprint." });

        var customerExists = await db.Customers.AnyAsync(c => c.Id == dto.CustomerId);
        if (!customerExists)
            return BadRequest(new { message = "Invalid customerId." });

        var siteExists = await db.Sites.AnyAsync(s => s.Id == dto.SiteId);
        if (!siteExists)
            return BadRequest(new { message = "Invalid siteId." });

        order.CustomerId = dto.CustomerId;
        order.SiteId = dto.SiteId;
        order.OrderDate = dto.OrderDate;
        order.CustomerPoNo = dto.CustomerPoNo;
        order.Contact = dto.Contact;
        order.Phone = dto.Phone;
        order.Comments = dto.Comments;
        order.Priority = dto.Priority;
        order.SalesPersonId = dto.SalesPersonId;
        order.BillToAddressId = dto.BillToAddressId;
        order.PickUpAddressId = dto.PickUpAddressId;
        order.ShipToAddressId = dto.ShipToAddressId;
        order.PickUpViaId = dto.PickUpViaId;
        order.ShipToViaId = dto.ShipToViaId;
        order.PaymentTermId = dto.PaymentTermId;
        order.ReturnScrap = dto.ReturnScrap;
        order.ReturnBrass = dto.ReturnBrass;
        order.OrderStatus = "New";

        await db.SaveChangesAsync();

        return Ok(await GetDetailDto(id));
    }

    [HttpPost("{id:int}/advance-status")]
    public async Task<ActionResult<OrderDraftDetailDto>> AdvanceStatus(int id, OrderAdvanceStatusDto dto)
    {
        var order = await db.SalesOrders.FindAsync(id);
        if (order is null)
            return NotFound();

        var currentIdx = Array.IndexOf(WorkflowSteps, order.OrderStatus);
        if (currentIdx < 0)
            return Conflict(new { message = $"Order is in unsupported status '{order.OrderStatus}'." });

        var expectedNext = currentIdx < WorkflowSteps.Length - 1
            ? WorkflowSteps[currentIdx + 1]
            : null;
        var expectedPrevious = currentIdx > 0
            ? WorkflowSteps[currentIdx - 1]
            : null;

        var isImmediateNext = expectedNext is not null &&
            string.Equals(dto.TargetStatus, expectedNext, StringComparison.Ordinal);
        var isImmediatePrevious = expectedPrevious is not null &&
            string.Equals(dto.TargetStatus, expectedPrevious, StringComparison.Ordinal);

        if (!isImmediateNext && !isImmediatePrevious)
        {
            return Conflict(new
            {
                message =
                    $"Only immediate adjacent step is allowed. Current='{order.OrderStatus}', " +
                    $"previous='{expectedPrevious ?? "(none)"}', next='{expectedNext ?? "(none)"}'."
            });
        }

        var previousStatus = order.OrderStatus;
        order.OrderStatus = dto.TargetStatus;

        if (isImmediateNext)
        {
            ApplyTransitionTimestamp(order, dto.TargetStatus);
        }
        else if (isImmediatePrevious)
        {
            ClearTransitionTimestamp(order, previousStatus);
        }

        await db.SaveChangesAsync();

        return Ok(await GetDetailDto(id));
    }

    [HttpPut("transport-board")]
    public async Task<ActionResult<List<TransportBoardItemDto>>> UpdateTransportBoard(
        [FromBody] List<TransportBoardUpdateDto>? updates)
    {
        if (updates is null || updates.Count == 0)
            return BadRequest(new { message = "No updates were provided." });

        var updateIds = updates.Select(u => u.Id).Distinct().ToList();
        var orders = await db.SalesOrders
            .Where(o => updateIds.Contains(o.Id))
            .Include(o => o.Customer)
            .Include(o => o.Site)
            .Include(o => o.PickUpAddress)
            .Include(o => o.ShipToAddress)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .ToListAsync();

        if (orders.Count != updateIds.Count)
            return BadRequest(new { message = "One or more orders were not found." });

        var orderById = orders.ToDictionary(o => o.Id);
        foreach (var dto in updates)
        {
            var order = orderById[dto.Id];
            if (!TransportEditableStatuses.Contains(order.OrderStatus))
            {
                return Conflict(new
                {
                    message = $"Order {order.SalesOrderNo} cannot be edited in status '{order.OrderStatus}'."
                });
            }

            order.TrailerNo = TrimToNull(dto.TrailerNo);
            order.Carrier = TrimToNull(dto.Carrier);
            order.DispatchDate = dto.DispatchDate;
            order.PickupScheduledDate = dto.ScheduledDate;
            order.TransportationStatus = TrimToNull(dto.TransportationStatus);
            order.TransportationNotes = TrimToNull(dto.TransportationNotes);
        }

        await db.SaveChangesAsync();

        var response = updates
            .Select(u => ToTransportBoardItemDto(orderById[u.Id]))
            .ToList();
        return Ok(response);
    }

    [HttpGet("statuses")]
    public async Task<ActionResult<List<string>>> GetStatuses()
    {
        var statuses = await db.SalesOrders
            .Select(o => o.OrderStatus)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync();
        return statuses;
    }

    [HttpGet("receiving")]
    public async Task<ActionResult<List<ReceivingOrderListItemDto>>> GetReceivingQueue()
    {
        var orders = await db.SalesOrders
            .Where(o => o.OrderStatus == "Pickup Scheduled")
            .Include(o => o.Customer)
            .Include(o => o.PickUpAddress)
            .Include(o => o.SalesOrderDetails)
            .OrderByDescending(o => o.PickupScheduledDate ?? DateTime.MinValue)
            .ThenByDescending(o => o.Id)
            .ToListAsync();

        var items = orders
            .Select(o => new ReceivingOrderListItemDto(
                o.Id,
                o.SalesOrderNo,
                o.Customer.Name,
                FormatAddressLabel(o.PickUpAddress),
                o.TrailerNo,
                o.PickupScheduledDate,
                o.SalesOrderDetails.Count,
                o.SalesOrderDetails.Sum(d => d.QuantityAsOrdered)))
            .ToList();

        return Ok(items);
    }

    [HttpGet("{id:int}/receiving")]
    public async Task<ActionResult<ReceivingOrderDetailDto>> GetReceivingDetail(int id)
    {
        var order = await db.SalesOrders
            .Include(o => o.Customer)
            .Include(o => o.PickUpAddress)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null)
            return NotFound();

        if (order.OrderStatus != "Pickup Scheduled")
            return Conflict(new { message = "Only orders in status 'Pickup Scheduled' can be received." });

        return Ok(ToReceivingDetailDto(order));
    }

    [HttpPost("{id:int}/receiving/complete")]
    public async Task<ActionResult<ReceivingOrderDetailDto>> CompleteReceiving(int id, CompleteReceivingDto dto)
    {
        var order = await db.SalesOrders
            .Include(o => o.Customer)
            .Include(o => o.PickUpAddress)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null)
            return NotFound();

        if (order.OrderStatus != "Pickup Scheduled")
            return Conflict(new { message = "Only orders in status 'Pickup Scheduled' can be received." });

        if (dto.Lines is null || dto.Lines.Count == 0)
            return BadRequest(new { message = "At least one line update is required." });

        var detailById = order.SalesOrderDetails.ToDictionary(d => d.Id);
        foreach (var line in dto.Lines)
        {
            if (!detailById.TryGetValue(line.LineId, out var detail))
                return BadRequest(new { message = $"Line {line.LineId} is invalid for this order." });

            if (line.QuantityAsReceived < 0)
                return BadRequest(new { message = "Quantity received cannot be negative." });

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
                .ToDictionaryAsync(i => i.Id);

            foreach (var added in dto.AddedLines)
            {
                if (!itemLookup.TryGetValue(added.ItemId, out var item))
                    return BadRequest(new { message = $"Item {added.ItemId} is invalid." });

                if (added.QuantityAsReceived <= 0)
                    return BadRequest(new { message = "Added lines must have quantity received greater than zero." });

                var created = new SalesOrderDetail
                {
                    SalesOrderId = order.Id,
                    LineNo = nextLineNo,
                    ItemId = item.Id,
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
        order.OrderStatus = "Received";

        await db.SaveChangesAsync();

        var refreshed = await db.SalesOrders
            .Include(o => o.Customer)
            .Include(o => o.PickUpAddress)
            .Include(o => o.SalesOrderDetails)
                .ThenInclude(d => d.Item)
            .FirstAsync(o => o.Id == id);

        return Ok(ToReceivingDetailDto(refreshed));
    }

    private async Task<OrderDraftDetailDto> GetDetailDto(int id)
    {
        var result = await Get(id);
        return ((OkObjectResult)result.Result!).Value as OrderDraftDetailDto
            ?? throw new InvalidOperationException("Failed to load order detail");
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

    private async Task<string> GenerateOrderNumber()
    {
        for (var i = 0; i < 10; i++)
        {
            var candidate = $"NEW-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";
            var exists = await db.SalesOrders.AnyAsync(o => o.SalesOrderNo == candidate);
            if (!exists)
                return candidate;
        }

        throw new InvalidOperationException("Unable to generate a unique order number.");
    }

    private static void ApplyTransitionTimestamp(SalesOrder order, string targetStatus)
    {
        var now = DateTime.Now;
        switch (targetStatus)
        {
            case "Ready for Pickup":
                order.PickupDate = now;
                break;
            case "Pickup Scheduled":
                order.PickupScheduledDate = now;
                break;
            case "Received":
                order.ReceivedDate = now;
                break;
            case "Ready to Ship":
                order.ReadyToShipDate = now;
                break;
            case "Ready to Invoice":
                order.InvoiceDate = now;
                break;
        }
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
            ShipmentStatuses.Contains(order.OrderStatus) ? "Shipment" : "Pickup",
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

    private static string? TrimToNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.Trim();
    }

    private static void ClearTransitionTimestamp(SalesOrder order, string fromStatus)
    {
        switch (fromStatus)
        {
            case "Ready for Pickup":
                order.PickupDate = null;
                break;
            case "Pickup Scheduled":
                order.PickupScheduledDate = null;
                break;
            case "Received":
                order.ReceivedDate = null;
                break;
            case "Ready to Ship":
                order.ReadyToShipDate = null;
                break;
            case "Ready to Invoice":
                order.InvoiceDate = null;
                break;
        }
    }

    private static string? FormatContactName(Contact? contact)
    {
        if (contact is null) return null;
        var fullName = $"{contact.FirstName} {contact.LastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? null : fullName;
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
            order.ReceivedDate,
            lines);
    }
}
