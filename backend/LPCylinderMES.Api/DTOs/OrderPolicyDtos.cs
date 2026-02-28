namespace LPCylinderMES.Api.DTOs;

public record DecisionPolicyEntryDto(
    string DecisionKey,
    int PolicyVersion,
    string ScopeType,
    int? SiteId,
    int? CustomerId,
    string PolicyValue,
    bool IsActive,
    DateTime UpdatedUtc,
    string? UpdatedByEmpNo,
    string? Notes);

public record UpsertDecisionPolicyDto(
    int PolicyVersion,
    string ScopeType,
    int? SiteId,
    int? CustomerId,
    string PolicyValue,
    bool IsActive,
    string? UpdatedByEmpNo,
    string? Notes);

public record DecisionSignoffDto(
    int PolicyVersion,
    string FunctionRole,
    bool IsApproved,
    string? ApprovedByEmpNo,
    DateTime? ApprovedUtc,
    string? Notes);

public record CreateDecisionSignoffDto(
    int PolicyVersion,
    string FunctionRole,
    string ApprovedByEmpNo,
    string? Notes);

public record PolicyActivationResultDto(
    int PolicyVersion,
    bool Activated,
    List<string> MissingFunctions);

public record PromiseReasonPolicyDto(
    int Id,
    string ReasonCode,
    string Description,
    string OwnerRole,
    string AllowedNotificationPolicies,
    bool IsActive,
    DateTime UpdatedUtc,
    string? UpdatedByEmpNo);

public record UpsertPromiseReasonPolicyDto(
    string ReasonCode,
    string Description,
    string OwnerRole,
    string AllowedNotificationPolicies,
    bool IsActive,
    string? UpdatedByEmpNo);

public record StatusReasonCodeDto(
    int Id,
    string OverlayType,
    string CodeName,
    DateTime UpdatedUtc,
    string? UpdatedByEmpNo);

public record UpsertStatusReasonCodeDto(
    string OverlayType,
    string CodeName,
    string? UpdatedByEmpNo);
