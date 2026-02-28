import { api } from "./api";
import type {
  ItemListItem,
  ItemDetail,
  ItemCreate,
  ItemUpdate,
  PricingRecord,
  PricingCreate,
  CrossReference,
  CrossReferenceCreate,
  ItemSizeLookup,
} from "../types/item";
import type { PaginatedResponse } from "../types/customer";

export interface ItemListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  productLine?: string;
  itemType?: string;
}

export const itemsApi = {
  list: (params: ItemListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.search) qs.set("search", params.search);
    if (params.productLine) qs.set("productLine", params.productLine);
    if (params.itemType) qs.set("itemType", params.itemType);
    const query = qs.toString();
    return api.get<PaginatedResponse<ItemListItem>>(
      `/items${query ? `?${query}` : ""}`
    );
  },

  get: (id: number) => api.get<ItemDetail>(`/items/${id}`),

  create: (data: ItemCreate) => api.post<ItemDetail>("/items", data),

  update: (id: number, data: ItemUpdate) =>
    api.put<ItemDetail>(`/items/${id}`, data),

  delete: (id: number) => api.delete<void>(`/items/${id}`),
};

export const pricingsApi = {
  list: (itemId: number) =>
    api.get<PricingRecord[]>(`/items/${itemId}/pricings`),

  create: (itemId: number, data: PricingCreate) =>
    api.post<PricingRecord>(`/items/${itemId}/pricings`, data),

  update: (itemId: number, id: number, data: PricingCreate) =>
    api.put<PricingRecord>(`/items/${itemId}/pricings/${id}`, data),

  delete: (itemId: number, id: number) =>
    api.delete<void>(`/items/${itemId}/pricings/${id}`),
};

export const crossRefsApi = {
  list: (erpItemNumber?: string) => {
    const qs = erpItemNumber
      ? `?erpItemNumber=${encodeURIComponent(erpItemNumber)}`
      : "";
    return api.get<CrossReference[]>(`/cross-references${qs}`);
  },

  create: (data: CrossReferenceCreate) =>
    api.post<CrossReference>("/cross-references", data),

  update: (id: number, data: CrossReferenceCreate) =>
    api.put<CrossReference>(`/cross-references/${id}`, data),

  delete: (id: number) => api.delete<void>(`/cross-references/${id}`),
};

export const itemLookupsApi = {
  itemSizes: () => api.get<ItemSizeLookup[]>("/lookups/item-sizes"),
  itemTypes: () => api.get<string[]>("/lookups/item-types"),
  productLines: (showWhere?: "OrderComments" | "OrderProduct" | "OrderReceiving" | "JobMaterialUsed") =>
    api.get<string[]>(`/lookups/product-lines${showWhere ? `?showWhere=${encodeURIComponent(showWhere)}` : ""}`),
};
