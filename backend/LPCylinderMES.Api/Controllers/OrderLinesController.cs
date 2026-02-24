using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/orders/{orderId:int}/lines")]
public class OrderLinesController(LpcAppsDbContext db) : ControllerBase
{
    [HttpGet("default-price")]
    public async Task<ActionResult<decimal?>> GetDefaultPrice(
        int orderId,
        [FromQuery] int itemId)
    {
        var order = await db.SalesOrders.FindAsync(orderId);
        if (order is null)
            return NotFound();

        var itemExists = await db.Items.AnyAsync(i => i.Id == itemId);
        if (!itemExists)
            return BadRequest(new { message = "Invalid itemId." });

        var unitPrice = await GetDefaultUnitPrice(itemId, order.CustomerId);
        return Ok(unitPrice);
    }

    [HttpPost]
    public async Task<ActionResult<OrderLineDto>> Create(int orderId, OrderLineCreateDto dto)
    {
        var order = await db.SalesOrders
            .Include(o => o.SalesOrderDetails)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order is null)
            return NotFound();

        if (order.OrderStatus != "New")
            return Conflict(new { message = "Only orders in status 'New' can be edited in this sprint." });

        var item = await db.Items.FindAsync(dto.ItemId);
        if (item is null)
            return BadRequest(new { message = "Invalid itemId." });

        var nextLineNo = order.SalesOrderDetails.Count == 0
            ? 1
            : order.SalesOrderDetails.Max(d => d.LineNo) + 1;

        var unitPrice = dto.UnitPrice ?? await GetDefaultUnitPrice(dto.ItemId, order.CustomerId);

        var detail = new SalesOrderDetail
        {
            SalesOrderId = orderId,
            LineNo = nextLineNo,
            ItemId = dto.ItemId,
            ItemName = item.ItemDescription ?? item.ItemNo,
            QuantityAsOrdered = dto.QuantityAsOrdered,
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
        };

        db.SalesOrderDetails.Add(detail);
        await db.SaveChangesAsync();

        var created = await db.SalesOrderDetails
            .Include(d => d.Item)
            .Include(d => d.Color)
            .Include(d => d.LidColor)
            .FirstAsync(d => d.Id == detail.Id);

        return Ok(ToOrderLineDto(created));
    }

    [HttpPut("{lineId:int}")]
    public async Task<ActionResult<OrderLineDto>> Update(int orderId, int lineId, OrderLineUpdateDto dto)
    {
        var order = await db.SalesOrders.FindAsync(orderId);
        if (order is null)
            return NotFound();

        if (order.OrderStatus != "New")
            return Conflict(new { message = "Only orders in status 'New' can be edited in this sprint." });

        var detail = await db.SalesOrderDetails
            .FirstOrDefaultAsync(d => d.Id == lineId && d.SalesOrderId == orderId);

        if (detail is null)
            return NotFound();

        var item = await db.Items.FindAsync(dto.ItemId);
        if (item is null)
            return BadRequest(new { message = "Invalid itemId." });

        detail.ItemId = dto.ItemId;
        detail.ItemName = item.ItemDescription ?? item.ItemNo;
        detail.QuantityAsOrdered = dto.QuantityAsOrdered;
        var resolvedUnitPrice = dto.UnitPrice ?? await GetDefaultUnitPrice(dto.ItemId, order.CustomerId);
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

        await db.SaveChangesAsync();

        var updated = await db.SalesOrderDetails
            .Include(d => d.Item)
            .Include(d => d.Color)
            .Include(d => d.LidColor)
            .FirstAsync(d => d.Id == detail.Id);

        return Ok(ToOrderLineDto(updated));
    }

    [HttpDelete("{lineId:int}")]
    public async Task<ActionResult> Delete(int orderId, int lineId)
    {
        var order = await db.SalesOrders.FindAsync(orderId);
        if (order is null)
            return NotFound();

        if (order.OrderStatus != "New")
            return Conflict(new { message = "Only orders in status 'New' can be edited in this sprint." });

        var detail = await db.SalesOrderDetails
            .FirstOrDefaultAsync(d => d.Id == lineId && d.SalesOrderId == orderId);

        if (detail is null)
            return NotFound();

        db.SalesOrderDetails.Remove(detail);
        await db.SaveChangesAsync();
        return NoContent();
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

    private async Task<decimal?> GetDefaultUnitPrice(int itemId, int customerId)
    {
        var customerSpecific = await db.Pricings
            .Where(p => p.ItemId == itemId && p.CustomerId == customerId)
            .OrderByDescending(p => p.EffectiveDate)
            .Select(p => p.UnitPrice)
            .FirstOrDefaultAsync();
        if (customerSpecific.HasValue)
            return (decimal?)customerSpecific.Value;

        var baseUnitPrice = await db.Pricings
            .Where(p => p.ItemId == itemId && p.CustomerId == null)
            .OrderByDescending(p => p.EffectiveDate)
            .Select(p => p.UnitPrice)
            .FirstOrDefaultAsync();
        return baseUnitPrice.HasValue ? (decimal?)baseUnitPrice.Value : null;
    }
}
