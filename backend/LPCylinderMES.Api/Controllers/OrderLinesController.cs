using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/orders/{orderId:int}/lines")]
public class OrderLinesController(IOrderLineService orderLineService) : ControllerBase
{
    [HttpGet("default-price")]
    public async Task<ActionResult<decimal?>> GetDefaultPrice(
        int orderId,
        [FromQuery] int itemId)
    {
        try
        {
            var unitPrice = await orderLineService.GetDefaultPriceAsync(orderId, itemId);
            return Ok(unitPrice);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost]
    public async Task<ActionResult<OrderLineDto>> Create(int orderId, OrderLineCreateDto dto)
    {
        try
        {
            var created = await orderLineService.CreateAsync(orderId, dto);
            return Ok(created);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPut("{lineId:int}")]
    public async Task<ActionResult<OrderLineDto>> Update(int orderId, int lineId, OrderLineUpdateDto dto)
    {
        try
        {
            var updated = await orderLineService.UpdateAsync(orderId, lineId, dto);
            return Ok(updated);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpDelete("{lineId:int}")]
    public async Task<ActionResult> Delete(int orderId, int lineId)
    {
        try
        {
            await orderLineService.DeleteAsync(orderId, lineId);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }
}
