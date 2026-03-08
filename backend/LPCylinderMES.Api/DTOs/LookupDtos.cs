namespace LPCylinderMES.Api.DTOs;

public record LookupDto(int Id, string Name);

public record SalesPersonLookupDto(int Id, string Name, string EmployeeNumber);

public record ItemSizeLookupDto(int Id, string Name, int Size);

public record AddressLookupDto(int Id, string Type, string Name);

public record OrderItemLookupDto(int Id, string ItemNo, string? ItemDescription, string? ProductLine);

public record OrderLineLookupOptionDto(int Id, string Code, string DisplayName, bool IsActive, int SortOrder);

public record OrderLineLookupBundleDto(
    List<OrderLineLookupOptionDto> ValveTypes,
    List<OrderLineLookupOptionDto> Gauges);
