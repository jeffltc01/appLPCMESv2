using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface IOrderKpiService
{
    Task<OrderKpiSummaryDto> GetSummaryAsync(
        DateTime? fromUtc = null,
        DateTime? toUtc = null,
        int? siteId = null,
        CancellationToken cancellationToken = default);

    Task<OrderKpiDiagnosticsDto> GetDiagnosticsAsync(
        DateTime? fromUtc = null,
        DateTime? toUtc = null,
        int? siteId = null,
        string? issueType = null,
        CancellationToken cancellationToken = default);

    Task<WorkCenterKpiSummaryDto> GetWorkCenterSummaryAsync(
        DateTime? fromUtc = null,
        DateTime? toUtc = null,
        int? siteId = null,
        CancellationToken cancellationToken = default);
}
