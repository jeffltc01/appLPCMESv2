using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LPCylinderMES.Api.Controllers;

[ApiController]
[Route("api/setup")]
public class ScheduleSettingsController(IScheduleSettingsService scheduleSettingsService) : ControllerBase
{
    [HttpGet("schedule-settings")]
    public async Task<ActionResult<ScheduleSettingsDto>> GetScheduleSettings(CancellationToken cancellationToken)
    {
        var result = await scheduleSettingsService.GetAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPut("schedule-settings")]
    public async Task<ActionResult<ScheduleSettingsDto>> UpdateScheduleSettings(
        ScheduleSettingsUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var result = await scheduleSettingsService.UpdateAsync(dto, "EMP001", cancellationToken);
        return Ok(result);
    }
}
