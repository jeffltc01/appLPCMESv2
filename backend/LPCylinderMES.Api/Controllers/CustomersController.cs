using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController(LpcAppsDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<CustomerListDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] string? status = "Active")
    {
        var query = db.Customers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
            query = query.Where(c => c.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c =>
                c.Name.Contains(search) ||
                (c.CustomerCode != null && c.CustomerCode.Contains(search)) ||
                (c.Email != null && c.Email.Contains(search)));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CustomerListDto(
                c.Id,
                c.Name,
                c.CustomerCode,
                c.Status,
                c.Email,
                c.TankColor != null ? c.TankColor.Name : null,
                c.LidColor != null ? c.LidColor.Name : null,
                c.Addresses
                    .Where(a => a.Type == "BILL_TO")
                    .OrderBy(a => a.Id)
                    .Select(a => (a.AddressName ?? a.Address1) + ", " + (a.City ?? "") + " " + (a.State ?? ""))
                    .FirstOrDefault(),
                c.Addresses
                    .Where(a => a.Type == "SHIP_TO")
                    .OrderBy(a => a.Id)
                    .Select(a => (a.AddressName ?? a.Address1) + ", " + (a.City ?? "") + " " + (a.State ?? ""))
                    .FirstOrDefault()))
            .ToListAsync();

        return Ok(new PaginatedResponse<CustomerListDto>(items, totalCount, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CustomerDetailDto>> Get(int id)
    {
        var c = await db.Customers
            .Include(x => x.TankColor)
            .Include(x => x.LidColor)
            .Include(x => x.DefaultPaymentTerm)
            .Include(x => x.DefaultShipVia)
            .Include(x => x.CustomerParent)
            .Include(x => x.Addresses)
            .Include(x => x.Contacts)
            .Where(x => x.Id == id)
            .FirstOrDefaultAsync();

        if (c is null)
            return NotFound();

        var salesPerson = c.DefaultSalesEmployeeId.HasValue
            ? await db.SalesPeoples.FindAsync(c.DefaultSalesEmployeeId.Value)
            : null;
        var defaultOrderContact = c.DefaultOrderContactId.HasValue
            ? c.Contacts.FirstOrDefault(ct => ct.Id == c.DefaultOrderContactId.Value)
            : null;

        var addressIds = c.Addresses.Select(a => a.Id).ToList();

        var billToUsed = await db.SalesOrders
            .Where(o => o.BillToAddressId != null && addressIds.Contains(o.BillToAddressId.Value))
            .Select(o => o.BillToAddressId!.Value).Distinct().ToListAsync();
        var pickUpUsed = await db.SalesOrders
            .Where(o => o.PickUpAddressId != null && addressIds.Contains(o.PickUpAddressId.Value))
            .Select(o => o.PickUpAddressId!.Value).Distinct().ToListAsync();
        var shipToUsed = await db.SalesOrders
            .Where(o => o.ShipToAddressId != null && addressIds.Contains(o.ShipToAddressId.Value))
            .Select(o => o.ShipToAddressId!.Value).Distinct().ToListAsync();

        var usedAddressIds = new HashSet<int>(billToUsed.Concat(pickUpUsed).Concat(shipToUsed));

        var addresses = c.Addresses.Select(a => new AddressDto(
            a.Id, a.Type, a.AddressName, a.Address1, a.Address2,
            a.City, a.State, a.PostalCode, a.Country,
            a.CustomerId, a.ContactId, a.DefaultSalesEmployeeId,
            usedAddressIds.Contains(a.Id)
        )).ToList();

        var contacts = c.Contacts.Select(ct => new ContactDto(
            ct.Id, ct.FirstName, ct.LastName, ct.Email,
            ct.OfficePhone, ct.MobilePhone, ct.Notes, ct.CustomerId
        )).ToList();

        return Ok(new CustomerDetailDto(
            c.Id, c.Name, c.CustomerCode, c.Status, c.Email, c.Notes,
            c.CustomerParentId, c.CustomerParent?.Name,
            c.DefaultSalesEmployeeId, salesPerson?.Name,
            c.TankColorId, c.TankColor?.Name,
            c.LidColorId, c.LidColor?.Name,
            c.DefaultPaymentTermId, c.DefaultPaymentTerm?.Name,
            c.DefaultShipViaId, c.DefaultShipVia?.Name,
            c.DefaultOrderContactId, FormatContactName(defaultOrderContact),
            c.DefaultBillToId, c.DefaultPickUpId, c.DefaultShipToId,
            c.DefaultNeedCollars, c.DefaultNeedFillers, c.DefaultNeedFootRings,
            c.DefaultReturnScrap, c.DefaultReturnBrass,
            c.DefaultValveType, c.DefaultGauges,
            addresses, contacts));
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDetailDto>> Create(CustomerCreateDto dto)
    {
        var customer = new Customer
        {
            Name = dto.Name,
            CustomerCode = dto.CustomerCode,
            Status = dto.Status ?? "Active",
            Email = dto.Email,
        };

        db.Customers.Add(customer);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = customer.Id }, await GetDetailDto(customer.Id));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CustomerDetailDto>> Update(int id, CustomerUpdateDto dto)
    {
        var customer = await db.Customers.FindAsync(id);
        if (customer is null)
            return NotFound();

        if (dto.DefaultOrderContactId.HasValue)
        {
            var contactExists = await db.Contacts.AnyAsync(c =>
                c.Id == dto.DefaultOrderContactId.Value &&
                c.CustomerId == id);
            if (!contactExists)
                return BadRequest(new { message = "Default order contact must belong to this customer." });
        }

        customer.Name = dto.Name;
        customer.CustomerCode = dto.CustomerCode;
        customer.Status = dto.Status;
        customer.Email = dto.Email;
        customer.Notes = dto.Notes;
        customer.CustomerParentId = dto.CustomerParentId;
        customer.DefaultSalesEmployeeId = dto.DefaultSalesEmployeeId;
        customer.TankColorId = dto.TankColorId;
        customer.LidColorId = dto.LidColorId;
        customer.DefaultPaymentTermId = dto.DefaultPaymentTermId;
        customer.DefaultShipViaId = dto.DefaultShipViaId;
        customer.DefaultOrderContactId = dto.DefaultOrderContactId;
        customer.DefaultBillToId = dto.DefaultBillToId;

        // Keep ship-to and pickup defaults in sync when one side is omitted.
        var resolvedShipToId = dto.DefaultShipToId ?? dto.DefaultPickUpId;
        var resolvedPickUpId = dto.DefaultPickUpId ?? dto.DefaultShipToId;
        customer.DefaultShipToId = resolvedShipToId;
        customer.DefaultPickUpId = resolvedPickUpId;

        customer.DefaultNeedCollars = dto.DefaultNeedCollars;
        customer.DefaultNeedFillers = dto.DefaultNeedFillers;
        customer.DefaultNeedFootRings = dto.DefaultNeedFootRings;
        customer.DefaultReturnScrap = dto.DefaultReturnScrap;
        customer.DefaultReturnBrass = dto.DefaultReturnBrass;
        customer.DefaultValveType = dto.DefaultValveType;
        customer.DefaultGauges = dto.DefaultGauges;

        await db.SaveChangesAsync();

        return Ok(await GetDetailDto(id));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var customer = await db.Customers.FindAsync(id);
        if (customer is null)
            return NotFound();

        customer.Status = "Inactive";
        await db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<CustomerDetailDto> GetDetailDto(int id)
    {
        var result = await Get(id);
        return ((OkObjectResult)result.Result!).Value as CustomerDetailDto
            ?? throw new InvalidOperationException("Failed to load customer detail");
    }

    private static string? FormatContactName(Contact? contact)
    {
        if (contact is null) return null;
        var fullName = $"{contact.FirstName} {contact.LastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? null : fullName;
    }
}
