export type OrderWorkflowStatus =
  | "New"
  | "Ready for Pickup"
  | "Pickup Scheduled"
  | "Received"
  | "Ready to Ship"
  | "Ready to Invoice"
  | "Draft"
  | "PendingOrderEntryValidation"
  | "InboundLogisticsPlanned"
  | "InboundInTransit"
  | "ReceivedPendingReconciliation"
  | "ReadyForProduction"
  | "InProduction"
  | "ProductionCompletePendingApproval"
  | "ProductionComplete"
  | "OutboundLogisticsPlanned"
  | "DispatchedOrPickupReleased"
  | "InvoiceReady"
  | "Invoiced";

export type OrderWorkspaceRole =
  | "Office"
  | "Transportation"
  | "Receiving"
  | "Production"
  | "Supervisor"
  | "Quality"
  | "Admin"
  | "PlantManager";

export type HoldOverlayType =
  | "OnHoldCustomer"
  | "OnHoldQuality"
  | "OnHoldLogistics"
  | "ExceptionQuantityMismatch"
  | "ExceptionDocumentation"
  | "ExceptionErpReconcile"
  | "Cancelled"
  | "ReworkOpen";

export type OrderWorkspaceAction =
  | "advanceInboundPlan"
  | "advanceInboundTransit"
  | "markReceived"
  | "markReadyForProduction"
  | "startProduction"
  | "markProductionComplete"
  | "planOutbound"
  | "markDispatchedOrReleased"
  | "openInvoiceWizard"
  | "markInvoiced"
  | "applyHold"
  | "uploadAttachment";

export interface OrderStatusMetadata {
  key: OrderWorkflowStatus;
  displayLabel: string;
  actorHint: string;
}

