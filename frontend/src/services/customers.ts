import { api } from "./api";
import type {
  CustomerListItem,
  CustomerDetail,
  CustomerCreate,
  CustomerUpdate,
  Address,
  AddressCreate,
  Contact,
  ContactCreate,
  PaginatedResponse,
  Lookup,
  SalesPersonLookup,
} from "../types/customer";

export interface CustomerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export const customersApi = {
  list: (params: CustomerListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.search) qs.set("search", params.search);
    if (params.status !== undefined) qs.set("status", params.status);
    const query = qs.toString();
    return api.get<PaginatedResponse<CustomerListItem>>(
      `/customers${query ? `?${query}` : ""}`
    );
  },

  get: (id: number) => api.get<CustomerDetail>(`/customers/${id}`),

  create: (data: CustomerCreate) =>
    api.post<CustomerDetail>("/customers", data),

  update: (id: number, data: CustomerUpdate) =>
    api.put<CustomerDetail>(`/customers/${id}`, data),

  delete: (id: number) => api.delete<void>(`/customers/${id}`),
};

export const addressesApi = {
  list: (customerId: number, type?: string) => {
    const qs = type ? `?type=${encodeURIComponent(type)}` : "";
    return api.get<Address[]>(
      `/customers/${customerId}/addresses${qs}`
    );
  },

  create: (customerId: number, data: AddressCreate) =>
    api.post<Address>(`/customers/${customerId}/addresses`, data),

  update: (customerId: number, id: number, data: AddressCreate) =>
    api.put<Address>(`/customers/${customerId}/addresses/${id}`, data),

  delete: (customerId: number, id: number) =>
    api.delete<void>(`/customers/${customerId}/addresses/${id}`),
};

export const contactsApi = {
  list: (customerId: number) =>
    api.get<Contact[]>(`/customers/${customerId}/contacts`),

  create: (customerId: number, data: ContactCreate) =>
    api.post<Contact>(`/customers/${customerId}/contacts`, data),

  update: (customerId: number, id: number, data: ContactCreate) =>
    api.put<Contact>(`/customers/${customerId}/contacts/${id}`, data),

  delete: (customerId: number, id: number) =>
    api.delete<void>(`/customers/${customerId}/contacts/${id}`),
};

export const lookupsApi = {
  colors: () => api.get<Lookup[]>("/lookups/colors"),
  paymentTerms: () => api.get<Lookup[]>("/lookups/payment-terms"),
  shipVias: () => api.get<Lookup[]>("/lookups/ship-vias"),
  salesPeople: () => api.get<SalesPersonLookup[]>("/lookups/sales-people"),
  sites: () => api.get<Lookup[]>("/lookups/sites"),
};
