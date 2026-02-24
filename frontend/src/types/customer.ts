export interface CustomerListItem {
  id: number;
  name: string;
  customerCode: string | null;
  status: string | null;
  email: string | null;
  tankColor: string | null;
  lidColor: string | null;
  billToAddress: string | null;
  shipToAddress: string | null;
}

export interface CustomerDetail {
  id: number;
  name: string;
  customerCode: string | null;
  status: string | null;
  email: string | null;
  notes: string | null;
  customerParentId: number | null;
  customerParentName: string | null;
  defaultSalesEmployeeId: number | null;
  defaultSalesEmployeeName: string | null;
  tankColorId: number | null;
  tankColorName: string | null;
  lidColorId: number | null;
  lidColorName: string | null;
  defaultPaymentTermId: number | null;
  defaultPaymentTermName: string | null;
  defaultShipViaId: number | null;
  defaultShipViaName: string | null;
  defaultOrderContactId: number | null;
  defaultOrderContactName: string | null;
  defaultBillToId: number | null;
  defaultPickUpId: number | null;
  defaultShipToId: number | null;
  defaultNeedCollars: number | null;
  defaultNeedFillers: number | null;
  defaultNeedFootRings: number | null;
  defaultReturnScrap: number | null;
  defaultReturnBrass: number | null;
  defaultValveType: string | null;
  defaultGauges: string | null;
  addresses: Address[];
  contacts: Contact[];
}

export interface CustomerCreate {
  name: string;
  customerCode?: string | null;
  status?: string | null;
  email?: string | null;
}

export interface CustomerUpdate {
  name: string;
  customerCode: string | null;
  status: string | null;
  email: string | null;
  notes: string | null;
  customerParentId: number | null;
  defaultSalesEmployeeId: number | null;
  tankColorId: number | null;
  lidColorId: number | null;
  defaultPaymentTermId: number | null;
  defaultShipViaId: number | null;
  defaultOrderContactId: number | null;
  defaultBillToId: number | null;
  defaultPickUpId: number | null;
  defaultShipToId: number | null;
  defaultNeedCollars: number | null;
  defaultNeedFillers: number | null;
  defaultNeedFootRings: number | null;
  defaultReturnScrap: number | null;
  defaultReturnBrass: number | null;
  defaultValveType: string | null;
  defaultGauges: string | null;
}

export interface Address {
  id: number;
  type: string;
  addressName: string | null;
  address1: string;
  address2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  customerId: number;
  contactId: number | null;
  defaultSalesEmployeeId: number | null;
  isUsedOnOrders: boolean;
}

export interface AddressCreate {
  type: string;
  addressName?: string | null;
  address1: string;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  contactId?: number | null;
  defaultSalesEmployeeId?: number | null;
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string | null;
  officePhone: string | null;
  mobilePhone: string | null;
  notes: string | null;
  customerId: number;
}

export interface ContactCreate {
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  officePhone?: string | null;
  mobilePhone?: string | null;
  notes?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface Lookup {
  id: number;
  name: string;
}

export interface SalesPersonLookup {
  id: number;
  name: string;
  employeeNumber: string;
}