export const ORDER_WORKFLOW_STATUS_ORDER: OrderWorkflowStatus[] = [
  "New",
  "Ready for Pickup",
  "Pickup Scheduled",
  "Received",
  "Ready to Ship",
  "Ready to Invoice",
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

export const ORDER_STATUS_KEYS = {
  NEW: "New" as OrderWorkflowStatus,
  READY_FOR_PICKUP: "Ready for Pickup" as OrderWorkflowStatus,
  PICKUP_SCHEDULED: "Pickup Scheduled" as OrderWorkflowStatus,
  RECEIVED: "Received" as OrderWorkflowStatus,
  READY_TO_SHIP: "Ready to Ship" as OrderWorkflowStatus,
  READY_TO_INVOICE: "Ready to Invoice" as OrderWorkflowStatus,
  DRAFT: "Draft" as OrderWorkflowStatus,
  PENDING_ORDER_ENTRY_VALIDATION: "PendingOrderEntryValidation" as OrderWorkflowStatus,
  INBOUND_LOGISTICS_PLANNED: "InboundLogisticsPlanned" as OrderWorkflowStatus,
  INBOUND_IN_TRANSIT: "InboundInTransit" as OrderWorkflowStatus,
  RECEIVED_PENDING_RECONCILIATION: "ReceivedPendingReconciliation" as OrderWorkflowStatus,
  READY_FOR_PRODUCTION: "ReadyForProduction" as OrderWorkflowStatus,
  IN_PRODUCTION: "InProduction" as OrderWorkflowStatus,
  PRODUCTION_COMPLETE_PENDING_APPROVAL: "ProductionCompletePendingApproval" as OrderWorkflowStatus,
  PRODUCTION_COMPLETE: "ProductionComplete" as OrderWorkflowStatus,
  OUTBOUND_LOGISTICS_PLANNED: "OutboundLogisticsPlanned" as OrderWorkflowStatus,
  DISPATCHED_OR_PICKUP_RELEASED: "DispatchedOrPickupReleased" as OrderWorkflowStatus,
  INVOICE_READY: "InvoiceReady" as OrderWorkflowStatus,
  INVOICED: "Invoiced" as OrderWorkflowStatus,
};

export const ORDER_STATUS_METADATA: Record<OrderWorkflowStatus, OrderStatusMetadata> = {
  New: {
    key: "New",
    displayLabel: "Needs Order Info",
    actorHint: "Office: gather missing order details.",
  },
  "Ready for Pickup": {
    key: "Ready for Pickup",
    displayLabel: "Awaiting Pickup Scheduling",
    actorHint: "Transportation: schedule trailer pickup.",
  },
  "Pickup Scheduled": {
    key: "Pickup Scheduled",
    displayLabel: "Pickup Scheduled / Awaiting Arrival",
    actorHint: "Receiving: wait for tanks to arrive.",
  },
  Received: {
    key: "Received",
    displayLabel: "At Plant / Ready for Production",
    actorHint: "Production: schedule and complete refurbishment.",
  },
  "Ready to Ship": {
    key: "Ready to Ship",
    displayLabel: "Awaiting Delivery Scheduling",
    actorHint: "Transportation: schedule outbound delivery.",
  },
  "Ready to Invoice": {
    key: "Ready to Invoice",
    displayLabel: "Ready for Invoicing",
    actorHint: "Office: produce invoice and close order.",
  },
  Draft: {
    key: "Draft",
    displayLabel: "Draft",
    actorHint: "Office: complete order setup.",
  },
  PendingOrderEntryValidation: {
    key: "PendingOrderEntryValidation",
    displayLabel: "Pending Order Entry Validation",
    actorHint: "Office: validate sales-mobile intake.",
  },
  InboundLogisticsPlanned: {
    key: "InboundLogisticsPlanned",
    displayLabel: "Inbound Planned",
    actorHint: "Transportation: plan inbound movement.",
  },
  InboundInTransit: {
    key: "InboundInTransit",
    displayLabel: "Inbound In Transit",
    actorHint: "Transportation: inbound movement active.",
  },
  ReceivedPendingReconciliation: {
    key: "ReceivedPendingReconciliation",
    displayLabel: "Received Pending Reconciliation",
    actorHint: "Receiving: reconcile received assets.",
  },
  ReadyForProduction: {
    key: "ReadyForProduction",
    displayLabel: "Ready for Production",
    actorHint: "Production: begin route execution.",
  },
  InProduction: {
    key: "InProduction",
    displayLabel: "In Production",
    actorHint: "Operator: execute work-center steps.",
  },
  ProductionCompletePendingApproval: {
    key: "ProductionCompletePendingApproval",
    displayLabel: "Production Complete Pending Approval",
    actorHint: "Supervisor: approve completion gate.",
  },
  ProductionComplete: {
    key: "ProductionComplete",
    displayLabel: "Production Complete",
    actorHint: "Transportation: prepare outbound release.",
  },
  OutboundLogisticsPlanned: {
    key: "OutboundLogisticsPlanned",
    displayLabel: "Outbound Planned",
    actorHint: "Transportation: schedule delivery or pickup.",
  },
  DispatchedOrPickupReleased: {
    key: "DispatchedOrPickupReleased",
    displayLabel: "Dispatched / Pickup Released",
    actorHint: "Shipping: release event captured.",
  },
  InvoiceReady: {
    key: "InvoiceReady",
    displayLabel: "Invoice Ready",
    actorHint: "Office: complete invoice submit workflow.",
  },
  Invoiced: {
    key: "Invoiced",
    displayLabel: "Invoiced",
    actorHint: "Accounting: invoice posted to ERP staging.",
  },
};

export function isOrderWorkflowStatus(value: string): value is OrderWorkflowStatus {
  return ORDER_WORKFLOW_STATUS_ORDER.includes(value as OrderWorkflowStatus);
}

export function getOrderStatusDisplayLabel(status: string): string {
  if (!isOrderWorkflowStatus(status)) {
    return status;
  }

  return ORDER_STATUS_METADATA[status].displayLabel;
}

export function getOrderStatusActorHint(status: string): string | null {
  if (!isOrderWorkflowStatus(status)) {
    return null;
  }

  return ORDER_STATUS_METADATA[status].actorHint;
}

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
  orderLifecycleStatus?: string | null;
  orderOrigin?: string | null;
  inboundMode?: string | null;
  outboundMode?: string | null;
  statusUpdatedUtc?: string | null;
  holdOverlay?: HoldOverlayType | null;
  statusOwnerRole?: string | null;
  statusReasonCode?: string | null;
  statusNote?: string | null;
  validatedByEmpNo?: string | null;
  validatedUtc?: string | null;
  deliveryEvidenceStatus?: string | null;
  deliveryEvidenceReceivedUtc?: string | null;
  customerReadyRetryUtc?: string | null;
  customerReadyLastContactUtc?: string | null;
  customerReadyContactName?: string | null;
  attachmentCount?: number;
  hasInvoiceRelevantAttachments?: boolean;
  isInboundComplete?: boolean;
  isProductionComplete?: boolean;
  isProductionCompleteForShipment?: boolean;
  isInvoiceComplete?: boolean;
  isReworkOpen?: boolean;
  hasOpenRework?: boolean;
  reworkBlockingInvoice?: boolean;
  invoiceReviewCompletedByEmpNo?: string | null;
  invoiceReviewCompletedUtc?: string | null;
  attachmentEmailPrompted?: boolean;
  attachmentEmailSent?: boolean;
  attachmentEmailSentUtc?: string | null;
  attachmentEmailRecipientSummary?: string | null;
  invoiceSubmissionRequestedByEmpNo?: string | null;
  invoiceSubmissionRequestedUtc?: string | null;
  invoiceSubmissionChannel?: string | null;
  invoiceSubmissionCorrelationId?: string | null;
  invoiceStagingResult?: string | null;
  invoiceStagingError?: string | null;
  erpInvoiceReference?: string | null;
  requestedDateUtc?: string | null;
  promisedDateUtc?: string | null;
  currentCommittedDateUtc?: string | null;
  promiseDateLastChangedUtc?: string | null;
  promiseDateLastChangedByEmpNo?: string | null;
  promiseRevisionCount?: number;
  promiseMissReasonCode?: string | null;
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
  orderLifecycleStatus?: string | null;
  orderOrigin?: string | null;
  inboundMode?: string | null;
  outboundMode?: string | null;
  statusUpdatedUtc?: string | null;
  holdOverlay?: HoldOverlayType | null;
  statusOwnerRole?: string | null;
  statusReasonCode?: string | null;
  statusNote?: string | null;
  validatedByEmpNo?: string | null;
  validatedUtc?: string | null;
  deliveryEvidenceStatus?: string | null;
  deliveryEvidenceReceivedUtc?: string | null;
  customerReadyRetryUtc?: string | null;
  customerReadyLastContactUtc?: string | null;
  customerReadyContactName?: string | null;
  attachmentCount?: number;
  hasInvoiceRelevantAttachments?: boolean;
  isInboundComplete?: boolean;
  isProductionComplete?: boolean;
  isProductionCompleteForShipment?: boolean;
  isInvoiceComplete?: boolean;
  isReworkOpen?: boolean;
  requestedDateUtc?: string | null;
  promisedDateUtc?: string | null;
  currentCommittedDateUtc?: string | null;
  promiseRevisionCount?: number;
  promiseDateLastChangedUtc?: string | null;
  promiseDateLastChangedByEmpNo?: string | null;
  promiseMissReasonCode?: string | null;
  hasOpenRework?: boolean;
  reworkBlockingInvoice?: boolean;
  invoiceReviewCompletedByEmpNo?: string | null;
  invoiceReviewCompletedUtc?: string | null;
  attachmentEmailPrompted?: boolean;
  attachmentEmailSent?: boolean;
  attachmentEmailSentUtc?: string | null;
  attachmentEmailRecipientSummary?: string | null;
  invoiceSubmissionRequestedByEmpNo?: string | null;
  invoiceSubmissionRequestedUtc?: string | null;
  invoiceSubmissionChannel?: string | null;
  invoiceSubmissionCorrelationId?: string | null;
  invoiceStagingResult?: string | null;
  invoiceStagingError?: string | null;
  erpInvoiceReference?: string | null;
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
  status?: string;
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
  orderLifecycleStatus?: string | null;
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
  isInboundComplete?: boolean;
  isProductionComplete?: boolean;
  isProductionCompleteForShipment?: boolean;
  isInvoiceComplete?: boolean;
  isReworkOpen?: boolean;
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
  ipadOrderNo: string | null;
  customerName: string;
  siteName: string;
  receivingMode: "Trailer Pickup" | "Customer Drop Off";
  priority: number | null;
  pickUpAddress: string | null;
  pickUpCity: string | null;
  pickUpState: string | null;
  pickUpPostalCode: string | null;
  pickUpCountry: string | null;
  itemsOrderedSummary: string;
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
  orderComments: string | null;
  receivedDate: string | null;
  lines: ReceivingOrderLine[];
}

