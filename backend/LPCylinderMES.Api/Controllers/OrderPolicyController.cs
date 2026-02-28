using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/order-policy")]
public class OrderPolicyController(IOrderPolicyService orderPolicyService) : ControllerBase
{
    [HttpGet("decisions")]
    public async Task<ActionResult<List<DecisionPolicyEntryDto>>> GetPolicies([FromQuery] int? policyVersion, CancellationToken cancellationToken)
    {
        return Ok(await orderPolicyService.GetPoliciesAsync(policyVersion, cancellationToken));
    }

    [HttpPut("decisions/{decisionKey}")]
    public async Task<ActionResult<DecisionPolicyEntryDto>> UpsertPolicy(
        string decisionKey,
        [FromBody] UpsertDecisionPolicyDto dto,
        CancellationToken cancellationToken)
    {
        return Ok(await orderPolicyService.UpsertPolicyAsync(decisionKey, dto, cancellationToken));
    }

    [HttpGet("signoffs/{policyVersion:int}")]
    public async Task<ActionResult<List<DecisionSignoffDto>>> GetSignoffs(int policyVersion, CancellationToken cancellationToken)
    {
        return Ok(await orderPolicyService.GetSignoffsAsync(policyVersion, cancellationToken));
    }

    [HttpPost("signoffs")]
    public async Task<ActionResult<DecisionSignoffDto>> AddSignoff(
        [FromBody] CreateDecisionSignoffDto dto,
        CancellationToken cancellationToken)
    {
        return Ok(await orderPolicyService.AddSignoffAsync(dto, cancellationToken));
    }

    [HttpPost("activate/{policyVersion:int}")]
    public async Task<ActionResult<PolicyActivationResultDto>> ActivateVersion(int policyVersion, CancellationToken cancellationToken)
    {
        var result = await orderPolicyService.ActivatePolicyVersionAsync(policyVersion, cancellationToken);
        if (!result.Activated)
        {
            return Conflict(result);
        }

        return Ok(result);
    }

    [HttpGet("promise-reasons")]
    public async Task<ActionResult<List<PromiseReasonPolicyDto>>> GetPromiseReasons(CancellationToken cancellationToken)
    {
        return Ok(await orderPolicyService.GetPromiseReasonPoliciesAsync(cancellationToken));
    }

    [HttpPut("promise-reasons")]
    public async Task<ActionResult<PromiseReasonPolicyDto>> UpsertPromiseReason(
        [FromBody] UpsertPromiseReasonPolicyDto dto,
        CancellationToken cancellationToken)
    {
        return Ok(await orderPolicyService.UpsertPromiseReasonPolicyAsync(dto, cancellationToken));
    }

    [HttpGet("status-reasons")]
    public async Task<ActionResult<List<StatusReasonCodeDto>>> GetStatusReasons(
        [FromQuery] string? overlayType,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await orderPolicyService.GetStatusReasonCodesAsync(overlayType, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPost("status-reasons")]
    public async Task<ActionResult<StatusReasonCodeDto>> CreateStatusReason(
        [FromBody] UpsertStatusReasonCodeDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await orderPolicyService.UpsertStatusReasonCodeAsync(null, dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpPut("status-reasons/{id:int}")]
    public async Task<ActionResult<StatusReasonCodeDto>> UpdateStatusReason(
        int id,
        [FromBody] UpsertStatusReasonCodeDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await orderPolicyService.UpsertStatusReasonCodeAsync(id, dto, cancellationToken));
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }

    [HttpDelete("status-reasons/{id:int}")]
    public async Task<IActionResult> DeleteStatusReason(int id, CancellationToken cancellationToken)
    {
        try
        {
            await orderPolicyService.DeleteStatusReasonCodeAsync(id, cancellationToken);
            return NoContent();
        }
        catch (ServiceException ex)
        {
            return this.ToActionResult(ex);
        }
    }
}
