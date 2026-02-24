using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController(
    LpcAppsDbContext db,
    IOrderQueryService orderQueryService,
    IOrderWorkflowService orderWorkflowService,
    IReceivingService receivingService,
    IOrderAttachmentService orderAttachmentService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<OrderDraftListDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] int? customerId = null,
        [FromQuery] DateOnly? dateFrom = null,
        [FromQuery] DateOnly? dateTo = null)
    {
        var result = await orderQueryService.GetOrdersAsync(page, pageSize, search, customerId, dateFrom, dateTo);
        return Ok(result);
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
        var result = await orderQueryService.GetTransportBoardAsync(
            page, pageSize, search, movementType, status, siteId, carrier);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDraftDetailDto>> Get(int id)
    {
        var detail = await orderQueryService.GetOrderDetailAsync(id);
        if (detail is null)
            return NotFound();

        return Ok(detail);
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

        var detail = await orderQueryService.GetOrderDetailAsync(order.Id);
        return CreatedAtAction(nameof(Get), new { id = order.Id }, detail);
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

        var detail = await orderQueryService.GetOrderDetailAsync(id);
        return Ok(detail);
    }

    [HttpPost("{id:int}/advance-status")]
    public async Task<ActionResult<OrderDraftDetailDto>> AdvanceStatus(int id, OrderAdvanceStatusDto dto)
    {
        try
        {
            var detail = await orderWorkflowService.AdvanceStatusAsync(id, dto.TargetStatus);
            return Ok(detail);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
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
            .ToListAsync();

        if (orders.Count != updateIds.Count)
            return BadRequest(new { message = "One or more orders were not found." });

        var orderById = orders.ToDictionary(o => o.Id);
        foreach (var dto in updates)
        {
            var order = orderById[dto.Id];
            if (!OrderStatusCatalog.TransportEditableStatuses.Contains(order.OrderStatus))
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

        var refreshed = await orderQueryService.GetTransportBoardAsync(
            1, updateIds.Count, null, null, null, null, null);
        var response = refreshed.Items.Where(i => updateIds.Contains(i.Id)).ToList();
        return Ok(response);
    }

    [HttpGet("statuses")]
    public async Task<ActionResult<List<string>>> GetStatuses()
    {
        return Ok(await orderQueryService.GetStatusesAsync());
    }

    [HttpGet("receiving")]
    public async Task<ActionResult<List<ReceivingOrderListItemDto>>> GetReceivingQueue()
    {
        return Ok(await orderQueryService.GetReceivingQueueAsync());
    }

    [HttpGet("production")]
    public async Task<ActionResult<List<ProductionOrderListItemDto>>> GetProductionQueue()
    {
        return Ok(await orderQueryService.GetProductionQueueAsync());
    }

    [HttpGet("{id:int}/receiving")]
    public async Task<ActionResult<ReceivingOrderDetailDto>> GetReceivingDetail(int id)
    {
        var detail = await orderQueryService.GetReceivingDetailAsync(id);
        if (detail is null)
            return NotFound();

        if (detail.OrderStatus != "Pickup Scheduled")
            return Conflict(new { message = "Only orders in status 'Pickup Scheduled' can be received." });

        return Ok(detail);
    }

    [HttpGet("{id:int}/production")]
    public async Task<ActionResult<ProductionOrderDetailDto>> GetProductionDetail(int id)
    {
        var detail = await orderQueryService.GetProductionDetailAsync(id);
        if (detail is null)
            return NotFound();

        if (detail.OrderStatus != "Received")
            return Conflict(new { message = "Only orders in status 'Received' can be viewed in Production." });

        return Ok(detail);
    }

    [HttpGet("{id:int}/attachments")]
    public async Task<ActionResult<List<OrderAttachmentDto>>> GetAttachments(int id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await orderAttachmentService.GetAttachmentsAsync(id, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{id:int}/attachments")]
    public async Task<ActionResult<OrderAttachmentDto>> UploadAttachment(
        int id,
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken)
    {
        try
        {
            var attachment = await orderAttachmentService.UploadAttachmentAsync(id, file, cancellationToken);
            return CreatedAtAction(
                nameof(DownloadAttachment),
                new { id, attachmentId = attachment.Id },
                attachment);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("{id:int}/attachments/{attachmentId:int}")]
    public async Task<IActionResult> DownloadAttachment(int id, int attachmentId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await orderAttachmentService.DownloadAttachmentAsync(id, attachmentId, cancellationToken);
            return File(result.Stream, result.ContentType, result.FileName);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpDelete("{id:int}/attachments/{attachmentId:int}")]
    public async Task<IActionResult> DeleteAttachment(int id, int attachmentId, CancellationToken cancellationToken)
    {
        try
        {
            await orderAttachmentService.DeleteAttachmentAsync(id, attachmentId, cancellationToken);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("{id:int}/receiving/complete")]
    public async Task<ActionResult<ReceivingOrderDetailDto>> CompleteReceiving(int id, CompleteReceivingDto dto)
    {
        try
        {
            var detail = await receivingService.CompleteReceivingAsync(id, dto);
            return Ok(detail);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
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

    private static string? TrimToNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.Trim();
    }

    private static string? FormatContactName(Contact? contact)
    {
        if (contact is null) return null;
        var fullName = $"{contact.FirstName} {contact.LastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? null : fullName;
    }
}

