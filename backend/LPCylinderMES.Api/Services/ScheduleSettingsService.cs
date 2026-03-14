using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public interface IScheduleSettingsService
{
    Task<ScheduleSettingsDto> GetAsync(CancellationToken cancellationToken = default);

    Task<ScheduleSettingsDto> UpdateAsync(ScheduleSettingsUpsertDto dto, string? updatedByEmpNo = null, CancellationToken cancellationToken = default);
}

public sealed class ScheduleSettingsService(LpcAppsDbContext db) : IScheduleSettingsService
{
    private const int MinLookbackDays = 7;
    private const int MaxLookbackDays = 365;

    public async Task<ScheduleSettingsDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var row = await db.ScheduleSettings.FirstOrDefaultAsync(cancellationToken);
        if (row is null)
        {
            return new ScheduleSettingsDto(90);
        }
        return new ScheduleSettingsDto(row.ThroughputLookbackDays);
    }

    public async Task<ScheduleSettingsDto> UpdateAsync(ScheduleSettingsUpsertDto dto, string? updatedByEmpNo = null, CancellationToken cancellationToken = default)
    {
        var days = Math.Clamp(dto.ThroughputLookbackDays, MinLookbackDays, MaxLookbackDays);

        var row = await db.ScheduleSettings.FirstOrDefaultAsync(cancellationToken);
        if (row is null)
        {
            row = new ScheduleSettings
            {
                ThroughputLookbackDays = days,
                UpdatedUtc = DateTime.UtcNow,
                UpdatedByEmpNo = updatedByEmpNo?.Trim(),
            };
            db.ScheduleSettings.Add(row);
        }
        else
        {
            row.ThroughputLookbackDays = days;
            row.UpdatedUtc = DateTime.UtcNow;
            row.UpdatedByEmpNo = updatedByEmpNo?.Trim();
        }

        await db.SaveChangesAsync(cancellationToken);
        return new ScheduleSettingsDto(row.ThroughputLookbackDays);
    }
}
