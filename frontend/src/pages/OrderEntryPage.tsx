import {
  Badge,
  Body1,
  Button,
  Card,
  Checkbox,
  Combobox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Option,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Textarea,
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Add20Regular,
  ArrowLeft24Regular,
  CheckmarkCircle20Filled,
  Delete20Regular,
  Pen20Regular,
  Play24Regular,
} from "@fluentui/react-icons";
import { LifecycleNavigator } from "../components/orders/LifecycleNavigator";
import { OrderLineDialog } from "../components/orders/OrderLineDialog";
import { AttachmentManager } from "../components/orders/AttachmentManager";
import { HelpEntryPoint } from "../components/help/HelpEntryPoint";
import { orderLinesApi, orderLookupsApi, ordersApi } from "../services/orders";
import { orderPoliciesApi } from "../services/orderPolicies";
import { getWorkspaceCurrentStatus } from "../services/orders";
import { ApiError } from "../services/api";
import type {
  AddressLookup,
  ApplyHoldRequest,
  ClearHoldRequest,
  HoldOverlayType,
  OrderAttachment,
  OrderDraftDetail,
  OrderLine,
  OrderWorkflowStatus,
} from "../types/order";
import type { Lookup, SalesPersonLookup } from "../types/customer";
import type { StatusReasonCode as PolicyStatusReasonCode } from "../types/policy";

const ACTING_ROLE = "Office";
const ACTING_EMP_NO = "EMP001";
const ATTACHMENT_CATEGORIES = [
  "TestResult",
  "SerialReport",
  "PackingSlip",
  "BillOfLading",
  "CustomerDocument",
  "Other",
];
const INVOICE_MUTABLE_LINE_STATUSES = new Set<OrderWorkflowStatus>([
  "Ready to Invoice",
  "DispatchedOrPickupReleased",
  "InvoiceReady",
]);

interface OrderEntryPageProps {
  invoiceMode?: boolean;
}

function extractApiMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) {
    return null;
  }

  const body = error.body as { message?: string } | undefined;
  if (body?.message) {
    return body.message;
  }
  return `${error.status} ${error.statusText}`;
}

function generateCorrelationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `invoice-${Date.now()}`;
}

interface OrderFormState {
  customerId: number | null;
  siteId: number | null;
  inboundMode: string | null;
  outboundMode: string | null;
  orderDate: string;
  customerPoNo: string;
  contact: string;
  phone: string;
  comments: string;
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

function getCurrentLocalDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDefaultFormState(): OrderFormState {
  return {
    customerId: null,
    siteId: null,
    inboundMode: "LpcArrangedPickup",
    outboundMode: "LpcArrangedDelivery",
    orderDate: getCurrentLocalDateInputValue(),
    customerPoNo: "",
    contact: "",
    phone: "",
    comments: "",
    priority: null,
    salesPersonId: null,
    billToAddressId: null,
    pickUpAddressId: null,
    shipToAddressId: null,
    pickUpViaId: null,
    shipToViaId: null,
    paymentTermId: null,
    returnScrap: null,
    returnBrass: null,
  };
}

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  main: {
    display: "grid",
    gridTemplateRows: "44px 56px minmax(0, 1fr) 52px",
    minWidth: 0,
  },
  utilityBar: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: "0 24px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e8e8e8",
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
  },
  headerBar: {
    backgroundColor: "#123046",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  headerTitle: {
    color: "#ffffff",
  },
  headerActions: {
    display: "flex",
    gap: "8px",
  },
  content: {
    padding: "16px 20px",
    overflow: "auto",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 290px",
    gap: "16px",
    alignItems: "start",
  },
  leftColumn: {
    display: "grid",
    gap: "12px",
  },
  rightColumn: {
    display: "grid",
    gap: "12px",
  },
  card: {
    border: "1px solid #d8d8d8",
    borderRadius: "4px",
    padding: "12px",
    backgroundColor: "#ffffff",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#123046",
    marginBottom: "10px",
  },
  orderHeaderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "8px 12px",
  },
  sectionDivider: {
    gridColumn: "1 / -1",
    marginTop: "6px",
    paddingTop: "8px",
    borderTop: "1px solid #e8e8e8",
    fontSize: "12px",
    fontWeight: 700,
    color: "#123046",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  fullRow: {
    gridColumn: "1 / -1",
  },
  orderNoInput: {
    backgroundColor: "#f5f5f5",
  },
  formControl: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  customerLabelRow: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
  },
  customerLabelText: {
    minWidth: 0,
  },
  customerLabelAction: {
    marginLeft: "auto",
    flexShrink: 0,
  },
  priorityGroup: {
    display: "grid",
    gap: "6px",
  },
  priorityButtons: {
    display: "flex",
    gap: "8px",
  },
  linesToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  lineTable: {
    border: "1px solid #e8e8e8",
    borderRadius: "4px",
    overflow: "hidden",
  },
  tableHeader: {
    backgroundColor: "#123046",
    color: "#ffffff",
  },
  rowActions: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  iconButton: {
    minWidth: "28px",
    minHeight: "28px",
  },
  dropZone: {
    border: "1px dashed #c7c7c7",
    borderRadius: "4px",
    backgroundColor: "#fafafa",
    minHeight: "44px",
    display: "grid",
    placeItems: "center",
    color: tokens.colorNeutralForeground2,
    fontSize: "13px",
    marginBottom: "8px",
  },
  summaryList: {
    display: "grid",
    gap: "8px",
    fontSize: "14px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
  },
  summaryTotal: {
    fontWeight: 700,
    borderTop: "1px solid #e8e8e8",
    paddingTop: "8px",
    marginTop: "2px",
  },
  checklistBanner: {
    border: "1px solid #d8d8d8",
    borderRadius: "4px",
    backgroundColor: "#ffffff",
    padding: "10px 12px",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  checklistTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#123046",
    marginRight: "4px",
  },
  checklistInlineItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: tokens.colorNeutralForeground2,
  },
  errorBanner: {
    border: "1px solid #e8b3b3",
    borderRadius: "4px",
    backgroundColor: "#fff5f5",
    padding: "10px 12px",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  errorTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#8a2f2f",
    marginRight: "4px",
  },
  errorMessage: {
    fontSize: "13px",
    color: "#8a2f2f",
  },
  lifecycleHero: {
    borderRadius: "10px",
    padding: "12px",
    background:
      "linear-gradient(132deg, rgba(18,48,70,1) 0%, rgba(43,59,132,1) 60%, rgba(1,124,197,1) 100%)",
    color: "#ffffff",
    display: "grid",
    gap: "8px",
    marginBottom: "10px",
  },
  lifecycleMeta: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    opacity: 0.85,
  },
  lifecycleCurrent: {
    fontSize: "20px",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  lifecycleProgressTrack: {
    height: "8px",
    borderRadius: "999px",
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  lifecycleProgressFill: {
    height: "100%",
    borderRadius: "999px",
    backgroundColor: "#ffffff",
  },
  lifecycleSummary: {
    fontSize: "12px",
    opacity: 0.9,
  },
  lifecycleList: {
    display: "grid",
    gap: "6px",
    marginBottom: "10px",
  },
  lifecycleItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #e8e8e8",
    fontSize: "12px",
  },
  lifecycleItemLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
  },
  currentStageIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid #4f95cc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    flexShrink: 0,
  },
  currentStageIconDot: {
    width: "3px",
    height: "3px",
    borderRadius: "50%",
    backgroundColor: "#4f95cc",
  },
  completedStageIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    borderTop: "2px solid #9fbe76",
    borderRight: "2px solid #9fbe76",
    borderBottom: "2px solid #9fbe76",
    borderLeft: "2px solid #9fbe76",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#7ea453",
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1,
  },
  nextStageIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    borderTop: "2px solid #4f95cc",
    borderRight: "2px solid #4f95cc",
    borderBottom: "2px solid #4f95cc",
    borderLeft: "2px solid #4f95cc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#017CC5",
  },
  queuedStageIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    borderTop: "2px solid #9aa6b2",
    borderRight: "2px solid #9aa6b2",
    borderBottom: "2px solid #9aa6b2",
    borderLeft: "2px solid #9aa6b2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#6E6E6E",
  },
  lifecycleItemCurrent: {
    backgroundColor: "#dff6dd",
    border: "1px solid #80c782",
    color: "#155724",
  },
  lifecycleItemDone: {
    backgroundColor: "#f8fffa",
    border: "1px solid #cde7cf",
  },
  lifecycleItemNext: {
    border: "1px solid #017CC5",
    backgroundColor: "#e8f4ff",
    boxShadow: "0 0 0 2px rgba(1,124,197,0.15)",
    cursor: "pointer",
    color: "#0c4f78",
  },
  lifecycleItemBlocked: {
    border: "1px solid #d9b0b0",
    backgroundColor: "#fff5f5",
    boxShadow: "none",
    cursor: "not-allowed",
    color: "#8a4d4d",
    transition: "box-shadow 180ms ease, background-color 180ms ease",
    ":hover": {
      backgroundColor: "#ffecec",
      boxShadow: "0 0 0 2px rgba(200, 91, 91, 0.18)",
    },
    ":focus-within": {
      backgroundColor: "#ffecec",
      boxShadow: "0 0 0 2px rgba(200, 91, 91, 0.22)",
    },
  },
  lifecycleItemQueued: {
    backgroundColor: "#f4f6fb",
    border: "1px solid #d6ddeb",
    color: "#4f5f78",
  },
  lifecycleInstruction: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#017CC5",
    marginBottom: "8px",
    fontWeight: 600,
  },
  blockedBadge: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    borderTop: "2px solid #c85b5b",
    borderRight: "2px solid #c85b5b",
    borderBottom: "2px solid #c85b5b",
    borderLeft: "2px solid #c85b5b",
    position: "relative",
    flexShrink: 0,
    transition: "transform 180ms ease, box-shadow 180ms ease",
    ":hover": {
      transform: "scale(1.06)",
      boxShadow: "0 0 0 2px rgba(200, 91, 91, 0.14)",
    },
    ":focus-visible": {
      transform: "scale(1.06)",
      boxShadow: "0 0 0 2px rgba(200, 91, 91, 0.2)",
    },
  },
  blockedSlash: {
    position: "absolute",
    width: "12px",
    height: "2px",
    backgroundColor: "#c85b5b",
    top: "8px",
    left: "2px",
    transform: "rotate(-35deg)",
  },
  footerBar: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "8px",
    padding: "0 20px",
    backgroundColor: "#123046",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  footerAction: {
    minHeight: "34px",
  },
});

