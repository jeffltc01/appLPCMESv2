namespace LPCylinderMES.Api.DTOs;

public record ContactDto(
    int Id,
    string FirstName,
    string? LastName,
    string? Email,
    string? OfficePhone,
    string? MobilePhone,
    string? Notes,
    int CustomerId);

public record ContactCreateDto(
    string FirstName,
    string? LastName,
    string? Email,
    string? OfficePhone,
    string? MobilePhone,
    string? Notes);

public record ContactUpdateDto(
    string FirstName,
    string? LastName,
    string? Email,
    string? OfficePhone,
    string? MobilePhone,
    string? Notes);
