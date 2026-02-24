import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Body1,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Select,
  Spinner,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Textarea,
  Title2,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { ArrowLeft24Regular, ArrowUpload24Regular, Delete24Regular } from "@fluentui/react-icons";
import { orderLookupsApi, ordersApi } from "../services/orders";
import { ApiError } from "../services/api";
import type {
  CompleteProductionRequest,
  OrderAttachment,
  OrderDraftDetail,
  ProductionOrderDetail,
  ProductionSerialNumberUpsert,
} from "../types/order";
import type { Lookup } from "../types/customer";
import { OrderWorkflowWidget } from "../components/orders/OrderWorkflowWidget";

type TabValue = "details" | "lines" | "attachments";
type EditableSerial = ProductionSerialNumberUpsert;
type EditingSerialState = {
  lineId: number;
  serialIndex: number | null;
  value: EditableSerial;
};
type PendingSerialDeleteState = {
  lineId: number;
  serialIndex: number;
  serialNo: string;
};

const LID_SIZE_OPTIONS = ["14.25", "14.5", "15", "15.75", "16", "16.25"] as const;

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    flexWrap: "wrap",
  },
  titleWrap: {
    flexGrow: 1,
  },
  tabContent: {
    marginTop: tokens.spacingVerticalL,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    maxWidth: "820px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalS,
  },
  priceCell: {
    textAlign: "right" as const,
  },
  lineCellTall: {
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
  },
  lineTopRow: {
    "& > td": {
      borderBottom: "none !important",
    },
  },
  lineDetailRow: {
    "& > td": {
      borderTop: "none !important",
    },
  },
  center: {
    display: "flex",
    justifyContent: "center",
    marginTop: tokens.spacingVerticalXXL,
  },
  actionsRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalM,
    flexWrap: "wrap",
  },
  hiddenInput: {
    display: "none",
  },
  fileLink: {
    color: tokens.colorBrandForeground1,
    textDecorationLine: "none",
  },
  lineQuantityInput: {
    width: "120px",
  },
  lineActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  serialSummaryText: {
    color: tokens.colorNeutralForeground2,
  },
  serialCardsWrap: {
    marginTop: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalS,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  serialCard: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: "12px",
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    cursor: "pointer",
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    transitionProperty: "box-shadow, border-color, transform, background-color",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      border: `1px solid ${tokens.colorBrandStroke1}`,
      boxShadow: tokens.shadow8,
      transform: "translateY(-1px)",
    },
    ":focus-within": {
      border: `1px solid ${tokens.colorBrandStroke1}`,
      boxShadow: `0 0 0 2px ${tokens.colorBrandStroke2}`,
    },
  },
  serialCardMain: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  serialCardSerialNo: {
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase300,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  serialCardStatus: {
    width: "fit-content",
    borderRadius: tokens.borderRadiusCircular,
    padding: `0 ${tokens.spacingHorizontalS}`,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase200,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  serialCardStatusGood: {
    color: "#107C10",
    backgroundColor: "#E6F4EA",
    border: "1px solid #107C10",
  },
  serialCardStatusBad: {
    color: "#E41E2F",
    backgroundColor: "#FDEBEC",
    border: "1px solid #E41E2F",
  },
  serialCardDeleteButton: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3,
    ":hover": {
      color: tokens.colorPaletteRedForeground1,
    },
  },
  serialAddButton: {
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: tokens.fontWeightSemibold,
  },
  topRowActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalS,
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  lineDetailCell: {
    backgroundColor: tokens.colorNeutralBackground2,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    borderTopStyle: "none",
  },
  lineDetailGrid: {
    display: "grid",
    gridTemplateColumns: "130px 130px minmax(520px, 1fr) 190px",
    gap: tokens.spacingHorizontalM,
    alignItems: "start",
  },
  lineDetailField: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  lineDetailLabel: {
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },
  lineDetailFieldQty: {
    minWidth: "120px",
    maxWidth: "140px",
  },
  lineDetailFieldSerials: {
    minWidth: "520px",
    width: "100%",
  },
  lineDetailFieldValidation: {
    minWidth: "160px",
    maxWidth: "220px",
    whiteSpace: "normal",
  },
});

