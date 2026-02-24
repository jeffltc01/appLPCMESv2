namespace LPCylinderMES.Api.DTOs;

public record CrossReferenceDto(
    int Id,
    string LpcItemNumber,
    string ErpItemNumber);

public record CrossReferenceCreateDto(
    string LpcItemNumber,
    string ErpItemNumber);
