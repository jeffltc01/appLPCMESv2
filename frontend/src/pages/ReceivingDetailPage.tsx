import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Body1,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  Label,
  Title2,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { ArrowClockwise24Regular, Checkmark24Regular, Dismiss24Regular, Question24Regular } from "@fluentui/react-icons";
import { HelpEntryPoint } from "../components/help/HelpEntryPoint";
import { orderLookupsApi, ordersApi } from "../services/orders";
import { ApiError } from "../services/api";
import type { OrderItemLookup, ReceivingOrderDetail, ReceivingOrderLine } from "../types/order";

type DraftLine = {
  lineId: number;
  receiptStatus: "Unknown" | "Received" | "NotReceived";
  quantityAsReceived: number;
};

type AddedLineDraft = {
  draftId: string;
  itemId: number;
  itemNo: string;
  itemDescription: string | null;
  productLine: string | null;
  quantityAsReceived: number;
};

const MAX_RECEIVED_QUANTITY = 1000;

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: tokens.spacingVerticalL,
  },
  shell: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  errorBanner: {
    border: "1px solid #e8b3b3",
    borderRadius: "4px",
    backgroundColor: "#fff5f5",
    padding: "10px 12px",
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
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "30% 70%",
    gap: tokens.spacingHorizontalM,
    alignItems: "start",
  },
  card: {
    border: "1px solid #e8e8e8",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  newLineHeaderButton: {
    minWidth: "160px",
    minHeight: "30px",
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    paddingTop: 0,
    paddingBottom: 0,
  },
  lineList: {
    display: "grid",
    gap: tokens.spacingVerticalS,
  },
  lineCard: {
    cursor: "pointer",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalXS,
    minHeight: "80px",
    backgroundColor: tokens.colorNeutralBackground1,
    display: "grid",
    gridTemplateColumns: "44px 1fr",
    gap: tokens.spacingHorizontalS,
    alignItems: "stretch",
  },
  lineStatusButton: {
    minWidth: "44px",
    width: "44px",
    height: "100%",
    alignSelf: "stretch",
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  lineStatusIcon: {
    fontSize: "32px",
  },
  lineStatusReceived: {
    backgroundColor: "#d4edda",
    color: "#107c10",
  },
  lineStatusUnknown: {
    backgroundColor: "#f5f5f5",
    color: tokens.colorNeutralForeground2,
  },
  lineStatusNotReceived: {
    backgroundColor: "#fff3cd",
    color: "#856404",
  },
  lineContent: {
    display: "grid",
    gap: tokens.spacingVerticalXXS,
  },
  selectedLineCard: {
    backgroundColor: "#e0eff8",
    border: "1px solid #123046",
  },
  lineTitle: {
    color: "#123046",
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase500,
  },
  lineMeta: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  lineMetricsRow: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  panel: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(90px, 0.5fr) minmax(160px, 0.9fr) minmax(280px, 1.9fr) minmax(170px, 0.8fr)",
    gap: tokens.spacingHorizontalL,
    alignItems: "end",
  },
  summaryField: {
    display: "grid",
    gap: tokens.spacingVerticalXXS,
  },
  summaryFieldFullWidth: {
    display: "grid",
    gap: tokens.spacingVerticalXXS,
    gridColumn: "1 / -1",
  },
  summaryLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  summaryValue: {
    color: "#123046",
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  metricCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalS,
    display: "grid",
    gap: tokens.spacingVerticalXXS,
  },
  metricLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
  metricValue: {
    fontSize: tokens.fontSizeBase500,
    color: "#123046",
    fontWeight: tokens.fontWeightSemibold,
  },
  metricInput: {
    maxWidth: "180px",
    "& input": {
      fontSize: tokens.fontSizeBase500,
      fontWeight: tokens.fontWeightSemibold,
      color: "#123046",
    },
  },
  metricInputWithDropdown: {
    position: "relative",
    maxWidth: "340px",
  },
  keypadDropdown: {
    position: "absolute",
    zIndex: 1001,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow16,
    padding: tokens.spacingVerticalS,
  },
  keypadOverlayHost: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 1000,
  },
  keypad: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: tokens.spacingHorizontalS,
    maxWidth: "320px",
  },
  keypadWideButton: {
    gridColumn: "span 3",
  },
  keypadButton: {
    minHeight: "56px",
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
  keypadEntryPreview: {
    gridColumn: "1 / -1",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalXS,
    textAlign: "right",
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: "#123046",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: tokens.spacingHorizontalS,
  },
  itemField: {
    display: "grid",
    gap: tokens.spacingVerticalXS,
  },
  itemFieldButton: {
    justifyContent: "flex-start",
    minHeight: "44px",
    fontSize: tokens.fontSizeBase400,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
  },
  itemPickerTopRow: {
    display: "grid",
    gap: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalS,
    position: "sticky",
    top: 0,
    zIndex: 1,
    backgroundColor: tokens.colorNeutralBackground1,
    paddingBottom: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  itemDialogSurface: {
    width: "1020px",
    maxWidth: "1020px",
    height: "600px",
    maxHeight: "600px",
    overflow: "hidden",
  },
  itemDialogBody: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
  },
  itemDialogContent: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  itemDialogActions: {
    justifyContent: "flex-end",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  productLineFilterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  itemPickerList: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gridAutoRows: "80px",
    gap: tokens.spacingVerticalS,
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    alignItems: "stretch",
    alignContent: "start",
  },
  itemPickerButton: {
    justifyContent: "flex-start",
    height: "100%",
    textAlign: "left",
    whiteSpace: "normal",
    lineHeight: 1.3,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
  },
  itemPickerMeta: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
});

