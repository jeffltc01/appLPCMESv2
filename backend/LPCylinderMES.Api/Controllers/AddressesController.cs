using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/customers/{customerId:int}/addresses")]
public class AddressesController(LpcAppsDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AddressDto>>> GetAll(int customerId, [FromQuery] string? type = null)
    {
        if (!await db.Customers.AnyAsync(c => c.Id == customerId))
            return NotFound();

        var query = db.Addresses.Where(a => a.CustomerId == customerId);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(a => a.Type == type);

        var orders = db.SalesOrders.Where(o => o.CustomerId == customerId);
        var billToUsed = await orders.Where(o => o.BillToAddressId != null)
            .Select(o => o.BillToAddressId!.Value).Distinct().ToListAsync();
        var pickUpUsed = await orders.Where(o => o.PickUpAddressId != null)
            .Select(o => o.PickUpAddressId!.Value).Distinct().ToListAsync();
        var shipToUsed = await orders.Where(o => o.ShipToAddressId != null)
            .Select(o => o.ShipToAddressId!.Value).Distinct().ToListAsync();
        var usedIds = new HashSet<int>(billToUsed.Concat(pickUpUsed).Concat(shipToUsed));

        var addresses = await query
            .OrderBy(a => a.Type).ThenBy(a => a.AddressName)
            .Select(a => new AddressDto(
                a.Id, a.Type, a.AddressName, a.Address1, a.Address2,
                a.City, a.State, a.PostalCode, a.Country,
                a.CustomerId, a.ContactId, a.DefaultSalesEmployeeId,
                usedIds.Contains(a.Id)))
            .ToListAsync();

        return Ok(addresses);
    }

    [HttpPost]
    public async Task<ActionResult<AddressDto>> Create(int customerId, AddressCreateDto dto)
    {
        if (!await db.Customers.AnyAsync(c => c.Id == customerId))
            return NotFound();

        var address = new Address
        {
            CustomerId = customerId,
            Type = dto.Type,
            AddressName = dto.AddressName,
            Address1 = dto.Address1,
            Address2 = dto.Address2,
            City = dto.City,
            State = dto.State,
            PostalCode = dto.PostalCode,
            Country = dto.Country,
            ContactId = dto.ContactId,
            DefaultSalesEmployeeId = dto.DefaultSalesEmployeeId,
        };

        db.Addresses.Add(address);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { customerId },
            new AddressDto(address.Id, address.Type, address.AddressName,
                address.Address1, address.Address2, address.City, address.State,
                address.PostalCode, address.Country, address.CustomerId,
                address.ContactId, address.DefaultSalesEmployeeId, false));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AddressDto>> Update(int customerId, int id, AddressUpdateDto dto)
    {
        var address = await db.Addresses
            .FirstOrDefaultAsync(a => a.Id == id && a.CustomerId == customerId);

        if (address is null)
            return NotFound();

        address.Type = dto.Type;
        address.AddressName = dto.AddressName;
        address.Address1 = dto.Address1;
        address.Address2 = dto.Address2;
        address.City = dto.City;
        address.State = dto.State;
        address.PostalCode = dto.PostalCode;
        address.Country = dto.Country;
        address.ContactId = dto.ContactId;
        address.DefaultSalesEmployeeId = dto.DefaultSalesEmployeeId;

        await db.SaveChangesAsync();

        var isUsed = await db.SalesOrders.AnyAsync(o =>
            o.BillToAddressId == id || o.PickUpAddressId == id || o.ShipToAddressId == id);

        return Ok(new AddressDto(address.Id, address.Type, address.AddressName,
            address.Address1, address.Address2, address.City, address.State,
            address.PostalCode, address.Country, address.CustomerId,
            address.ContactId, address.DefaultSalesEmployeeId, isUsed));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int customerId, int id)
    {
        var address = await db.Addresses
            .FirstOrDefaultAsync(a => a.Id == id && a.CustomerId == customerId);

        if (address is null)
            return NotFound();

        var isUsed = await db.SalesOrders.AnyAsync(o =>
            o.BillToAddressId == id || o.PickUpAddressId == id || o.ShipToAddressId == id);

        if (isUsed)
            return Conflict(new { message = "Cannot delete address because it is referenced by one or more sales orders." });

        db.Addresses.Remove(address);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
