using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SitesController(LpcAppsDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<Site>>> GetAll()
    {
        return await db.Sites.OrderBy(s => s.Name).ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Site>> Get(int id)
    {
        var site = await db.Sites.FindAsync(id);
        return site is null ? NotFound() : site;
    }
}
