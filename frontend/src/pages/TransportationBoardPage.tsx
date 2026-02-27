import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Body1,
  Button,
  Input,
  makeStyles,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title2,
  tokens,
  Dropdown,
} from "@fluentui/react-components";
import {
  ArrowClockwise24Regular,
  BoxCheckmark24Regular,
  Save24Regular,
  VehicleTruckProfile24Regular,
} from "@fluentui/react-icons";
import { ordersApi, orderLookupsApi } from "../services/orders";
import type {
  TransportBoardItem,
  TransportBoardUpdate,
  TransportBoardParams,
} from "../types/order";
import {
  ORDER_STATUS_KEYS,
  getOrderStatusDisplayLabel,
  type OrderWorkflowStatus,
} from "../types/order";
import type { Lookup, PaginatedResponse } from "../types/customer";
import { ApiError } from "../services/api";

const UNPAGED_FETCH_SIZE = 1000;

type EditableField =
  | "trailerNo"
  | "carrier"
  | "dispatchDate"
  | "scheduledDate"
  | "transportationStatus"
  | "transportationNotes";

const useStyles = makeStyles({
  root: {
    marginTop: `-${tokens.spacingVerticalXL}`,
    marginLeft: `-${tokens.spacingHorizontalXXL}`,
    marginRight: `-${tokens.spacingHorizontalXXL}`,
    marginBottom: `-${tokens.spacingVerticalXL}`,
    minHeight: "100vh",
    backgroundColor: "#eceef1",
  },
  headerBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    flexWrap: "wrap",
  },
  title: {
    color: tokens.colorNeutralForeground1,
  },
  titleWrap: {
    flexGrow: 1,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  toolbarField: {
    minWidth: "132px",
    maxWidth: "170px",
    backgroundColor: "#fff",
    borderRadius: "2px",
    "& .fui-Input__input": {
      fontSize: "12px",
    },
  },
  toolbarSearch: {
    minWidth: "260px",
    backgroundColor: "#fff",
    borderRadius: "2px",
    "& .fui-Input__input": {
      fontSize: "12px",
    },
  },
  toolbarButton: {
    minHeight: "32px",
    backgroundColor: "#d9edf9",
    border: "1px solid #bad5e7",
    color: "#2d6f99",
  },
  filters: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "4px 10px",
    borderBottom: "1px solid #c9c9c9",
    backgroundColor: "#f8f8f8",
    minHeight: "28px",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#3d3d3d",
  },
  statValue: {
    color: "#111",
    fontWeight: 600,
  },
  contentWrap: {
    padding: "8px",
  },
  boardLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 4.3fr) minmax(300px, 1.25fr)",
    gap: "8px",
    alignItems: "start",
  },
  tableWrap: {
    overflowX: "auto",
    overflowY: "auto",
    maxHeight: "calc(100vh - 265px)",
    border: "1px solid #c4c7cc",
    borderRadius: "4px",
    backgroundColor: "#fff",
    "& th, & td": {
      borderBottom: "1px solid #d8d8d8",
      borderRight: "1px solid #dcdcdc",
    },
    "& th:last-child, & td:last-child": {
      borderRight: "none",
    },
  },
  rowFixed: {
    height: "38px",
    minHeight: "38px",
    maxHeight: "38px",
    "& td": {
      borderBottom: "none !important",
    },
  },
  addressSubRow: {
    height: "14px",
    minHeight: "14px",
    maxHeight: "14px",
    backgroundColor: "#fff",
    "& td": {
      borderRight: "none !important",
    },
    "&:hover td": {
      backgroundColor: "#f2f2f2",
    },
  },
  addressSubRowSelected: {
    backgroundColor: "#eaf3ff",
    "& td": {
      backgroundColor: "#eaf3ff !important",
    },
  },
  addressSpanCell: {
    paddingTop: "0px",
    paddingBottom: "0px",
    paddingLeft: "30px",
    fontSize: "11px",
    lineHeight: "14px",
    color: "#5e6670",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "560px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #d8d8d8",
    borderRight: "none !important",
  },
  addressRemainderCell: {
    padding: "0",
    backgroundColor: "#f5f1df",
    borderBottom: "1px solid #d8d8d8",
    borderRight: "none !important",
  },
  stickyHeaderCell: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    backgroundColor: "#ececec",
    fontSize: "11px",
    fontWeight: 700,
    color: "#2d2d2d",
    paddingTop: "4px",
    paddingBottom: "4px",
    lineHeight: "14px",
  },
  editableHeaderCell: {
    backgroundColor: "#e6dcff",
  },
  darkPurpleDividerRight: {
    borderRight: "1px solid #dcdcdc !important",
  },
  rowSelected: {
    backgroundColor: "#eaf3ff",
    "& td": {
      backgroundColor: "#eaf3ff !important",
    },
  },
  rowHoverLinked: {
    "& td": {
      backgroundColor: "#f2f2f2 !important",
    },
  },
  selectedCell: {
    backgroundColor: "#eaf3ff !important",
  },
  editableCell: {
    backgroundColor: "#f2edff",
    minWidth: "122px",
    maxWidth: "122px",
    overflow: "hidden",
    paddingTop: "1px",
    paddingBottom: "1px",
    paddingLeft: "2px",
    paddingRight: "2px",
    boxSizing: "border-box",
  },
  topAlignedEditorCell: {
    verticalAlign: "top",
    paddingTop: "2px",
  },
  movementPill: {
    display: "inline-block",
    padding: `2px ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusCircular,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  movementPickup: {
    backgroundColor: "#e8f1fd",
    color: "#0f5ea8",
  },
  movementShipment: {
    backgroundColor: "#ece7ff",
    color: "#5c3fb3",
  },
  orderNoCell: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: "2px",
    minWidth: "108px",
  },
  orderNoDataCell: {
    paddingLeft: "6px",
    paddingRight: "6px",
    paddingTop: "0px",
    paddingBottom: "0px",
    verticalAlign: "bottom",
  },
  orderNoPrimary: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  movementIconPickup: {
    color: "#0f5ea8",
    width: "16px",
    height: "16px",
    padding: "2px",
    borderRadius: "999px",
    backgroundColor: "#e8f1fd",
    flexShrink: 0,
  },
  movementIconShipment: {
    color: "#5c3fb3",
    width: "16px",
    height: "16px",
    padding: "2px",
    borderRadius: "999px",
    backgroundColor: "#ece7ff",
    flexShrink: 0,
  },
  tableBodyText: {
    fontSize: "11px",
    lineHeight: "14px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "140px",
  },
  statusPill: {
    display: "inline-block",
    padding: "1px 7px",
    borderRadius: tokens.borderRadiusCircular,
    fontSize: "10px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  statusCellWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "4px",
  },
  statusActionButton: {
    minHeight: "22px",
    fontSize: "10px",
    fontWeight: 600,
    paddingLeft: "8px",
    paddingRight: "8px",
    border: "1px solid #7f8fa6",
    borderRadius: "999px",
    backgroundColor: "#eef4ff",
    color: "#214c9b",
  },
  statusOpen: {
    backgroundColor: "#fff3bf",
    color: "#8a6d00",
  },
  statusCalled: {
    backgroundColor: "#dbeafe",
    color: "#0b4f99",
  },
  statusScheduled: {
    backgroundColor: "#ffe7bf",
    color: "#8a5a00",
  },
  statusDispatched: {
    backgroundColor: "#d5f2dc",
    color: "#146a2e",
  },
  compactInput: {
    width: "112px",
    minHeight: "24px",
  },
  textCompactInput: {
    width: "120px",
    minHeight: "18px !important",
    height: "18px !important",
    maxHeight: "18px !important",
    "& input": {
      paddingTop: "0px !important",
      paddingBottom: "0px !important",
      lineHeight: "16px !important",
      fontSize: "12px",
    },
    "& .fui-Input__input": {
      paddingTop: "0px !important",
      paddingBottom: "0px !important",
      lineHeight: "16px !important",
      fontSize: "12px",
    },
  },
  notesInput: {
    width: "120px",
    minHeight: "18px !important",
    height: "18px !important",
    maxHeight: "18px !important",
    "& input": {
      paddingTop: "0px !important",
      paddingBottom: "0px !important",
      lineHeight: "16px !important",
      fontSize: "12px",
    },
    "& .fui-Input__input": {
      paddingTop: "0px !important",
      paddingBottom: "0px !important",
      lineHeight: "16px !important",
      fontSize: "12px",
    },
  },
  notesCell: {
    minWidth: "132px",
    maxWidth: "132px",
    overflow: "hidden",
    paddingTop: "2px",
    paddingBottom: "2px",
    verticalAlign: "top",
  },
  notesEditor: {
    width: "100%",
    height: "44px",
    minHeight: "44px",
    maxHeight: "44px",
    boxSizing: "border-box",
    border: "1px solid #c9ccd1",
    borderRadius: "3px",
    backgroundColor: "#fff",
    padding: "3px 6px",
    fontSize: "11px",
    lineHeight: "12px",
    color: "#1f1f1f",
    resize: "none",
    outlineStyle: "none",
    overflow: "hidden",
  },
  nativeCompactInput: {
    width: "100%",
    maxWidth: "100%",
    display: "block",
    height: "44px",
    minHeight: "44px",
    maxHeight: "44px",
    boxSizing: "border-box",
    border: "1px solid #b9bcc2",
    borderRadius: "2px",
    padding: "0 5px",
    fontSize: "11px",
    lineHeight: "42px",
    backgroundColor: "#fff",
    outlineStyle: "none",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  nativeCompactInputTopText: {
    paddingTop: "4px",
    paddingBottom: "0px",
    lineHeight: "16px",
  },
  multiRowEditor: {
    width: "100%",
    height: "44px",
    minHeight: "44px",
    maxHeight: "44px",
    boxSizing: "border-box",
    border: "1px solid #b9bcc2",
    borderRadius: "2px",
    padding: "4px 6px 0 6px",
    fontSize: "11px",
    lineHeight: "14px",
    backgroundColor: "#fff",
    outlineStyle: "none",
    resize: "none",
    overflow: "auto",
  },
  monthDayEditorWrap: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  monthDayDisplayInput: {
    flex: 1,
    minWidth: 0,
    height: "44px",
    minHeight: "44px",
    maxHeight: "44px",
    boxSizing: "border-box",
    border: "1px solid #b9bcc2",
    borderRadius: "2px",
    padding: "0 6px",
    fontSize: "11px",
    lineHeight: "42px",
    backgroundColor: "#fff",
    outlineStyle: "none",
  },
  hiddenDatePicker: {
    position: "absolute",
    width: "0",
    height: "0",
    opacity: 0,
    pointerEvents: "none",
  },
  dateEditButton: {
    height: "22px",
    minWidth: "34px",
    border: "1px solid #b9bcc2",
    borderRadius: "2px",
    backgroundColor: "#fff",
    color: "#2f2f2f",
    fontSize: "10px",
    lineHeight: "20px",
    padding: "0 6px",
    cursor: "pointer",
  },
  sidePanel: {
    position: "sticky",
    top: "8px",
    border: "1px solid #d3d5d9",
    borderRadius: "5px",
    padding: "7px 10px",
    backgroundColor: "#eaf3ff",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  sectionTitle: {
    fontWeight: 700,
    color: "#222",
    fontSize: "17px",
    lineHeight: "18px",
  },
  infoLine: {
    fontSize: "13px",
    lineHeight: "16px",
    color: "#222",
  },
  sideSection: {
    borderTop: "1px solid #d3d5d9",
    paddingTop: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  sideSectionTitle: {
    fontWeight: 700,
    marginBottom: "1px",
    color: "#222",
    fontSize: "17px",
    lineHeight: "18px",
  },
  linesWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  lineItem: {
    fontSize: "12px",
    lineHeight: "14px",
    color: "#222",
  },
  kvRow: {
    display: "grid",
    gridTemplateColumns: "62px 1fr",
    gap: "5px",
    alignItems: "start",
  },
  kvLabel: {
    fontWeight: 700,
    color: "#222",
    fontSize: "12px",
    lineHeight: "14px",
  },
  kvValue: {
    color: "#222",
    fontSize: "12px",
    lineHeight: "14px",
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
  commentsBox: {
    border: "1px solid #d3d5d9",
    borderRadius: "4px",
    backgroundColor: "#f3f3f4",
    padding: "6px",
  },
  lineCard: {
    border: "1px solid #d3d5d9",
    borderRadius: "4px",
    backgroundColor: "#e9eaec",
    padding: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  lineCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    lineHeight: "14px",
    fontWeight: 700,
    color: "#222",
  },
  lineCardChevron: {
    color: "#6f7680",
    fontSize: "10px",
    lineHeight: "12px",
  },
  openOrderButton: {
    marginTop: "8px",
    alignSelf: "center",
    fontSize: "11px",
    minHeight: "22px",
    backgroundColor: "#d9edf9",
    color: "#2d6f99",
    border: "1px solid #bad5e7",
    borderRadius: "4px",
  },
  bottomBar: {
    marginTop: "8px",
    borderTop: "1px solid #c8ccd2",
    borderRadius: "0",
    padding: "5px 8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f2f4f7",
    color: "#2f2f2f",
    minHeight: "34px",
  },
  actions: {
    display: "flex",
    gap: "6px",
  },
  pager: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    marginTop: "6px",
  },
  center: {
    display: "flex",
    justifyContent: "center",
    marginTop: tokens.spacingVerticalXXL,
  },
});

function toMonthDayValue(value: string | null): string {
  if (!value) return "";
  const raw = value.trim();
  if (raw.length >= 10 && raw[4] === "-" && raw[7] === "-") {
    return `${raw.slice(5, 7)}/${raw.slice(8, 10)}`;
  }
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return "";
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${m}/${d}`;
}

