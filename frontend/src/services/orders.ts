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
} from "../types/order";
import type {
  Lookup,
  PaginatedResponse,
  SalesPersonLookup,
} from "../types/customer";

export const ordersApi = {
  list: (params: OrderListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.search) qs.set("search", params.search);
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
  defaultItemPrice: (orderId: number, itemId: number) =>
    api.get<number | null>(
      `/orders/${orderId}/lines/default-price?itemId=${itemId}`
    ),
};
