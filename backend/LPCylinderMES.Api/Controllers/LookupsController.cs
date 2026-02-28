using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LookupsController(LpcAppsDbContext db) : ControllerBase
{
    [HttpGet("colors")]
    public async Task<ActionResult<List<LookupDto>>> GetColors()
    {
        var items = await db.Colors
            .OrderBy(c => c.Name)
            .Select(c => new LookupDto(c.Id, c.Name))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("scrap-reasons")]
    public async Task<ActionResult<List<LookupDto>>> GetScrapReasons()
    {
        var items = await db.ScrapReasons
            .OrderBy(sr => sr.Name)
            .Select(sr => new LookupDto(sr.Id, sr.Name))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("payment-terms")]
    public async Task<ActionResult<List<LookupDto>>> GetPaymentTerms()
    {
        var items = await db.PaymentTerms
            .OrderBy(pt => pt.Name)
            .Select(pt => new LookupDto(pt.Id, pt.Name))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("ship-vias")]
    public async Task<ActionResult<List<LookupDto>>> GetShipVias()
    {
        var items = await db.ShipVias
            .OrderBy(sv => sv.Name)
            .Select(sv => new LookupDto(sv.Id, sv.Name))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("sales-people")]
    public async Task<ActionResult<List<SalesPersonLookupDto>>> GetSalesPeople()
    {
        var items = await db.SalesPeoples
            .OrderBy(sp => sp.Name)
            .Select(sp => new SalesPersonLookupDto(sp.Id, sp.Name, sp.EmployeeNumber))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("sites")]
    public async Task<ActionResult<List<LookupDto>>> GetSites()
    {
        var items = await db.Sites
            .OrderBy(s => s.Name)
            .Select(s => new LookupDto(s.Id, s.Name))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("item-sizes")]
    public async Task<ActionResult<List<ItemSizeLookupDto>>> GetItemSizes()
    {
        var items = await db.ItemSizes
            .OrderBy(s => s.Size)
            .Select(s => new ItemSizeLookupDto(s.Id, s.Name, s.Size))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("item-types")]
    public async Task<ActionResult<List<string>>> GetItemTypes()
    {
        var types = await db.Items
            .Select(i => i.ItemType)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();
        return Ok(types);
    }

    [HttpGet("product-lines")]
    public async Task<ActionResult<List<string>>> GetProductLines()
    {
        var lines = await db.Items
            .Where(i => i.ProductLine != null && i.ProductLine != "")
            .Select(i => i.ProductLine!)
            .Distinct()
            .OrderBy(l => l)
            .ToListAsync();
        return Ok(lines);
    }

    [HttpGet("customers-active")]
    public async Task<ActionResult<List<LookupDto>>> GetActiveCustomers()
    {
        var customers = await db.Customers
            .Where(c => c.Status == "Active")
            .OrderBy(c => c.Name)
            .Select(c => new LookupDto(c.Id, c.Name))
            .ToListAsync();
        return Ok(customers);
    }

    [HttpGet("customers/{customerId:int}/addresses")]
    public async Task<ActionResult<List<AddressLookupDto>>> GetCustomerAddresses(
        int customerId,
        [FromQuery] string? type = null)
    {
        var exists = await db.Customers.AnyAsync(c => c.Id == customerId);
        if (!exists)
            return NotFound();

        var query = db.Addresses.Where(a => a.CustomerId == customerId);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(a => a.Type == type);

        var rows = await query
            .OrderBy(a => a.Type)
            .ThenBy(a => a.Id)
            .Select(a => new
            {
                a.Id,
                a.Type,
                a.AddressName,
                a.Address1,
                a.City,
                a.State,
                a.PostalCode
            })
            .ToListAsync();

        var addresses = rows
            .Select(a => new AddressLookupDto(
                a.Id,
                a.Type,
                FormatAddressLabel(a.AddressName, a.Address1, a.City, a.State, a.PostalCode)))
            .ToList();

        return Ok(addresses);
    }

    [HttpGet("order-items")]
    public async Task<ActionResult<List<OrderItemLookupDto>>> GetOrderItems()
    {
        var items = await db.Items
            .OrderBy(i => i.ItemNo)
            .Select(i => new OrderItemLookupDto(
                i.Id,
                i.ItemNo,
                i.ItemDescription,
                i.ProductLine))
            .ToListAsync();
        return Ok(items);
    }

    private static string FormatAddressLabel(
        string? addressName,
        string? address1,
        string? city,
        string? state,
        string? postalCode)
    {
        var line1 = string.IsNullOrWhiteSpace(addressName) ? address1 : addressName;
        line1 = string.IsNullOrWhiteSpace(line1) ? "(no address)" : line1.Trim();

        var cityStateZip = string.Join(" ",
            new[] { city, state, postalCode }
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x!.Trim()));

        return string.IsNullOrWhiteSpace(cityStateZip)
            ? line1
            : $"{line1}, {cityStateZip}";
    }
}
