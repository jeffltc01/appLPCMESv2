import { api } from "./api";
import type {
  OrderDraftListItem,
  OrderDraftDetail,
  OrderDraftCreate,
  OrderDraftUpdate,
  OrderLine,
  OrderLineCreate,
  OrderLineUpdate,
  OrderListParams,
  TransportBoardParams,
  TransportBoardItem,
  TransportBoardUpdate,
  ReceivingOrderListItem,
  ReceivingOrderDetail,
  CompleteReceivingRequest,
  AddressLookup,
  OrderItemLookup,
  ProductionOrderListItem,
  ProductionOrderDetail,
  OrderAttachment,
  CompleteProductionRequest,
  SubmitInvoiceRequest,
  ApplyHoldRequest,
  ClearHoldRequest,
  UpsertPromiseCommitmentRequest,
  ClassifyPromiseMissRequest,
  RecordPromiseNotificationRequest,
  OrderPromiseChangeEvent,
  OrderLifecycleMigrationResult,
  OrderKpiSummary,
  OrderKpiDiagnostics,
  WorkCenterQueueItem,
  OrderRouteExecution,
  OperatorScanInRequest,
  OperatorScanOutRequest,
  CompleteWorkCenterStepRequest,
  VerifySerialLoadRequest,
  GenerateStepDocumentRequest,
  StepMaterialUsageCreateRequest,
  StepScrapEntryCreateRequest,
  StepSerialCaptureCreateRequest,
  StepChecklistResultCreateRequest,
  SupervisorRouteReviewRequest,
  SupervisorDecisionRequest,
  ReworkRequest,
  ReworkStateChangeRequest,
  CorrectStepDurationRequest,
  OperatorActivityLogItem,
  OrderWorkspaceAction,
  OrderWorkspaceRole,
  OrderWorkflowStatus,
} from "../types/order";
import type {
  Lookup,
  PaginatedResponse,
  SalesPersonLookup,
} from "../types/customer";
import { ApiError } from "./api";

const STATUS_SEQUENCE: OrderWorkflowStatus[] = [
  "Draft",
  "PendingOrderEntryValidation",
  "InboundLogisticsPlanned",
  "InboundInTransit",
  "ReceivedPendingReconciliation",
  "ReadyForProduction",
  "InProduction",
  "ProductionCompletePendingApproval",
  "ProductionComplete",
  "OutboundLogisticsPlanned",
  "DispatchedOrPickupReleased",
  "InvoiceReady",
  "Invoiced",
];

const ROLE_ACTIONS: Record<OrderWorkspaceRole, Set<OrderWorkspaceAction>> = {
  Office: new Set([
    "advanceInboundPlan",
    "openInvoiceWizard",
    "markInvoiced",
    "applyHold",
    "uploadAttachment",
  ]),
  Transportation: new Set([
    "advanceInboundPlan",
    "advanceInboundTransit",
    "planOutbound",
    "markDispatchedOrReleased",
    "applyHold",
  ]),
  Receiving: new Set(["markReceived", "markReadyForProduction", "uploadAttachment", "applyHold"]),
  Production: new Set([
    "startProduction",
    "markProductionComplete",
    "applyHold",
    "uploadAttachment",
  ]),
  Supervisor: new Set(["markProductionComplete", "markInvoiced", "applyHold", "uploadAttachment"]),
  Quality: new Set(["markProductionComplete", "applyHold", "uploadAttachment"]),
  Admin: new Set([
    "advanceInboundPlan",
    "advanceInboundTransit",
    "markReceived",
    "markReadyForProduction",
    "startProduction",
    "markProductionComplete",
    "planOutbound",
    "markDispatchedOrReleased",
    "openInvoiceWizard",
    "markInvoiced",
    "applyHold",
    "uploadAttachment",
  ]),
  PlantManager: new Set([
    "advanceInboundPlan",
    "advanceInboundTransit",
    "markReceived",
    "markReadyForProduction",
    "startProduction",
    "markProductionComplete",
    "planOutbound",
    "markDispatchedOrReleased",
    "openInvoiceWizard",
    "markInvoiced",
    "applyHold",
    "uploadAttachment",
  ]),
};

