using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/setup")]
public class SetupController(ISetupRoutingService setupRoutingService) : ControllerBase
{
    [HttpGet("production-lines")]
    public async Task<ActionResult<List<ProductionLineDto>>> GetProductionLines(CancellationToken cancellationToken)
    {
        var items = await setupRoutingService.GetProductionLinesAsync(cancellationToken);
        return Ok(items);
    }

    [HttpGet("production-lines/{id:int}")]
    public async Task<ActionResult<ProductionLineDto>> GetProductionLine(int id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.GetProductionLineAsync(id, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("production-lines")]
    public async Task<ActionResult<ProductionLineDto>> CreateProductionLine(ProductionLineUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var created = await setupRoutingService.CreateProductionLineAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetProductionLine), new { id = created.Id }, created);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPut("production-lines/{id:int}")]
    public async Task<ActionResult<ProductionLineDto>> UpdateProductionLine(int id, ProductionLineUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.UpdateProductionLineAsync(id, dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpDelete("production-lines/{id:int}")]
    public async Task<ActionResult> DeleteProductionLine(int id, CancellationToken cancellationToken)
    {
        try
        {
            await setupRoutingService.DeleteProductionLineAsync(id, cancellationToken);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("workcenters")]
    public async Task<ActionResult<List<WorkCenterDto>>> GetWorkCenters(CancellationToken cancellationToken)
    {
        var items = await setupRoutingService.GetWorkCentersAsync(cancellationToken);
        return Ok(items);
    }

    [HttpGet("workcenters/{id:int}")]
    public async Task<ActionResult<WorkCenterDto>> GetWorkCenter(int id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.GetWorkCenterAsync(id, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("workcenters")]
    public async Task<ActionResult<WorkCenterDto>> CreateWorkCenter(WorkCenterUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var created = await setupRoutingService.CreateWorkCenterAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetWorkCenter), new { id = created.Id }, created);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPut("workcenters/{id:int}")]
    public async Task<ActionResult<WorkCenterDto>> UpdateWorkCenter(int id, WorkCenterUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.UpdateWorkCenterAsync(id, dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpDelete("workcenters/{id:int}")]
    public async Task<ActionResult> DeleteWorkCenter(int id, CancellationToken cancellationToken)
    {
        try
        {
            await setupRoutingService.DeleteWorkCenterAsync(id, cancellationToken);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("route-templates")]
    public async Task<ActionResult<List<RouteTemplateSummaryDto>>> GetRouteTemplates(CancellationToken cancellationToken)
    {
        var items = await setupRoutingService.GetRouteTemplatesAsync(cancellationToken);
        return Ok(items);
    }

    [HttpGet("route-templates/{id:int}")]
    public async Task<ActionResult<RouteTemplateDetailDto>> GetRouteTemplate(int id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.GetRouteTemplateAsync(id, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("route-templates")]
    public async Task<ActionResult<RouteTemplateDetailDto>> CreateRouteTemplate(RouteTemplateUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var created = await setupRoutingService.CreateRouteTemplateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetRouteTemplate), new { id = created.Id }, created);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPut("route-templates/{id:int}")]
    public async Task<ActionResult<RouteTemplateDetailDto>> UpdateRouteTemplate(int id, RouteTemplateUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.UpdateRouteTemplateAsync(id, dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpDelete("route-templates/{id:int}")]
    public async Task<ActionResult> DeleteRouteTemplate(int id, CancellationToken cancellationToken)
    {
        try
        {
            await setupRoutingService.DeleteRouteTemplateAsync(id, cancellationToken);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("assignments")]
    public async Task<ActionResult<List<RouteTemplateAssignmentDto>>> GetAssignments(CancellationToken cancellationToken)
    {
        var items = await setupRoutingService.GetAssignmentsAsync(cancellationToken);
        return Ok(items);
    }

    [HttpGet("assignments/{id:int}")]
    public async Task<ActionResult<RouteTemplateAssignmentDto>> GetAssignment(int id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.GetAssignmentAsync(id, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("assignments")]
    public async Task<ActionResult<RouteTemplateAssignmentDto>> CreateAssignment(RouteTemplateAssignmentUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var created = await setupRoutingService.CreateAssignmentAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetAssignment), new { id = created.Id }, created);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPut("assignments/{id:int}")]
    public async Task<ActionResult<RouteTemplateAssignmentDto>> UpdateAssignment(int id, RouteTemplateAssignmentUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.UpdateAssignmentAsync(id, dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpDelete("assignments/{id:int}")]
    public async Task<ActionResult> DeleteAssignment(int id, CancellationToken cancellationToken)
    {
        try
        {
            await setupRoutingService.DeleteAssignmentAsync(id, cancellationToken);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("rules/simulate")]
    public async Task<ActionResult<RouteRuleSimulationResponseDto>> Simulate(RouteRuleSimulationRequestDto dto, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.SimulateRouteAsync(dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }
}
