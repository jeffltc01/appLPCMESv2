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
  WorkCenterQueueItem,
  OrderRouteExecution,
  OperatorScanInRequest,
  OperatorScanOutRequest,
  CompleteWorkCenterStepRequest,
  StepMaterialUsageCreateRequest,
  StepScrapEntryCreateRequest,
  StepSerialCaptureCreateRequest,
  StepChecklistResultCreateRequest,
  SupervisorRouteReviewRequest,
  SupervisorDecisionRequest,
  ReworkRequest,
  ReworkStateChangeRequest,
} from "../types/order";
import type {
  Lookup,
  PaginatedResponse,
  SalesPersonLookup,
} from "../types/customer";
import { ApiError } from "./api";

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

  advanceStatus: (id: number, targetStatus: string) =>
    api.post<OrderDraftDetail>(`/orders/${id}/advance-status`, { targetStatus }),

  submitInvoice: (id: number, data: SubmitInvoiceRequest) =>
    api.post<OrderDraftDetail>(`/orders/${id}/invoice/submit`, data),

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

  uploadAttachment: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

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

  deleteAttachment: (id: number, attachmentId: number) =>
    api.delete<void>(`/orders/${id}/attachments/${attachmentId}`),

  attachmentDownloadUrl: (id: number, attachmentId: number) =>
    `/api/orders/${id}/attachments/${attachmentId}`,

  workCenterQueue: (workCenterId: number) =>
    api.get<WorkCenterQueueItem[]>(`/orders/workcenter/${workCenterId}/queue`),

  orderRouteExecution: (orderId: number) =>
    api.get<OrderRouteExecution>(`/orders/${orderId}/route-execution`),

  lineRouteExecution: (orderId: number, lineId: number) =>
    api.get<OrderRouteExecution>(`/orders/${orderId}/lines/${lineId}/route-execution`),

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