export function OrderEntryPage({ invoiceMode = false }: OrderEntryPageProps) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const styles = useStyles();
  const [order, setOrder] = useState<OrderDraftDetail | null>(null);
  const [form, setForm] = useState<OrderFormState>(createDefaultFormState);
  const [currentStatus, setCurrentStatus] = useState<OrderWorkflowStatus>("Draft");
  const [holdOverlay, setHoldOverlay] = useState<HoldOverlayType | null>(null);
  const [statusReasonCode, setStatusReasonCode] = useState<string | null>(null);
  const [statusOwnerRole, setStatusOwnerRole] = useState<string | null>("Office");
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Lookup[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [sites, setSites] = useState<Lookup[]>([]);
  const [salesPeople, setSalesPeople] = useState<SalesPersonLookup[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<Lookup[]>([]);
  const [shipVias, setShipVias] = useState<Lookup[]>([]);
  const [billToAddresses, setBillToAddresses] = useState<AddressLookup[]>([]);
  const [shipToAddresses, setShipToAddresses] = useState<AddressLookup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isMutatingOverlay, setIsMutatingOverlay] = useState(false);
  const [overlayReasonOptions, setOverlayReasonOptions] = useState<PolicyStatusReasonCode[]>([]);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAttachmentCategory, setSelectedAttachmentCategory] = useState("Other");
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<OrderLine | null>(null);
  const [invoiceWizardOpen, setInvoiceWizardOpen] = useState(false);
  const [invoiceWizardStep, setInvoiceWizardStep] = useState<1 | 2 | 3>(1);
  const [invoiceWizardError, setInvoiceWizardError] = useState<string | null>(null);
  const [invoiceSelectedAttachmentIds, setInvoiceSelectedAttachmentIds] = useState<number[]>([]);
  const [invoiceAttachmentRecipientSummary, setInvoiceAttachmentRecipientSummary] = useState("");
  const [invoiceAttachmentSkipReason, setInvoiceAttachmentSkipReason] = useState("");
  const [invoiceSendAttachmentEmail, setInvoiceSendAttachmentEmail] = useState(true);
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
  const [invoicePaperworkChecked, setInvoicePaperworkChecked] = useState(false);
  const [invoicePricingChecked, setInvoicePricingChecked] = useState(false);
  const [invoiceBillingChecked, setInvoiceBillingChecked] = useState(false);
  const [missingSerialLineCount, setMissingSerialLineCount] = useState<number | null>(null);
  const [isCheckingSerialValidation, setIsCheckingSerialValidation] = useState(false);

  const isNewOrderRoute = orderId === "new";
  const parsedOrderId = orderId && orderId !== "new" ? Number(orderId) : null;
  const canMutateOrder = Boolean(order?.id);
  const canMutateLines =
    Boolean(order?.id) &&
    (order.orderStatus === "New" ||
      (invoiceMode && INVOICE_MUTABLE_LINE_STATUSES.has(currentStatus)));
  const hasFailedValidations =
    !form.customerId ||
    !form.siteId ||
    !form.orderDate ||
    !order?.lines?.length;
  const canAdvance = !hasFailedValidations;
  const hasInvoiceAttachments = attachments.length > 0;
  const canContinueInvoiceReview =
    invoicePaperworkChecked && invoicePricingChecked && invoiceBillingChecked;
  const showInvoiceSerialChecklist =
    invoiceMode &&
    (currentStatus === "InvoiceReady" ||
      currentStatus === "Ready to Invoice" ||
      order?.orderLifecycleStatus === "InvoiceReady" ||
      order?.orderStatus === "Ready to Invoice");
  const hasSerialRequiredLines = useMemo(
    () => (order?.lines ?? []).some((line) => line.requiresSerialNumbers),
    [order?.lines]
  );

  const lineTotals = useMemo(() => {
    const lines = order?.lines ?? [];
    const subtotal = lines.reduce((sum, line) => sum + (line.extension ?? 0), 0);
    const qty = lines.reduce((sum, line) => sum + line.quantityAsOrdered, 0);
    const tax = subtotal * 0.0825;
    const freight = subtotal > 0 ? 150 : 0;
    return {
      subtotal,
      tax,
      freight,
      total: subtotal + tax + freight,
      qty,
    };
  }, [order?.lines]);

  const selectedCustomerName = useMemo(() => {
    if (!form.customerId) {
      return "";
    }
    return customers.find((customer) => customer.id === form.customerId)?.name ?? "";
  }, [customers, form.customerId]);

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    if (!query) {
      return customers;
    }
    // When a value is selected and the input mirrors that value, keep full list available.
    if (
      form.customerId &&
      selectedCustomerName &&
      query === selectedCustomerName.toLowerCase()
    ) {
      return customers;
    }
    return customers.filter((customer) => customer.name.toLowerCase().includes(query));
  }, [customers, customerQuery, form.customerId, selectedCustomerName]);

  const updateFormFromOrder = (detail: OrderDraftDetail) => {
    setForm({
      customerId: detail.customerId,
      siteId: detail.siteId,
      inboundMode: detail.inboundMode ?? "LpcArrangedPickup",
      outboundMode: detail.outboundMode ?? "LpcArrangedDelivery",
      orderDate: detail.orderDate ?? "",
      customerPoNo: detail.customerPoNo ?? "",
      contact: detail.contact ?? "",
      phone: detail.phone ?? "",
      comments: detail.comments ?? "",
      priority: detail.priority ?? null,
      salesPersonId: detail.salesPersonId ?? null,
      billToAddressId: detail.billToAddressId ?? null,
      pickUpAddressId: detail.pickUpAddressId ?? null,
      shipToAddressId: detail.shipToAddressId ?? null,
      pickUpViaId: detail.pickUpViaId ?? null,
      shipToViaId: detail.shipToViaId ?? null,
      paymentTermId: detail.paymentTermId ?? null,
      returnScrap: detail.returnScrap ?? null,
      returnBrass: detail.returnBrass ?? null,
    });
    const resolvedStatus = getWorkspaceCurrentStatus(
      detail.orderLifecycleStatus ?? detail.orderStatus
    );
    setCurrentStatus(resolvedStatus as OrderWorkflowStatus);
    setHoldOverlay(detail.holdOverlay ?? null);
    setStatusReasonCode(detail.statusReasonCode ?? null);
    setStatusOwnerRole(detail.statusOwnerRole ?? null);
    setStatusNote(detail.statusNote ?? null);
    setCustomerQuery(detail.customerName ?? "");
  };

  const refreshOrder = async (id: number) => {
    const detail = await ordersApi.get(id);
    setOrder(detail);
    updateFormFromOrder(detail);
  };

  const refreshAttachments = async (id: number) => {
    const rows = await ordersApi.attachments(id);
    setAttachments(rows);
  };

  const refreshStatusReasonOptions = async () => {
    const rows = await orderPoliciesApi.listStatusReasons();
    setOverlayReasonOptions(rows);
  };

  useEffect(() => {
    void Promise.all([
      orderLookupsApi.activeCustomers(),
      orderLookupsApi.sites(),
      orderLookupsApi.salesPeople(),
      orderLookupsApi.paymentTerms(),
      orderLookupsApi.shipVias(),
      refreshStatusReasonOptions(),
    ])
      .then(([loadedCustomers, loadedSites, loadedSalesPeople, loadedPaymentTerms, loadedShipVias]) => {
        setCustomers(loadedCustomers);
        setSites(loadedSites);
        setSalesPeople(loadedSalesPeople);
        setPaymentTerms(loadedPaymentTerms);
        setShipVias(loadedShipVias);
      })
      .catch(() => {
        setLoadError("Lookup data failed to load.");
      });
  }, []);

  useEffect(() => {
    if (!form.customerId) {
      setBillToAddresses([]);
      setShipToAddresses([]);
      return;
    }

    void Promise.all([
      orderLookupsApi.customerAddresses(form.customerId, "BILL_TO"),
      orderLookupsApi.customerAddresses(form.customerId, "SHIP_TO"),
    ])
      .then(([loadedBillTo, loadedShipTo]) => {
        setBillToAddresses(loadedBillTo);
        setShipToAddresses(loadedShipTo);
      })
      .catch(() => {
        setError("Failed to load customer addresses.");
      });
  }, [form.customerId]);

  useEffect(() => {
    if (isNewOrderRoute) {
      setOrder(null);
      setForm(createDefaultFormState());
      setCurrentStatus("Draft");
      setHoldOverlay(null);
      setStatusOwnerRole("Office");
      setStatusReasonCode(null);
      setStatusNote(null);
      setAttachments([]);
      setCustomerQuery("");
      return;
    }

    if (!parsedOrderId || Number.isNaN(parsedOrderId)) {
      setLoadError("Invalid order id.");
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    void Promise.all([refreshOrder(parsedOrderId), refreshAttachments(parsedOrderId)])
      .catch(() => {
        setLoadError("Failed to load order.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isNewOrderRoute, parsedOrderId]);

  useEffect(() => {
    if (!showInvoiceSerialChecklist || !order?.id) {
      setMissingSerialLineCount(null);
      setIsCheckingSerialValidation(false);
      return;
    }
    if (!hasSerialRequiredLines) {
      setMissingSerialLineCount(0);
      setIsCheckingSerialValidation(false);
      return;
    }

    let isCancelled = false;
    setIsCheckingSerialValidation(true);
    void ordersApi
      .productionDetail(order.id)
      .then((detail) => {
        if (isCancelled) {
          return;
        }
        const missingCount = detail.lines.filter(
          (line) => line.requiresSerialNumbers && line.serialNumbers.length === 0
        ).length;
        setMissingSerialLineCount(missingCount);
      })
      .catch(() => {
        if (!isCancelled) {
          setMissingSerialLineCount(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsCheckingSerialValidation(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [hasSerialRequiredLines, order?.id, showInvoiceSerialChecklist]);

  const handleInput = (key: keyof OrderFormState, value: string) => {
    setForm((previous) => ({
      ...previous,
      [key]:
        key === "customerId" ||
        key === "siteId" ||
        key === "priority" ||
        key === "salesPersonId" ||
        key === "billToAddressId" ||
        key === "pickUpAddressId" ||
        key === "shipToAddressId" ||
        key === "pickUpViaId" ||
        key === "shipToViaId" ||
        key === "paymentTermId" ||
        key === "returnScrap" ||
        key === "returnBrass"
          ? value === ""
            ? null
            : Number(value)
          : value,
    }));
  };

  const saveOrder = async () => {
    setError(null);
    setShowValidationErrors(true);
    if (!form.customerId || !form.siteId || !form.orderDate) {
      setError("Customer, Site, and Order Date are required.");
      return;
    }

    setIsSaving(true);
    try {
      if (!order) {
        const created = await ordersApi.create({
          customerId: form.customerId,
          siteId: form.siteId,
          inboundMode: form.inboundMode,
          outboundMode: form.outboundMode,
          orderDate: form.orderDate,
          customerPoNo: form.customerPoNo || null,
          contact: form.contact || null,
          phone: form.phone || null,
          comments: form.comments || null,
          priority: form.priority,
          salesPersonId: form.salesPersonId,
          billToAddressId: form.billToAddressId,
          pickUpAddressId: form.pickUpAddressId,
          shipToAddressId: form.shipToAddressId,
          pickUpViaId: dropoffToggleOn ? null : form.pickUpViaId,
          shipToViaId: pickupToggleOn ? null : form.shipToViaId,
          paymentTermId: form.paymentTermId,
          returnScrap: form.returnScrap,
          returnBrass: form.returnBrass,
        });
        setOrder(created);
        updateFormFromOrder(created);
        await refreshAttachments(created.id);
        navigate(`/orders/${created.id}`, { replace: true });
      } else {
        const updated = await ordersApi.update(order.id, {
          customerId: form.customerId,
          siteId: form.siteId,
          inboundMode: form.inboundMode,
          outboundMode: form.outboundMode,
          orderDate: form.orderDate,
          customerPoNo: form.customerPoNo || null,
          contact: form.contact || null,
          phone: form.phone || null,
          comments: form.comments || null,
          priority: form.priority,
          salesPersonId: form.salesPersonId,
          billToAddressId: form.billToAddressId,
          pickUpAddressId: form.pickUpAddressId,
          shipToAddressId: form.shipToAddressId,
          pickUpViaId: dropoffToggleOn ? null : form.pickUpViaId,
          shipToViaId: pickupToggleOn ? null : form.shipToViaId,
          paymentTermId: form.paymentTermId,
          returnScrap: form.returnScrap,
          returnBrass: form.returnBrass,
        });
        setOrder(updated);
        updateFormFromOrder(updated);
      }
    } catch {
      setError("Failed to save order.");
    } finally {
      setIsSaving(false);
    }
  };

  const customerMissing = showValidationErrors && !form.customerId;
  const siteMissing = showValidationErrors && !form.siteId;
  const orderDateMissing = showValidationErrors && !form.orderDate;
  const hasErrorMessage = Boolean(loadError || error);
  const selectedCustomerId = form.customerId;
  const dropoffToggleOn = form.inboundMode === "CustomerDropoff";
  const pickupToggleOn = form.outboundMode === "CustomerPickup";

  const handleAdvanceStatus = async (targetStatus: OrderWorkflowStatus) => {
    if (!order?.id) {
      setError("Save the order before advancing lifecycle status.");
      return;
    }
    setIsAdvancing(true);
    try {
      const updated = await ordersApi.advanceStatus(order.id, targetStatus, {
        actingRole: ACTING_ROLE,
        actingEmpNo: ACTING_EMP_NO,
      });
      setOrder(updated);
      updateFormFromOrder(updated);
    } catch {
      setError("Unable to advance status.");
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleApplyOverlay = async (payload: ApplyHoldRequest) => {
    if (!order?.id) {
      setError("Save the order before applying overlays.");
      return;
    }
    setIsMutatingOverlay(true);
    try {
      const updated = await ordersApi.applyHold(order.id, payload);
      setOrder(updated);
      setHoldOverlay(updated.holdOverlay ?? payload.holdOverlay);
      setStatusReasonCode(updated.statusReasonCode ?? payload.reasonCode);
      setStatusOwnerRole(updated.statusOwnerRole ?? payload.actingRole);
      setStatusNote(updated.statusNote ?? payload.note ?? null);
    } catch {
      setError("Unable to apply hold overlay.");
    } finally {
      setIsMutatingOverlay(false);
    }
  };

  const handleCreateReasonCode = async (overlayType: HoldOverlayType, codeName: string) => {
    try {
      await orderPoliciesApi.createStatusReason({
        overlayType,
        codeName,
        updatedByEmpNo: ACTING_EMP_NO,
      });
      await refreshStatusReasonOptions();
    } catch (error) {
      setError(extractApiMessage(error) ?? "Unable to add status reason code.");
    }
  };

  const handleUpdateReasonCode = async (id: number, overlayType: HoldOverlayType, codeName: string) => {
    try {
      await orderPoliciesApi.updateStatusReason(id, {
        overlayType,
        codeName,
        updatedByEmpNo: ACTING_EMP_NO,
      });
      await refreshStatusReasonOptions();
    } catch (error) {
      setError(extractApiMessage(error) ?? "Unable to update status reason code.");
    }
  };

  const handleDeleteReasonCode = async (id: number) => {
    try {
      await orderPoliciesApi.deleteStatusReason(id);
      await refreshStatusReasonOptions();
    } catch (error) {
      setError(extractApiMessage(error) ?? "Unable to delete status reason code.");
    }
  };

  const handleClearOverlay = async (payload: ClearHoldRequest) => {
    if (!order?.id) {
      setError("Save the order before clearing overlays.");
      return;
    }
    setIsMutatingOverlay(true);
    try {
      const updated = await ordersApi.clearHold(order.id, payload);
      setOrder(updated);
      setHoldOverlay(updated.holdOverlay ?? null);
      setStatusReasonCode(updated.statusReasonCode ?? null);
      setStatusOwnerRole(updated.statusOwnerRole ?? payload.actingRole);
      setStatusNote(updated.statusNote ?? null);
    } catch {
      setError("Unable to clear hold overlay.");
    } finally {
      setIsMutatingOverlay(false);
    }
  };

  const handleUploadAttachment = async (): Promise<boolean> => {
    if (!order?.id || !selectedFile) {
      return false;
    }
    setIsUploadingAttachment(true);
    setError(null);
    try {
      await ordersApi.uploadAttachment(
        order.id,
        selectedFile,
        selectedAttachmentCategory,
        ACTING_ROLE,
        ACTING_EMP_NO
      );
      await refreshAttachments(order.id);
      setSelectedFile(null);
      return true;
    } catch (error) {
      setError(extractApiMessage(error) ?? "Attachment upload failed.");
      return false;
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleUpdateAttachmentCategory = async (
    attachmentId: number,
    category: string
  ) => {
    if (!order?.id) {
      return;
    }
    try {
      await ordersApi.updateAttachmentCategory(
        order.id,
        attachmentId,
        category,
        ACTING_ROLE,
        ACTING_EMP_NO
      );
      await refreshAttachments(order.id);
    } catch {
      setError("Unable to update attachment category.");
    }
  };

  const handleDeleteLine = async (lineId: number) => {
    if (!order?.id) {
      return;
    }
    try {
      await orderLinesApi.delete(order.id, lineId);
      await refreshOrder(order.id);
    } catch {
      setError("Unable to delete line.");
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!order?.id) {
      return;
    }
    try {
      await ordersApi.deleteAttachment(
        order.id,
        attachmentId,
        ACTING_ROLE,
        ACTING_EMP_NO,
        "UserDeletedAttachment"
      );
      await refreshAttachments(order.id);
    } catch {
      setError("Unable to delete attachment.");
    }
  };

  const openInvoiceSubmissionWizard = () => {
    setInvoiceWizardOpen(true);
    setInvoiceWizardStep(1);
    setInvoiceWizardError(null);
    setInvoiceSelectedAttachmentIds(
      attachments.filter((attachment) => attachment.isInvoiceRelevant).map((attachment) => attachment.id)
    );
    setInvoiceAttachmentRecipientSummary("");
    setInvoiceAttachmentSkipReason("");
    setInvoiceSendAttachmentEmail(true);
    setIsSubmittingInvoice(false);
    setInvoicePaperworkChecked(false);
    setInvoicePricingChecked(false);
    setInvoiceBillingChecked(false);
  };

  const handleInvoiceReviewContinue = () => {
    if (!canContinueInvoiceReview) {
      setInvoiceWizardError("Complete all final review confirmations before continuing.");
      return;
    }
    setInvoiceWizardError(null);
    if (hasInvoiceAttachments) {
      setInvoiceWizardStep(2);
      return;
    }
    setInvoiceWizardStep(3);
  };

  const handleInvoiceAttachmentContinue = (sendEmail: boolean) => {
    if (sendEmail) {
      if (
        invoiceSelectedAttachmentIds.length === 0 ||
        !invoiceAttachmentRecipientSummary.trim()
      ) {
        setInvoiceWizardError(
          "Sending attachments requires selected files and at least one recipient."
        );
        return;
      }
    } else if (!invoiceAttachmentSkipReason.trim()) {
      setInvoiceWizardError("Skipping attachment email requires a reason.");
      return;
    }
    setInvoiceWizardError(null);
    setInvoiceSendAttachmentEmail(sendEmail);
    setInvoiceWizardStep(3);
  };

  const handleSubmitInvoice = async () => {
    if (!order) {
      return;
    }
    setIsSubmittingInvoice(true);
    setInvoiceWizardError(null);
    try {
      const correlationId = generateCorrelationId();
      await ordersApi.submitInvoice(order.id, {
        finalReviewConfirmed: true,
        reviewPaperworkConfirmed: invoicePaperworkChecked,
        reviewPricingConfirmed: invoicePricingChecked,
        reviewBillingConfirmed: invoiceBillingChecked,
        sendAttachmentEmail: invoiceSendAttachmentEmail,
        selectedAttachmentIds: invoiceSendAttachmentEmail ? invoiceSelectedAttachmentIds : null,
        attachmentRecipientSummary: invoiceSendAttachmentEmail
          ? invoiceAttachmentRecipientSummary.trim()
          : null,
        attachmentSkipReason: invoiceSendAttachmentEmail
          ? null
          : invoiceAttachmentSkipReason.trim(),
        correlationId,
        submittedByEmpNo: ACTING_EMP_NO,
        reviewCompletedByEmpNo: ACTING_EMP_NO,
      });
      setInvoiceWizardOpen(false);
      await Promise.all([refreshOrder(order.id), refreshAttachments(order.id)]);
    } catch {
      setInvoiceWizardError(
        "Invoice submission failed. The order remains in queue. Please retry and check integration diagnostics."
      );
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.utilityBar}>
          <Button
            appearance="subtle"
            icon={<ArrowLeft24Regular />}
            onClick={() => navigate(invoiceMode ? "/invoices" : "/orders")}
          >
            Back to Orders
          </Button>
          <HelpEntryPoint route="/orders/:orderId" context={currentStatus} />
          <span>{ACTING_EMP_NO}</span>
          <span>Role: {ACTING_ROLE}</span>
        </div>

        <header className={styles.headerBar}>
          <Title2 className={styles.headerTitle}>
            {order ? `Sales Order ${order.salesOrderNo}` : "Create New Sales Order"}
          </Title2>
          <div className={styles.headerActions}>
            {invoiceMode ? (
              <Button
                appearance="primary"
                icon={<Play24Regular />}
                onClick={openInvoiceSubmissionWizard}
                disabled={!order || isLoading}
              >
                Start Invoice Submission
              </Button>
            ) : null}
            <Button appearance="secondary" onClick={saveOrder} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
          </div>
        </header>

        <section className={styles.content}>
          {isLoading ? <Body1>Loading order...</Body1> : null}
          {hasErrorMessage ? (
            <div className={styles.errorBanner}>
              <span className={styles.errorTitle}>Error</span>
              <span className={styles.errorMessage}>{loadError ?? error}</span>
            </div>
          ) : (
            <>
              <div className={styles.checklistBanner}>
                <span className={styles.checklistTitle}>Validation Checklist</span>
                {!invoiceMode ? (
                  <>
                    <span className={styles.checklistInlineItem}>
                      <CheckmarkCircle20Filled color={form.customerId ? "#107C10" : "#6E6E6E"} />
                      Customer selected
                    </span>
                    <span className={styles.checklistInlineItem}>
                      <CheckmarkCircle20Filled color={(order?.lines?.length ?? 0) > 0 ? "#107C10" : "#6E6E6E"} />
                      At least one line
                    </span>
                  </>
                ) : null}
                <span className={styles.checklistInlineItem}>
                  <CheckmarkCircle20Filled color={(order?.lines?.length ?? 0) > 0 ? "#107C10" : "#6E6E6E"} />
                  Qty &gt; 0
                </span>
                <span className={styles.checklistInlineItem}>
                  <CheckmarkCircle20Filled color={Boolean(form.orderDate) ? "#107C10" : "#6E6E6E"} />
                  Required dates set
                </span>
                {showInvoiceSerialChecklist ? (
                  <span className={styles.checklistInlineItem}>
                    <CheckmarkCircle20Filled
                      color={
                        isCheckingSerialValidation
                          ? "#6E6E6E"
                          : !hasSerialRequiredLines
                          ? "#107C10"
                          : missingSerialLineCount === 0
                          ? "#107C10"
                          : "#D13438"
                      }
                    />
                    {isCheckingSerialValidation
                      ? "Serial Numbers: checking..."
                      : !hasSerialRequiredLines
                      ? "Serial Numbers: not required"
                      : missingSerialLineCount == null
                      ? "Serial Numbers: unavailable"
                      : `Serial Numbers: ${missingSerialLineCount} line(s) missing`}
                  </span>
                ) : null}
              </div>
            </>
          )}
          <div className={styles.contentGrid}>
            <div className={styles.leftColumn}>
              <Card className={styles.card}>
                <div className={styles.cardTitle}>Order Header</div>
                <div className={styles.orderHeaderGrid}>
                  <div className={styles.sectionDivider}>Core Order</div>
                  <Field label="Sales Order No">
                    <Input
                      value={order?.salesOrderNo ?? "(new order)"}
                      readOnly
                      className={styles.orderNoInput}
                    />
                  </Field>
                  <Field
                    label="Order Date *"
                    validationState={orderDateMissing ? "error" : "none"}
                    validationMessage={orderDateMissing ? "Order date is required." : undefined}
                  >
                    <Input
                      type="date"
                      value={form.orderDate}
                      onChange={(_, data) => handleInput("orderDate", data.value)}
                      className={styles.formControl}
                      readOnly={invoiceMode}
                    />
                  </Field>
                  <Field
                    validationState={customerMissing ? "error" : "none"}
                    validationMessage={customerMissing ? "Customer is required." : undefined}
                  >
                    <div className={styles.customerLabelRow}>
                      <span className={styles.customerLabelText}>Customer *</span>
                      {selectedCustomerId ? (
                        <Button
                          appearance="subtle"
                          size="small"
                          className={styles.customerLabelAction}
                          onClick={() => navigate(`/customers/${selectedCustomerId}`)}
                        >
                          View Details
                        </Button>
                      ) : null}
                    </div>
                    <Combobox
                      value={customerQuery}
                      selectedOptions={form.customerId ? [String(form.customerId)] : []}
                      placeholder="Type to search customer"
                      onChange={(event) => {
                        const value = event.target.value;
                        setCustomerQuery(value);
                        if (!value) {
                          handleInput("customerId", "");
                        }
                      }}
                      onOptionSelect={(_, data) => {
                        const selectedId = data.optionValue ?? "";
                        handleInput("customerId", selectedId);
                        const selectedName = customers.find(
                          (customer) => String(customer.id) === selectedId
                        )?.name;
                        setCustomerQuery(selectedName ?? data.optionText ?? "");
                      }}
                      className={styles.formControl}
                    >
                      {filteredCustomers.map((customer) => (
                        <Option key={customer.id} value={String(customer.id)}>
                          {customer.name}
                        </Option>
                      ))}
                    </Combobox>
                  </Field>
                  <Field label="Customer PO">
                    <Input
                      value={form.customerPoNo}
                      onChange={(_, data) => handleInput("customerPoNo", data.value)}
                      className={styles.formControl}
                    />
                  </Field>
                  <Field label="Contact">
                    <Input
                      value={form.contact}
                      onChange={(_, data) => handleInput("contact", data.value)}
                      className={styles.formControl}
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      value={form.phone}
                      onChange={(_, data) => handleInput("phone", data.value)}
                      className={styles.formControl}
                    />
                  </Field>
                  <Field label="Return Scrap">
                    <Switch
                      checked={form.returnScrap === 1}
                      disabled={invoiceMode}
                      onChange={(_, data) =>
                        handleInput("returnScrap", data.checked ? "1" : "0")
                      }
                      label={form.returnScrap === 1 ? "Yes" : "No"}
                    />
                  </Field>
                  <Field label="Return Brass">
                    <Switch
                      checked={form.returnBrass === 1}
                      disabled={invoiceMode}
                      onChange={(_, data) =>
                        handleInput("returnBrass", data.checked ? "1" : "0")
                      }
                      label={form.returnBrass === 1 ? "Yes" : "No"}
                    />
                  </Field>
                  <Field label="Requested Delivery Date">
                    <Input value={order?.requestedDateUtc ?? ""} readOnly />
                  </Field>
                  <Field label="Promised Date">
                    <Input value={order?.promisedDateUtc ?? ""} readOnly />
                  </Field>
                  <Field label="Current Committed Date">
                    <Input value={order?.currentCommittedDateUtc ?? ""} readOnly />
                  </Field>

                  <div className={styles.sectionDivider}>Site, Sales and Commercial</div>
                  <Field
                    label="Site *"
                    validationState={siteMissing ? "error" : "none"}
                    validationMessage={siteMissing ? "Site is required." : undefined}
                  >
                    <Select
                      value={form.siteId ? String(form.siteId) : ""}
                      onChange={(event) => handleInput("siteId", event.target.value)}
                      className={styles.formControl}
                      disabled={invoiceMode}
                    >
                      <option value="">Select Site</option>
                      {sites.map((site) => (
                        <option key={site.id} value={String(site.id)}>
                          {site.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Salesperson">
                    <Select
                      value={form.salesPersonId ? String(form.salesPersonId) : ""}
                      onChange={(event) => handleInput("salesPersonId", event.target.value)}
                      className={styles.formControl}
                      disabled={invoiceMode}
                    >
                      <option value="">Select Salesperson</option>
                      {salesPeople.map((salesPerson) => (
                        <option key={salesPerson.id} value={String(salesPerson.id)}>
                          {salesPerson.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Priority">
                    <Input
                      value={form.priority != null ? String(form.priority) : ""}
                      onChange={(_, data) => handleInput("priority", data.value)}
                      className={styles.formControl}
                      readOnly={invoiceMode}
                    />
                  </Field>
                  <Field label="Payment Terms">
                    <Select
                      value={form.paymentTermId ? String(form.paymentTermId) : ""}
                      onChange={(event) => handleInput("paymentTermId", event.target.value)}
                      className={styles.formControl}
                    >
                      <option value="">Select Payment Term</option>
                      {paymentTerms.map((term) => (
                        <option key={term.id} value={String(term.id)}>
                          {term.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className={styles.sectionDivider}>Inbound and Outbound Logistics</div>
                  <Field label="Customer Dropoff">
                    <Switch
                      checked={dropoffToggleOn}
                      disabled={invoiceMode}
                      onChange={(_, data) => {
                        setForm((previous) => ({
                          ...previous,
                          inboundMode: data.checked ? "CustomerDropoff" : "LpcArrangedPickup",
                          pickUpViaId: data.checked ? null : previous.pickUpViaId,
                        }));
                      }}
                    />
                  </Field>
                  <Field label="Customer Pickup">
                    <Switch
                      checked={pickupToggleOn}
                      disabled={invoiceMode}
                      onChange={(_, data) => {
                        setForm((previous) => ({
                          ...previous,
                          outboundMode: data.checked
                            ? "CustomerPickup"
                            : "LpcArrangedDelivery",
                          shipToViaId: data.checked ? null : previous.shipToViaId,
                        }));
                      }}
                    />
                  </Field>
                  {!dropoffToggleOn ? (
                    <Field label="Pickup Via">
                      <Select
                        value={form.pickUpViaId != null ? String(form.pickUpViaId) : ""}
                        onChange={(event) => handleInput("pickUpViaId", event.target.value)}
                        className={styles.formControl}
                        disabled={invoiceMode}
                      >
                        <option value="">Select Pickup Via</option>
                        {shipVias.map((shipVia) => (
                          <option key={shipVia.id} value={String(shipVia.id)}>
                            {shipVia.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ) : null}
                  {!pickupToggleOn ? (
                    <Field label="Ship Via">
                      <Select
                        value={form.shipToViaId != null ? String(form.shipToViaId) : ""}
                        onChange={(event) => handleInput("shipToViaId", event.target.value)}
                        className={styles.formControl}
                        disabled={invoiceMode}
                      >
                        <option value="">Select Ship Via</option>
                        {shipVias.map((shipVia) => (
                          <option key={shipVia.id} value={String(shipVia.id)}>
                            {shipVia.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ) : null}
                  <Field label="Bill To Address">
                    <Select
                      value={form.billToAddressId != null ? String(form.billToAddressId) : ""}
                      onChange={(event) => handleInput("billToAddressId", event.target.value)}
                      className={styles.formControl}
                    >
                      <option value="">Select Bill To Address</option>
                      {billToAddresses.map((address) => (
                        <option key={address.id} value={String(address.id)}>
                          {address.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Pickup Address">
                    <Select
                      value={form.pickUpAddressId != null ? String(form.pickUpAddressId) : ""}
                      onChange={(event) => handleInput("pickUpAddressId", event.target.value)}
                      className={styles.formControl}
                      disabled={invoiceMode}
                    >
                      <option value="">Select Pickup Address</option>
                      {shipToAddresses.map((address) => (
                        <option key={address.id} value={String(address.id)}>
                          {address.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Ship To Address">
                    <Select
                      value={form.shipToAddressId != null ? String(form.shipToAddressId) : ""}
                      onChange={(event) => handleInput("shipToAddressId", event.target.value)}
                      className={styles.formControl}
                      disabled={invoiceMode}
                    >
                      <option value="">Select Ship To Address</option>
                      {shipToAddresses.map((address) => (
                        <option key={address.id} value={String(address.id)}>
                          {address.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field className={styles.fullRow} label="Notes">
                    <Textarea
                      value={form.comments}
                      onChange={(_, data) => handleInput("comments", data.value)}
                      resize="vertical"
                    />
                  </Field>
                </div>
              </Card>

              <Card className={styles.card}>
                <div className={styles.linesToolbar}>
                  <div className={styles.cardTitle}>Order Lines</div>
                  <Button
                    icon={<Add20Regular />}
                    appearance="subtle"
                    disabled={!canMutateLines}
                    onClick={() => {
                      setEditingLine(null);
                      setLineDialogOpen(true);
                    }}
                  >
                    Add Line
                  </Button>
                </div>
                <div className={styles.lineTable}>
                  <Table>
                    <TableHeader>
                      <TableRow className={styles.tableHeader}>
                        <TableHeaderCell>Line</TableHeaderCell>
                        <TableHeaderCell>Item No</TableHeaderCell>
                        <TableHeaderCell>Description</TableHeaderCell>
                        <TableHeaderCell>Qty Ordered</TableHeaderCell>
                        <TableHeaderCell>Unit Price</TableHeaderCell>
                        <TableHeaderCell>Actions</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(order?.lines ?? []).map((line) => (
                        <TableRow key={line.lineNo}>
                          <TableCell>{line.lineNo}</TableCell>
                          <TableCell>{line.itemNo}</TableCell>
                          <TableCell>{line.itemDescription}</TableCell>
                          <TableCell>{line.quantityAsOrdered}</TableCell>
                          <TableCell>{line.unitPrice ?? "-"}</TableCell>
                          <TableCell>
                            <div className={styles.rowActions}>
                              <Button
                                icon={<Pen20Regular />}
                                appearance="subtle"
                                className={styles.iconButton}
                                aria-label={`Edit line ${line.lineNo}`}
                                onClick={() => {
                                  setEditingLine(line);
                                  setLineDialogOpen(true);
                                }}
                                disabled={!canMutateLines}
                              />
                              <Button
                                icon={<Delete20Regular />}
                                appearance="subtle"
                                className={styles.iconButton}
                                aria-label={`Delete line ${line.lineNo}`}
                                onClick={() => void handleDeleteLine(line.id)}
                                disabled={!canMutateLines}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>

            </div>

            <div className={styles.rightColumn}>
              <Card className={styles.card}>
                <div className={styles.cardTitle}>Order Summary</div>
                <div className={styles.summaryList}>
                  <div className={styles.summaryRow}>
                    <span>Subtotal:</span>
                    <span>${lineTotals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Tax (8.25%):</span>
                    <span>${lineTotals.tax.toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Freight:</span>
                    <span>${lineTotals.freight.toFixed(2)}</span>
                  </div>
                  <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                    <span>Total:</span>
                    <span>${lineTotals.total.toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Total Qty:</span>
                    <Badge appearance="outline">{lineTotals.qty} EA</Badge>
                  </div>
                </div>
              </Card>

              <Card className={styles.card}>
                <LifecycleNavigator
                  currentStatus={currentStatus}
                  canAdvance={canAdvance}
                  isAdvancing={isAdvancing}
                  holdOverlay={holdOverlay}
                  statusReasonCode={statusReasonCode}
                  statusOwnerRole={statusOwnerRole}
                  statusNote={statusNote}
                  onAdvanceStatus={handleAdvanceStatus}
                  onApplyOverlay={handleApplyOverlay}
                  onClearOverlay={handleClearOverlay}
                  actingRole={ACTING_ROLE}
                  actingEmpNo={ACTING_EMP_NO}
                  isMutatingOverlay={isMutatingOverlay}
                  overlayReasonOptions={overlayReasonOptions}
                  onCreateReasonCode={handleCreateReasonCode}
                  onUpdateReasonCode={handleUpdateReasonCode}
                  onDeleteReasonCode={handleDeleteReasonCode}
                />
              </Card>
              <Card className={styles.card}>
                <AttachmentManager
                  attachments={attachments}
                  categories={ATTACHMENT_CATEGORIES}
                  canMutate={canMutateOrder}
                  selectedCategory={selectedAttachmentCategory}
                  selectedFile={selectedFile}
                  isUploading={isUploadingAttachment}
                  onSelectedCategoryChange={setSelectedAttachmentCategory}
                  onSelectedFileChange={setSelectedFile}
                  onUpload={handleUploadAttachment}
                  onUpdateCategory={(attachmentId, category) =>
                    void handleUpdateAttachmentCategory(attachmentId, category)
                  }
                  onDelete={(attachmentId) => void handleDeleteAttachment(attachmentId)}
                  getDownloadUrl={(attachmentId) =>
                    order ? ordersApi.attachmentDownloadUrl(order.id, attachmentId) : "#"
                  }
                />
              </Card>
            </div>
          </div>
        </section>

      </main>
      {canMutateLines ? (
        <OrderLineDialog
          open={lineDialogOpen}
          orderId={order.id}
          line={editingLine}
          onClose={() => setLineDialogOpen(false)}
          onSaved={() => {
            setLineDialogOpen(false);
            void refreshOrder(order.id);
          }}
        />
      ) : null}
      <Dialog
        open={invoiceWizardOpen}
        onOpenChange={(_, data) => !isSubmittingInvoice && setInvoiceWizardOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              Invoice Submission Wizard{order ? ` - ${order.salesOrderNo}` : ""}
            </DialogTitle>
            <DialogContent>
              {invoiceWizardStep === 1 ? (
                <div>
                  <Body1>Step 1 of 3 - Final Review Confirmation</Body1>
                  <Checkbox
                    label="Required paperwork is present (serial/test/supporting docs)"
                    checked={invoicePaperworkChecked}
                    onChange={(_, data) => setInvoicePaperworkChecked(Boolean(data.checked))}
                  />
                  <Checkbox
                    label="Quantity and pricing are reviewed"
                    checked={invoicePricingChecked}
                    onChange={(_, data) => setInvoicePricingChecked(Boolean(data.checked))}
                  />
                  <Checkbox
                    label="Customer and billing details are reviewed"
                    checked={invoiceBillingChecked}
                    onChange={(_, data) => setInvoiceBillingChecked(Boolean(data.checked))}
                  />
                </div>
              ) : null}

              {invoiceWizardStep === 2 ? (
                <div>
                  <Body1>Step 2 of 3 - Attachment Email</Body1>
                  {hasInvoiceAttachments ? (
                    <>
                      {attachments.map((attachment) => (
                        <Checkbox
                          key={attachment.id}
                          checked={invoiceSelectedAttachmentIds.includes(attachment.id)}
                          label={`${attachment.fileName} (${attachment.category})`}
                          onChange={(_, data) => {
                            setInvoiceSelectedAttachmentIds((previous) => {
                              if (data.checked) {
                                return [...previous, attachment.id];
                              }
                              return previous.filter((id) => id !== attachment.id);
                            });
                          }}
                        />
                      ))}
                      <Field label="Recipient summary (comma-separated emails)">
                        <Input
                          value={invoiceAttachmentRecipientSummary}
                          onChange={(_, data) => setInvoiceAttachmentRecipientSummary(data.value)}
                          placeholder="billing@customer.com, ops@customer.com"
                        />
                      </Field>
                      <Field label="Skip email reason (required only when skipping)">
                        <Textarea
                          value={invoiceAttachmentSkipReason}
                          onChange={(_, data) => setInvoiceAttachmentSkipReason(data.value)}
                        />
                      </Field>
                    </>
                  ) : (
                    <Body1>No attachments found. This step can be skipped.</Body1>
                  )}
                </div>
              ) : null}

              {invoiceWizardStep === 3 ? (
                <div>
                  <Body1>Step 3 of 3 - ERP Submission Confirmation</Body1>
                  <Body1>
                    Submission sends invoice data to ERP staging and cannot be reversed from this dialog.
                  </Body1>
                  <Body1>
                    Attachment email: {invoiceSendAttachmentEmail ? "Send before submit" : "Skipped"}
                  </Body1>
                  <Body1>
                    Ensure this order is in <strong>InvoiceReady</strong> status before submitting.
                  </Body1>
                </div>
              ) : null}

              {invoiceWizardError ? <Body1>{invoiceWizardError}</Body1> : null}
            </DialogContent>
            <DialogActions>
              {invoiceWizardStep > 1 ? (
                <Button
                  appearance="secondary"
                  disabled={isSubmittingInvoice}
                  onClick={() => setInvoiceWizardStep((invoiceWizardStep - 1) as 1 | 2 | 3)}
                >
                  Back
                </Button>
              ) : null}
              <Button
                appearance="secondary"
                disabled={isSubmittingInvoice}
                onClick={() => setInvoiceWizardOpen(false)}
              >
                Cancel
              </Button>
              {invoiceWizardStep === 1 ? (
                <Button appearance="primary" onClick={handleInvoiceReviewContinue}>
                  {hasInvoiceAttachments ? "Continue to Attachments" : "Continue to Submit"}
                </Button>
              ) : null}
              {invoiceWizardStep === 2 ? (
                <>
                  <Button
                    appearance="secondary"
                    onClick={() => handleInvoiceAttachmentContinue(false)}
                  >
                    Skip Email and Continue
                  </Button>
                  <Button
                    appearance="primary"
                    disabled={!hasInvoiceAttachments}
                    onClick={() => handleInvoiceAttachmentContinue(true)}
                  >
                    Send Email and Continue
                  </Button>
                </>
              ) : null}
              {invoiceWizardStep === 3 ? (
                <Button
                  appearance="primary"
                  disabled={isSubmittingInvoice}
                  onClick={() => void handleSubmitInvoice()}
                >
                  {isSubmittingInvoice ? "Submitting..." : "Submit Invoice"}
                </Button>
              ) : null}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
