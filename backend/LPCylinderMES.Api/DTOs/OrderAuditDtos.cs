namespace LPCylinderMES.Api.DTOs;

public record OrderFieldAuditDto(
    long Id,
    int OrderId,
    string SalesOrderNo,
    string EntityName,
    int? EntityId,
    string FieldName,
    string? OldValue,
    string? NewValue,
    string ActionType,
    string? ActorEmpNo,
    string? ActorRole,
    string? Source,
    string? CorrelationId,
    DateTime OccurredUtc);
