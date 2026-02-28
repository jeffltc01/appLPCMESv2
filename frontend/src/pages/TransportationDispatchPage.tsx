import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Body1,
  Button,
  Card,
  Field,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title2,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { ArrowClockwise24Regular } from "@fluentui/react-icons";
import { HelpEntryPoint } from "../components/help/HelpEntryPoint";
import { LifecycleNavigator } from "../components/orders/LifecycleNavigator";
import { ordersApi } from "../services/orders";
import type {
  ApplyHoldRequest,
  ClearHoldRequest,
  OrderWorkspaceRole,
  TransportBoardItem,
  TransportBoardUpdate,
} from "../types/order";

type MovementFilter = "All" | "Pickup" | "Delivery";
const ACTING_ROLE: OrderWorkspaceRole = "Transportation";
const ACTING_EMP_NO = "EMP001";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: tokens.spacingVerticalL,
  },
  shell: {
    maxWidth: "1480px",
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
  controls: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr)) auto auto",
    gap: tokens.spacingHorizontalS,
    alignItems: "end",
  },
  tableCard: {
    border: "1px solid #e8e8e8",
  },
  tableWrap: {
    overflow: "auto",
  },
  muted: {
    color: tokens.colorNeutralForeground2,
  },
  editableInput: {
    minWidth: "112px",
  },
  notesInput: {
    minWidth: "180px",
  },
  clickableRow: {
    cursor: "pointer",
  },
  selectedRow: {
    backgroundColor: "#e0eff8",
  },
  selectedRowOutline: {
    "& > td": {
      borderTop: "2px solid #123046",
    },
    "& > td:first-child": {
      borderLeft: "2px solid #123046",
    },
    "& > td:last-child": {
      borderRight: "2px solid #123046",
    },
  },
  expandedCell: {
    backgroundColor: "#f5f7fa",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingVerticalM,
  },
  expandedCellOutline: {
    borderTop: "none",
    borderLeft: "2px solid #123046",
    borderRight: "2px solid #123046",
    borderBottom: "2px solid #123046",
  },
  expandedContent: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  expandedLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: tokens.spacingHorizontalM,
    alignItems: "start",
  },
  expandedDetails: {
    display: "grid",
    gap: tokens.spacingVerticalM,
    minWidth: 0,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  detailGroup: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    padding: tokens.spacingVerticalM,
    display: "grid",
    gap: tokens.spacingVerticalXS,
  },
  detailGroupTitle: {
    color: "#123046",
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXS,
  },
  detailLine: {
    display: "grid",
    gridTemplateColumns: "140px minmax(0, 1fr)",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalXS,
  },
  detailLabel: {
    color: tokens.colorNeutralForeground2,
  },
  lineTableTitle: {
    marginBottom: tokens.spacingVerticalS,
  },
  lineCardsWrap: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    overflowX: "auto",
    paddingBottom: tokens.spacingVerticalXS,
  },
  lineCard: {
    minWidth: "300px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    padding: tokens.spacingVerticalS,
    display: "grid",
    gap: tokens.spacingVerticalXS,
  },
  lineCardTopRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  lineCardField: {
    display: "grid",
    gridTemplateColumns: "max-content minmax(0, 1fr)",
    gap: tokens.spacingHorizontalXS,
  },
  lifecyclePanel: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    padding: tokens.spacingVerticalM,
    minWidth: 0,
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

function toDisplayDate(value: string | null): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString();
}

