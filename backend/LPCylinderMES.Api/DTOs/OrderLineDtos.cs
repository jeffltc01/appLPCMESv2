namespace LPCylinderMES.Api.DTOs;

public record OrderLineDto(
    int Id,
    decimal LineNo,
    int ItemId,
    string ItemNo,
    string ItemDescription,
    decimal QuantityAsOrdered,
    decimal? UnitPrice,
    decimal? Extension,
    string? Notes,
    int? ColorId,
    string? ColorName,
    int? LidColorId,
    string? LidColorName,
    bool? NeedCollars,
    bool? NeedFillers,
    bool? NeedFootRings,
    bool? NeedDecals,
    string? ValveType,
    string? Gauges);

public record OrderLineCreateDto(
    int ItemId,
    decimal QuantityAsOrdered,
    decimal? UnitPrice,
    string? Notes,
    int? ColorId,
    int? LidColorId,
    bool? NeedCollars,
    bool? NeedFillers,
    bool? NeedFootRings,
    bool? NeedDecals,
    string? ValveType,
    string? Gauges);

public record OrderLineUpdateDto(
    int ItemId,
    decimal QuantityAsOrdered,
    decimal? UnitPrice,
    string? Notes,
    int? ColorId,
    int? LidColorId,
    bool? NeedCollars,
    bool? NeedFillers,
    bool? NeedFootRings,
    bool? NeedDecals,
    string? ValveType,
    string? Gauges);