const ACTION_TO_STATUS: Partial<Record<OrderWorkspaceAction, OrderWorkflowStatus>> = {
  advanceInboundPlan: "InboundLogisticsPlanned",
  advanceInboundTransit: "InboundInTransit",
  markReceived: "ReceivedPendingReconciliation",
  markReadyForProduction: "ReadyForProduction",
  startProduction: "InProduction",
  markProductionComplete: "ProductionComplete",
  planOutbound: "OutboundLogisticsPlanned",
  markDispatchedOrReleased: "DispatchedOrPickupReleased",
  markInvoiced: "Invoiced",
};

const ACTION_ALLOWED_STATUSES: Partial<Record<OrderWorkspaceAction, OrderWorkflowStatus[]>> = {
  advanceInboundPlan: ["Draft", "PendingOrderEntryValidation"],
  advanceInboundTransit: ["InboundLogisticsPlanned"],
  markReceived: [
    "Draft",
    "PendingOrderEntryValidation",
    "InboundLogisticsPlanned",
    "InboundInTransit",
  ],
  markReadyForProduction: ["ReceivedPendingReconciliation"],
  startProduction: ["ReadyForProduction"],
  markProductionComplete: ["InProduction", "ProductionCompletePendingApproval"],
  planOutbound: ["ProductionComplete"],
  markDispatchedOrReleased: ["ProductionComplete", "OutboundLogisticsPlanned"],
  openInvoiceWizard: ["DispatchedOrPickupReleased", "InvoiceReady"],
  markInvoiced: ["InvoiceReady"],
};

export function getSuggestedWorkspaceActions(currentStatus: string): OrderWorkspaceAction[] {
  const byStatus: Partial<Record<OrderWorkflowStatus, OrderWorkspaceAction[]>> = {
    Draft: ["advanceInboundPlan", "markReceived"],
    PendingOrderEntryValidation: ["advanceInboundPlan", "markReceived"],
    InboundLogisticsPlanned: ["advanceInboundTransit", "markReceived"],
    InboundInTransit: ["markReceived"],
    ReceivedPendingReconciliation: ["markReadyForProduction"],
    ReadyForProduction: ["startProduction"],
    InProduction: ["markProductionComplete"],
    ProductionCompletePendingApproval: ["markProductionComplete"],
    ProductionComplete: ["planOutbound", "markDispatchedOrReleased"],
    OutboundLogisticsPlanned: ["markDispatchedOrReleased"],
    DispatchedOrPickupReleased: ["openInvoiceWizard"],
    InvoiceReady: ["openInvoiceWizard", "markInvoiced"],
    Invoiced: [],
  };

  const known = byStatus[currentStatus as OrderWorkflowStatus];
  if (known) {
    return [...known, "uploadAttachment", "applyHold"];
  }
  return ["uploadAttachment", "applyHold"];
}

export function getWorkspaceCurrentStatus(orderStatus: string | null | undefined): string {
  if (!orderStatus) {
    return "Draft";
  }

  const legacyToLifecycle: Record<string, string> = {
    New: "Draft",
    "Ready for Pickup": "InboundLogisticsPlanned",
    "Pickup Scheduled": "InboundLogisticsPlanned",
    Received: "ReceivedPendingReconciliation",
    "Ready to Ship": "ProductionComplete",
    "Ready to Invoice": "InvoiceReady",
    Complete: "Invoiced",
    Closed: "Invoiced",
  };

  return legacyToLifecycle[orderStatus] ?? orderStatus;
}

export function getWorkspaceActionState(
  role: OrderWorkspaceRole,
  action: OrderWorkspaceAction,
  currentStatus: string,
  hasHoldOverlay: boolean,
  overrideEnabled: boolean
): { enabled: boolean; reason?: string; targetStatus?: OrderWorkflowStatus } {
  if (!ROLE_ACTIONS[role].has(action) && !overrideEnabled) {
    return { enabled: false, reason: "Role does not allow this action." };
  }

  if (hasHoldOverlay && action !== "applyHold" && !overrideEnabled) {
    return { enabled: false, reason: "Hold overlay blocks forward transitions." };
  }

  const targetStatus = ACTION_TO_STATUS[action];
  const allowedStatuses = ACTION_ALLOWED_STATUSES[action];
  if (allowedStatuses && !allowedStatuses.includes(currentStatus as OrderWorkflowStatus) && !overrideEnabled) {
    return { enabled: false, reason: "Action is not valid from current status.", targetStatus };
  }

  if (!targetStatus) {
    return { enabled: true };
  }

  const currentIdx = STATUS_SEQUENCE.indexOf(currentStatus as OrderWorkflowStatus);
  const targetIdx = STATUS_SEQUENCE.indexOf(targetStatus);
  if (currentIdx === -1 || targetIdx === -1) {
    return { enabled: overrideEnabled, reason: "Unknown lifecycle status.", targetStatus };
  }

  if (targetIdx < currentIdx && !overrideEnabled) {
    return { enabled: false, reason: "Backwards transitions require override.", targetStatus };
  }

  if (targetIdx > currentIdx + 1 && !overrideEnabled) {
    return { enabled: false, reason: "Guided mode only allows next-step progress.", targetStatus };
  }

  return { enabled: true, targetStatus };
}

