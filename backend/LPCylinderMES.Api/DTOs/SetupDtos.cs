namespace LPCylinderMES.Api.DTOs;

public record WorkCenterDto(
    int Id,
    string WorkCenterCode,
    string WorkCenterName,
    int SiteId,
    string? Description,
    bool IsActive,
    string DefaultTimeCaptureMode,
    string DefaultProcessingMode,
    bool RequiresScanByDefault,
    DateTime CreatedUtc,
    DateTime UpdatedUtc);

public record ProductionLineDto(
    int Id,
    string Code,
    string Name,
    List<string> ShowWhere,
    bool IsFinishedGood,
    int? WeeklyCapacityTarget,
    string? ScheduleColorHex,
    int SortOrder,
    bool IsActive,
    DateTime CreatedUtc,
    DateTime UpdatedUtc);

public record ProductionLineUpsertDto(
    string Code,
    string Name,
    List<string> ShowWhere,
    bool IsFinishedGood,
    int? WeeklyCapacityTarget,
    string? ScheduleColorHex,
    int SortOrder,
    bool IsActive);

public record AppRoleDto(
    int Id,
    string RoleName,
    string? Description,
    bool IsActive,
    DateTime CreatedUtc,
    DateTime UpdatedUtc);

public record AppRoleUpsertDto(
    string RoleName,
    string? Description,
    bool IsActive);

public record AppUserRoleAssignmentDto(
    int RoleId,
    string RoleName);

public record AppUserRoleAssignmentUpsertDto(
    int RoleId);

public record AppUserDto(
    int Id,
    string? EmpNo,
    string DisplayName,
    string? Email,
    bool HasOperatorPassword,
    int? DefaultSiteId,
    string State,
    bool IsActive,
    DateTime CreatedUtc,
    DateTime UpdatedUtc,
    List<AppUserRoleAssignmentDto> Roles);

public record AppUserUpsertDto(
    string? EmpNo,
    string DisplayName,
    string? Email,
    string? OperatorPassword,
    bool ClearOperatorPassword,
    int? DefaultSiteId,
    string State,
    bool IsActive,
    List<AppUserRoleAssignmentUpsertDto> Roles);

public record WorkCenterUpsertDto(
    string WorkCenterCode,
    string WorkCenterName,
    int SiteId,
    string? Description,
    bool IsActive,
    string DefaultTimeCaptureMode,
    string DefaultProcessingMode,
    bool RequiresScanByDefault);

public record RouteTemplateStepDto(
    int Id,
    int StepSequence,
    string StepCode,
    string StepName,
    int WorkCenterId,
    bool IsRequired,
    string DataCaptureMode,
    string TimeCaptureMode,
    string? ProcessingModeOverride,
    bool RequiresScan,
    bool RequiresUsageEntry,
    bool RequiresScrapEntry,
    bool RequiresSerialCapture,
    bool RequiresChecklistCompletion,
    int? ChecklistTemplateId,
    string ChecklistFailurePolicy,
    bool RequireScrapReasonWhenBad,
    bool RequiresTrailerCapture,
    bool RequiresSerialLoadVerification,
    bool GeneratePackingSlipOnComplete,
    bool GenerateBolOnComplete,
    bool RequiresAttachment,
    bool RequiresSupervisorApproval,
    bool AutoQueueNextStep,
    int? SlaMinutes);

public record RouteTemplateStepUpsertDto(
    int StepSequence,
    string StepCode,
    string StepName,
    int WorkCenterId,
    bool IsRequired,
    string DataCaptureMode,
    string TimeCaptureMode,
    string? ProcessingModeOverride,
    bool RequiresScan,
    bool RequiresUsageEntry,
    bool RequiresScrapEntry,
    bool RequiresSerialCapture,
    bool RequiresChecklistCompletion,
    int? ChecklistTemplateId,
    string ChecklistFailurePolicy,
    bool RequireScrapReasonWhenBad,
    bool RequiresTrailerCapture,
    bool RequiresSerialLoadVerification,
    bool GeneratePackingSlipOnComplete,
    bool GenerateBolOnComplete,
    bool RequiresAttachment,
    bool RequiresSupervisorApproval,
    bool AutoQueueNextStep,
    int? SlaMinutes);

public record RouteTemplateSummaryDto(
    int Id,
    string RouteTemplateCode,
    string RouteTemplateName,
    string? Description,
    bool IsActive,
    int VersionNo,
    DateTime CreatedUtc,
    DateTime UpdatedUtc,
    int StepCount);

public record RouteTemplateDetailDto(
    int Id,
    string RouteTemplateCode,
    string RouteTemplateName,
    string? Description,
    bool IsActive,
    int VersionNo,
    DateTime CreatedUtc,
    DateTime UpdatedUtc,
    List<RouteTemplateStepDto> Steps);

public record RouteTemplateUpsertDto(
    string RouteTemplateCode,
    string RouteTemplateName,
    string? Description,
    bool IsActive,
    int VersionNo,
    List<RouteTemplateStepUpsertDto> Steps);

public record RouteTemplateAssignmentDto(
    int Id,
    string AssignmentName,
    int Priority,
    int RevisionNo,
    bool IsActive,
    int? CustomerId,
    int? SiteId,
    int? ItemId,
    string? ItemType,
    int? OrderPriorityMin,
    int? OrderPriorityMax,
    int? PickUpViaId,
    int? ShipToViaId,
    int RouteTemplateId,
    bool? SupervisorGateOverride,
    DateTime? EffectiveFromUtc,
    DateTime? EffectiveToUtc,
    DateTime CreatedUtc,
    DateTime UpdatedUtc);

public record RouteTemplateAssignmentUpsertDto(
    string AssignmentName,
    int Priority,
    int RevisionNo,
    bool IsActive,
    int? CustomerId,
    int? SiteId,
    int? ItemId,
    string? ItemType,
    int? OrderPriorityMin,
    int? OrderPriorityMax,
    int? PickUpViaId,
    int? ShipToViaId,
    int RouteTemplateId,
    bool? SupervisorGateOverride,
    DateTime? EffectiveFromUtc,
    DateTime? EffectiveToUtc);

public record RouteRuleSimulationRequestDto(
    int CustomerId,
    int SiteId,
    int ItemId,
    string? ItemType = null);

public record RouteRuleSimulationResponseDto(
    bool Matched,
    int? MatchTier,
    string? MatchTierLabel,
    RouteTemplateAssignmentDto? Assignment,
    RouteTemplateDetailDto? RouteTemplate);

public record LookupOptionAdminDto(
    int Id,
    string Code,
    string DisplayName,
    bool IsActive,
    int SortOrder,
    bool IsInUse,
    DateTime CreatedUtc,
    DateTime UpdatedUtc);

public record LookupOptionUpsertDto(
    string Code,
    string DisplayName,
    bool IsActive,
    int SortOrder);

public record ScheduleSettingsDto(int ThroughputLookbackDays);

public record ScheduleSettingsUpsertDto(int ThroughputLookbackDays);
