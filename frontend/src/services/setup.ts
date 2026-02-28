import { api } from "./api";
import type {
  AppRole,
  AppRoleUpsert,
  AppUser,
  AppUserUpsert,
  FeatureFlagConfig,
  FeatureFlagConfigUpsert,
  ProductionLine,
  ProductionLineUpsert,
  RouteRuleSimulationRequest,
  RouteRuleSimulationResponse,
  SetupConfigAuditEntry,
  SitePolicyConfig,
  SitePolicyConfigUpsert,
  RouteTemplateAssignment,
  RouteTemplateAssignmentUpsert,
  RouteTemplateDetail,
  RouteTemplateSummary,
  RouteTemplateUpsert,
  WorkCenter,
  WorkCenterUpsert,
} from "../types/setup";

export const setupApi = {
  listRoles: () => api.get<AppRole[]>("/setup/roles"),
  getRole: (id: number) => api.get<AppRole>(`/setup/roles/${id}`),
  createRole: (data: AppRoleUpsert) => api.post<AppRole>("/setup/roles", data),
  updateRole: (id: number, data: AppRoleUpsert) => api.put<AppRole>(`/setup/roles/${id}`, data),
  deleteRole: (id: number) => api.delete<void>(`/setup/roles/${id}`),

  listUsers: () => api.get<AppUser[]>("/setup/users"),
  getUser: (id: number) => api.get<AppUser>(`/setup/users/${id}`),
  createUser: (data: AppUserUpsert) => api.post<AppUser>("/setup/users", data),
  updateUser: (id: number, data: AppUserUpsert) => api.put<AppUser>(`/setup/users/${id}`, data),
  deleteUser: (id: number) => api.delete<void>(`/setup/users/${id}`),

  listProductionLines: () => api.get<ProductionLine[]>("/setup/production-lines"),
  getProductionLine: (id: number) => api.get<ProductionLine>(`/setup/production-lines/${id}`),
  createProductionLine: (data: ProductionLineUpsert) =>
    api.post<ProductionLine>("/setup/production-lines", data),
  updateProductionLine: (id: number, data: ProductionLineUpsert) =>
    api.put<ProductionLine>(`/setup/production-lines/${id}`, data),
  deleteProductionLine: (id: number) => api.delete<void>(`/setup/production-lines/${id}`),

  listWorkCenters: () => api.get<WorkCenter[]>("/setup/workcenters"),
  getWorkCenter: (id: number) => api.get<WorkCenter>(`/setup/workcenters/${id}`),
  createWorkCenter: (data: WorkCenterUpsert) => api.post<WorkCenter>("/setup/workcenters", data),
  updateWorkCenter: (id: number, data: WorkCenterUpsert) => api.put<WorkCenter>(`/setup/workcenters/${id}`, data),
  deleteWorkCenter: (id: number) => api.delete<void>(`/setup/workcenters/${id}`),

  listRouteTemplates: () => api.get<RouteTemplateSummary[]>("/setup/route-templates"),
  getRouteTemplate: (id: number) => api.get<RouteTemplateDetail>(`/setup/route-templates/${id}`),
  createRouteTemplate: (data: RouteTemplateUpsert) =>
    api.post<RouteTemplateDetail>("/setup/route-templates", data),
  updateRouteTemplate: (id: number, data: RouteTemplateUpsert) =>
    api.put<RouteTemplateDetail>(`/setup/route-templates/${id}`, data),
  deleteRouteTemplate: (id: number) => api.delete<void>(`/setup/route-templates/${id}`),

  listAssignments: () => api.get<RouteTemplateAssignment[]>("/setup/assignments"),
  getAssignment: (id: number) => api.get<RouteTemplateAssignment>(`/setup/assignments/${id}`),
  createAssignment: (data: RouteTemplateAssignmentUpsert) =>
    api.post<RouteTemplateAssignment>("/setup/assignments", data),
  updateAssignment: (id: number, data: RouteTemplateAssignmentUpsert) =>
    api.put<RouteTemplateAssignment>(`/setup/assignments/${id}`, data),
  deleteAssignment: (id: number) => api.delete<void>(`/setup/assignments/${id}`),

  simulateRoute: (data: RouteRuleSimulationRequest) =>
    api.post<RouteRuleSimulationResponse>("/setup/rules/simulate", data),

  listFeatureFlags: () => api.get<FeatureFlagConfig[]>("/setup/feature-flags"),
  updateFeatureFlag: (id: number, data: FeatureFlagConfigUpsert) =>
    api.put<FeatureFlagConfig>(`/setup/feature-flags/${id}`, data),

  listSitePolicies: () => api.get<SitePolicyConfig[]>("/setup/site-policies"),
  updateSitePolicy: (id: number, data: SitePolicyConfigUpsert) =>
    api.put<SitePolicyConfig>(`/setup/site-policies/${id}`, data),

  listConfigAudit: () => api.get<SetupConfigAuditEntry[]>("/setup/config-audit"),
};