export const ordersApi = {
  list: (params: OrderListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.search) qs.set("search", params.search);
    if (params.status) qs.set("status", params.status);
    if (params.customerId) qs.set("customerId", String(params.customerId));
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
    const query = qs.toString();

    return api.get<PaginatedResponse<OrderDraftListItem>>(
      `/orders${query ? `?${query}` : ""}`
    );
  },

  get: (id: number) => api.get<OrderDraftDetail>(`/orders/${id}`),

  create: (data: OrderDraftCreate) =>
    api.post<OrderDraftDetail>("/orders", data),

  update: (id: number, data: OrderDraftUpdate) =>
    api.put<OrderDraftDetail>(`/orders/${id}`, data),

  advanceStatus: (
    id: number,
    targetStatus: string,
    context?: {
      actingRole?: OrderWorkspaceRole;
      reasonCode?: string;
      note?: string;
      actingEmpNo?: string;
    }
  ) =>
    api.post<OrderDraftDetail>(`/orders/${id}/advance-status`, {
      targetStatus,
      actingRole: context?.actingRole,
      reasonCode: context?.reasonCode,
      note: context?.note,
      actingEmpNo: context?.actingEmpNo,
    }),

  submitInvoice: (id: number, data: SubmitInvoiceRequest) =>
    api.post<OrderDraftDetail>(`/orders/${id}/invoice/submit`, data),

  applyHold: (id: number, data: ApplyHoldRequest) =>
    api.post<OrderDraftDetail>(`/orders/${id}/hold/apply`, data),

  clearHold: (id: number, data: ClearHoldRequest) =>
    api.post<OrderDraftDetail>(`/orders/${id}/hold/clear`, data),

  upsertPromiseCommitment: (id: number, data: UpsertPromiseCommitmentRequest) =>
    api.post<OrderDraftDetail>(`/orders/${id}/promise-commitment`, data),

  classifyPromiseMiss: (id: number, data: ClassifyPromiseMissRequest) =>
    api.post<OrderDraftDetail>(`/orders/${id}/promise-miss-classification`, data),

  recordPromiseNotification: (id: number, data: RecordPromiseNotificationRequest) =>
    api.post<OrderDraftDetail>(`/orders/${id}/promise-notification`, data),

  promiseHistory: (id: number) =>
    api.get<OrderPromiseChangeEvent[]>(`/orders/${id}/promise-history`),

  migrateLifecycleStatuses: (
    dryRun: boolean,
    options?: { migratedBy?: string; migrationBatchId?: string; batchSize?: number }
  ) =>
    api.post<OrderLifecycleMigrationResult>(
      `/orders/migrate-lifecycle-statuses?dryRun=${dryRun ? "true" : "false"}${
        options?.migratedBy ? `&migratedBy=${encodeURIComponent(options.migratedBy)}` : ""
      }${
        options?.migrationBatchId ? `&migrationBatchId=${encodeURIComponent(options.migrationBatchId)}` : ""
      }${
        options?.batchSize ? `&batchSize=${encodeURIComponent(String(options.batchSize))}` : ""
      }`,
      {}
    ),

  kpiSummary: (params?: { fromUtc?: string; toUtc?: string; siteId?: number }) => {
    const qs = new URLSearchParams();
    if (params?.fromUtc) qs.set("fromUtc", params.fromUtc);
    if (params?.toUtc) qs.set("toUtc", params.toUtc);
    if (params?.siteId) qs.set("siteId", String(params.siteId));
    const query = qs.toString();
    return api.get<OrderKpiSummary>(`/orders/kpi-summary${query ? `?${query}` : ""}`);
  },

  kpiDiagnostics: (params?: {
    fromUtc?: string;
    toUtc?: string;
    siteId?: number;
    issueType?: "all" | "missingTimestamp" | "missingReasonCode" | "missingOwnership" | "invalidOrdering";
  }) => {
    const qs = new URLSearchParams();
    if (params?.fromUtc) qs.set("fromUtc", params.fromUtc);
    if (params?.toUtc) qs.set("toUtc", params.toUtc);
    if (params?.siteId) qs.set("siteId", String(params.siteId));
    if (params?.issueType && params.issueType !== "all") qs.set("issueType", params.issueType);
    const query = qs.toString();
    return api.get<OrderKpiDiagnostics>(`/orders/kpi-diagnostics${query ? `?${query}` : ""}`);
  },

  transportBoard: (params: TransportBoardParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.search) qs.set("search", params.search);
    if (params.movementType) qs.set("movementType", params.movementType);
    if (params.status) qs.set("status", params.status);
    if (params.siteId) qs.set("siteId", String(params.siteId));
    if (params.carrier) qs.set("carrier", params.carrier);
    const query = qs.toString();

    return api.get<PaginatedResponse<TransportBoardItem>>(
      `/orders/transport-board${query ? `?${query}` : ""}`
    );
  },

  saveTransportBoard: (updates: TransportBoardUpdate[]) =>
    api.put<TransportBoardItem[]>("/orders/transport-board", updates),

  receivingList: () => api.get<ReceivingOrderListItem[]>("/orders/receiving"),

  receivingDetail: (id: number) =>
    api.get<ReceivingOrderDetail>(`/orders/${id}/receiving`),

  completeReceiving: (id: number, data: CompleteReceivingRequest) =>
    api.post<ReceivingOrderDetail>(`/orders/${id}/receiving/complete`, data),

  productionList: () => api.get<ProductionOrderListItem[]>("/orders/production"),

  productionDetail: (id: number) => api.get<ProductionOrderDetail>(`/orders/${id}/production`),

  completeProduction: (id: number, data: CompleteProductionRequest) =>
    api.post<ProductionOrderDetail>(`/orders/${id}/production/complete`, data),

  attachments: (id: number) => api.get<OrderAttachment[]>(`/orders/${id}/attachments`),

  uploadAttachment: async (
    id: number,
    file: File,
    category = "Other",
    actingRole = "Office",
    actingEmpNo = "UI"
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    formData.append("actingRole", actingRole);
    formData.append("actingEmpNo", actingEmpNo);

    const res = await fetch(`/api/orders/${id}/attachments`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        /* empty */
      }
      throw new ApiError(res.status, res.statusText, body);
    }

    return (await res.json()) as OrderAttachment;
  },

  updateAttachmentCategory: (
    id: number,
    attachmentId: number,
    category: string,
    actingRole = "Office",
    actingEmpNo = "UI"
  ) =>
    api.patch<OrderAttachment>(`/orders/${id}/attachments/${attachmentId}`, {
      category,
      actingRole,
      actingEmpNo,
    }),

  deleteAttachment: (
    id: number,
    attachmentId: number,
    actingRole = "Office",
    actingEmpNo = "UI",
    reasonCode?: string
  ) =>
    api.deleteWithBody<void>(`/orders/${id}/attachments/${attachmentId}`, {
      actingRole,
      actingEmpNo,
      reasonCode: reasonCode ?? null,
    }),

  attachmentDownloadUrl: (
    id: number,
    attachmentId: number,
    actingRole = "Office",
    actingEmpNo = "UI"
  ) =>
    `/api/orders/${id}/attachments/${attachmentId}?actingRole=${encodeURIComponent(actingRole)}&actingEmpNo=${encodeURIComponent(actingEmpNo)}`,

  workCenterQueue: (workCenterId: number) =>
    api.get<WorkCenterQueueItem[]>(`/orders/workcenter/${workCenterId}/queue`),

  orderRouteExecution: (orderId: number) =>
    api.get<OrderRouteExecution>(`/orders/${orderId}/route-execution`),

  lineRouteExecution: (orderId: number, lineId: number) =>
    api.get<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/route-execution`),

  orderWorkCenterActivityLog: (orderId: number) =>
    api.get<OperatorActivityLogItem[]>(`/orders/${orderId}/workcenter/activity-log`),

  scanIn: (orderId: number, lineId: number, stepId: number, data: OperatorScanInRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/scan-in`, data),

  scanOut: (orderId: number, lineId: number, stepId: number, data: OperatorScanOutRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/scan-out`, data),

  addStepUsage: (orderId: number, lineId: number, stepId: number, data: StepMaterialUsageCreateRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/usage`, data),

  addStepScrap: (orderId: number, lineId: number, stepId: number, data: StepScrapEntryCreateRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/scrap`, data),

  addStepSerial: (orderId: number, lineId: number, stepId: number, data: StepSerialCaptureCreateRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/serials`, data),

  addStepChecklist: (orderId: number, lineId: number, stepId: number, data: StepChecklistResultCreateRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/checklist`, data),

  correctStepDuration: (orderId: number, lineId: number, stepId: number, data: CorrectStepDurationRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/duration-correction`, data),

  verifySerialLoad: (orderId: number, lineId: number, stepId: number, data: VerifySerialLoadRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/loading/verify-serials`, data),

  generatePackingSlip: (orderId: number, lineId: number, stepId: number, data: GenerateStepDocumentRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/loading/generate-packing-slip`, data),

  generateBol: (orderId: number, lineId: number, stepId: number, data: GenerateStepDocumentRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/loading/generate-bol`, data),

  completeStep: (orderId: number, lineId: number, stepId: number, data: CompleteWorkCenterStepRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/complete`, data),

  pendingSupervisorReview: () =>
    api.get<ProductionOrderListItem[]>("/orders/pending-supervisor-review"),

  pendingRouteReview: () =>
    api.get<ProductionOrderListItem[]>("/orders/pending-route-review"),

  supervisorApprove: (orderId: number, data: SupervisorDecisionRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/supervisor/approve`, data),

  supervisorReject: (orderId: number, data: SupervisorDecisionRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/supervisor/reject`, data),

  validateRoute: (orderId: number, data: SupervisorRouteReviewRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/route/validate`, data),

  adjustRoute: (orderId: number, data: SupervisorRouteReviewRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/route/adjust`, data),

  reopenRoute: (orderId: number, data: SupervisorRouteReviewRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/route/reopen`, data),

  reworkRequest: (orderId: number, lineId: number, stepId: number, data: ReworkRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/rework/request`, data),

  reworkApprove: (orderId: number, lineId: number, stepId: number, data: ReworkStateChangeRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/rework/approve`, data),

  reworkStart: (orderId: number, lineId: number, stepId: number, data: ReworkStateChangeRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/rework/start`, data),

  reworkSubmitVerification: (orderId: number, lineId: number, stepId: number, data: ReworkStateChangeRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/rework/submit-verification`, data),

  reworkClose: (orderId: number, lineId: number, stepId: number, data: ReworkStateChangeRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/rework/close`, data),

  reworkCancel: (orderId: number, lineId: number, stepId: number, data: ReworkStateChangeRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/rework/cancel`, data),

  reworkScrap: (orderId: number, lineId: number, stepId: number, data: ReworkStateChangeRequest) =>
    api.post<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/workcenter/${stepId}/rework/scrap`, data),
};

