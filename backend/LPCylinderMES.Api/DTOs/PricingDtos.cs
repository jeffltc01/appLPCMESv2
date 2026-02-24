namespace LPCylinderMES.Api.DTOs;

public record PricingDto(
    int Id,
    DateOnly EffectiveDate,
    double? UnitPrice,
    string? Notes,
    int ItemId,
    int? CustomerId,
    string? CustomerName);

public record PricingCreateDto(
    DateOnly EffectiveDate,
    double? UnitPrice,
    string? Notes,
    int? CustomerId);

public record PricingUpdateDto(
    DateOnly EffectiveDate,
    double? UnitPrice,
    string? Notes,
    int? CustomerId);