function toDatePickerValue(value: string | null): string {
  if (!value) return "";
  const raw = value.trim();
  if (raw.length >= 10 && raw[4] === "-" && raw[7] === "-") return raw.slice(0, 10);
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toTransportDateFromPicker(value: string): string | null {
  return value ? `${value}T00:00:00` : null;
}

function toTransportDateFromMonthDay(value: string, existingValue: string | null): string | null {
  const text = value.trim();
  if (!text) return null;

  const match = text.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return existingValue;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return existingValue;

  const existing = existingValue ? new Date(existingValue) : null;
  const year =
    existing && !Number.isNaN(existing.getTime()) ? existing.getFullYear() : new Date().getFullYear();

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}T00:00:00`;
}

function formatPanelDate(value: string | null): string {
  if (!value) return "--";
  const raw = value.trim();
  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) return dt.toLocaleDateString();
  if (raw.length >= 10 && raw[4] === "-" && raw[7] === "-") {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${m}/${d}/${y}`;
  }
  return raw;
}

function getListAddress(row: TransportBoardItem): string {
  return row.movementType === "Shipment"
    ? row.shipToAddressStreet ?? row.shipToAddress ?? "--"
    : row.pickUpAddressStreet ?? row.pickUpAddress ?? "--";
}

export function TransportationBoardPage() {
  const styles = useStyles();
  const navigate = useNavigate();

  const [sites, setSites] = useState<Lookup[]>([]);
  const [data, setData] = useState<PaginatedResponse<TransportBoardItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState("");
  const [siteId, setSiteId] = useState("");
  const [carrier, setCarrier] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [advancingId, setAdvancingId] = useState<number | null>(null);
  const [dirtyById, setDirtyById] = useState<Record<number, Partial<TransportBoardUpdate>>>(
    {}
  );

  useEffect(() => {
    orderLookupsApi.sites().then(setSites);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: TransportBoardParams = {
        page: 1,
        pageSize: UNPAGED_FETCH_SIZE,
        search: search || undefined,
        movementType: movementType ? (movementType as "Pickup" | "Shipment") : undefined,
        siteId: siteId ? Number(siteId) : undefined,
        carrier: carrier || undefined,
      };
      const result = await ordersApi.transportBoard(params);
      setData(result);
      setSelectedId((prev) => prev ?? result.items[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }, [search, movementType, siteId, carrier]);

  useEffect(() => {
    void load();
  }, [load]);

  const mergedItems = useMemo(() => {
    if (!data) return [];
    return data.items.map((row) => {
      const dirty = dirtyById[row.id];
      if (!dirty) return row;
      return {
        ...row,
        trailerNo: dirty.trailerNo ?? row.trailerNo,
        carrier: dirty.carrier ?? row.carrier,
        dispatchDate: dirty.dispatchDate ?? row.dispatchDate,
        scheduledDate: dirty.scheduledDate ?? row.scheduledDate,
        transportationStatus: dirty.transportationStatus ?? row.transportationStatus,
        transportationNotes: dirty.transportationNotes ?? row.transportationNotes,
      };
    });
  }, [data, dirtyById]);

  const selectedRow =
    mergedItems.find((row) => row.id === selectedId) ?? mergedItems[0] ?? null;

  const updateEditableField = (id: number, field: EditableField, value: string | null) => {
    setDirtyById((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        id,
        [field]: value,
      },
    }));
  };

  const saveAll = async () => {
    const updates = Object.values(dirtyById).filter(
      (u): u is TransportBoardUpdate => typeof u.id === "number"
    );
    if (updates.length === 0) return;

    setSaving(true);
    setMsg(null);
    try {
      const saved = await ordersApi.saveTransportBoard(updates);
      setData((prev) => {
        if (!prev) return prev;
        const byId = new Map(saved.map((s) => [s.id, s]));
        return {
          ...prev,
          items: prev.items.map((row) => byId.get(row.id) ?? row),
        };
      });
      setDirtyById({});
      setMsg({ type: "success", text: `Saved ${saved.length} order update(s).` });
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMsg({
        type: "error",
        text: body?.message ?? "Failed to save transportation updates.",
      });
    } finally {
      setSaving(false);
    }
  };

  const getNextStatusAction = (orderStatus: string) => {
    if (orderStatus === ORDER_STATUS_KEYS.READY_FOR_PICKUP) {
      return {
        label: "Mark Pickup Scheduled",
        targetStatus: ORDER_STATUS_KEYS.PICKUP_SCHEDULED as OrderWorkflowStatus,
      };
    }
    if (orderStatus === ORDER_STATUS_KEYS.READY_TO_SHIP) {
      return {
        label: "Mark Ready for Invoicing",
        targetStatus: ORDER_STATUS_KEYS.READY_TO_INVOICE as OrderWorkflowStatus,
      };
    }
    return null;
  };

  const advanceTransportRowStatus = async (row: TransportBoardItem) => {
    const action = getNextStatusAction(row.orderStatus);
    if (!action) return;

    setAdvancingId(row.id);
    setMsg(null);
    try {
      await ordersApi.advanceStatus(row.id, action.targetStatus);
      setMsg({
        type: "success",
        text: `Order ${row.salesOrderNo} moved to ${getOrderStatusDisplayLabel(action.targetStatus)}.`,
      });
      await load();
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMsg({
        type: "error",
        text:
          body?.message ??
          `Failed to move order ${row.salesOrderNo} to ${getOrderStatusDisplayLabel(action.targetStatus)}.`,
      });
    } finally {
      setAdvancingId(null);
    }
  };

  const dirtyCount = Object.keys(dirtyById).length;
  const panelLineItems = useMemo(() => {
    if (!selectedRow?.lineSummary) return [];
    return selectedRow.lineSummary
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part.length > 0 && part !== "...");
  }, [selectedRow]);
  const selectedAddress = useMemo(() => {
    if (!selectedRow) return "--";
    return selectedRow.movementType === "Shipment"
      ? selectedRow.shipToAddress ?? "--"
      : selectedRow.pickUpAddress ?? "--";
  }, [selectedRow]);

  return (
    <div className={styles.root}>
      <div className={styles.headerBar}>
        <div className={styles.titleWrap}>
          <Title2 className={styles.title}>Transportation Dispatch</Title2>
        </div>
        <div className={styles.toolbar}>
          <Button
            appearance="subtle"
            className={styles.toolbarButton}
            icon={<ArrowClockwise24Regular />}
            onClick={load}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            appearance="primary"
            className={styles.toolbarButton}
            icon={<Save24Regular />}
            onClick={saveAll}
            disabled={saving || dirtyCount === 0}
          >
            Save All
          </Button>
        </div>
      </div>

      <div className={styles.filters}>
        <Dropdown
          className={styles.toolbarField}
          value={sites.find((s) => String(s.id) === siteId)?.name ?? "Site: All Sites"}
          selectedOptions={siteId ? [siteId] : []}
          onOptionSelect={(_, d) => setSiteId(d.optionValue ?? "")}
          clearable
        >
          {sites.map((site) => (
            <Option key={site.id} value={String(site.id)}>
              {site.name}
            </Option>
          ))}
        </Dropdown>
        <Input
          className={styles.toolbarField}
          placeholder="Carrier: All"
          value={carrier}
          onChange={(_, d) => setCarrier(d.value)}
        />
        <Dropdown
          value={movementType || "Movement Type: All"}
          selectedOptions={movementType ? [movementType] : []}
          onOptionSelect={(_, d) => setMovementType(d.optionValue ?? "")}
          clearable
        >
          <Option value="Pickup">Pickup</Option>
          <Option value="Shipment">Shipment</Option>
        </Dropdown>
        <Input
          className={styles.toolbarSearch}
          placeholder="Search Order No, Customer..."
          value={search}
          onChange={(_, d) => setSearch(d.value)}
        />
      </div>

      <div className={styles.contentWrap}>
        {msg && (
          <MessageBar intent={msg.type} style={{ marginBottom: tokens.spacingVerticalM }}>
            <MessageBarBody>{msg.text}</MessageBarBody>
          </MessageBar>
        )}
        {loading ? (
          <div className={styles.center}>
            <Spinner size="large" label="Loading transportation queue..." />
          </div>
        ) : !data || mergedItems.length === 0 ? (
          <div className={styles.center}>
            <Body1>No transportation orders found.</Body1>
          </div>
        ) : (
          <>
            <div className={styles.boardLayout}>
            <div className={styles.tableWrap}>
              <Table size="extra-small">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell className={styles.stickyHeaderCell}>Order No</TableHeaderCell>
                    <TableHeaderCell className={styles.stickyHeaderCell}>Customer</TableHeaderCell>
                    <TableHeaderCell className={styles.stickyHeaderCell}>Order Date</TableHeaderCell>
                    <TableHeaderCell className={styles.stickyHeaderCell}>Site</TableHeaderCell>
                    <TableHeaderCell className={styles.stickyHeaderCell}>Status</TableHeaderCell>
                    <TableHeaderCell className={`${styles.stickyHeaderCell} ${styles.editableHeaderCell} ${styles.darkPurpleDividerRight}`} style={{ backgroundColor: "#e6dcff", borderRight: "1px solid #dcdcdc" }}>Trailer No</TableHeaderCell>
                    <TableHeaderCell className={`${styles.stickyHeaderCell} ${styles.editableHeaderCell} ${styles.darkPurpleDividerRight}`} style={{ backgroundColor: "#e6dcff", borderRight: "1px solid #dcdcdc" }}>Carrier</TableHeaderCell>
                    <TableHeaderCell className={`${styles.stickyHeaderCell} ${styles.editableHeaderCell} ${styles.darkPurpleDividerRight}`} style={{ backgroundColor: "#e6dcff", borderRight: "1px solid #dcdcdc" }}>Dispatched</TableHeaderCell>
                    <TableHeaderCell className={`${styles.stickyHeaderCell} ${styles.editableHeaderCell} ${styles.darkPurpleDividerRight}`} style={{ backgroundColor: "#e6dcff", borderRight: "1px solid #dcdcdc" }}>Scheduled</TableHeaderCell>
                    <TableHeaderCell className={`${styles.stickyHeaderCell} ${styles.editableHeaderCell}`} style={{ backgroundColor: "#e6dcff" }}>Transp. Status</TableHeaderCell>
                    <TableHeaderCell className={`${styles.stickyHeaderCell} ${styles.editableHeaderCell}`} style={{ backgroundColor: "#e6dcff" }}>Transp. Notes</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mergedItems.map((row) => {
                    const isSelected = row.id === selectedRow?.id;
                    const isHoverLinked = hoveredId === row.id && !isSelected;
                    return (
                    <Fragment key={row.id}>
                      <TableRow
                        className={`${styles.rowFixed} ${
                          isSelected ? styles.rowSelected : ""
                        } ${isHoverLinked ? styles.rowHoverLinked : ""}`}
                        onClick={() => setSelectedId(row.id)}
                        onMouseEnter={() => setHoveredId(row.id)}
                        onMouseLeave={() => setHoveredId((prev) => (prev === row.id ? null : prev))}
                      >
                        <TableCell
                          className={`${styles.tableBodyText} ${styles.orderNoDataCell} ${isSelected ? styles.selectedCell : ""}`}
                          style={isSelected ? { backgroundColor: "#eaf3ff" } : undefined}
                        >
                          <span className={styles.orderNoCell}>
                            <span className={styles.orderNoPrimary}>
                              {row.movementType === "Shipment" ? (
                                <BoxCheckmark24Regular
                                  className={styles.movementIconShipment}
                                  title="Shipment"
                                />
                              ) : (
                                <VehicleTruckProfile24Regular
                                  className={styles.movementIconPickup}
                                  title="Pickup"
                                />
                              )}
                              <span>{row.salesOrderNo}</span>
                            </span>
                          </span>
                        </TableCell>
                        <TableCell
                          className={`${styles.tableBodyText} ${isSelected ? styles.selectedCell : ""}`}
                          style={isSelected ? { backgroundColor: "#eaf3ff" } : undefined}
                        >
                          {row.customerName}
                        </TableCell>
                        <TableCell
                          className={`${styles.tableBodyText} ${isSelected ? styles.selectedCell : ""}`}
                          style={isSelected ? { backgroundColor: "#eaf3ff" } : undefined}
                        >
                          {row.orderDate}
                        </TableCell>
                        <TableCell
                          className={`${styles.tableBodyText} ${isSelected ? styles.selectedCell : ""}`}
                          style={isSelected ? { backgroundColor: "#eaf3ff" } : undefined}
                        >
                          {row.siteName}
                        </TableCell>
                        <TableCell
                          className={isSelected ? styles.selectedCell : ""}
                          style={isSelected ? { backgroundColor: "#eaf3ff" } : undefined}
                        >
                          <div className={styles.statusCellWrap}>
                            <span
                              className={`${styles.statusPill} ${
                                row.orderStatus === ORDER_STATUS_KEYS.READY_TO_SHIP
                                  ? styles.statusScheduled
                                  : styles.statusOpen
                              }`}
                            >
                              {getOrderStatusDisplayLabel(row.orderStatus)}
                            </span>
                            {(() => {
                              const action = getNextStatusAction(row.orderStatus);
                              if (!action) return null;
                              return (
                                <Button
                                  size="small"
                                  appearance="secondary"
                                  className={styles.statusActionButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (dirtyById[row.id]) {
                                      setMsg({
                                        type: "error",
                                        text: `Save or discard changes for order ${row.salesOrderNo} before changing status.`,
                                      });
                                      return;
                                    }
                                    void advanceTransportRowStatus(row);
                                  }}
                                  disabled={advancingId === row.id}
                                >
                                  {advancingId === row.id ? "Updating..." : action.label}
                                </Button>
                              );
                            })()}
                          </div>
                        </TableCell>
                        <TableCell
                          rowSpan={2}
                          className={`${styles.editableCell} ${styles.topAlignedEditorCell} ${styles.darkPurpleDividerRight} ${isSelected ? styles.selectedCell : ""}`}
                          style={{ borderRight: "1px solid #dcdcdc" }}
                        >
                          <textarea
                            className={styles.multiRowEditor}
                            value={row.trailerNo ?? ""}
                            onChange={(e) =>
                              updateEditableField(row.id, "trailerNo", e.target.value || null)
                            }
                          />
                        </TableCell>
                        <TableCell
                          rowSpan={2}
                          className={`${styles.editableCell} ${styles.topAlignedEditorCell} ${styles.darkPurpleDividerRight} ${isSelected ? styles.selectedCell : ""}`}
                          style={{ borderRight: "1px solid #dcdcdc" }}
                        >
                          <textarea
                            className={styles.multiRowEditor}
                            value={row.carrier ?? ""}
                            onChange={(e) =>
                              updateEditableField(row.id, "carrier", e.target.value || null)
                            }
                          />
                        </TableCell>
                        <TableCell
                          rowSpan={2}
                          className={`${styles.editableCell} ${styles.darkPurpleDividerRight} ${isSelected ? styles.selectedCell : ""}`}
                          style={{ borderRight: "1px solid #dcdcdc" }}
                        >
                          <div className={styles.monthDayEditorWrap}>
                            <input
                              key={`dispatch-text-${row.id}-${row.dispatchDate ?? "none"}`}
                              className={styles.monthDayDisplayInput}
                              defaultValue={toMonthDayValue(row.dispatchDate)}
                              placeholder="MM/DD"
                              onBlur={(e) =>
                                updateEditableField(
                                  row.id,
                                  "dispatchDate",
                                  toTransportDateFromMonthDay(e.target.value, row.dispatchDate)
                                )
                              }
                            />
                            <input
                              id={`dispatch-picker-${row.id}`}
                              className={styles.hiddenDatePicker}
                              type="date"
                              value={toDatePickerValue(row.dispatchDate)}
                              onChange={(e) =>
                                updateEditableField(
                                  row.id,
                                  "dispatchDate",
                                  toTransportDateFromPicker(e.target.value)
                                )
                              }
                            />
                            <button
                              type="button"
                              className={styles.dateEditButton}
                              onClick={() => {
                                const picker = document.getElementById(
                                  `dispatch-picker-${row.id}`
                                ) as HTMLInputElement | null;
                                if (!picker) return;
                                const pickerWithApi = picker as HTMLInputElement & {
                                  showPicker?: () => void;
                                };
                                if (pickerWithApi.showPicker) pickerWithApi.showPicker();
                                else picker.click();
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </TableCell>
                        <TableCell
                          rowSpan={2}
                          className={`${styles.editableCell} ${styles.darkPurpleDividerRight} ${isSelected ? styles.selectedCell : ""}`}
                          style={{ borderRight: "1px solid #dcdcdc" }}
                        >
                          <div className={styles.monthDayEditorWrap}>
                            <input
                              key={`scheduled-text-${row.id}-${row.scheduledDate ?? "none"}`}
                              className={styles.monthDayDisplayInput}
                              defaultValue={toMonthDayValue(row.scheduledDate)}
                              placeholder="MM/DD"
                              onBlur={(e) =>
                                updateEditableField(
                                  row.id,
                                  "scheduledDate",
                                  toTransportDateFromMonthDay(e.target.value, row.scheduledDate)
                                )
                              }
                            />
                            <input
                              id={`scheduled-picker-${row.id}`}
                              className={styles.hiddenDatePicker}
                              type="date"
                              value={toDatePickerValue(row.scheduledDate)}
                              onChange={(e) =>
                                updateEditableField(
                                  row.id,
                                  "scheduledDate",
                                  toTransportDateFromPicker(e.target.value)
                                )
                              }
                            />
                            <button
                              type="button"
                              className={styles.dateEditButton}
                              onClick={() => {
                                const picker = document.getElementById(
                                  `scheduled-picker-${row.id}`
                                ) as HTMLInputElement | null;
                                if (!picker) return;
                                const pickerWithApi = picker as HTMLInputElement & {
                                  showPicker?: () => void;
                                };
                                if (pickerWithApi.showPicker) pickerWithApi.showPicker();
                                else picker.click();
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </TableCell>
                        <TableCell rowSpan={2} className={`${styles.editableCell} ${styles.topAlignedEditorCell} ${isSelected ? styles.selectedCell : ""}`}>
                          <textarea
                            className={styles.multiRowEditor}
                            value={row.transportationStatus ?? ""}
                            onChange={(e) =>
                              updateEditableField(
                                row.id,
                                "transportationStatus",
                                e.target.value || null
                              )
                            }
                          />
                        </TableCell>
                        <TableCell rowSpan={2} className={`${styles.editableCell} ${styles.topAlignedEditorCell} ${styles.notesCell} ${isSelected ? styles.selectedCell : ""}`}>
                          <textarea
                            className={styles.notesEditor}
                            value={row.transportationNotes ?? ""}
                            onChange={(e) =>
                              updateEditableField(
                                row.id,
                                "transportationNotes",
                                e.target.value || null
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow
                        className={`${styles.addressSubRow} ${isSelected ? styles.addressSubRowSelected : ""} ${
                          isHoverLinked ? styles.rowHoverLinked : ""
                        }`}
                        style={isSelected ? { backgroundColor: "#eaf3ff" } : undefined}
                        onClick={() => setSelectedId(row.id)}
                        onMouseEnter={() => setHoveredId(row.id)}
                        onMouseLeave={() => setHoveredId((prev) => (prev === row.id ? null : prev))}
                      >
                        <TableCell
                          className={`${styles.addressSpanCell} ${isSelected ? styles.selectedCell : ""}`}
                          style={isSelected ? { backgroundColor: "#eaf3ff" } : undefined}
                          colSpan={5}
                        >
                          {getListAddress(row)}
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  )})}
                </TableBody>
              </Table>
            </div>

            <aside className={styles.sidePanel}>
              <Text className={styles.sectionTitle}>Order Info</Text>
              {selectedRow ? (
                <>
                  <div className={styles.kvRow}>
                    <span className={styles.kvLabel}>Order No:</span>
                    <span className={styles.kvValue}>{selectedRow.salesOrderNo}</span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvLabel}>Customer:</span>
                    <span className={styles.kvValue}>{selectedRow.customerName}</span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvLabel}>Order Date:</span>
                    <span className={styles.kvValue}>{selectedRow.orderDate}</span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvLabel}>Site:</span>
                    <span className={styles.kvValue}>{selectedRow.siteName}</span>
                  </div>

                  <div className={styles.sideSection}>
                    <Text className={styles.sideSectionTitle}>Pickup Details</Text>
                    <div className={styles.kvRow}>
                      <span className={styles.kvLabel}>Address:</span>
                      <span className={styles.kvValue}>{selectedAddress}</span>
                    </div>
                    <div className={styles.kvRow}>
                      <span className={styles.kvLabel}>Schedule:</span>
                      <span className={styles.kvValue}>{formatPanelDate(selectedRow.scheduledDate)}</span>
                    </div>
                    <div className={styles.kvRow}>
                      <span className={styles.kvLabel}>Contact:</span>
                      <span className={styles.kvValue}>
                        {selectedRow.contact
                          ? `${selectedRow.contact}${selectedRow.phone ? ` (${selectedRow.phone})` : ""}`
                          : "--"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.sideSection}>
                    <Text className={styles.sideSectionTitle}>Comments</Text>
                    <div className={styles.commentsBox}>
                      <Body1 className={styles.infoLine}>{selectedRow.orderComments ?? "--"}</Body1>
                    </div>
                  </div>

                  <div className={styles.sideSection}>
                    <Text className={styles.sideSectionTitle}>Lines</Text>
                    <div className={styles.linesWrap}>
                      {panelLineItems.length > 0 ? (
                        panelLineItems.map((line, idx) => (
                          <div key={`${selectedRow.id}-line-${idx}`} className={styles.lineCard}>
                            <div className={styles.lineCardHeader}>
                              <span className={styles.lineCardChevron}>⌄</span>
                              <span>Line {idx + 1}</span>
                            </div>
                            <Body1 className={styles.lineItem}>{line}</Body1>
                          </div>
                        ))
                      ) : (
                        <div className={styles.lineCard}>
                          <Body1 className={styles.lineItem}>No lines</Body1>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    appearance="secondary"
                    className={styles.openOrderButton}
                    onClick={() => navigate(`/orders/${selectedRow.id}/workspace`)}
                  >
                    Open Workspace (↗)
                  </Button>
                </>
              ) : (
                <Body1>Select a row to view details.</Body1>
              )}
            </aside>
            </div>

          <div className={styles.bottomBar}>
            <Body1>
              {dirtyCount > 0
                ? `${dirtyCount} order(s) with unsaved transportation updates`
                : "No unsaved transportation updates"}
            </Body1>
            <div className={styles.actions}>
              <Button
                appearance="secondary"
                disabled={dirtyCount === 0 || saving}
                onClick={() => setDirtyById({})}
              >
                Discard
              </Button>
              <Button
                appearance="primary"
                disabled={dirtyCount === 0 || saving}
                onClick={saveAll}
              >
                {saving ? "Saving..." : `Save ${dirtyCount} Change(s)`}
              </Button>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
