namespace LPCylinderMES.Api.DTOs;

public record ItemListDto(
    int Id,
    string ItemNo,
    string? ItemDescription,
    string ItemType,
    string? ProductLine,
    string? SizeName,
    double? BasePrice);

public record ItemDetailDto(
    int Id,
    string ItemNo,
    string? ItemDescription,
    string ItemType,
    string? ProductLine,
    int? ItemSizeId,
    string? SizeName,
    string? SystemCode,
    int RequiresSerialNumbers,
    bool? RequiresGaugeOption,
    bool? RequiresFillerOption,
    bool? RequiresCollarOption,
    bool? RequiresFootRingOption,
    bool? RequiresValveTypeOption,
    List<PricingDto> Pricings,
    List<CrossReferenceDto> CrossReferences);

public record ItemCreateDto(
    string ItemNo,
    string? ItemDescription,
    string ItemType,
    string? ProductLine,
    int? ItemSizeId);

public record ItemUpdateDto(
    string ItemNo,
    string? ItemDescription,
    string ItemType,
    string? ProductLine,
    int? ItemSizeId,
    string? SystemCode,
    int RequiresSerialNumbers,
    bool? RequiresGaugeOption,
    bool? RequiresFillerOption,
    bool? RequiresCollarOption,
    bool? RequiresFootRingOption,
    bool? RequiresValveTypeOption);