const toMb = (sizeBytes: number) => `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
const toDisplay = (value: string | number | null | undefined) =>
  value == null || value === "" ? "--" : String(value);
const toBoolDisplay = (value: number | null | undefined) =>
  value == null ? "--" : value === 1 ? "Yes" : "No";
const toFeatureDisplay = (value: boolean | null | undefined) =>
  value == null ? "--" : value ? "Yes" : "No";
const parseNonNegative = (value: string): number => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
};
const stringEqualsIgnoreCase = (value: string | undefined, expected: string) =>
  (value ?? "").trim().toUpperCase() === expected.toUpperCase();
const normalizeSerial = (serial: EditableSerial): EditableSerial => ({
  id: serial.id ?? undefined,
  serialNo: serial.serialNo.trim(),
  manufacturer: serial.manufacturer?.trim() || null,
  manufacturingDate: serial.manufacturingDate?.trim() || null,
  testDate: serial.testDate?.trim() || null,
  scrapReasonId: serial.scrapReasonId ?? null,
  lidColor: serial.lidColor?.trim() || null,
  lidSize: serial.lidSize?.trim() || null,
});

export function ProductionOrderPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<TabValue>("details");
  const [detail, setDetail] = useState<ProductionOrderDetail | null>(null);
  const [orderHeader, setOrderHeader] = useState<OrderDraftDetail | null>(null);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingLines, setSavingLines] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyAttachmentId, setBusyAttachmentId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lidColors, setLidColors] = useState<Lookup[]>([]);
  const [scrapReasons, setScrapReasons] = useState<Lookup[]>([]);
  const [serialByLineId, setSerialByLineId] = useState<Record<number, EditableSerial[]>>({});
  const [qtyByLineId, setQtyByLineId] = useState<
    Record<number, { quantityAsReceived: number; quantityAsShipped: number; quantityAsScrapped: number }>
  >({});
  const [editingSerial, setEditingSerial] = useState<EditingSerialState | null>(null);
  const [pendingSerialDelete, setPendingSerialDelete] = useState<PendingSerialDeleteState | null>(null);
  const scrapReasonNameById = useMemo(
    () => new Map(scrapReasons.map((reason) => [reason.id, reason.name])),
    [scrapReasons]
  );

  const productionLineRows = useMemo(() => {
    const productionById = new Map((detail?.lines ?? []).map((line) => [line.id, line]));
    const detailedLines = orderHeader?.lines ?? [];

    if (detailedLines.length > 0) {
      return detailedLines.map((line) => {
        const productionLine = productionById.get(line.id);
        const qtyState = qtyByLineId[line.id];
        const qtyReceived = qtyState?.quantityAsReceived ?? productionLine?.quantityAsReceived ?? 0;
        const qtyShipped = qtyState?.quantityAsShipped ?? productionLine?.quantityAsShipped ?? 0;
        const qtyScrapped = qtyState?.quantityAsScrapped ?? productionLine?.quantityAsScrapped ?? 0;
        const requiresSerialNumbers = productionLine?.requiresSerialNumbers ?? false;
        const serialNumbers = serialByLineId[line.id] ?? productionLine?.serialNumbers ?? [];
        return {
          id: line.id,
          lineNo: line.lineNo,
          itemText: `${line.itemNo} - ${line.itemDescription}`,
          quantityAsReceived: qtyReceived,
          quantityAsShipped: qtyShipped,
          quantityAsScrapped: qtyScrapped,
          requiresSerialNumbers,
          serialNumbers,
          tankColor: toDisplay(line.colorName),
          lidColor: toDisplay(line.lidColorName),
          collar: toFeatureDisplay(line.needCollars),
          decal: toFeatureDisplay(line.needDecals),
          filler: toFeatureDisplay(line.needFillers),
          footring: toFeatureDisplay(line.needFootRings),
          gauge: toDisplay(line.gauges),
          valve: toDisplay(line.valveType),
        };
      });
    }

    return (detail?.lines ?? []).map((line) => ({
      id: line.id,
      lineNo: line.lineNo,
      itemText: `${line.itemNo} - ${line.itemDescription}`,
      quantityAsReceived: qtyByLineId[line.id]?.quantityAsReceived ?? line.quantityAsReceived,
      quantityAsShipped: qtyByLineId[line.id]?.quantityAsShipped ?? line.quantityAsShipped,
      quantityAsScrapped: qtyByLineId[line.id]?.quantityAsScrapped ?? line.quantityAsScrapped,
      requiresSerialNumbers: line.requiresSerialNumbers,
      serialNumbers: serialByLineId[line.id] ?? line.serialNumbers,
      tankColor: "--",
      lidColor: "--",
      collar: "--",
      decal: "--",
      filler: "--",
      footring: "--",
      gauge: "--",
      valve: "--",
    }));
  }, [detail, orderHeader, qtyByLineId, serialByLineId]);

  const loadOrder = useCallback(async () => {
    if (!orderId || Number.isNaN(orderId)) {
      setMsg({ type: "error", text: "Invalid order id." });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const [orderData, fullOrderResult, colorResult, scrapReasonResult] = await Promise.all([
        ordersApi.productionDetail(orderId),
        ordersApi.get(orderId).catch(() => null),
        orderLookupsApi.colors().catch(() => [] as Lookup[]),
        orderLookupsApi.scrapReasons().catch(() => [] as Lookup[]),
      ]);
      setDetail(orderData);
      setOrderHeader(fullOrderResult);
      setLidColors(colorResult);
      setScrapReasons(scrapReasonResult);

      try {
        const attachmentData = await ordersApi.attachments(orderId);
        setAttachments(attachmentData);
      } catch (err) {
        const apiError = err as ApiError;
        const body = apiError.body as { message?: string } | undefined;
        setAttachments([]);
        setMsg({
          type: "error",
          text: body?.message ?? "Order loaded, but attachments could not be loaded.",
        });
      }
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMsg({
        type: "error",
        text: body?.message ?? "Unable to load production order.",
      });
      setDetail(null);
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!detail) return;
    const nextQty: Record<
      number,
      { quantityAsReceived: number; quantityAsShipped: number; quantityAsScrapped: number }
    > = {};
    const nextSerials: Record<number, EditableSerial[]> = {};
    for (const line of detail.lines) {
      nextQty[line.id] = {
        quantityAsReceived: line.quantityAsReceived,
        quantityAsShipped: line.quantityAsShipped,
        quantityAsScrapped: line.quantityAsScrapped,
      };
      nextSerials[line.id] = line.serialNumbers.map((serial) => ({
        id: serial.id,
        serialNo: serial.serialNo,
        manufacturer: serial.manufacturer,
        manufacturingDate: serial.manufacturingDate,
        testDate: serial.testDate,
        scrapReasonId: serial.scrapReasonId,
        lidColor: serial.lidColor,
        lidSize: serial.lidSize,
      }));
    }
    setQtyByLineId(nextQty);
    setSerialByLineId(nextSerials);
  }, [detail]);

  const setNonSerialShipped = (lineId: number, rawValue: string) => {
    setQtyByLineId((prev) => {
      const current = prev[lineId];
      if (!current) return prev;
      const clampedShipped = Math.min(parseNonNegative(rawValue), current.quantityAsReceived);
      return {
        ...prev,
        [lineId]: {
          ...current,
          quantityAsShipped: clampedShipped,
          quantityAsScrapped: current.quantityAsReceived - clampedShipped,
        },
      };
    });
  };

  const setNonSerialScrapped = (lineId: number, rawValue: string) => {
    setQtyByLineId((prev) => {
      const current = prev[lineId];
      if (!current) return prev;
      const clampedScrapped = Math.min(parseNonNegative(rawValue), current.quantityAsReceived);
      return {
        ...prev,
        [lineId]: {
          ...current,
          quantityAsScrapped: clampedScrapped,
          quantityAsShipped: current.quantityAsReceived - clampedScrapped,
        },
      };
    });
  };

  const openAddSerialDialog = (lineId: number) => {
    setEditingSerial({
      lineId,
      serialIndex: null,
      value: {
        serialNo: "",
        manufacturer: "",
        manufacturingDate: "",
        testDate: "",
        scrapReasonId: scrapReasons[0]?.id ?? null,
        lidColor: "",
        lidSize: "",
      },
    });
  };

  const openEditSerialDialog = (lineId: number, serialIndex: number) => {
    const lineSerials = serialByLineId[lineId] ?? [];
    const target = lineSerials[serialIndex];
    if (!target) return;
    setEditingSerial({
      lineId,
      serialIndex,
      value: {
        id: target.id,
        serialNo: target.serialNo,
        manufacturer: target.manufacturer ?? "",
        manufacturingDate: target.manufacturingDate ?? "",
        testDate: target.testDate ?? "",
        scrapReasonId: target.scrapReasonId ?? null,
        lidColor: target.lidColor ?? "",
        lidSize: target.lidSize ?? "",
      },
    });
  };

  const saveSerialDialog = () => {
    if (!editingSerial) return;
    const normalized = normalizeSerial(editingSerial.value);
    if (!normalized.serialNo) {
      setMsg({ type: "error", text: "Serial No is required." });
      return;
    }

    setSerialByLineId((prev) => {
      const next = [...(prev[editingSerial.lineId] ?? [])];
      if (editingSerial.serialIndex == null) {
        next.push(normalized);
      } else {
        next[editingSerial.serialIndex] = normalized;
      }
      return {
        ...prev,
        [editingSerial.lineId]: next,
      };
    });
    setEditingSerial(null);
  };

  const deleteSerial = (lineId: number, serialIndex: number) => {
    setSerialByLineId((prev) => ({
      ...prev,
      [lineId]: (prev[lineId] ?? []).filter((_, idx) => idx !== serialIndex),
    }));
  };
  const serialStatusLabel = (serial: EditableSerial) =>
    scrapReasonNameById.get(serial.scrapReasonId ?? -1) ?? "--";

  useEffect(() => {
    const serialLineIds = new Set((detail?.lines ?? []).filter((l) => l.requiresSerialNumbers).map((l) => l.id));
    if (serialLineIds.size === 0) return;

    setQtyByLineId((prev) => {
      const next = { ...prev };
      for (const lineId of serialLineIds) {
        const serials = serialByLineId[lineId] ?? [];
        const goodCount = serials.filter(
          (sn) =>
            stringEqualsIgnoreCase(scrapReasonNameById.get(sn.scrapReasonId ?? -1), "GOOD")
        ).length;
        const badCount = serials.filter(
          (sn) =>
            stringEqualsIgnoreCase(scrapReasonNameById.get(sn.scrapReasonId ?? -1), "BAD")
        ).length;
        if (!next[lineId]) continue;
        next[lineId] = {
          ...next[lineId],
          quantityAsShipped: goodCount,
          quantityAsScrapped: badCount,
        };
      }
      return next;
    });
  }, [detail, scrapReasonNameById, serialByLineId]);

  const lineValidationMessage = (line: (typeof productionLineRows)[number]) => {
    const qtyState = qtyByLineId[line.id];
    if (!qtyState) return null;
    if (qtyState.quantityAsShipped + qtyState.quantityAsScrapped !== qtyState.quantityAsReceived) {
      return "Shipped + Scrapped must equal Qty Received.";
    }

    if (!line.requiresSerialNumbers) return null;

    const serials = serialByLineId[line.id] ?? [];
    if (serials.length !== qtyState.quantityAsReceived) {
      return "Serial count must equal Qty Received.";
    }
    if (serials.some((serial) => !serial.scrapReasonId)) {
      return "All serial rows require Test Status.";
    }
    const hasBlankSerial = serials.some((serial) => !serial.serialNo?.trim());
    if (hasBlankSerial) return "All serial rows require Serial No.";
    const normalized = serials.map((serial) => serial.serialNo.trim().toLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      return "Duplicate serial numbers are not allowed.";
    }
    return null;
  };

  const saveProductionLines = async () => {
    if (!detail) return;
    const firstError = productionLineRows.map(lineValidationMessage).find((msgText) => msgText);
    if (firstError) {
      setMsg({ type: "error", text: firstError });
      return;
    }

    const payload: CompleteProductionRequest = {
      lines: productionLineRows.map((line) => {
        const qtyState = qtyByLineId[line.id];
        return {
          lineId: line.id,
          quantityAsShipped: qtyState?.quantityAsShipped ?? 0,
          quantityAsScrapped: qtyState?.quantityAsScrapped ?? 0,
          serialNumbers: line.requiresSerialNumbers
            ? (serialByLineId[line.id] ?? []).map((serial) => normalizeSerial(serial))
            : [],
        };
      }),
    };

    setSavingLines(true);
    setMsg(null);
    try {
      const updated = await ordersApi.completeProduction(detail.id, payload);
      setDetail(updated);
      setMsg({ type: "success", text: "Production lines updated." });
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMsg({ type: "error", text: body?.message ?? "Failed to update production lines." });
    } finally {
      setSavingLines(false);
    }
  };

  const uploadAttachment = async (file?: File) => {
    if (!file || !detail) return;
    setUploading(true);
    setMsg(null);
    try {
      await ordersApi.uploadAttachment(detail.id, file);
      const updated = await ordersApi.attachments(detail.id);
      setAttachments(updated);
      setMsg({ type: "success", text: "Attachment uploaded." });
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMsg({ type: "error", text: body?.message ?? "Failed to upload attachment." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const deleteAttachment = async (attachment: OrderAttachment) => {
    if (!detail) return;
    if (!window.confirm(`Delete attachment "${attachment.fileName}"?`)) {
      return;
    }

    setBusyAttachmentId(attachment.id);
    setMsg(null);
    try {
      await ordersApi.deleteAttachment(detail.id, attachment.id);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      setMsg({ type: "success", text: "Attachment deleted." });
    } catch {
      setMsg({ type: "error", text: "Failed to delete attachment." });
    } finally {
      setBusyAttachmentId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="large" label="Loading production order..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className={styles.center}>
        <Body1>Production order not found.</Body1>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate("/production")}
        />
        <div className={styles.titleWrap}>
          <Title2>{`${detail.salesOrderNo} (${detail.orderStatus})`}</Title2>
        </div>
      </div>

      {msg && (
        <MessageBar intent={msg.type} style={{ marginBottom: tokens.spacingVerticalM }}>
          <MessageBarBody>{msg.text}</MessageBarBody>
        </MessageBar>
      )}

      <OrderWorkflowWidget
        currentStatus={detail.orderStatus}
        dates={{
          orderCreatedDate: orderHeader?.orderCreatedDate ?? detail.receivedDate ?? "",
          readyForPickupDate:
            orderHeader?.readyForPickupDate ??
            orderHeader?.pickupScheduledDate ??
            detail.receivedDate ??
            orderHeader?.readyToShipDate ??
            orderHeader?.readyToInvoiceDate ??
            null,
          pickupScheduledDate: orderHeader?.pickupScheduledDate ?? null,
          receivedDate: detail.receivedDate ?? orderHeader?.receivedDate ?? null,
          readyToShipDate: orderHeader?.readyToShipDate ?? null,
          readyToInvoiceDate: orderHeader?.readyToInvoiceDate ?? null,
        }}
        canAdvance={false}
      />

      <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as TabValue)}>
        <Tab value="details">Details</Tab>
        <Tab value="lines">Lines ({detail.lines.length})</Tab>
        <Tab value="attachments">Attachments ({attachments.length})</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {tab === "details" && (
          <div className={styles.form}>
            <div className={styles.row}>
              <Field label="Customer">
                <Input value={detail.customerName} readOnly />
              </Field>
              <Field label="Received Date">
                <Input value={detail.receivedDate?.slice(0, 10) ?? ""} type="date" readOnly />
              </Field>
            </div>

            <div className={styles.row}>
              <Field label="Return Scrap">
                <Input value={toBoolDisplay(orderHeader?.returnScrap)} readOnly />
              </Field>
              <Field label="Return Brass">
                <Input value={toBoolDisplay(orderHeader?.returnBrass)} readOnly />
              </Field>
            </div>

            <div className={styles.row}>
              <Field label="Pickup Address">
                <Textarea value={toDisplay(detail.pickUpAddress)} rows={3} readOnly />
              </Field>
              <Field label="Trailer">
                <Input value={toDisplay(detail.trailerNo)} readOnly />
              </Field>
            </div>

            <Field label="Comments">
              <Textarea value={toDisplay(detail.orderComments)} rows={4} readOnly />
            </Field>
          </div>
        )}

        {tab === "lines" && (
          <div>
            <div className={styles.topRowActions}>
              <Body1 style={{ fontWeight: tokens.fontWeightSemibold }}>Order Lines</Body1>
              <Button appearance="primary" disabled={savingLines} onClick={() => void saveProductionLines()}>
                {savingLines ? "Saving..." : "Save Lines"}
              </Button>
            </div>

            {productionLineRows.length === 0 ? (
              <Body1>No lines available.</Body1>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Line</TableHeaderCell>
                    <TableHeaderCell>Item</TableHeaderCell>
                    <TableHeaderCell>Qty Received</TableHeaderCell>
                    <TableHeaderCell>Tank Color</TableHeaderCell>
                    <TableHeaderCell>Lid Color</TableHeaderCell>
                    <TableHeaderCell>Collar</TableHeaderCell>
                    <TableHeaderCell>Decal</TableHeaderCell>
                    <TableHeaderCell>Filler</TableHeaderCell>
                    <TableHeaderCell>Footring</TableHeaderCell>
                    <TableHeaderCell>Gauge</TableHeaderCell>
                    <TableHeaderCell>Valve</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionLineRows.map((line) => (
                    <Fragment key={line.id}>
                      <TableRow
                        className={styles.lineTopRow}
                        data-testid={`line-top-row-${line.id}`}
                        style={{ borderBottom: "none" }}
                      >
                        <TableCell className={styles.lineCellTall}>{line.lineNo}</TableCell>
                        <TableCell className={styles.lineCellTall}>{line.itemText}</TableCell>
                        <TableCell className={`${styles.lineCellTall} ${styles.priceCell}`}>
                          {line.quantityAsReceived}
                        </TableCell>
                        <TableCell className={styles.lineCellTall}>{line.tankColor}</TableCell>
                        <TableCell className={styles.lineCellTall}>{line.lidColor}</TableCell>
                        <TableCell className={styles.lineCellTall}>{line.collar}</TableCell>
                        <TableCell className={styles.lineCellTall}>{line.decal}</TableCell>
                        <TableCell className={styles.lineCellTall}>{line.filler}</TableCell>
                        <TableCell className={styles.lineCellTall}>{line.footring}</TableCell>
                        <TableCell className={styles.lineCellTall}>{line.gauge}</TableCell>
                        <TableCell className={styles.lineCellTall}>{line.valve}</TableCell>
                      </TableRow>
                      <TableRow
                        className={styles.lineDetailRow}
                        data-testid={`line-detail-row-${line.id}`}
                        style={{ borderTop: "none" }}
                      >
                        <TableCell className={styles.lineDetailCell} />
                        <TableCell className={styles.lineDetailCell} colSpan={10}>
                          <div
                            className={styles.lineDetailGrid}
                            style={{
                              gridTemplateColumns: line.requiresSerialNumbers
                                ? "130px 130px minmax(520px, 1fr) 190px"
                                : "130px 130px minmax(190px, 1fr)",
                            }}
                          >
                            <div
                              className={`${styles.lineDetailField} ${styles.lineDetailFieldQty}`}
                              data-testid={`line-qty-shipped-field-${line.id}`}
                            >
                              <Body1 className={styles.lineDetailLabel}>Qty Shipped</Body1>
                              {line.requiresSerialNumbers ? (
                                <Body1>{qtyByLineId[line.id]?.quantityAsShipped ?? line.quantityAsShipped}</Body1>
                              ) : (
                                <Input
                                  className={styles.lineQuantityInput}
                                  type="number"
                                  min={0}
                                  value={String(qtyByLineId[line.id]?.quantityAsShipped ?? line.quantityAsShipped)}
                                  onChange={(event) => setNonSerialShipped(line.id, event.target.value)}
                                />
                              )}
                            </div>
                            <div
                              className={`${styles.lineDetailField} ${styles.lineDetailFieldQty}`}
                              data-testid={`line-qty-scrapped-field-${line.id}`}
                            >
                              <Body1 className={styles.lineDetailLabel}>Qty Scrapped</Body1>
                              {line.requiresSerialNumbers ? (
                                <Body1>{qtyByLineId[line.id]?.quantityAsScrapped ?? line.quantityAsScrapped}</Body1>
                              ) : (
                                <Input
                                  className={styles.lineQuantityInput}
                                  type="number"
                                  min={0}
                                  value={String(qtyByLineId[line.id]?.quantityAsScrapped ?? line.quantityAsScrapped)}
                                  onChange={(event) => setNonSerialScrapped(line.id, event.target.value)}
                                />
                              )}
                            </div>
                            {line.requiresSerialNumbers && (
                              <div
                                className={`${styles.lineDetailField} ${styles.lineDetailFieldSerials}`}
                                data-testid={`line-serials-field-${line.id}`}
                              >
                                <Body1 className={styles.lineDetailLabel}>
                                  {`Serials (Good: ${
                                    (serialByLineId[line.id] ?? []).filter((sn) =>
                                      stringEqualsIgnoreCase(
                                        scrapReasonNameById.get(sn.scrapReasonId ?? -1),
                                        "GOOD"
                                      )
                                    ).length
                                  } Bad: ${
                                    (serialByLineId[line.id] ?? []).filter((sn) =>
                                      stringEqualsIgnoreCase(
                                        scrapReasonNameById.get(sn.scrapReasonId ?? -1),
                                        "BAD"
                                      )
                                    ).length
                                  })`}
                                </Body1>
                                <div>
                                  <div className={styles.lineActions}>
                                    <Button
                                      className={styles.serialAddButton}
                                      size="small"
                                      appearance="secondary"
                                      onClick={() => openAddSerialDialog(line.id)}
                                    >
                                      Add Serial Number
                                    </Button>
                                  </div>
                                  <div className={styles.serialCardsWrap}>
                                    {(serialByLineId[line.id] ?? []).map((serial, index) => (
                                      <div
                                        key={serial.id ?? `${serial.serialNo}-${index}`}
                                        className={styles.serialCard}
                                        data-testid={`serial-card-${line.id}-${index}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openEditSerialDialog(line.id, index)}
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            openEditSerialDialog(line.id, index);
                                          }
                                        }}
                                      >
                                        <div className={styles.serialCardMain}>
                                          <Body1 className={styles.serialCardSerialNo}>
                                            {serial.serialNo || "--"}
                                          </Body1>
                                          <Body1
                                            className={mergeClasses(
                                              styles.serialCardStatus,
                                              stringEqualsIgnoreCase(serialStatusLabel(serial), "BAD")
                                                ? styles.serialCardStatusBad
                                                : styles.serialCardStatusGood
                                            )}
                                          >
                                            {serialStatusLabel(serial)}
                                          </Body1>
                                        </div>
                                        <Button
                                          className={styles.serialCardDeleteButton}
                                          size="small"
                                          appearance="subtle"
                                          icon={<Delete24Regular />}
                                          aria-label={`Delete serial ${serial.serialNo || index + 1}`}
                                          data-testid={`serial-card-delete-${line.id}-${index}`}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setPendingSerialDelete({
                                              lineId: line.id,
                                              serialIndex: index,
                                              serialNo: serial.serialNo || "this serial",
                                            });
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            <div
                              className={`${styles.lineDetailField} ${styles.lineDetailFieldValidation}`}
                              data-testid={`line-validation-field-${line.id}`}
                            >
                              <Body1 className={styles.lineDetailLabel}>Validation</Body1>
                              <Body1>{lineValidationMessage(line) ?? "--"}</Body1>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {tab === "attachments" && (
          <div>
            <div className={styles.actionsRow}>
              <input
                ref={fileInputRef}
                className={styles.hiddenInput}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={(event) => void uploadAttachment(event.target.files?.[0])}
              />
              <Button
                appearance="primary"
                icon={<ArrowUpload24Regular />}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Uploading..." : "Upload Attachment"}
              </Button>
            </div>

            {attachments.length === 0 ? (
              <Body1>No attachments yet.</Body1>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>File Name</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Size</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attachments.map((attachment) => {
                    const downloadUrl = ordersApi.attachmentDownloadUrl(detail.id, attachment.id);
                    return (
                      <TableRow key={attachment.id}>
                        <TableCell>{attachment.fileName}</TableCell>
                        <TableCell>{attachment.contentType}</TableCell>
                        <TableCell>{toMb(attachment.sizeBytes)}</TableCell>
                        <TableCell>{new Date(attachment.createdAtUtc).toLocaleString()}</TableCell>
                        <TableCell>
                          <div style={{ display: "flex", gap: tokens.spacingHorizontalS }}>
                            <a className={styles.fileLink} href={downloadUrl} target="_blank" rel="noreferrer">
                              View
                            </a>
                            <a className={styles.fileLink} href={downloadUrl} download>
                              Download
                            </a>
                            <Button
                              appearance="subtle"
                              icon={<Delete24Regular />}
                              size="small"
                              disabled={busyAttachmentId === attachment.id}
                              onClick={() => void deleteAttachment(attachment)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>

      <Dialog open={editingSerial != null} onOpenChange={(_, data) => !data.open && setEditingSerial(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{editingSerial?.serialIndex == null ? "Add Serial Number" : "Edit Serial Number"}</DialogTitle>
            <DialogContent>
              {editingSerial && (
                <div className={styles.form}>
                  <Field label="Serial No" required>
                    <Input
                      value={editingSerial.value.serialNo}
                      onChange={(_, data) =>
                        setEditingSerial((prev) =>
                          prev
                            ? {
                                ...prev,
                                value: { ...prev.value, serialNo: data.value },
                              }
                            : prev
                        )
                      }
                    />
                  </Field>
                  <Field label="Manufacturer">
                    <Input
                      value={editingSerial.value.manufacturer ?? ""}
                      onChange={(_, data) =>
                        setEditingSerial((prev) =>
                          prev
                            ? {
                                ...prev,
                                value: { ...prev.value, manufacturer: data.value },
                              }
                            : prev
                        )
                      }
                    />
                  </Field>
                  <div className={styles.row}>
                    <Field label="Manfu. Date">
                      <Input
                        value={editingSerial.value.manufacturingDate ?? ""}
                        onChange={(_, data) =>
                          setEditingSerial((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  value: { ...prev.value, manufacturingDate: data.value },
                                }
                              : prev
                          )
                        }
                      />
                    </Field>
                    <Field label="Test Date">
                      <Input
                        value={editingSerial.value.testDate ?? ""}
                        onChange={(_, data) =>
                          setEditingSerial((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  value: { ...prev.value, testDate: data.value },
                                }
                              : prev
                          )
                        }
                      />
                    </Field>
                  </div>
                  <div className={styles.row}>
                    <Field label="Test Status">
                      <Select
                        value={String(editingSerial.value.scrapReasonId ?? "")}
                        onChange={(_, data) =>
                          setEditingSerial((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  value: {
                                    ...prev.value,
                                    scrapReasonId: data.value
                                      ? Number(data.value)
                                      : null,
                                  },
                                }
                              : prev
                          )
                        }
                      >
                        <option value="">--</option>
                        {scrapReasons.map((reason) => (
                          <option key={reason.id} value={String(reason.id)}>
                            {reason.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Lid Color">
                      <Select
                        value={editingSerial.value.lidColor ?? ""}
                        onChange={(_, data) =>
                          setEditingSerial((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  value: { ...prev.value, lidColor: data.value },
                                }
                              : prev
                          )
                        }
                      >
                        <option value="">--</option>
                        {lidColors.map((color) => (
                          <option key={color.id} value={color.name}>
                            {color.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <Field label="Lid Size">
                    <Select
                      value={editingSerial.value.lidSize ?? ""}
                      onChange={(_, data) =>
                        setEditingSerial((prev) =>
                          prev
                            ? {
                                ...prev,
                                value: { ...prev.value, lidSize: data.value },
                              }
                            : prev
                        )
                      }
                    >
                      <option value="">--</option>
                      {LID_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={saveSerialDialog}>
                Save Serial
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={pendingSerialDelete != null}
        onOpenChange={(_, data) => {
          if (!data.open) {
            setPendingSerialDelete(null);
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete Serial Number</DialogTitle>
            <DialogContent>
              <Body1>{`Are you sure you want to delete serial "${pendingSerialDelete?.serialNo ?? ""}"?`}</Body1>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                onClick={() => {
                  if (!pendingSerialDelete) return;
                  deleteSerial(pendingSerialDelete.lineId, pendingSerialDelete.serialIndex);
                  setPendingSerialDelete(null);
                }}
              >
                Delete
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