export interface ProductionOrderListItem {
  id: number;
  salesOrderNo: string;
  customerName: string;
  siteName: string;
  priority: number | null;
  itemsOrderedSummary: string;
  receivedDate: string | null;
  lineCount: number;
  totalOrderedQuantity: number;
}

export interface ProductionOrderDetail {
  id: number;
  salesOrderNo: string;
  orderStatus: string;
  customerName: string;
  pickUpAddress: string | null;
  trailerNo: string | null;
  orderComments: string | null;
  receivedDate: string | null;
  lines: ProductionOrderLine[];
}

export interface ProductionSerialNumber {
  id: number;
  serialNo: string;
  manufacturer: string | null;
  manufacturingDate: string | null;
  testDate: string | null;
  scrapReasonId: number | null;
  testStatus: string;
  lidColor: string | null;
  lidSize: string | null;
}

export interface ProductionOrderLine {
  id: number;
  lineNo: number;
  itemId: number;
  itemNo: string;
  itemDescription: string;
  quantityAsOrdered: number;
  quantityAsReceived: number;
  quantityAsShipped: number;
  quantityAsScrapped: number;
  requiresSerialNumbers: boolean;
  serialNumbers: ProductionSerialNumber[];
}

export interface ProductionSerialNumberUpsert {
  id?: number | null;
  serialNo: string;
  manufacturer?: string | null;
  manufacturingDate?: string | null;
  testDate?: string | null;
  scrapReasonId?: number | null;
  lidColor?: string | null;
  lidSize?: string | null;
}

