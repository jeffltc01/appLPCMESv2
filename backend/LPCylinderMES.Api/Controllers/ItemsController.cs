using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ItemsController(LpcAppsDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<ItemListDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] string? productLine = null,
        [FromQuery] string? itemType = null)
    {
        var query = db.Items.AsQueryable();

        if (!string.IsNullOrWhiteSpace(productLine) && productLine != "All")
            query = query.Where(i => i.ProductLine == productLine);

        if (!string.IsNullOrWhiteSpace(itemType) && itemType != "All")
            query = query.Where(i => i.ItemType == itemType);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(i =>
                i.ItemNo.Contains(search) ||
                (i.ItemDescription != null && i.ItemDescription.Contains(search)));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(i => i.ItemNo)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new ItemListDto(
                i.Id,
                i.ItemNo,
                i.ItemDescription,
                i.ItemType,
                i.ProductLine,
                i.ItemSizeNavigation != null ? i.ItemSizeNavigation.Name : null,
                i.Pricings
                    .Where(p => p.CustomerId == null)
                    .OrderByDescending(p => p.EffectiveDate)
                    .Select(p => p.UnitPrice)
                    .FirstOrDefault()))
            .ToListAsync();

        return Ok(new PaginatedResponse<ItemListDto>(items, totalCount, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ItemDetailDto>> Get(int id)
    {
        var item = await db.Items
            .Include(i => i.ItemSizeNavigation)
            .Include(i => i.Pricings).ThenInclude(p => p.Customer)
            .Where(i => i.Id == id)
            .FirstOrDefaultAsync();

        if (item is null)
            return NotFound();

        var crossRefs = await db.PartCrossReferences
            .Where(cr => cr.ErpItemNumber == item.ItemNo)
            .OrderBy(cr => cr.LpcItemNumber)
            .Select(cr => new CrossReferenceDto(cr.Id, cr.LpcItemNumber, cr.ErpItemNumber))
            .ToListAsync();

        var pricings = item.Pricings
            .OrderByDescending(p => p.EffectiveDate)
            .Select(p => new PricingDto(
                p.Id, p.EffectiveDate, p.UnitPrice, p.Notes,
                p.ItemId, p.CustomerId, p.Customer?.Name))
            .ToList();

        return Ok(new ItemDetailDto(
            item.Id, item.ItemNo, item.ItemDescription, item.ItemType,
            item.ProductLine, item.ItemSize, item.ItemSizeNavigation?.Name,
            item.SystemCode, item.RequiresSerialNumbers,
            item.RequiresGaugeOption, item.RequiresFillerOption,
            item.RequiresCollarOption, item.RequiresFootRingOption,
            item.RequiresValveTypeOption,
            pricings, crossRefs));
    }

    [HttpPost]
    public async Task<ActionResult<ItemDetailDto>> Create(ItemCreateDto dto)
    {
        if (await db.Items.AnyAsync(i => i.ItemNo == dto.ItemNo))
            return Conflict(new { message = $"Item number '{dto.ItemNo}' already exists." });

        var (isProductLineValid, productLineCode, productLineError) = await ValidateProductLineCodeAsync(dto.ProductLine);
        if (!isProductLineValid)
            return BadRequest(new { message = productLineError });

        var item = new Item
        {
            ItemNo = dto.ItemNo,
            ItemDescription = dto.ItemDescription,
            ItemType = dto.ItemType,
            ProductLine = productLineCode,
            ItemSize = dto.ItemSizeId,
            RequiresSerialNumbers = 0,
        };

        db.Items.Add(item);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = item.Id }, await GetDetailDto(item.Id));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ItemDetailDto>> Update(int id, ItemUpdateDto dto)
    {
        var item = await db.Items.FindAsync(id);
        if (item is null)
            return NotFound();

        if (item.ItemNo != dto.ItemNo && await db.Items.AnyAsync(i => i.ItemNo == dto.ItemNo && i.Id != id))
            return Conflict(new { message = $"Item number '{dto.ItemNo}' already exists." });

        var (isProductLineValid, productLineCode, productLineError) = await ValidateProductLineCodeAsync(dto.ProductLine);
        if (!isProductLineValid)
            return BadRequest(new { message = productLineError });

        item.ItemNo = dto.ItemNo;
        item.ItemDescription = dto.ItemDescription;
        item.ItemType = dto.ItemType;
        item.ProductLine = productLineCode;
        item.ItemSize = dto.ItemSizeId;
        item.SystemCode = dto.SystemCode;
        item.RequiresSerialNumbers = dto.RequiresSerialNumbers;
        item.RequiresGaugeOption = dto.RequiresGaugeOption;
        item.RequiresFillerOption = dto.RequiresFillerOption;
        item.RequiresCollarOption = dto.RequiresCollarOption;
        item.RequiresFootRingOption = dto.RequiresFootRingOption;
        item.RequiresValveTypeOption = dto.RequiresValveTypeOption;

        await db.SaveChangesAsync();

        return Ok(await GetDetailDto(id));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var item = await db.Items.FindAsync(id);
        if (item is null)
            return NotFound();

        var isUsed = await db.SalesOrderDetails.AnyAsync(d => d.ItemId == id);
        if (isUsed)
            return Conflict(new { message = "Cannot delete item because it is referenced by sales order details." });

        db.Items.Remove(item);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<ItemDetailDto> GetDetailDto(int id)
    {
        var result = await Get(id);
        return ((OkObjectResult)result.Result!).Value as ItemDetailDto
            ?? throw new InvalidOperationException("Failed to load item detail");
    }

    private async Task<(bool IsValid, string? Code, string? Error)> ValidateProductLineCodeAsync(string? productLine)
    {
        if (string.IsNullOrWhiteSpace(productLine))
            return (true, null, null);

        var normalizedCode = productLine.Trim();
        var exists = await db.ProductionLines.AnyAsync(pl => pl.Code == normalizedCode);
        if (!exists)
            return (false, null, $"Product line code '{normalizedCode}' does not exist.");

        return (true, normalizedCode, null);
    }
}
