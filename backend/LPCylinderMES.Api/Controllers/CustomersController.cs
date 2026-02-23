using LPCylinderMES.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController(LpcAppsDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<object>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null)
    {
        var query = db.Customers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c =>
                c.Name.Contains(search) ||
                (c.CustomerCode != null && c.CustomerCode.Contains(search)));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.CustomerCode,
                c.Status,
                c.Email,
                TankColor = c.TankColor != null ? c.TankColor.Name : null,
                LidColor = c.LidColor != null ? c.LidColor.Name : null,
                AddressCount = c.Addresses.Count(),
                OrderCount = c.SalesOrders.Count(),
            })
            .ToListAsync();

        return Ok(new { items, totalCount, page, pageSize });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> Get(int id)
    {
        var customer = await db.Customers
            .Include(c => c.TankColor)
            .Include(c => c.LidColor)
            .Include(c => c.DefaultPaymentTerm)
            .Include(c => c.DefaultShipVia)
            .Include(c => c.Addresses)
            .Include(c => c.Contacts)
            .Where(c => c.Id == id)
            .FirstOrDefaultAsync();

        if (customer is null)
            return NotFound();

        return Ok(customer);
    }
}
