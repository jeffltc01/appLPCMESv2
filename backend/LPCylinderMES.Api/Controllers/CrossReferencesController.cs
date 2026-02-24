using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/cross-references")]
public class CrossReferencesController(LpcAppsDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CrossReferenceDto>>> GetAll(
        [FromQuery] string? erpItemNumber = null)
    {
        var query = db.PartCrossReferences.AsQueryable();

        if (!string.IsNullOrWhiteSpace(erpItemNumber))
            query = query.Where(cr => cr.ErpItemNumber == erpItemNumber);

        var items = await query
            .OrderBy(cr => cr.LpcItemNumber)
            .Select(cr => new CrossReferenceDto(cr.Id, cr.LpcItemNumber, cr.ErpItemNumber))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<CrossReferenceDto>> Create(CrossReferenceCreateDto dto)
    {
        var crossRef = new PartCrossReference
        {
            LpcItemNumber = dto.LpcItemNumber,
            ErpItemNumber = dto.ErpItemNumber,
        };

        db.PartCrossReferences.Add(crossRef);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), null,
            new CrossReferenceDto(crossRef.Id, crossRef.LpcItemNumber, crossRef.ErpItemNumber));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CrossReferenceDto>> Update(int id, CrossReferenceCreateDto dto)
    {
        var crossRef = await db.PartCrossReferences.FindAsync(id);
        if (crossRef is null)
            return NotFound();

        crossRef.LpcItemNumber = dto.LpcItemNumber;
        crossRef.ErpItemNumber = dto.ErpItemNumber;

        await db.SaveChangesAsync();

        return Ok(new CrossReferenceDto(crossRef.Id, crossRef.LpcItemNumber, crossRef.ErpItemNumber));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var crossRef = await db.PartCrossReferences.FindAsync(id);
        if (crossRef is null)
            return NotFound();

        db.PartCrossReferences.Remove(crossRef);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
