using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface ISetupRoutingService
{
    Task<List<AppRoleDto>> GetRolesAsync(CancellationToken cancellationToken = default);
    Task<AppRoleDto> GetRoleAsync(int id, CancellationToken cancellationToken = default);
    Task<AppRoleDto> CreateRoleAsync(AppRoleUpsertDto dto, CancellationToken cancellationToken = default);
    Task<AppRoleDto> UpdateRoleAsync(int id, AppRoleUpsertDto dto, CancellationToken cancellationToken = default);
    Task DeleteRoleAsync(int id, CancellationToken cancellationToken = default);

    Task<List<AppUserDto>> GetUsersAsync(CancellationToken cancellationToken = default);
    Task<AppUserDto> GetUserAsync(int id, CancellationToken cancellationToken = default);
    Task<AppUserDto> CreateUserAsync(AppUserUpsertDto dto, CancellationToken cancellationToken = default);
    Task<AppUserDto> UpdateUserAsync(int id, AppUserUpsertDto dto, CancellationToken cancellationToken = default);
    Task DeleteUserAsync(int id, CancellationToken cancellationToken = default);

    Task<List<ProductionLineDto>> GetProductionLinesAsync(CancellationToken cancellationToken = default);
    Task<ProductionLineDto> GetProductionLineAsync(int id, CancellationToken cancellationToken = default);
    Task<ProductionLineDto> CreateProductionLineAsync(ProductionLineUpsertDto dto, CancellationToken cancellationToken = default);
    Task<ProductionLineDto> UpdateProductionLineAsync(int id, ProductionLineUpsertDto dto, CancellationToken cancellationToken = default);
    Task DeleteProductionLineAsync(int id, CancellationToken cancellationToken = default);

    Task<List<WorkCenterDto>> GetWorkCentersAsync(CancellationToken cancellationToken = default);
    Task<WorkCenterDto> GetWorkCenterAsync(int id, CancellationToken cancellationToken = default);
    Task<WorkCenterDto> CreateWorkCenterAsync(WorkCenterUpsertDto dto, CancellationToken cancellationToken = default);
    Task<WorkCenterDto> UpdateWorkCenterAsync(int id, WorkCenterUpsertDto dto, CancellationToken cancellationToken = default);
    Task DeleteWorkCenterAsync(int id, CancellationToken cancellationToken = default);

    Task<List<RouteTemplateSummaryDto>> GetRouteTemplatesAsync(CancellationToken cancellationToken = default);
    Task<RouteTemplateDetailDto> GetRouteTemplateAsync(int id, CancellationToken cancellationToken = default);
    Task<RouteTemplateDetailDto> CreateRouteTemplateAsync(RouteTemplateUpsertDto dto, CancellationToken cancellationToken = default);
    Task<RouteTemplateDetailDto> UpdateRouteTemplateAsync(int id, RouteTemplateUpsertDto dto, CancellationToken cancellationToken = default);
    Task DeleteRouteTemplateAsync(int id, CancellationToken cancellationToken = default);

    Task<List<RouteTemplateAssignmentDto>> GetAssignmentsAsync(CancellationToken cancellationToken = default);
    Task<RouteTemplateAssignmentDto> GetAssignmentAsync(int id, CancellationToken cancellationToken = default);
    Task<RouteTemplateAssignmentDto> CreateAssignmentAsync(RouteTemplateAssignmentUpsertDto dto, CancellationToken cancellationToken = default);
    Task<RouteTemplateAssignmentDto> UpdateAssignmentAsync(int id, RouteTemplateAssignmentUpsertDto dto, CancellationToken cancellationToken = default);
    Task DeleteAssignmentAsync(int id, CancellationToken cancellationToken = default);

    Task<RouteRuleSimulationResponseDto> SimulateRouteAsync(RouteRuleSimulationRequestDto dto, CancellationToken cancellationToken = default);
}