export interface ProductionLineUpdate {
  lineId: number;
  quantityAsShipped: number;
  quantityAsScrapped: number;
  serialNumbers?: ProductionSerialNumberUpsert[] | null;
}

export interface CompleteProductionRequest {
  lines: ProductionLineUpdate[];
}

export interface OrderAttachment {
  id: number;
  orderId: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedUtc: string;
  uploadedByEmpNo: string | null;
  category: string;
  isInvoiceRelevant: boolean;
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

export interface SubmitInvoiceRequest {
  finalReviewConfirmed: boolean;
  reviewPaperworkConfirmed: boolean;
  reviewPricingConfirmed: boolean;
  reviewBillingConfirmed: boolean;
  sendAttachmentEmail: boolean;
  selectedAttachmentIds?: number[] | null;
  attachmentRecipientSummary?: string | null;
  attachmentSkipReason?: string | null;
  correlationId?: string | null;
  submittedByEmpNo?: string | null;
  reviewCompletedByEmpNo?: string | null;
}

export interface ApplyHoldRequest {
  holdOverlay: HoldOverlayType;
  actingRole: string;
  appliedByEmpNo: string;
  reasonCode: string;
  note?: string | null;
  customerReadyRetryUtc?: string | null;
  customerReadyLastContactUtc?: string | null;
  customerReadyContactName?: string | null;
}

export interface ClearHoldRequest {
  actingRole: string;
  clearedByEmpNo: string;
  note?: string | null;
}

export interface UpsertPromiseCommitmentRequest {
  requestedDateUtc?: string | null;
  newCommittedDateUtc: string;
  actingRole: string;
  changedByEmpNo: string;
  promiseChangeReasonCode?: string | null;
  promiseChangeReasonNote?: string | null;
  customerNotificationStatus?: "Notified" | "DeferredNotification" | "InternalOnly" | null;
  customerNotificationChannel?: string | null;
  customerNotificationUtc?: string | null;
  customerNotificationByEmpNo?: string | null;
}

export interface ClassifyPromiseMissRequest {
  missReasonCode: string;
  actingRole: string;
  changedByEmpNo: string;
  note?: string | null;
  customerNotificationStatus?: "Notified" | "DeferredNotification" | "InternalOnly" | null;
  customerNotificationChannel?: string | null;
  customerNotificationUtc?: string | null;
  customerNotificationByEmpNo?: string | null;
}

export interface RecordPromiseNotificationRequest {
  promiseChangeReasonCode: string;
  actingRole: string;
  changedByEmpNo: string;
  customerNotificationStatus: "Notified" | "DeferredNotification" | "InternalOnly";
  customerNotificationChannel?: string | null;
  customerNotificationUtc?: string | null;
  customerNotificationByEmpNo?: string | null;
  note?: string | null;
}

export interface OrderPromiseChangeEvent {
  promiseChangeEventId: number;
  orderId: number;
  eventType: string;
  oldCommittedDate?: string | null;
  newCommittedDate?: string | null;
  promiseChangeReasonCode?: string | null;
  promiseChangeReasonNote?: string | null;
  changedByEmpNo?: string | null;
  changedUtc: string;
  customerNotificationStatus?: string | null;
  customerNotificationChannel?: string | null;
  customerNotificationUtc?: string | null;
  customerNotificationByEmpNo?: string | null;
  missReasonCode?: string | null;
}

export interface OrderLifecycleMigrationResult {
  totalOrdersScanned: number;
  ordersAlreadyInitialized: number;
  ordersUpdated: number;
  dryRun: boolean;
  migrationBatchId?: string;
  candidateOrders?: number;
  auditRecordsWritten?: number;
  sampleDeltas?: OrderLifecycleMigrationDelta[];
}

export interface OrderLifecycleMigrationDelta {
  orderId: number;
  legacyStatus: string;
  previousLifecycleStatus?: string | null;
  proposedLifecycleStatus: string;
  ruleApplied: string;
}

export interface KpiLeadTimeMetric {
  metricKey: string;
  label: string;
  pairCount: number;
  avgHours?: number | null;
  p50Hours?: number | null;
  p90Hours?: number | null;
}

export interface HoldDurationMetric {
  closedCount: number;
  activeCount: number;
  averageClosedHours?: number | null;
  averageActiveAgeHours?: number | null;
}

export interface KpiGroupedCount {
  groupKey: string;
  count: number;
}

export interface PromiseReliabilityMetric {
  eligibleCount: number;
  onTimeCount: number;
  onTimeRatePercent?: number | null;
  averageSlipDaysForLateOrders?: number | null;
  lateOrderCount: number;
  slippedWithNotificationPercent?: number | null;
  revisionFrequencyBySite: KpiGroupedCount[];
  revisionFrequencyByCustomer: KpiGroupedCount[];
  revisionFrequencyByReason: KpiGroupedCount[];
}

export interface KpiDataQuality {
  missingTimestampCount: number;
  missingReasonCodeCount: number;
  missingOwnershipCount: number;
  invalidOrderingCount: number;
  sampleOrderIds: number[];
}

export interface OrderKpiSummary {
  generatedUtc: string;
  totalOrdersEvaluated: number;
  leadTimeMetrics: KpiLeadTimeMetric[];
  holdDuration: HoldDurationMetric;
  promiseReliability: PromiseReliabilityMetric;
  dataQuality: KpiDataQuality;
}

export interface OrderKpiDiagnosticsItem {
  orderId: number;
  salesOrderNo: string;
  siteId: number;
  customerId: number;
  lifecycleStatus: string;
  missingTimestampCount: number;
  missingReasonCodeCount: number;
  missingOwnershipCount: number;
  invalidOrderingCount: number;
}

export interface OrderKpiDiagnostics {
  generatedUtc: string;
  totalAffectedOrders: number;
  items: OrderKpiDiagnosticsItem[];
}

export interface WorkCenterQueueItem {
  stepInstanceId: number;
  orderId: number;
  lineId: number;
  salesOrderNo: string;
  stepCode: string;
  stepName: string;
  stepSequence: number;
  stepState: string;
  scanInUtc: string | null;
}

export interface RouteStepExecution {
  stepInstanceId: number;
  stepSequence: number;
  stepCode: string;
  stepName: string;
  state: string;
  scanInUtc: string | null;
  scanOutUtc: string | null;
  completedUtc: string | null;
}

export interface LineRouteExecution {
  routeInstanceId: number;
  lineId: number;
  state: string;
  steps: RouteStepExecution[];
}

export interface OrderRouteExecution {
  orderId: number;
  lifecycleStatus: string | null;
  hasOpenRework: boolean;
  routes: LineRouteExecution[];
}

export interface OperatorScanInRequest {
  empNo: string;
  deviceId?: string | null;
}

export interface OperatorScanOutRequest {
  empNo: string;
  deviceId?: string | null;
}

export interface CompleteWorkCenterStepRequest {
  empNo: string;
  notes?: string | null;
}

export interface StepMaterialUsageCreateRequest {
  partItemId: number;
  quantityUsed: number;
  uom?: string | null;
  recordedByEmpNo: string;
}

export interface StepScrapEntryCreateRequest {
  quantityScrapped: number;
  scrapReasonId: number;
  notes?: string | null;
  recordedByEmpNo: string;
}

export interface StepSerialCaptureCreateRequest {
  serialNo: string;
  manufacturer: string;
  manufactureDate?: string | null;
  testDate?: string | null;
  lidColorId?: number | null;
  lidSizeId?: number | null;
  conditionStatus: string;
  scrapReasonId?: number | null;
  recordedByEmpNo: string;
}

export interface StepChecklistResultCreateRequest {
  checklistTemplateItemId: number;
  itemLabel: string;
  isRequiredItem: boolean;
  resultStatus: string;
  resultNotes?: string | null;
  completedByEmpNo: string;
}

export interface SupervisorRouteReviewRequest {
  isAdjusted: boolean;
  notes?: string | null;
  reviewerEmpNo: string;
}

export interface SupervisorDecisionRequest {
  empNo: string;
  notes?: string | null;
}

export interface ReworkRequest {
  requestedByEmpNo: string;
  reasonCode: string;
  notes?: string | null;
}

export interface ReworkStateChangeRequest {
  empNo: string;
  notes?: string | null;
}
