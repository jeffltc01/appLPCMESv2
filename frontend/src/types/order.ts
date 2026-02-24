export interface OrderDraftListItem {
  id: number;
  salesOrderNo: string;
  orderDate: string;
  orderStatus: string;
  customerId: number;
  customerName: string;
  siteId: number;
  siteName: string;
  customerPoNo: string | null;
  contact: string | null;
  lineCount: number;
  totalOrderedQuantity: number;
}

export interface OrderLine {
  id: number;
  lineNo: number;
  itemId: number;
  itemNo: string;
  itemDescription: string;
  quantityAsOrdered: number;
  unitPrice: number | null;
  extension: number | null;
  notes: string | null;
  colorId: number | null;
  colorName: string | null;
  lidColorId: number | null;
  lidColorName: string | null;
  needCollars: boolean | null;
  needFillers: boolean | null;
  needFootRings: boolean | null;
  needDecals: boolean | null;
  valveType: string | null;
  gauges: string | null;
}

export interface OrderDraftDetail {
  id: number;
  salesOrderNo: string;
  orderDate: string;
  orderStatus: string;
  orderCreatedDate: string;
  readyForPickupDate: string | null;
  pickupScheduledDate: string | null;
  receivedDate: string | null;
  readyToShipDate: string | null;
  readyToInvoiceDate: string | null;
  customerId: number;
  customerName: string;
  siteId: number;
  siteName: string;
  customerPoNo: string | null;
  contact: string | null;
  phone: string | null;
  comments: string | null;
  priority: number | null;
  salesPersonId: number | null;
  salesPersonName: string | null;
  billToAddressId: number | null;
  pickUpAddressId: number | null;
  shipToAddressId: number | null;
  pickUpViaId: number | null;
  shipToViaId: number | null;
  paymentTermId: number | null;
  returnScrap: number | null;
  returnBrass: number | null;
  lines: OrderLine[];
}

export interface OrderDraftCreate {
  customerId: number;
  siteId: number;
  orderDate?: string | null;
  customerPoNo?: string | null;
  contact?: string | null;
  phone?: string | null;
  comments?: string | null;
  priority?: number | null;
  salesPersonId?: number | null;
  billToAddressId?: number | null;
  pickUpAddressId?: number | null;
  shipToAddressId?: number | null;
  pickUpViaId?: number | null;
  shipToViaId?: number | null;
  paymentTermId?: number | null;
  returnScrap?: number | null;
  returnBrass?: number | null;
}

export interface OrderDraftUpdate {
  customerId: number;
  siteId: number;
  orderDate: string;
  customerPoNo: string | null;
  contact: string | null;
  phone: string | null;
  comments: string | null;
  priority: number | null;
  salesPersonId: number | null;
  billToAddressId: number | null;
  pickUpAddressId: number | null;
  shipToAddressId: number | null;
  pickUpViaId: number | null;
  shipToViaId: number | null;
  paymentTermId: number | null;
  returnScrap: number | null;
  returnBrass: number | null;
}

export interface OrderLineCreate {
  itemId: number;
  quantityAsOrdered: number;
  unitPrice?: number | null;
  notes?: string | null;
  colorId?: number | null;
  lidColorId?: number | null;
  needCollars?: boolean | null;
  needFillers?: boolean | null;
  needFootRings?: boolean | null;
  needDecals?: boolean | null;
  valveType?: string | null;
  gauges?: string | null;
}

export interface OrderLineUpdate {
  itemId: number;
  quantityAsOrdered: number;
  unitPrice?: number | null;
  notes?: string | null;
  colorId?: number | null;
  lidColorId?: number | null;
  needCollars?: boolean | null;
  needFillers?: boolean | null;
  needFootRings?: boolean | null;
  needDecals?: boolean | null;
  valveType?: string | null;
  gauges?: string | null;
}

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  customerId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface TransportBoardParams {
  page?: number;
  pageSize?: number;
  search?: string;
  movementType?: "Pickup" | "Shipment";
  status?: string;
  siteId?: number;
  carrier?: string;
}

export interface TransportBoardItem {
  id: number;
  salesOrderNo: string;
  orderStatus: string;
  movementType: "Pickup" | "Shipment";
  orderDate: string;
  customerId: number;
  customerName: string;
  siteId: number;
  siteName: string;
  pickUpAddress: string | null;
  shipToAddress: string | null;
  pickUpAddressStreet: string | null;
  shipToAddressStreet: string | null;
  lineCount: number;
  totalOrderedQuantity: number;
  lineSummary: string;
  contact: string | null;
  phone: string | null;
  orderComments: string | null;
  trailerNo: string | null;
  carrier: string | null;
  dispatchDate: string | null;
  scheduledDate: string | null;
  transportationStatus: string | null;
  transportationNotes: string | null;
}

export interface TransportBoardUpdate {
  id: number;
  trailerNo: string | null;
  carrier: string | null;
  dispatchDate: string | null;
  scheduledDate: string | null;
  transportationStatus: string | null;
  transportationNotes: string | null;
}

export interface ReceivingOrderListItem {
  id: number;
  salesOrderNo: string;
  customerName: string;
  pickUpAddress: string | null;
  trailerNo: string | null;
  pickupScheduledDate: string | null;
  lineCount: number;
  totalOrderedQuantity: number;
}

export interface ReceivingOrderLine {
  id: number;
  lineNo: number;
  itemId: number;
  itemNo: string;
  itemDescription: string;
  quantityAsOrdered: number;
  quantityAsReceived: number;
  isReceived: boolean;
}

export interface ReceivingOrderDetail {
  id: number;
  salesOrderNo: string;
  orderStatus: string;
  customerName: string;
  pickUpAddress: string | null;
  trailerNo: string | null;
  receivedDate: string | null;
  lines: ReceivingOrderLine[];
}

export interface ReceivingLineUpdate {
  lineId: number;
  isReceived: boolean;
  quantityAsReceived: number;
}

export interface ReceivingAddLine {
  itemId: number;
  quantityAsReceived: number;
}

export interface CompleteReceivingRequest {
  receivedDate: string;
  lines: ReceivingLineUpdate[];
  addedLines: ReceivingAddLine[];
}

export interface AddressLookup {
  id: number;
  type: string;
  name: string;
}

export interface OrderItemLookup {
  id: number;
  itemNo: string;
  itemDescription: string | null;
}
