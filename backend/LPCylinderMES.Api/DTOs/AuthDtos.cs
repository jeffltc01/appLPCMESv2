namespace LPCylinderMES.Api.DTOs;

public sealed record OperatorPreLoginRequestDto(string EmpNo);

public sealed record OperatorAssignmentDto(
    int SiteId,
    string SiteName,
    int WorkCenterId,
    string WorkCenterCode,
    string WorkCenterName);

public sealed record OperatorPreLoginResponseDto(
    string EmpNo,
    string DisplayName,
    bool PasswordRequired,
    List<OperatorAssignmentDto> Assignments);

public sealed record OperatorLoginRequestDto(
    string EmpNo,
    string? Password,
    int SiteId,
    int WorkCenterId);

public sealed record MicrosoftLoginRequestDto(string IdToken);

public sealed record AuthSessionDto(
    string Token,
    DateTime ExpiresUtc,
    string AuthMethod,
    int UserId,
    string EmpNo,
    string DisplayName,
    int? SiteId,
    string? SiteName,
    int? WorkCenterId,
    string? WorkCenterCode,
    string? WorkCenterName,
    List<string> Roles);
