using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/setup")]
public class SetupController(ISetupRoutingService setupRoutingService) : ControllerBase
{
    [HttpGet("roles")]
    public async Task<ActionResult<List<AppRoleDto>>> GetRoles(CancellationToken cancellationToken)
    {
        var items = await setupRoutingService.GetRolesAsync(cancellationToken);
        return Ok(items);
    }

    [HttpGet("roles/{id:int}")]
    public async Task<ActionResult<AppRoleDto>> GetRole(int id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.GetRoleAsync(id, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("roles")]
    public async Task<ActionResult<AppRoleDto>> CreateRole(AppRoleUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var created = await setupRoutingService.CreateRoleAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetRole), new { id = created.Id }, created);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPut("roles/{id:int}")]
    public async Task<ActionResult<AppRoleDto>> UpdateRole(int id, AppRoleUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.UpdateRoleAsync(id, dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpDelete("roles/{id:int}")]
    public async Task<ActionResult> DeleteRole(int id, CancellationToken cancellationToken)
    {
        try
        {
            await setupRoutingService.DeleteRoleAsync(id, cancellationToken);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<AppUserDto>>> GetUsers(CancellationToken cancellationToken)
    {
        var items = await setupRoutingService.GetUsersAsync(cancellationToken);
        return Ok(items);
    }

    [HttpGet("users/{id:int}")]
    public async Task<ActionResult<AppUserDto>> GetUser(int id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.GetUserAsync(id, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("users")]
    public async Task<ActionResult<AppUserDto>> CreateUser(AppUserUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var created = await setupRoutingService.CreateUserAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetUser), new { id = created.Id }, created);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPut("users/{id:int}")]
    public async Task<ActionResult<AppUserDto>> UpdateUser(int id, AppUserUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.UpdateUserAsync(id, dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpDelete("users/{id:int}")]
    public async Task<ActionResult> DeleteUser(int id, CancellationToken cancellationToken)
    {
        try
        {
            await setupRoutingService.DeleteUserAsync(id, cancellationToken);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

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

    [HttpGet("valve-types")]
    public async Task<ActionResult<List<LookupOptionAdminDto>>> GetValveTypes(CancellationToken cancellationToken)
    {
        var items = await setupRoutingService.GetValveTypeLookupsAsync(cancellationToken);
        return Ok(items);
    }

    [HttpPost("valve-types")]
    public async Task<ActionResult<LookupOptionAdminDto>> CreateValveType(LookupOptionUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var created = await setupRoutingService.CreateValveTypeLookupAsync(dto, cancellationToken);
            return Ok(created);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPut("valve-types/{id:int}")]
    public async Task<ActionResult<LookupOptionAdminDto>> UpdateValveType(int id, LookupOptionUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.UpdateValveTypeLookupAsync(id, dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpDelete("valve-types/{id:int}")]
    public async Task<ActionResult> DeleteValveType(int id, CancellationToken cancellationToken)
    {
        try
        {
            await setupRoutingService.DeleteValveTypeLookupAsync(id, cancellationToken);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpGet("gauges")]
    public async Task<ActionResult<List<LookupOptionAdminDto>>> GetGauges(CancellationToken cancellationToken)
    {
        var items = await setupRoutingService.GetGaugeLookupsAsync(cancellationToken);
        return Ok(items);
    }

    [HttpPost("gauges")]
    public async Task<ActionResult<LookupOptionAdminDto>> CreateGauge(LookupOptionUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var created = await setupRoutingService.CreateGaugeLookupAsync(dto, cancellationToken);
            return Ok(created);
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPut("gauges/{id:int}")]
    public async Task<ActionResult<LookupOptionAdminDto>> UpdateGauge(int id, LookupOptionUpsertDto dto, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await setupRoutingService.UpdateGaugeLookupAsync(id, dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpDelete("gauges/{id:int}")]
    public async Task<ActionResult> DeleteGauge(int id, CancellationToken cancellationToken)
    {
        try
        {
            await setupRoutingService.DeleteGaugeLookupAsync(id, cancellationToken);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

}
