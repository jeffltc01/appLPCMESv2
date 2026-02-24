using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/items/{itemId:int}/pricings")]
public class PricingsController(LpcAppsDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PricingDto>>> GetAll(int itemId)
    {
        if (!await db.Items.AnyAsync(i => i.Id == itemId))
            return NotFound();

        var pricings = await db.Pricings
            .Where(p => p.ItemId == itemId)
            .OrderByDescending(p => p.EffectiveDate)
            .Select(p => new PricingDto(
                p.Id, p.EffectiveDate, p.UnitPrice, p.Notes,
                p.ItemId, p.CustomerId,
                p.Customer != null ? p.Customer.Name : null))
            .ToListAsync();

        return Ok(pricings);
    }

    [HttpPost]
    public async Task<ActionResult<PricingDto>> Create(int itemId, PricingCreateDto dto)
    {
        if (!await db.Items.AnyAsync(i => i.Id == itemId))
            return NotFound();

        var pricing = new Pricing
        {
            ItemId = itemId,
            EffectiveDate = dto.EffectiveDate,
            UnitPrice = dto.UnitPrice,
            Notes = dto.Notes,
            CustomerId = dto.CustomerId,
        };

        db.Pricings.Add(pricing);
        await db.SaveChangesAsync();

        var customerName = dto.CustomerId.HasValue
            ? (await db.Customers.FindAsync(dto.CustomerId.Value))?.Name
            : null;

        return CreatedAtAction(nameof(GetAll), new { itemId },
            new PricingDto(pricing.Id, pricing.EffectiveDate, pricing.UnitPrice,
                pricing.Notes, pricing.ItemId, pricing.CustomerId, customerName));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PricingDto>> Update(int itemId, int id, PricingUpdateDto dto)
    {
        var pricing = await db.Pricings
            .FirstOrDefaultAsync(p => p.Id == id && p.ItemId == itemId);

        if (pricing is null)
            return NotFound();

        pricing.EffectiveDate = dto.EffectiveDate;
        pricing.UnitPrice = dto.UnitPrice;
        pricing.Notes = dto.Notes;
        pricing.CustomerId = dto.CustomerId;

        await db.SaveChangesAsync();

        var customerName = dto.CustomerId.HasValue
            ? (await db.Customers.FindAsync(dto.CustomerId.Value))?.Name
            : null;

        return Ok(new PricingDto(pricing.Id, pricing.EffectiveDate, pricing.UnitPrice,
            pricing.Notes, pricing.ItemId, pricing.CustomerId, customerName));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int itemId, int id)
    {
        var pricing = await db.Pricings
            .FirstOrDefaultAsync(p => p.Id == id && p.ItemId == itemId);

        if (pricing is null)
            return NotFound();

        db.Pricings.Remove(pricing);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
