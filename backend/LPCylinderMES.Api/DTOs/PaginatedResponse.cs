namespace LPCylinderMES.Api.DTOs;

public record PaginatedResponse<T>(
    List<T> Items,
    int TotalCount,
    int Page,
    int PageSize);
