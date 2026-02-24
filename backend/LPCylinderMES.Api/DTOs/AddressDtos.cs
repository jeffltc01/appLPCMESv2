namespace LPCylinderMES.Api.DTOs;

public record AddressDto(
    int Id,
    string Type,
    string? AddressName,
    string Address1,
    string? Address2,
    string? City,
    string? State,
    string? PostalCode,
    string? Country,
    int CustomerId,
    int? ContactId,
    int? DefaultSalesEmployeeId,
    bool IsUsedOnOrders);

public record AddressCreateDto(
    string Type,
    string? AddressName,
    string Address1,
    string? Address2,
    string? City,
    string? State,
    string? PostalCode,
    string? Country,
    int? ContactId,
    int? DefaultSalesEmployeeId);

public record AddressUpdateDto(
    string Type,
    string? AddressName,
    string Address1,
    string? Address2,
    string? City,
    string? State,
    string? PostalCode,
    string? Country,
    int? ContactId,
    int? DefaultSalesEmployeeId);
