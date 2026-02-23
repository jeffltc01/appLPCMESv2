using LPCylinderMES.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController(LpcAppsDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<object>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? status = null,
        [FromQuery] int? siteId = null,
        [FromQuery] string? search = null)
    {
        var query = db.SalesOrders.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(o => o.OrderStatus == status);

        if (siteId.HasValue)
            query = query.Where(o => o.SiteId == siteId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(o =>
                o.SalesOrderNo.Contains(search) ||
                o.Customer.Name.Contains(search) ||
                (o.CustomerPoNo != null && o.CustomerPoNo.Contains(search)));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(o => o.OrderDate)
            .ThenByDescending(o => o.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new
            {
                o.Id,
                o.SalesOrderNo,
                o.OrderDate,
                o.OrderStatus,
                o.Priority,
                CustomerName = o.Customer.Name,
                SiteName = o.Site.Name,
                o.SiteId,
                o.CustomerId,
                DetailCount = o.SalesOrderDetails.Count(),
            })
            .ToListAsync();

        return Ok(new { items, totalCount, page, pageSize });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> Get(int id)
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

        return Ok(order);
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
}