function toDateInputValue(value: string | null): string {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.includes("T") ? value.split("T")[0] : value;
  }
  return parsed.toISOString().slice(0, 10);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  if (parsed < 0) {
    return 0;
  }
  if (parsed > MAX_RECEIVED_QUANTITY) {
    return MAX_RECEIVED_QUANTITY;
  }
  return parsed;
}

function displayLineValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "-";
}

function normalizeFilterValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
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

function formatOrderLineCardTitle(line: ReceivingOrderLine): string {
  return `${displayLineValue(line.productLine)} - ${displayLineValue(line.itemNo)} - ${displayLineValue(line.itemDescription)}`;
}

function getLineMap(lines: ReceivingOrderLine[]): Record<number, DraftLine> {
  return lines.reduce<Record<number, DraftLine>>((acc, line) => {
    const safeQtyReceived = line.quantityAsReceived ?? 0;
    const receiptStatus = line.receiptStatus === "Received" || line.receiptStatus === "NotReceived" || line.receiptStatus === "Unknown"
      ? line.receiptStatus
      : (line.isReceived || safeQtyReceived > 0 ? "Received" : "Unknown");
    acc[line.id] = {
      lineId: line.id,
      receiptStatus,
      quantityAsReceived: safeQtyReceived,
    };
    return acc;
  }, {});
}

