export interface WorkCenter {
  id: number;
  workCenterCode: string;
  workCenterName: string;
  siteId: number;
  description: string | null;
  isActive: boolean;
  defaultTimeCaptureMode: "Automated" | "Manual" | "Hybrid";
  requiresScanByDefault: boolean;
  createdUtc: string;
  updatedUtc: string;
}

export interface AppRole {
  id: number;
  roleName: string;
  description: string | null;
  isActive: boolean;
  createdUtc: string;
  updatedUtc: string;
}

export interface AppRoleUpsert {
  roleName: string;
  description?: string | null;
  isActive: boolean;
}

export interface AppUserRoleAssignment {
  roleId: number;
  roleName: string;
  siteId: number | null;
}

export interface AppUserRoleAssignmentUpsert {
  roleId: number;
  siteId?: number | null;
}

export interface AppUser {
  id: number;
  empNo: string | null;
  displayName: string;
  email: string | null;
  defaultSiteId: number | null;
  state: "Active" | "Inactive" | "Locked";
  isActive: boolean;
  createdUtc: string;
  updatedUtc: string;
  roles: AppUserRoleAssignment[];
}

export interface AppUserUpsert {
  empNo?: string | null;
  displayName: string;
  email?: string | null;
  defaultSiteId?: number | null;
  state: "Active" | "Inactive" | "Locked";
  isActive: boolean;
  roles: AppUserRoleAssignmentUpsert[];
}

export type ProductionLineShowWhere =
  | "OrderComments"
  | "OrderProduct"
  | "OrderReceiving"
  | "JobMaterialUsed";

export interface ProductionLine {
  id: number;
  code: string;
  name: string;
  showWhere: ProductionLineShowWhere[];
  createdUtc: string;
  updatedUtc: string;
}

export interface ProductionLineUpsert {
  code: string;
  name: string;
  showWhere: ProductionLineShowWhere[];
}

export interface WorkCenterUpsert {
  workCenterCode: string;
  workCenterName: string;
  siteId: number;
  description?: string | null;
  isActive: boolean;
  defaultTimeCaptureMode: "Automated" | "Manual" | "Hybrid";
  requiresScanByDefault: boolean;
}

export interface RouteTemplateStep {
  id: number;
  stepSequence: number;
  stepCode: string;
  stepName: string;
  workCenterId: number;
  isRequired: boolean;
  dataCaptureMode: "ElectronicRequired" | "ElectronicOptional" | "PaperOnly";
  timeCaptureMode: "Automated" | "Manual" | "Hybrid";
  requiresScan: boolean;
  requiresUsageEntry: boolean;
  requiresScrapEntry: boolean;
  requiresSerialCapture: boolean;
  requiresChecklistCompletion: boolean;
  checklistTemplateId: number | null;
  checklistFailurePolicy: "BlockCompletion" | "AllowWithSupervisorOverride";
  requireScrapReasonWhenBad: boolean;
  requiresTrailerCapture: boolean;
  requiresSerialLoadVerification: boolean;
  generatePackingSlipOnComplete: boolean;
  generateBolOnComplete: boolean;
  requiresAttachment: boolean;
  requiresSupervisorApproval: boolean;
  autoQueueNextStep: boolean;
  slaMinutes: number | null;
}

export interface RouteTemplateStepUpsert {
  stepSequence: number;
  stepCode: string;
  stepName: string;
  workCenterId: number;
  isRequired: boolean;
  dataCaptureMode: "ElectronicRequired" | "ElectronicOptional" | "PaperOnly";
  timeCaptureMode: "Automated" | "Manual" | "Hybrid";
  requiresScan: boolean;
  requiresUsageEntry: boolean;
  requiresScrapEntry: boolean;
  requiresSerialCapture: boolean;
  requiresChecklistCompletion: boolean;
  checklistTemplateId?: number | null;
  checklistFailurePolicy: "BlockCompletion" | "AllowWithSupervisorOverride";
  requireScrapReasonWhenBad: boolean;
  requiresTrailerCapture: boolean;
  requiresSerialLoadVerification: boolean;
  generatePackingSlipOnComplete: boolean;
  generateBolOnComplete: boolean;
  requiresAttachment: boolean;
  requiresSupervisorApproval: boolean;
  autoQueueNextStep: boolean;
  slaMinutes?: number | null;
}

export interface RouteTemplateSummary {
  id: number;
  routeTemplateCode: string;
  routeTemplateName: string;
  description: string | null;
  isActive: boolean;
  versionNo: number;
  createdUtc: string;
  updatedUtc: string;
  stepCount: number;
}

export interface RouteTemplateDetail {
  id: number;
  routeTemplateCode: string;
  routeTemplateName: string;
  description: string | null;
  isActive: boolean;
  versionNo: number;
  createdUtc: string;
  updatedUtc: string;
  steps: RouteTemplateStep[];
}

export interface RouteTemplateUpsert {
  routeTemplateCode: string;
  routeTemplateName: string;
  description?: string | null;
  isActive: boolean;
  versionNo: number;
  steps: RouteTemplateStepUpsert[];
}

export interface RouteTemplateAssignment {
  id: number;
  assignmentName: string;
  priority: number;
  revisionNo: number;
  isActive: boolean;
  customerId: number | null;
  siteId: number | null;
  itemId: number | null;
  itemType: string | null;
  orderPriorityMin: number | null;
  orderPriorityMax: number | null;
  pickUpViaId: number | null;
  shipToViaId: number | null;
  routeTemplateId: number;
  supervisorGateOverride: boolean | null;
  effectiveFromUtc: string | null;
  effectiveToUtc: string | null;
  createdUtc: string;
  updatedUtc: string;
}

export interface RouteTemplateAssignmentUpsert {
  assignmentName: string;
  priority: number;
  revisionNo: number;
  isActive: boolean;
  customerId?: number | null;
  siteId?: number | null;
  itemId?: number | null;
  itemType?: string | null;
  orderPriorityMin?: number | null;
  orderPriorityMax?: number | null;
  pickUpViaId?: number | null;
  shipToViaId?: number | null;
  routeTemplateId: number;
  supervisorGateOverride?: boolean | null;
  effectiveFromUtc?: string | null;
  effectiveToUtc?: string | null;
}

export interface RouteRuleSimulationRequest {
  customerId: number;
  siteId: number;
  itemId: number;
  itemType?: string | null;
}

export interface RouteRuleSimulationResponse {
  matched: boolean;
  matchTier: number | null;
  matchTierLabel: string | null;
  assignment: RouteTemplateAssignment | null;
  routeTemplate: RouteTemplateDetail | null;
}