function normalizeForSave(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function toLifecycleStatus(orderLifecycleStatus: string | null | undefined, orderStatus: string): string {
  if (orderLifecycleStatus && orderLifecycleStatus.trim().length > 0) {
    return orderLifecycleStatus;
  }

  const legacyToLifecycle: Record<string, string> = {
    New: "Draft",
    "Ready for Pickup": "InboundLogisticsPlanned",
    "Pickup Scheduled": "InboundLogisticsPlanned",
    Received: "ReceivedPendingReconciliation",
    "Ready to Ship": "ProductionComplete",
    "Ready to Invoice": "InvoiceReady",
    Complete: "Invoiced",
    Closed: "Invoiced",
  };

  return legacyToLifecycle[orderStatus] ?? orderStatus;
}

export function TransportationDispatchPage() {
  const styles = useStyles();
  const [orders, setOrders] = useState<TransportBoardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [overlayMutatingOrderId, setOverlayMutatingOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [dirtyOrderIds, setDirtyOrderIds] = useState<Set<number>>(new Set());

  const [search, setSearch] = useState("");
  const [siteIdFilter, setSiteIdFilter] = useState("All");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [movementFilter, setMovementFilter] = useState<MovementFilter>("All");

  const loadBoard = async () => {
    setLoading(true);
    setError(null);
    try {
      const movementType =
        movementFilter === "All" ? undefined : movementFilter === "Delivery" ? "Shipment" : "Pickup";
      const siteId = siteIdFilter === "All" ? undefined : Number(siteIdFilter);
      const result = await ordersApi.transportBoard({
        page: 1,
        pageSize: 250,
        search: search.trim() || undefined,
        movementType,
        siteId: Number.isNaN(siteId ?? NaN) ? undefined : siteId,
        carrier: carrierFilter.trim() || undefined,
      });

      setOrders(result.items);
      setDirtyOrderIds(new Set());
      if (selectedOrderId && !result.items.some((item) => item.id === selectedOrderId)) {
        setSelectedOrderId(null);
      }
    } catch {
      setError("Unable to load transportation dispatch board.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const siteOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const order of orders) {
      if (!map.has(order.siteId)) {
        map.set(order.siteId, order.siteName);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [orders]);

  const handleFieldChange = (
    orderId: number,
    field: keyof Pick<
      TransportBoardItem,
      "trailerNo" | "carrier" | "dispatchDate" | "scheduledDate" | "transportationStatus" | "transportationNotes"
    >,
    value: string
  ) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              [field]: value,
            }
          : order
      )
    );

    setDirtyOrderIds((prev) => {
      const next = new Set(prev);
      next.add(orderId);
      return next;
    });
  };

  const saveAll = async () => {
    if (dirtyOrderIds.size === 0) {
      return;
    }

    const updates: TransportBoardUpdate[] = orders
      .filter((order) => dirtyOrderIds.has(order.id))
      .map((order) => ({
        id: order.id,
        trailerNo: normalizeForSave(order.trailerNo),
        carrier: normalizeForSave(order.carrier),
        dispatchDate: normalizeForSave(order.dispatchDate),
        scheduledDate: normalizeForSave(order.scheduledDate),
        transportationStatus: normalizeForSave(order.transportationStatus),
        transportationNotes: normalizeForSave(order.transportationNotes),
      }));

    setSaving(true);
    setError(null);
    try {
      await ordersApi.saveTransportBoard(updates);
      await loadBoard();
    } catch {
      setError("Unable to save transportation updates.");
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = async () => {
    await loadBoard();
  };

  const handleApplyOverlay = async (orderId: number, payload: ApplyHoldRequest) => {
    setOverlayMutatingOrderId(orderId);
    setError(null);
    try {
      await ordersApi.applyHold(orderId, payload);
      await loadBoard();
    } catch {
      setError("Unable to apply hold overlay.");
    } finally {
      setOverlayMutatingOrderId((prev) => (prev === orderId ? null : prev));
    }
  };

  const handleClearOverlay = async (orderId: number, payload: ClearHoldRequest) => {
    setOverlayMutatingOrderId(orderId);
    setError(null);
    try {
      await ordersApi.clearHold(orderId, payload);
      await loadBoard();
    } catch {
      setError("Unable to clear hold overlay.");
    } finally {
      setOverlayMutatingOrderId((prev) => (prev === orderId ? null : prev));
    }
  };

  const dirtyCountLabel =
    dirtyOrderIds.size === 0
      ? "No unsaved transportation updates"
      : `${dirtyOrderIds.size} order(s) with unsaved transportation updates`;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div>
            <Title2>Transportation Dispatch</Title2>
            <Body1 className={styles.muted}>{dirtyCountLabel}</Body1>
          </div>
          <div className={styles.headerActions}>
            <HelpEntryPoint route="/transportation" />
            <Button appearance="secondary" icon={<ArrowClockwise24Regular />} onClick={() => void loadBoard()} disabled={loading || saving}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button appearance="secondary" onClick={() => void discardChanges()} disabled={loading || saving || dirtyOrderIds.size === 0}>
              Discard
            </Button>
            <Button appearance="primary" onClick={() => void saveAll()} disabled={loading || saving || dirtyOrderIds.size === 0}>
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>

        {error ? <Body1>{error}</Body1> : null}

        <Card className={styles.tableCard}>
          <div className={styles.controls}>
            <Field label="Site">
              <Select value={siteIdFilter} onChange={(_, data) => setSiteIdFilter(data.value)}>
                <option value="All">All Sites</option>
                {siteOptions.map(([id, name]) => (
                  <option key={id} value={String(id)}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Carrier">
              <Input value={carrierFilter} onChange={(_, data) => setCarrierFilter(data.value)} placeholder="All carriers" />
            </Field>
            <Field label="Movement Type">
              <Select value={movementFilter} onChange={(_, data) => setMovementFilter(data.value as MovementFilter)}>
                <option value="All">All</option>
                <option value="Pickup">Pickup</option>
                <option value="Delivery">Delivery</option>
              </Select>
            </Field>
            <Field label="Search">
              <Input value={search} onChange={(_, data) => setSearch(data.value)} placeholder="Order no, customer..." />
            </Field>
            <div />
            <Button appearance="secondary" onClick={() => void loadBoard()} disabled={loading || saving}>
              {loading ? "Loading..." : "Search"}
            </Button>
            <Body1 className={styles.muted}>{orders.length} order(s)</Body1>
          </div>

          <div className={styles.tableWrap}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Order No</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Order Date</TableHeaderCell>
                  <TableHeaderCell>Site</TableHeaderCell>
                  <TableHeaderCell>Movement</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Trailer No</TableHeaderCell>
                  <TableHeaderCell>Carrier</TableHeaderCell>
                  <TableHeaderCell>Dispatched</TableHeaderCell>
                  <TableHeaderCell>Scheduled</TableHeaderCell>
                  <TableHeaderCell>Transp. Status</TableHeaderCell>
                  <TableHeaderCell>Transp. Notes</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const isSelected = selectedOrderId === order.id;
                  const orderLines = order.lines ?? [];
                  const lifecycleStatus = toLifecycleStatus(order.orderLifecycleStatus, order.orderStatus);
                  return (
                    <Fragment key={order.id}>
                      <TableRow
                        className={mergeClasses(
                          styles.clickableRow,
                          isSelected ? styles.selectedRow : undefined,
                          isSelected ? styles.selectedRowOutline : undefined
                        )}
                        onClick={() => setSelectedOrderId((prev) => (prev === order.id ? null : order.id))}
                      >
                        <TableCell>{order.salesOrderNo}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{toDisplayDate(order.orderDate)}</TableCell>
                        <TableCell>{order.siteName}</TableCell>
                        <TableCell>{order.movementType === "Shipment" ? "Delivery" : "Pickup"}</TableCell>
                        <TableCell>
                          <Badge appearance="tint">{order.orderStatus}</Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            className={styles.editableInput}
                            value={order.trailerNo ?? ""}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(_, data) => handleFieldChange(order.id, "trailerNo", data.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className={styles.editableInput}
                            value={order.carrier ?? ""}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(_, data) => handleFieldChange(order.id, "carrier", data.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            className={styles.editableInput}
                            value={toDateInputValue(order.dispatchDate)}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(_, data) => handleFieldChange(order.id, "dispatchDate", data.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            className={styles.editableInput}
                            value={toDateInputValue(order.scheduledDate)}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(_, data) => handleFieldChange(order.id, "scheduledDate", data.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className={styles.editableInput}
                            value={order.transportationStatus ?? ""}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(_, data) => handleFieldChange(order.id, "transportationStatus", data.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className={styles.notesInput}
                            value={order.transportationNotes ?? ""}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(_, data) => handleFieldChange(order.id, "transportationNotes", data.value)}
                          />
                        </TableCell>
                      </TableRow>
                      {isSelected ? (
                        <TableRow>
                          <TableCell colSpan={12} className={mergeClasses(styles.expandedCell, styles.expandedCellOutline)}>
                            <div className={styles.expandedContent}>
                              <div className={styles.expandedLayout}>
                                <div className={styles.expandedDetails}>
                                  <div className={styles.detailGrid}>
                                    <div className={styles.detailGroup}>
                                      <Body1 className={styles.detailGroupTitle}>Order Summary</Body1>
                                      <div className={styles.detailLine}>
                                        <span className={styles.detailLabel}>Order:</span>
                                        <span>{order.salesOrderNo}</span>
                                      </div>
                                      <div className={styles.detailLine}>
                                        <span className={styles.detailLabel}>Customer:</span>
                                        <span>{order.customerName}</span>
                                      </div>
                                      <div className={styles.detailLine}>
                                        <span className={styles.detailLabel}>Order Date:</span>
                                        <span>{toDisplayDate(order.orderDate)}</span>
                                      </div>
                                      <div className={styles.detailLine}>
                                        <span className={styles.detailLabel}>Site:</span>
                                        <span>{order.siteName}</span>
                                      </div>
                                    </div>
                                    <div className={styles.detailGroup}>
                                      <Body1 className={styles.detailGroupTitle}>Pickup / Contact</Body1>
                                      <div className={styles.detailLine}>
                                        <span className={styles.detailLabel}>Pickup Details:</span>
                                        <span>{order.pickUpAddress ?? "-"}</span>
                                      </div>
                                      <div className={styles.detailLine}>
                                        <span className={styles.detailLabel}>Contact:</span>
                                        <span>{order.contact ?? "-"}</span>
                                      </div>
                                    </div>
                                    <div className={styles.detailGroup}>
                                      <Body1 className={styles.detailGroupTitle}>Delivery / Notes</Body1>
                                      <div className={styles.detailLine}>
                                        <span className={styles.detailLabel}>Delivery Details:</span>
                                        <span>{order.shipToAddress ?? "-"}</span>
                                      </div>
                                      <div className={styles.detailLine}>
                                        <span className={styles.detailLabel}>Comments:</span>
                                        <span>{order.orderComments ?? "-"}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className={styles.detailGroup}>
                                    <div className={styles.lineTableTitle}>
                                      <Body1 className={styles.detailGroupTitle}>Lines</Body1>
                                    </div>
                                    {orderLines.length > 0 ? (
                                      <div className={styles.lineCardsWrap}>
                                        {orderLines.map((line) => (
                                          <div key={line.lineId} className={styles.lineCard}>
                                            <div className={styles.lineCardTopRow}>
                                              <div className={styles.lineCardField}>
                                                <span className={styles.detailLabel}>Line</span>
                                                <span>{line.lineNo}</span>
                                              </div>
                                              <div className={styles.lineCardField}>
                                                <span className={styles.detailLabel}>Qty</span>
                                                <span>{line.quantityOrdered}</span>
                                              </div>
                                            </div>
                                            <div className={styles.lineCardTopRow}>
                                              <div className={styles.lineCardField}>
                                                <span className={styles.detailLabel}>Item</span>
                                                <span>{line.itemNo}</span>
                                              </div>
                                              <div className={styles.lineCardField}>
                                                <span className={styles.detailLabel}>Prod.</span>
                                                <span>{line.productLine ?? "-"}</span>
                                              </div>
                                            </div>
                                            <div className={styles.lineCardField}>
                                              <span className={styles.detailLabel}>Description</span>
                                              <span>{line.itemDescription}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <Body1>No line details available.</Body1>
                                    )}
                                  </div>
                                </div>

                                <div className={styles.lifecyclePanel}>
                                  <LifecycleNavigator
                                    currentStatus={lifecycleStatus}
                                    canAdvance={false}
                                    showCurrentStageCard={false}
                                    onApplyOverlay={(payload) => handleApplyOverlay(order.id, payload)}
                                    onClearOverlay={(payload) => handleClearOverlay(order.id, payload)}
                                    actingRole={ACTING_ROLE}
                                    actingEmpNo={ACTING_EMP_NO}
                                    isMutatingOverlay={overlayMutatingOrderId === order.id}
                                  />
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}

                {!loading && orders.length === 0 ? (
                  <TableRow>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>No transportation orders found.</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
