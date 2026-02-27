using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.DTOs;
using LPCylinderMES.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public sealed class SetupRoutingService(LpcAppsDbContext db) : ISetupRoutingService
{
    private static readonly string[] SupportedTimeCaptureModes = ["Automated", "Manual", "Hybrid"];
    private static readonly string[] SupportedDataCaptureModes = ["ElectronicRequired", "ElectronicOptional", "PaperOnly"];
    private static readonly string[] SupportedChecklistFailurePolicies = ["BlockCompletion", "AllowWithSupervisorOverride"];

    public async Task<List<WorkCenterDto>> GetWorkCentersAsync(CancellationToken cancellationToken = default) =>
        await db.WorkCenters
            .AsNoTracking()
            .OrderBy(w => w.WorkCenterCode)
            .Select(w => ToWorkCenterDto(w))
            .ToListAsync(cancellationToken);

    public async Task<WorkCenterDto> GetWorkCenterAsync(int id, CancellationToken cancellationToken = default)
    {
        var workCenter = await db.WorkCenters
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);

        if (workCenter is null)
            throw new ServiceException(StatusCodes.Status404NotFound, $"Work center '{id}' was not found.");

        return ToWorkCenterDto(workCenter);
    }

    public async Task<WorkCenterDto> CreateWorkCenterAsync(WorkCenterUpsertDto dto, CancellationToken cancellationToken = default)
    {
        await ValidateWorkCenterAsync(dto, null, cancellationToken);

        var now = DateTime.UtcNow;
        var workCenter = new WorkCenter
        {
            WorkCenterCode = dto.WorkCenterCode.Trim(),
            WorkCenterName = dto.WorkCenterName.Trim(),
            SiteId = dto.SiteId,
            Description = NormalizeNullable(dto.Description),
            IsActive = dto.IsActive,
            DefaultTimeCaptureMode = dto.DefaultTimeCaptureMode.Trim(),
            RequiresScanByDefault = dto.RequiresScanByDefault,
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        db.WorkCenters.Add(workCenter);
        await db.SaveChangesAsync(cancellationToken);
        return ToWorkCenterDto(workCenter);
    }

    public async Task<WorkCenterDto> UpdateWorkCenterAsync(int id, WorkCenterUpsertDto dto, CancellationToken cancellationToken = default)
    {
        var workCenter = await db.WorkCenters.FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
        if (workCenter is null)
            throw new ServiceException(StatusCodes.Status404NotFound, $"Work center '{id}' was not found.");

        await ValidateWorkCenterAsync(dto, id, cancellationToken);

        workCenter.WorkCenterCode = dto.WorkCenterCode.Trim();
        workCenter.WorkCenterName = dto.WorkCenterName.Trim();
        workCenter.SiteId = dto.SiteId;
        workCenter.Description = NormalizeNullable(dto.Description);
        workCenter.IsActive = dto.IsActive;
        workCenter.DefaultTimeCaptureMode = dto.DefaultTimeCaptureMode.Trim();
        workCenter.RequiresScanByDefault = dto.RequiresScanByDefault;
        workCenter.UpdatedUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return ToWorkCenterDto(workCenter);
    }

    public async Task DeleteWorkCenterAsync(int id, CancellationToken cancellationToken = default)
    {
        var workCenter = await db.WorkCenters.FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
        if (workCenter is null)
            throw new ServiceException(StatusCodes.Status404NotFound, $"Work center '{id}' was not found.");

        var isReferenced = await db.RouteTemplateSteps.AnyAsync(s => s.WorkCenterId == id, cancellationToken)
            || await db.OrderLineRouteStepInstances.AnyAsync(s => s.WorkCenterId == id, cancellationToken)
            || await db.OperatorActivityLogs.AnyAsync(l => l.WorkCenterId == id, cancellationToken);

        if (isReferenced)
            throw new ServiceException(StatusCodes.Status409Conflict, "Cannot delete work center because it is referenced by routing or execution data.");

        db.WorkCenters.Remove(workCenter);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<RouteTemplateSummaryDto>> GetRouteTemplatesAsync(CancellationToken cancellationToken = default) =>
        await db.RouteTemplates
            .AsNoTracking()
            .OrderBy(t => t.RouteTemplateCode)
            .Select(t => new RouteTemplateSummaryDto(
                t.Id,
                t.RouteTemplateCode,
                t.RouteTemplateName,
                t.Description,
                t.IsActive,
                t.VersionNo,
                t.CreatedUtc,
                t.UpdatedUtc,
                t.Steps.Count))
            .ToListAsync(cancellationToken);

    public async Task<RouteTemplateDetailDto> GetRouteTemplateAsync(int id, CancellationToken cancellationToken = default)
    {
        var template = await LoadRouteTemplateAsync(id, cancellationToken);
        return ToRouteTemplateDetailDto(template);
    }

    public async Task<RouteTemplateDetailDto> CreateRouteTemplateAsync(RouteTemplateUpsertDto dto, CancellationToken cancellationToken = default)
    {
        await ValidateRouteTemplateAsync(dto, null, cancellationToken);

        var now = DateTime.UtcNow;
        var template = new RouteTemplate
        {
            RouteTemplateCode = dto.RouteTemplateCode.Trim(),
            RouteTemplateName = dto.RouteTemplateName.Trim(),
            Description = NormalizeNullable(dto.Description),
            IsActive = dto.IsActive,
            VersionNo = dto.VersionNo,
            CreatedUtc = now,
            UpdatedUtc = now,
            Steps = dto.Steps
                .OrderBy(s => s.StepSequence)
                .Select(ToRouteTemplateStepEntity)
                .ToList(),
        };

        db.RouteTemplates.Add(template);
        await db.SaveChangesAsync(cancellationToken);
        return ToRouteTemplateDetailDto(template);
    }

    public async Task<RouteTemplateDetailDto> UpdateRouteTemplateAsync(int id, RouteTemplateUpsertDto dto, CancellationToken cancellationToken = default)
    {
        var template = await db.RouteTemplates
            .Include(t => t.Steps)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (template is null)
            throw new ServiceException(StatusCodes.Status404NotFound, $"Route template '{id}' was not found.");

        await ValidateRouteTemplateAsync(dto, id, cancellationToken);

        template.RouteTemplateCode = dto.RouteTemplateCode.Trim();
        template.RouteTemplateName = dto.RouteTemplateName.Trim();
        template.Description = NormalizeNullable(dto.Description);
        template.IsActive = dto.IsActive;
        template.VersionNo = dto.VersionNo;
        template.UpdatedUtc = DateTime.UtcNow;

        db.RouteTemplateSteps.RemoveRange(template.Steps);
        template.Steps = dto.Steps
            .OrderBy(s => s.StepSequence)
            .Select(ToRouteTemplateStepEntity)
            .ToList();

        await db.SaveChangesAsync(cancellationToken);
        return ToRouteTemplateDetailDto(template);
    }

    public async Task DeleteRouteTemplateAsync(int id, CancellationToken cancellationToken = default)
    {
        var template = await db.RouteTemplates.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (template is null)
            throw new ServiceException(StatusCodes.Status404NotFound, $"Route template '{id}' was not found.");

        var hasAssignments = await db.RouteTemplateAssignments.AnyAsync(a => a.RouteTemplateId == id, cancellationToken);
        var hasRouteInstances = await db.OrderLineRouteInstances.AnyAsync(r => r.RouteTemplateId == id, cancellationToken);
        if (hasAssignments || hasRouteInstances)
            throw new ServiceException(StatusCodes.Status409Conflict, "Cannot delete route template because it is referenced by assignments or route instances.");

        var steps = await db.RouteTemplateSteps.Where(s => s.RouteTemplateId == id).ToListAsync(cancellationToken);
        db.RouteTemplateSteps.RemoveRange(steps);
        db.RouteTemplates.Remove(template);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<RouteTemplateAssignmentDto>> GetAssignmentsAsync(CancellationToken cancellationToken = default) =>
        await db.RouteTemplateAssignments
            .AsNoTracking()
            .OrderBy(a => a.Priority)
            .ThenByDescending(a => a.RevisionNo)
            .ThenBy(a => a.Id)
            .Select(a => new RouteTemplateAssignmentDto(
                a.Id,
                a.AssignmentName,
                a.Priority,
                a.RevisionNo,
                a.IsActive,
                a.CustomerId,
                a.SiteId,
                a.ItemId,
                a.ItemType,
                a.RouteTemplateId,
                a.EffectiveFromUtc,
                a.EffectiveToUtc,
                a.CreatedUtc,
                a.UpdatedUtc))
            .ToListAsync(cancellationToken);

    public async Task<RouteTemplateAssignmentDto> GetAssignmentAsync(int id, CancellationToken cancellationToken = default)
    {
        var assignment = await db.RouteTemplateAssignments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (assignment is null)
            throw new ServiceException(StatusCodes.Status404NotFound, $"Assignment '{id}' was not found.");

        return ToAssignmentDto(assignment);
    }

    public async Task<RouteTemplateAssignmentDto> CreateAssignmentAsync(RouteTemplateAssignmentUpsertDto dto, CancellationToken cancellationToken = default)
    {
        await ValidateAssignmentAsync(dto, null, cancellationToken);
        await EnsureNoAssignmentOverlapAsync(dto, null, cancellationToken);

        var now = DateTime.UtcNow;
        var assignment = new RouteTemplateAssignment
        {
            AssignmentName = dto.AssignmentName.Trim(),
            Priority = dto.Priority,
            RevisionNo = dto.RevisionNo,
            IsActive = dto.IsActive,
            CustomerId = dto.CustomerId,
            SiteId = dto.SiteId,
            ItemId = dto.ItemId,
            ItemType = NormalizeNullable(dto.ItemType),
            RouteTemplateId = dto.RouteTemplateId,
            EffectiveFromUtc = dto.EffectiveFromUtc,
            EffectiveToUtc = dto.EffectiveToUtc,
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        db.RouteTemplateAssignments.Add(assignment);
        await db.SaveChangesAsync(cancellationToken);
        return ToAssignmentDto(assignment);
    }

    public async Task<RouteTemplateAssignmentDto> UpdateAssignmentAsync(int id, RouteTemplateAssignmentUpsertDto dto, CancellationToken cancellationToken = default)
    {
        var assignment = await db.RouteTemplateAssignments.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (assignment is null)
            throw new ServiceException(StatusCodes.Status404NotFound, $"Assignment '{id}' was not found.");

        await ValidateAssignmentAsync(dto, id, cancellationToken);
        await EnsureNoAssignmentOverlapAsync(dto, id, cancellationToken);

        assignment.AssignmentName = dto.AssignmentName.Trim();
        assignment.Priority = dto.Priority;
        assignment.RevisionNo = dto.RevisionNo;
        assignment.IsActive = dto.IsActive;
        assignment.CustomerId = dto.CustomerId;
        assignment.SiteId = dto.SiteId;
        assignment.ItemId = dto.ItemId;
        assignment.ItemType = NormalizeNullable(dto.ItemType);
        assignment.RouteTemplateId = dto.RouteTemplateId;
        assignment.EffectiveFromUtc = dto.EffectiveFromUtc;
        assignment.EffectiveToUtc = dto.EffectiveToUtc;
        assignment.UpdatedUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return ToAssignmentDto(assignment);
    }

    public async Task DeleteAssignmentAsync(int id, CancellationToken cancellationToken = default)
    {
        var assignment = await db.RouteTemplateAssignments.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (assignment is null)
            throw new ServiceException(StatusCodes.Status404NotFound, $"Assignment '{id}' was not found.");

        var hasRouteInstances = await db.OrderLineRouteInstances.AnyAsync(r => r.RouteTemplateAssignmentId == id, cancellationToken);
        if (hasRouteInstances)
            throw new ServiceException(StatusCodes.Status409Conflict, "Cannot delete assignment because it is referenced by route instances.");

        db.RouteTemplateAssignments.Remove(assignment);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<RouteRuleSimulationResponseDto> SimulateRouteAsync(RouteRuleSimulationRequestDto dto, CancellationToken cancellationToken = default)
    {
        var item = await db.Items
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == dto.ItemId, cancellationToken);
        if (item is null)
            throw new ServiceException(StatusCodes.Status400BadRequest, $"Invalid itemId '{dto.ItemId}'.");

        var itemType = !string.IsNullOrWhiteSpace(dto.ItemType) ? dto.ItemType.Trim() : item.ItemType;
        var now = DateTime.UtcNow;
        var candidates = await db.RouteTemplateAssignments
            .AsNoTracking()
            .Include(a => a.RouteTemplate)
                .ThenInclude(t => t.Steps)
            .Where(a =>
                a.IsActive &&
                a.RouteTemplate.IsActive &&
                (!a.EffectiveFromUtc.HasValue || a.EffectiveFromUtc <= now) &&
                (!a.EffectiveToUtc.HasValue || a.EffectiveToUtc >= now))
            .ToListAsync(cancellationToken);

        var match = RouteInstantiationService.ResolveAssignmentWithTier(
            candidates,
            dto.CustomerId,
            dto.SiteId,
            dto.ItemId,
            itemType);

        if (match.Assignment is null)
        {
            return new RouteRuleSimulationResponseDto(false, null, null, null, null);
        }

        var selectedTemplate = match.Assignment.RouteTemplate;
        selectedTemplate.Steps = selectedTemplate.Steps.OrderBy(s => s.StepSequence).ToList();

        return new RouteRuleSimulationResponseDto(
            true,
            match.Tier,
            MatchTierLabel(match.Tier),
            ToAssignmentDto(match.Assignment),
            ToRouteTemplateDetailDto(selectedTemplate));
    }

    private async Task ValidateWorkCenterAsync(WorkCenterUpsertDto dto, int? existingId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.WorkCenterCode))
            throw new ServiceException(StatusCodes.Status400BadRequest, "WorkCenterCode is required.");
        if (string.IsNullOrWhiteSpace(dto.WorkCenterName))
            throw new ServiceException(StatusCodes.Status400BadRequest, "WorkCenterName is required.");
        if (!SupportedTimeCaptureModes.Contains(dto.DefaultTimeCaptureMode))
            throw new ServiceException(StatusCodes.Status400BadRequest, $"DefaultTimeCaptureMode must be one of: {string.Join(", ", SupportedTimeCaptureModes)}.");

        var siteExists = await db.Sites.AnyAsync(s => s.Id == dto.SiteId, cancellationToken);
        if (!siteExists)
            throw new ServiceException(StatusCodes.Status400BadRequest, $"Invalid SiteId '{dto.SiteId}'.");

        var duplicateCode = await db.WorkCenters.AnyAsync(
            w => w.WorkCenterCode == dto.WorkCenterCode && (!existingId.HasValue || w.Id != existingId.Value),
            cancellationToken);
        if (duplicateCode)
            throw new ServiceException(StatusCodes.Status409Conflict, $"Work center code '{dto.WorkCenterCode}' already exists.");
    }

    private async Task ValidateRouteTemplateAsync(RouteTemplateUpsertDto dto, int? existingId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.RouteTemplateCode))
            throw new ServiceException(StatusCodes.Status400BadRequest, "RouteTemplateCode is required.");
        if (string.IsNullOrWhiteSpace(dto.RouteTemplateName))
            throw new ServiceException(StatusCodes.Status400BadRequest, "RouteTemplateName is required.");
        if (dto.VersionNo <= 0)
            throw new ServiceException(StatusCodes.Status400BadRequest, "VersionNo must be greater than zero.");
        if (dto.Steps is null || dto.Steps.Count == 0)
            throw new ServiceException(StatusCodes.Status400BadRequest, "At least one route template step is required.");

        var duplicateCode = await db.RouteTemplates.AnyAsync(
            t => t.RouteTemplateCode == dto.RouteTemplateCode && (!existingId.HasValue || t.Id != existingId.Value),
            cancellationToken);
        if (duplicateCode)
            throw new ServiceException(StatusCodes.Status409Conflict, $"Route template code '{dto.RouteTemplateCode}' already exists.");

        var duplicateStepSequence = dto.Steps
            .GroupBy(s => s.StepSequence)
            .Any(g => g.Count() > 1);
        if (duplicateStepSequence)
            throw new ServiceException(StatusCodes.Status400BadRequest, "StepSequence must be unique within a route template.");

        var workCenterIds = dto.Steps.Select(s => s.WorkCenterId).Distinct().ToList();
        var knownWorkCenterIds = await db.WorkCenters
            .Where(w => workCenterIds.Contains(w.Id))
            .Select(w => w.Id)
            .ToListAsync(cancellationToken);
        var unknownWorkCenterIds = workCenterIds.Except(knownWorkCenterIds).ToList();
        if (unknownWorkCenterIds.Count > 0)
            throw new ServiceException(StatusCodes.Status400BadRequest, $"Unknown WorkCenterId values: {string.Join(", ", unknownWorkCenterIds)}.");

        foreach (var step in dto.Steps)
        {
            if (step.StepSequence <= 0)
                throw new ServiceException(StatusCodes.Status400BadRequest, "StepSequence must be greater than zero.");
            if (string.IsNullOrWhiteSpace(step.StepCode))
                throw new ServiceException(StatusCodes.Status400BadRequest, "StepCode is required for each step.");
            if (string.IsNullOrWhiteSpace(step.StepName))
                throw new ServiceException(StatusCodes.Status400BadRequest, "StepName is required for each step.");
            if (!SupportedDataCaptureModes.Contains(step.DataCaptureMode))
                throw new ServiceException(StatusCodes.Status400BadRequest, $"DataCaptureMode must be one of: {string.Join(", ", SupportedDataCaptureModes)}.");
            if (!SupportedTimeCaptureModes.Contains(step.TimeCaptureMode))
                throw new ServiceException(StatusCodes.Status400BadRequest, $"TimeCaptureMode must be one of: {string.Join(", ", SupportedTimeCaptureModes)}.");
            if (!SupportedChecklistFailurePolicies.Contains(step.ChecklistFailurePolicy))
                throw new ServiceException(StatusCodes.Status400BadRequest, $"ChecklistFailurePolicy must be one of: {string.Join(", ", SupportedChecklistFailurePolicies)}.");
        }
    }

    private async Task ValidateAssignmentAsync(RouteTemplateAssignmentUpsertDto dto, int? existingId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.AssignmentName))
            throw new ServiceException(StatusCodes.Status400BadRequest, "AssignmentName is required.");
        if (dto.Priority <= 0)
            throw new ServiceException(StatusCodes.Status400BadRequest, "Priority must be greater than zero.");
        if (dto.RevisionNo <= 0)
            throw new ServiceException(StatusCodes.Status400BadRequest, "RevisionNo must be greater than zero.");
        if (dto.EffectiveFromUtc.HasValue && dto.EffectiveToUtc.HasValue && dto.EffectiveFromUtc > dto.EffectiveToUtc)
            throw new ServiceException(StatusCodes.Status400BadRequest, "EffectiveFromUtc cannot be later than EffectiveToUtc.");

        var templateExists = await db.RouteTemplates.AnyAsync(t => t.Id == dto.RouteTemplateId, cancellationToken);
        if (!templateExists)
            throw new ServiceException(StatusCodes.Status400BadRequest, $"Invalid RouteTemplateId '{dto.RouteTemplateId}'.");

        if (dto.CustomerId.HasValue && !await db.Customers.AnyAsync(c => c.Id == dto.CustomerId.Value, cancellationToken))
            throw new ServiceException(StatusCodes.Status400BadRequest, $"Invalid CustomerId '{dto.CustomerId.Value}'.");
        if (dto.SiteId.HasValue && !await db.Sites.AnyAsync(s => s.Id == dto.SiteId.Value, cancellationToken))
            throw new ServiceException(StatusCodes.Status400BadRequest, $"Invalid SiteId '{dto.SiteId.Value}'.");
        if (dto.ItemId.HasValue && !await db.Items.AnyAsync(i => i.Id == dto.ItemId.Value, cancellationToken))
            throw new ServiceException(StatusCodes.Status400BadRequest, $"Invalid ItemId '{dto.ItemId.Value}'.");

        var normalizedItemType = NormalizeNullable(dto.ItemType);
        if (!string.IsNullOrWhiteSpace(normalizedItemType))
        {
            var knownItemType = await db.Items
                .AsNoTracking()
                .AnyAsync(i => i.ItemType == normalizedItemType, cancellationToken);
            if (!knownItemType)
                throw new ServiceException(StatusCodes.Status400BadRequest, $"Unknown ItemType '{normalizedItemType}'.");
        }
    }

    private async Task EnsureNoAssignmentOverlapAsync(RouteTemplateAssignmentUpsertDto dto, int? existingId, CancellationToken cancellationToken)
    {
        if (!dto.IsActive)
            return;

        var normalizedItemType = NormalizeNullable(dto.ItemType);
        var candidates = await db.RouteTemplateAssignments
            .AsNoTracking()
            .Where(a =>
                a.IsActive &&
                a.Priority == dto.Priority &&
                a.CustomerId == dto.CustomerId &&
                a.SiteId == dto.SiteId &&
                a.ItemId == dto.ItemId &&
                a.ItemType == normalizedItemType &&
                (!existingId.HasValue || a.Id != existingId.Value))
            .ToListAsync(cancellationToken);

        var hasOverlap = candidates.Any(a => RangesOverlap(dto.EffectiveFromUtc, dto.EffectiveToUtc, a.EffectiveFromUtc, a.EffectiveToUtc));
        if (hasOverlap)
            throw new ServiceException(StatusCodes.Status409Conflict, "Assignment effective window overlaps an existing active assignment for the same match signature and priority.");
    }

    private static bool RangesOverlap(DateTime? startA, DateTime? endA, DateTime? startB, DateTime? endB)
    {
        var normalizedStartA = startA ?? DateTime.MinValue;
        var normalizedEndA = endA ?? DateTime.MaxValue;
        var normalizedStartB = startB ?? DateTime.MinValue;
        var normalizedEndB = endB ?? DateTime.MaxValue;
        return normalizedStartA <= normalizedEndB && normalizedStartB <= normalizedEndA;
    }

    private static string? NormalizeNullable(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static WorkCenterDto ToWorkCenterDto(WorkCenter workCenter) =>
        new(
            workCenter.Id,
            workCenter.WorkCenterCode,
            workCenter.WorkCenterName,
            workCenter.SiteId,
            workCenter.Description,
            workCenter.IsActive,
            workCenter.DefaultTimeCaptureMode,
            workCenter.RequiresScanByDefault,
            workCenter.CreatedUtc,
            workCenter.UpdatedUtc);

    private static RouteTemplateStep ToRouteTemplateStepEntity(RouteTemplateStepUpsertDto step) =>
        new()
        {
            StepSequence = step.StepSequence,
            StepCode = step.StepCode.Trim(),
            StepName = step.StepName.Trim(),
            WorkCenterId = step.WorkCenterId,
            IsRequired = step.IsRequired,
            DataCaptureMode = step.DataCaptureMode,
            TimeCaptureMode = step.TimeCaptureMode,
            RequiresScan = step.RequiresScan,
            RequiresUsageEntry = step.RequiresUsageEntry,
            RequiresScrapEntry = step.RequiresScrapEntry,
            RequiresSerialCapture = step.RequiresSerialCapture,
            RequiresChecklistCompletion = step.RequiresChecklistCompletion,
            ChecklistFailurePolicy = step.ChecklistFailurePolicy,
            RequireScrapReasonWhenBad = step.RequireScrapReasonWhenBad,
            RequiresTrailerCapture = step.RequiresTrailerCapture,
            RequiresSerialLoadVerification = step.RequiresSerialLoadVerification,
            GeneratePackingSlipOnComplete = step.GeneratePackingSlipOnComplete,
            GenerateBolOnComplete = step.GenerateBolOnComplete,
            RequiresAttachment = step.RequiresAttachment,
            RequiresSupervisorApproval = step.RequiresSupervisorApproval,
        };

    private async Task<RouteTemplate> LoadRouteTemplateAsync(int id, CancellationToken cancellationToken)
    {
        var template = await db.RouteTemplates
            .AsNoTracking()
            .Include(t => t.Steps)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (template is null)
            throw new ServiceException(StatusCodes.Status404NotFound, $"Route template '{id}' was not found.");

        template.Steps = template.Steps.OrderBy(s => s.StepSequence).ToList();
        return template;
    }

    private static RouteTemplateStepDto ToStepDto(RouteTemplateStep step) =>
        new(
            step.Id,
            step.StepSequence,
            step.StepCode,
            step.StepName,
            step.WorkCenterId,
            step.IsRequired,
            step.DataCaptureMode,
            step.TimeCaptureMode,
            step.RequiresScan,
            step.RequiresUsageEntry,
            step.RequiresScrapEntry,
            step.RequiresSerialCapture,
            step.RequiresChecklistCompletion,
            step.ChecklistFailurePolicy,
            step.RequireScrapReasonWhenBad,
            step.RequiresTrailerCapture,
            step.RequiresSerialLoadVerification,
            step.GeneratePackingSlipOnComplete,
            step.GenerateBolOnComplete,
            step.RequiresAttachment,
            step.RequiresSupervisorApproval);

    private static RouteTemplateDetailDto ToRouteTemplateDetailDto(RouteTemplate template) =>
        new(
            template.Id,
            template.RouteTemplateCode,
            template.RouteTemplateName,
            template.Description,
            template.IsActive,
            template.VersionNo,
            template.CreatedUtc,
            template.UpdatedUtc,
            template.Steps.OrderBy(s => s.StepSequence).Select(ToStepDto).ToList());

    private static RouteTemplateAssignmentDto ToAssignmentDto(RouteTemplateAssignment assignment) =>
        new(
            assignment.Id,
            assignment.AssignmentName,
            assignment.Priority,
            assignment.RevisionNo,
            assignment.IsActive,
            assignment.CustomerId,
            assignment.SiteId,
            assignment.ItemId,
            assignment.ItemType,
            assignment.RouteTemplateId,
            assignment.EffectiveFromUtc,
            assignment.EffectiveToUtc,
            assignment.CreatedUtc,
            assignment.UpdatedUtc);

    private static string? MatchTierLabel(int? tier) => tier switch
    {
        1 => "customer+item+site",
        2 => "customer+itemType+site",
        3 => "item+site",
        4 => "itemType+site",
        5 => "customer+site",
        6 => "site-default",
        7 => "global-default",
        _ => null,
    };
}