export const orderLinesApi = {
  create: (orderId: number, data: OrderLineCreate) =>
    api.post<OrderLine>(`/orders/${orderId}/lines`, data),

  update: (orderId: number, lineId: number, data: OrderLineUpdate) =>
    api.put<OrderLine>(`/orders/${orderId}/lines/${lineId}`, data),

  delete: (orderId: number, lineId: number) =>
    api.delete<void>(`/orders/${orderId}/lines/${lineId}`),
};

export const orderLookupsApi = {
  activeCustomers: () => api.get<Lookup[]>("/lookups/customers-active"),
  customerAddresses: (customerId: number, type?: "BILL_TO" | "SHIP_TO") => {
    const qs = type ? `?type=${encodeURIComponent(type)}` : "";
    return api.get<AddressLookup[]>(`/lookups/customers/${customerId}/addresses${qs}`);
  },
  items: () => api.get<OrderItemLookup[]>("/lookups/order-items"),
  sites: () => api.get<Lookup[]>("/lookups/sites"),
  paymentTerms: () => api.get<Lookup[]>("/lookups/payment-terms"),
  shipVias: () => api.get<Lookup[]>("/lookups/ship-vias"),
  salesPeople: () => api.get<SalesPersonLookup[]>("/lookups/sales-people"),
  colors: () => api.get<Lookup[]>("/lookups/colors"),
  scrapReasons: () => api.get<Lookup[]>("/lookups/scrap-reasons"),
  defaultItemPrice: (orderId: number, itemId: number) =>
    api.get<number | null>(
      `/orders/${orderId}/lines/default-price?itemId=${itemId}`
    ),
};
