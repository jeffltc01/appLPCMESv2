import { api } from "./api";
import type {
  ProductionLine,
  ProductionLineUpsert,
  RouteRuleSimulationRequest,
  RouteRuleSimulationResponse,
  RouteTemplateAssignment,
  RouteTemplateAssignmentUpsert,
  RouteTemplateDetail,
  RouteTemplateSummary,
  RouteTemplateUpsert,
  WorkCenter,
  WorkCenterUpsert,
} from "../types/setup";

export const setupApi = {
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
};