export function ReceivingDetailPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const parsedOrderId = Number(orderId);

  const [detail, setDetail] = useState<ReceivingOrderDetail | null>(null);
  const [draftLines, setDraftLines] = useState<Record<number, DraftLine>>({});
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [receivedDate, setReceivedDate] = useState(todayIsoDate());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showTabletKeypad, setShowTabletKeypad] = useState(false);
  const [isTabletKeypadOpen, setIsTabletKeypadOpen] = useState(false);
  const [replaceQuantityOnNextDigit, setReplaceQuantityOnNextDigit] = useState(false);
  const [pendingTabletQuantity, setPendingTabletQuantity] = useState<string | null>(null);
  const [tabletKeypadPosition, setTabletKeypadPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const keypadDropdownRef = useRef<HTMLDivElement | null>(null);
  const quantityInputContainerRef = useRef<HTMLDivElement | null>(null);
  const keypadOverlayHostRef = useRef<HTMLDivElement | null>(null);

  const [isNewLineMode, setIsNewLineMode] = useState(false);
  const [addedLines, setAddedLines] = useState<AddedLineDraft[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemLookup[]>([]);
  const [itemLookupError, setItemLookupError] = useState<string | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [newLineSelectedItem, setNewLineSelectedItem] = useState<OrderItemLookup | null>(null);
  const [newLineQuantityAsReceived, setNewLineQuantityAsReceived] = useState(0);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [selectedProductLineFilter, setSelectedProductLineFilter] = useState("All");
  const [productLineOptions, setProductLineOptions] = useState<string[]>([]);

  const loadDetail = async () => {
    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      setError("Invalid receiving order id.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await ordersApi.receivingDetail(parsedOrderId);
      setDetail(result);
      setDraftLines(getLineMap(result.lines));
      setSelectedLineId(result.lines[0]?.id ?? null);
      setReceivedDate(toDateInputValue(result.receivedDate) || todayIsoDate());
      setAddedLines([]);
      setIsNewLineMode(false);
      setNewLineSelectedItem(null);
      setNewLineQuantityAsReceived(0);
      setItemSearchQuery("");
      setSelectedProductLineFilter("All");
    } catch {
      setError("Unable to load receiving detail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedOrderId]);

  useEffect(() => {
    let isActive = true;
    Promise.all([orderLookupsApi.items(), orderLookupsApi.productLines()])
      .then(([items, productLines]) => {
        if (!isActive) {
          return;
        }
        setOrderItems(items);
        setProductLineOptions(productLines);
        setItemLookupError(null);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setItemLookupError("Unable to load item list.");
        setProductLineOptions([]);
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const minNonMobileWidthQuery = window.matchMedia("(min-width: 640px)");

    const syncTabletKeypad = () => {
      setShowTabletKeypad(minNonMobileWidthQuery.matches);
    };

    syncTabletKeypad();

    if (typeof minNonMobileWidthQuery.addEventListener === "function") {
      minNonMobileWidthQuery.addEventListener("change", syncTabletKeypad);
      return () => {
        minNonMobileWidthQuery.removeEventListener("change", syncTabletKeypad);
      };
    }

    minNonMobileWidthQuery.addListener(syncTabletKeypad);
    return () => {
      minNonMobileWidthQuery.removeListener(syncTabletKeypad);
    };
  }, []);

  const syncTabletKeypadPosition = () => {
    if (!quantityInputContainerRef.current) {
      return;
    }
    const rect = quantityInputContainerRef.current.getBoundingClientRect();
    setTabletKeypadPosition({
      top: rect.bottom + 8,
      left: rect.left,
    });
  };

  useEffect(() => {
    if (!isTabletKeypadOpen) {
      return;
    }

    syncTabletKeypadPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const clickedInputArea = quantityInputContainerRef.current?.contains(targetNode) ?? false;
      const clickedKeypad = keypadDropdownRef.current?.contains(targetNode) ?? false;
      if (!clickedInputArea && !clickedKeypad) {
        setIsTabletKeypadOpen(false);
        setReplaceQuantityOnNextDigit(false);
        setPendingTabletQuantity(null);
      }
    };
    const handleWindowReposition = () => syncTabletKeypadPosition();

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleWindowReposition);
    window.addEventListener("scroll", handleWindowReposition, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleWindowReposition);
      window.removeEventListener("scroll", handleWindowReposition, true);
    };
  }, [isTabletKeypadOpen]);

  const selectedLine = useMemo(() => {
    if (!detail || selectedLineId === null) {
      return null;
    }
    return detail.lines.find((line) => line.id === selectedLineId) ?? null;
  }, [detail, selectedLineId]);

  const selectedDraft = selectedLine ? draftLines[selectedLine.id] : null;

  const availableProductLineFilters = useMemo(() => {
    const normalizedFromLookup = productLineOptions
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (normalizedFromLookup.length > 0) {
      return ["All", ...normalizedFromLookup];
    }
    const derivedFromItems = Array.from(
      new Set(orderItems.map((item) => item.productLine?.trim()).filter((value): value is string => Boolean(value)))
    );
    return ["All", ...derivedFromItems];
  }, [orderItems, productLineOptions]);

  const filteredItems = useMemo(() => {
    const query = itemSearchQuery.trim().toLowerCase();
    const selectedProductLineKey = normalizeFilterValue(selectedProductLineFilter);
    return orderItems.filter((item) => {
      const itemProductLineKey = normalizeFilterValue(item.productLine);
      const includeProductLine = selectedProductLineKey === "all" || itemProductLineKey === selectedProductLineKey;
      if (!includeProductLine) {
        return false;
      }
      if (!query) {
        return true;
      }
      const searchText = `${item.itemNo} ${item.itemDescription ?? ""} ${item.productLine ?? ""}`.toLowerCase();
      return searchText.includes(query);
    });
  }, [itemSearchQuery, orderItems, selectedProductLineFilter]);

  const handleQuantityChange = (lineId: number, value: string) => {
    const nextQty = toNumber(value);
    setDraftLines((prev) => ({
      ...prev,
      [lineId]: (() => {
        const existing = prev[lineId] ?? { lineId, receiptStatus: "Unknown" as const, quantityAsReceived: 0 };
        const nextReceiptStatus =
          nextQty > 0 ? "Received" : existing.receiptStatus === "Received" ? "Unknown" : existing.receiptStatus;
        return {
          ...existing,
          quantityAsReceived: nextQty,
          receiptStatus: nextReceiptStatus,
        };
      })(),
    }));
  };

  const cycleReceiptStatus = (lineId: number) => {
    setDraftLines((prev) => {
      const existing = prev[lineId] ?? { lineId, receiptStatus: "Unknown" as const, quantityAsReceived: 0 };
      const orderedQty = detail?.lines.find((line) => line.id === lineId)?.quantityAsOrdered ?? 0;
      const nextStatus =
        existing.receiptStatus === "Unknown"
          ? "Received"
          : existing.receiptStatus === "Received"
            ? "NotReceived"
            : "Unknown";
      return {
        ...prev,
        [lineId]: {
          ...existing,
          receiptStatus: nextStatus,
          quantityAsReceived:
            nextStatus === "Received"
              ? (existing.quantityAsReceived > 0 ? existing.quantityAsReceived : Math.min(orderedQty, MAX_RECEIVED_QUANTITY))
              : 0,
        },
      };
    });
  };

  const applyTabletDigit = (digit: string) => {
    const activeQuantity = isNewLineMode ? newLineQuantityAsReceived : selectedDraft?.quantityAsReceived;
    if (activeQuantity === undefined) {
      return;
    }
    const currentText = pendingTabletQuantity ?? String(Math.max(0, Math.trunc(activeQuantity)));
    const nextText = replaceQuantityOnNextDigit || currentText === "0" ? digit : `${currentText}${digit}`;
    setPendingTabletQuantity(nextText);
    setIsTabletKeypadOpen(true);
    setReplaceQuantityOnNextDigit(false);
  };

  const clearTabletQuantity = () => {
    setPendingTabletQuantity("0");
    setIsTabletKeypadOpen(true);
    setReplaceQuantityOnNextDigit(false);
  };

  const backspaceTabletQuantity = () => {
    const activeQuantity = isNewLineMode ? newLineQuantityAsReceived : selectedDraft?.quantityAsReceived;
    if (activeQuantity === undefined) {
      return;
    }
    const currentText = pendingTabletQuantity ?? String(Math.max(0, Math.trunc(activeQuantity)));
    const nextText = currentText.length <= 1 ? "0" : currentText.slice(0, -1);
    setPendingTabletQuantity(nextText);
    setIsTabletKeypadOpen(true);
    setReplaceQuantityOnNextDigit(false);
  };

  const acceptTabletQuantity = () => {
    if (pendingTabletQuantity !== null) {
      const acceptedValue = toNumber(pendingTabletQuantity);
      if (isNewLineMode) {
        setNewLineQuantityAsReceived(acceptedValue);
      } else if (selectedLine) {
        handleQuantityChange(selectedLine.id, String(acceptedValue));
      }
    }
    setIsTabletKeypadOpen(false);
    setReplaceQuantityOnNextDigit(false);
    setPendingTabletQuantity(null);
  };

  const getLineStatusLabel = (status: "Unknown" | "Received" | "NotReceived"): string => {
    if (status === "Received") {
      return "Line received";
    }
    if (status === "NotReceived") {
      return "Line not received";
    }
    return "Receipt status unknown";
  };

  const startNewLineMode = () => {
    setIsNewLineMode(true);
    setIsTabletKeypadOpen(false);
    setReplaceQuantityOnNextDigit(false);
    setPendingTabletQuantity(null);
    setNewLineSelectedItem(null);
    setNewLineQuantityAsReceived(0);
  };

  const cancelNewLineMode = () => {
    setIsNewLineMode(false);
    setIsTabletKeypadOpen(false);
    setReplaceQuantityOnNextDigit(false);
    setPendingTabletQuantity(null);
    setNewLineSelectedItem(null);
    setNewLineQuantityAsReceived(0);
  };

  const confirmAddLine = () => {
    if (!newLineSelectedItem) {
      setError("Please select an item for the new line.");
      return;
    }
    if (newLineQuantityAsReceived <= 0) {
      setError("New line quantity received must be greater than zero.");
      return;
    }
    setError(null);
    setAddedLines((prev) => [
      ...prev,
      {
        draftId: `${newLineSelectedItem.id}-${Date.now()}-${prev.length + 1}`,
        itemId: newLineSelectedItem.id,
        itemNo: newLineSelectedItem.itemNo,
        itemDescription: newLineSelectedItem.itemDescription,
        productLine: newLineSelectedItem.productLine,
        quantityAsReceived: newLineQuantityAsReceived,
      },
    ]);
    cancelNewLineMode();
  };

  useEffect(() => {
    if (!isNewLineMode || !newLineSelectedItem || newLineQuantityAsReceived <= 0) {
      return;
    }
    setError(null);
    setAddedLines((prev) => [
      ...prev,
      {
        draftId: `${newLineSelectedItem.id}-${Date.now()}-${prev.length + 1}`,
        itemId: newLineSelectedItem.id,
        itemNo: newLineSelectedItem.itemNo,
        itemDescription: newLineSelectedItem.itemDescription,
        productLine: newLineSelectedItem.productLine,
        quantityAsReceived: newLineQuantityAsReceived,
      },
    ]);
    cancelNewLineMode();
  }, [isNewLineMode, newLineSelectedItem, newLineQuantityAsReceived]);

  const saveReceiving = async () => {
    if (!detail || !Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await ordersApi.completeReceiving(parsedOrderId, {
        receivedDate,
        lines: Object.values(draftLines).map((line) => ({
          lineId: line.lineId,
          isReceived: line.receiptStatus === "Received",
          quantityAsReceived: line.receiptStatus === "Received" ? line.quantityAsReceived : 0,
          receiptStatus: line.receiptStatus,
        })),
        addedLines: addedLines.map((line) => ({
          itemId: line.itemId,
          quantityAsReceived: line.quantityAsReceived,
        })),
      });
      navigate("/receiving");
    } catch (error) {
      setError(extractApiMessage(error) ?? "Unable to save receiving updates.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div>
            <Title2>Receiving Detail</Title2>
          </div>
          <div className={styles.headerActions}>
            <HelpEntryPoint route="/receiving" />
            <Button appearance="secondary" onClick={() => navigate("/receiving")}>
              Back to Queue
            </Button>
            <Button appearance="secondary" icon={<ArrowClockwise24Regular />} onClick={() => void loadDetail()} disabled={loading || saving}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button appearance="primary" onClick={() => void saveReceiving()} disabled={loading || saving || !detail}>
              {saving ? "Saving..." : "Complete Receiving"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className={styles.errorBanner}>
            <span className={styles.errorTitle}>Error</span>
            <span className={styles.errorMessage}>{error}</span>
          </div>
        ) : null}

        <Card className={styles.card}>
          <div className={styles.panel}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryField}>
                <span className={styles.summaryLabel}>Order Number</span>
                <span className={styles.summaryValue}>{detail?.salesOrderNo ?? "-"}</span>
              </div>
              <div className={styles.summaryField}>
                <span className={styles.summaryLabel}>Customer</span>
                <span className={styles.summaryValue}>{detail?.customerName ?? "-"}</span>
              </div>
              <div className={styles.summaryField}>
                <span className={styles.summaryLabel}>Address</span>
                <span className={styles.summaryValue}>{detail?.pickUpAddressStreet ?? "-"}</span>
              </div>
              <div className={styles.summaryField}>
                <Label className={styles.summaryLabel} htmlFor="receiving-date-input">
                  Received Date
                </Label>
                <Input
                  id="receiving-date-input"
                  type="date"
                  value={receivedDate}
                  onChange={(_, data) => setReceivedDate(data.value)}
                />
              </div>
              <div className={styles.summaryFieldFullWidth}>
                <span className={styles.summaryLabel}>Order Notes</span>
                <span className={styles.summaryValue}>{detail?.orderComments ?? "-"}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className={styles.twoColumn}>
          <Card className={styles.card}>
            <div className={styles.panel}>
              <div className={styles.sectionHeader}>
                <Title2>Order Lines</Title2>
                <Button
                  appearance="primary"
                  className={styles.newLineHeaderButton}
                  onClick={startNewLineMode}
                  disabled={saving || loading}
                >
                  New Line
                </Button>
              </div>
              <div className={styles.lineList}>
                {detail?.lines.map((line) => {
                  const isSelected = line.id === selectedLineId && !isNewLineMode;
                  const draft = draftLines[line.id];
                  const status = draft?.receiptStatus ?? line.receiptStatus ?? "Unknown";
                  return (
                    <div
                      key={line.id}
                      className={mergeClasses(styles.lineCard, isSelected ? styles.selectedLineCard : undefined)}
                      onClick={() => {
                        setSelectedLineId(line.id);
                        setIsNewLineMode(false);
                      }}
                    >
                      <Button
                        appearance="subtle"
                        aria-label={getLineStatusLabel(status)}
                        className={mergeClasses(
                          styles.lineStatusButton,
                          status === "Received" ? styles.lineStatusReceived : undefined,
                          status === "Unknown" ? styles.lineStatusUnknown : undefined,
                          status === "NotReceived" ? styles.lineStatusNotReceived : undefined
                        )}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedLineId(line.id);
                          setIsNewLineMode(false);
                          cycleReceiptStatus(line.id);
                        }}
                      >
                        {status === "Received" ? <Checkmark24Regular className={styles.lineStatusIcon} /> : null}
                        {status === "Unknown" ? <Question24Regular className={styles.lineStatusIcon} /> : null}
                        {status === "NotReceived" ? <Dismiss24Regular className={styles.lineStatusIcon} /> : null}
                      </Button>
                      <div className={styles.lineContent}>
                        <span className={styles.lineTitle}>{formatOrderLineCardTitle(line)}</span>
                        <div className={styles.lineMetricsRow}>
                          <span className={styles.lineMeta}>{`Qty Ordered: ${line.quantityAsOrdered}`}</span>
                          <span className={styles.lineMeta}>{`Qty Received: ${draft?.quantityAsReceived ?? line.quantityAsReceived ?? 0}`}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {addedLines.map((line) => (
                  <div key={line.draftId} className={styles.lineCard}>
                    <div className={mergeClasses(styles.lineStatusButton, styles.lineStatusReceived)} aria-label="Line received" role="img">
                      <Checkmark24Regular className={styles.lineStatusIcon} />
                    </div>
                    <div className={styles.lineContent}>
                      <span className={styles.lineTitle}>{`${displayLineValue(line.productLine)} - ${line.itemNo} - ${displayLineValue(line.itemDescription)}`}</span>
                      <div className={styles.lineMetricsRow}>
                        <span className={styles.lineMeta}>Qty Ordered: 0</span>
                        <span className={styles.lineMeta}>{`Qty Received: ${line.quantityAsReceived}`}</span>
                      </div>
                      <div>
                        <Button
                          appearance="subtle"
                          disabled={saving}
                          onClick={() => {
                            setAddedLines((prev) => prev.filter((candidate) => candidate.draftId !== line.draftId));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className={styles.card}>
            <div className={styles.panel}>
              {isNewLineMode ? (
                <>
                  <div className={styles.sectionHeader}>
                    <Title2>New Order Line</Title2>
                  </div>
                  <div className={styles.itemField}>
                    <Label>Item</Label>
                    <Button
                      appearance="secondary"
                      className={styles.itemFieldButton}
                      onClick={() => setIsItemDialogOpen(true)}
                      disabled={saving}
                    >
                      {newLineSelectedItem
                        ? `${newLineSelectedItem.itemNo} - ${displayLineValue(newLineSelectedItem.itemDescription)}`
                        : "Select Item"}
                    </Button>
                  </div>
                  <div className={styles.metrics}>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>Quantity As Ordered</span>
                      <span className={styles.metricValue}>0</span>
                    </div>
                    <div className={styles.metricCard}>
                      <Label className={styles.metricLabel} htmlFor="new-line-quantity-received-input">
                        Quantity As Received
                      </Label>
                      <div className={styles.metricInputWithDropdown} ref={quantityInputContainerRef}>
                        <Input
                          id="new-line-quantity-received-input"
                          className={styles.metricInput}
                          type="number"
                          min="0"
                          step="1"
                          max={MAX_RECEIVED_QUANTITY}
                          value={String(newLineQuantityAsReceived)}
                          onChange={(_, data) => setNewLineQuantityAsReceived(toNumber(data.value))}
                          onFocus={() => {
                            if (showTabletKeypad) {
                              syncTabletKeypadPosition();
                              setIsTabletKeypadOpen(true);
                              setReplaceQuantityOnNextDigit(true);
                              setPendingTabletQuantity(String(Math.max(0, Math.trunc(newLineQuantityAsReceived))));
                            }
                          }}
                          onClick={() => {
                            if (showTabletKeypad) {
                              syncTabletKeypadPosition();
                              setIsTabletKeypadOpen(true);
                              setReplaceQuantityOnNextDigit(true);
                              setPendingTabletQuantity(String(Math.max(0, Math.trunc(newLineQuantityAsReceived))));
                            }
                          }}
                        />
                        {showTabletKeypad && isTabletKeypadOpen && keypadOverlayHostRef.current
                          ? createPortal(
                            <div
                              className={styles.keypadDropdown}
                              ref={keypadDropdownRef}
                              style={{ top: `${tabletKeypadPosition.top}px`, left: `${tabletKeypadPosition.left}px`, pointerEvents: "auto" }}
                            >
                              <div className={styles.keypad} role="group" aria-label="Tablet quantity keypad">
                                <div className={styles.keypadEntryPreview} aria-live="polite">
                                  {pendingTabletQuantity ?? String(Math.max(0, Math.trunc(newLineQuantityAsReceived)))}
                                </div>
                                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                                  <Button key={digit} appearance="secondary" className={styles.keypadButton} onClick={() => applyTabletDigit(digit)} disabled={saving}>
                                    {digit}
                                  </Button>
                                ))}
                                <Button appearance="secondary" className={styles.keypadButton} onClick={() => applyTabletDigit("0")} disabled={saving}>
                                  0
                                </Button>
                                <Button appearance="secondary" className={styles.keypadButton} onClick={backspaceTabletQuantity} disabled={saving}>
                                  Backspace
                                </Button>
                                <Button appearance="secondary" className={styles.keypadButton} onClick={clearTabletQuantity} disabled={saving}>
                                  Clear
                                </Button>
                                <Button appearance="primary" className={mergeClasses(styles.keypadButton, styles.keypadWideButton)} onClick={acceptTabletQuantity} disabled={saving}>
                                  Accept
                                </Button>
                              </div>
                            </div>,
                            keypadOverlayHostRef.current
                          )
                          : null}
                      </div>
                    </div>
                  </div>
                  <div className={styles.actionRow}>
                    <Button appearance="secondary" onClick={cancelNewLineMode} disabled={saving}>
                      Cancel
                    </Button>
                    <Button appearance="primary" onClick={confirmAddLine} disabled={saving}>
                      Add Line
                    </Button>
                  </div>
                </>
              ) : !selectedLine || !selectedDraft ? (
                <Body1>Select a line to edit receiving details.</Body1>
              ) : (
                <>
                  <div>
                    <Title2>{formatOrderLineCardTitle(selectedLine)}</Title2>
                  </div>
                  <div className={styles.metrics}>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>Quantity As Ordered</span>
                      <span className={styles.metricValue}>{selectedLine.quantityAsOrdered}</span>
                    </div>
                    <div className={styles.metricCard}>
                      <Label className={styles.metricLabel} htmlFor="quantity-received-input">
                        Quantity As Received
                      </Label>
                      <div className={styles.metricInputWithDropdown} ref={quantityInputContainerRef}>
                        <Input
                          id="quantity-received-input"
                          className={styles.metricInput}
                          type="number"
                          min="0"
                          step="1"
                          max={MAX_RECEIVED_QUANTITY}
                          value={String(selectedDraft.quantityAsReceived ?? 0)}
                          onChange={(_, data) => handleQuantityChange(selectedLine.id, data.value)}
                          onFocus={() => {
                            if (showTabletKeypad) {
                              syncTabletKeypadPosition();
                              setIsTabletKeypadOpen(true);
                              setReplaceQuantityOnNextDigit(true);
                              setPendingTabletQuantity(String(Math.max(0, Math.trunc(selectedDraft.quantityAsReceived ?? 0))));
                            }
                          }}
                          onClick={() => {
                            if (showTabletKeypad) {
                              syncTabletKeypadPosition();
                              setIsTabletKeypadOpen(true);
                              setReplaceQuantityOnNextDigit(true);
                              setPendingTabletQuantity(String(Math.max(0, Math.trunc(selectedDraft.quantityAsReceived ?? 0))));
                            }
                          }}
                        />
                        {showTabletKeypad && isTabletKeypadOpen && keypadOverlayHostRef.current
                          ? createPortal(
                            <div
                              className={styles.keypadDropdown}
                              ref={keypadDropdownRef}
                              style={{ top: `${tabletKeypadPosition.top}px`, left: `${tabletKeypadPosition.left}px`, pointerEvents: "auto" }}
                            >
                              <div className={styles.keypad} role="group" aria-label="Tablet quantity keypad">
                                <div className={styles.keypadEntryPreview} aria-live="polite">
                                  {pendingTabletQuantity ?? String(Math.max(0, Math.trunc(selectedDraft.quantityAsReceived ?? 0)))}
                                </div>
                                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                                  <Button key={digit} appearance="secondary" className={styles.keypadButton} onClick={() => applyTabletDigit(digit)} disabled={saving}>
                                    {digit}
                                  </Button>
                                ))}
                                <Button appearance="secondary" className={styles.keypadButton} onClick={() => applyTabletDigit("0")} disabled={saving}>
                                  0
                                </Button>
                                <Button appearance="secondary" className={styles.keypadButton} onClick={backspaceTabletQuantity} disabled={saving}>
                                  Backspace
                                </Button>
                                <Button appearance="secondary" className={styles.keypadButton} onClick={clearTabletQuantity} disabled={saving}>
                                  Clear
                                </Button>
                                <Button appearance="primary" className={mergeClasses(styles.keypadButton, styles.keypadWideButton)} onClick={acceptTabletQuantity} disabled={saving}>
                                  Accept
                                </Button>
                              </div>
                            </div>,
                            keypadOverlayHostRef.current
                          )
                          : null}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
      <div ref={keypadOverlayHostRef} className={styles.keypadOverlayHost} />
      <Dialog open={isItemDialogOpen} onOpenChange={(_, data) => setIsItemDialogOpen(data.open)}>
        <DialogSurface className={styles.itemDialogSurface}>
          <DialogBody className={styles.itemDialogBody}>
            <DialogTitle>Select Item</DialogTitle>
            <DialogContent className={styles.itemDialogContent}>
              <div className={styles.itemPickerTopRow}>
                <Input
                  type="search"
                  value={itemSearchQuery}
                  onChange={(_, data) => setItemSearchQuery(data.value)}
                  placeholder="Search item number or description..."
                  aria-label="Search items"
                />
                <div className={styles.productLineFilterRow}>
                  {availableProductLineFilters.map((line) => (
                    <Button
                      key={line}
                      appearance={selectedProductLineFilter === line ? "primary" : "secondary"}
                      onClick={() => setSelectedProductLineFilter(line)}
                    >
                      {line}
                    </Button>
                  ))}
                </div>
              </div>
              {itemLookupError ? <Body1>{itemLookupError}</Body1> : null}
              <div className={styles.itemPickerList}>
                {filteredItems.map((item) => (
                  <Button
                    key={item.id}
                    appearance="secondary"
                    className={styles.itemPickerButton}
                    onClick={() => {
                      setNewLineSelectedItem(item);
                      setIsItemDialogOpen(false);
                    }}
                  >
                    <div>
                      <div>{`${item.itemNo} - ${displayLineValue(item.itemDescription)}`}</div>
                      <div className={styles.itemPickerMeta}>{displayLineValue(item.productLine)}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </DialogContent>
            <DialogActions className={styles.itemDialogActions}>
              <Button appearance="secondary" onClick={() => setIsItemDialogOpen(false)}>
                Cancel
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
