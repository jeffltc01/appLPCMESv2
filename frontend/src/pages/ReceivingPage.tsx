import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Body1,
  Button,
  Card,
  CardHeader,
  Combobox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  makeStyles,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Title1,
  tokens,
} from "@fluentui/react-components";
import {
  Add24Regular,
  ArrowDownload24Regular,
  ArrowLeft24Regular,
  Checkmark24Regular,
  CheckmarkCircle24Regular,
  Dismiss24Regular,
  VehicleTruckProfile24Regular,
} from "@fluentui/react-icons";
import { ApiError } from "../services/api";
import { orderLookupsApi, ordersApi } from "../services/orders";
import type {
  CompleteReceivingRequest,
  OrderItemLookup,
  ReceivingOrderDetail,
  ReceivingOrderListItem,
} from "../types/order";
import { getOrderStatusDisplayLabel } from "../types/order";

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
  },
  headerArea: {
    position: "sticky",
    top: 0,
    zIndex: 1,
    backgroundColor: tokens.colorNeutralBackground1,
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
  },
  headerContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingTop: tokens.spacingVerticalM,
  },
  queuePanel: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: tokens.spacingVerticalM,
    "@media (max-width: 1200px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  queueCard: {
    cursor: "pointer",
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusLarge,
    minHeight: "112px",
    backgroundColor: tokens.colorNeutralBackground1,
    position: "relative",
  },
  queueCardSelected: {
    border: `3px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  queueOrderNo: {
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase500,
  },
  queueMeta: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  queueAddress: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  queueMetaInline: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  queueMoveIconBadge: {
    position: "absolute",
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusCircular,
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },
  queueItemsSummary: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: "2",
    WebkitBoxOrient: "vertical",
  },
  detailPanel: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  detailHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  detailHeaderRight: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  detailReceivedRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  detailReceivedLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    whiteSpace: "nowrap",
  },
  detailOrderNo: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightBold,
  },
  compactActionButton: {
    minHeight: "44px",
    minWidth: "112px",
  },
  touchButton: {
    minHeight: "52px",
    minWidth: "140px",
  },
  detailSummaryBar: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr 2fr 0.8fr",
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} 0`,
    "@media (max-width: 1200px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  detailSummaryItem: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  detailTrailer: {
    maxWidth: "180px",
  },
  detailCommentsRow: {
    width: "100%",
    marginTop: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    whiteSpace: "normal",
  },
  detailDateInput: {
    width: "220px",
    "& input": {
      minHeight: "48px",
      fontSize: tokens.fontSizeBase300,
      fontWeight: tokens.fontWeightSemibold,
    },
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
  },
  sectionHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  lineList: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: tokens.spacingVerticalM,
    "@media (max-width: 1400px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  lineCard: {
    padding: tokens.spacingHorizontalM,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  lineHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
  },
  lineHeaderMain: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    minWidth: 0,
  },
  lineTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
  },
  lineOrdered: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: "nowrap",
  },
  lineControls: {
    display: "grid",
    gridTemplateColumns: "80px 80px minmax(140px, 1fr)",
    gap: tokens.spacingHorizontalM,
    alignItems: "end",
    "@media (max-width: 1024px)": {
      gridTemplateColumns: "80px 80px",
      "& > div": {
        gridColumn: "1 / span 2",
      },
    },
  },
  lineDecisionButton: {
    width: "80px",
    height: "80px",
    minWidth: "80px",
    minHeight: "80px",
    alignSelf: "end",
  },
  touchInput: {
    "& input": {
      minHeight: "50px",
      fontSize: tokens.fontSizeBase300,
    },
    "& button": {
      minHeight: "50px",
    },
  },
  qtyField: {
    minWidth: "160px",
  },
  addRow: {
    display: "grid",
    gridTemplateColumns: "1fr 180px auto",
    gap: tokens.spacingHorizontalM,
    alignItems: "end",
    "@media (max-width: 1024px)": {
      gridTemplateColumns: "1fr",
    },
  },
  addedList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  addedItemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  actionButton: {
    minHeight: "46px",
    minWidth: "170px",
    borderRadius: tokens.borderRadiusLarge,
    fontWeight: tokens.fontWeightSemibold,
  },
  addLineDialogSurface: {
    width: "560px",
    maxWidth: "92vw",
  },
  addLineDialogForm: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  addLineDialogRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  addLineListbox: {
    maxHeight: "320px !important",
    overflowY: "scroll",
  },
  addLineField: {
    "& input": {
      minHeight: "40px",
    },
  },
});

interface AddedLineDraft {
  itemId: number;
  itemLabel: string;
  quantityAsReceived: number;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function ReceivingPage() {
  const styles = useStyles();
  const [view, setView] = useState<"queue" | "detail">("queue");
  const [orders, setOrders] = useState<ReceivingOrderListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ReceivingOrderDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [receivedDate, setReceivedDate] = useState(todayIso());
  const [lineState, setLineState] = useState<
    Record<number, { isReceived: boolean; quantityAsReceived: string }>
  >({});

  const [items, setItems] = useState<OrderItemLookup[]>([]);
  const [itemQuery, setItemQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [addQty, setAddQty] = useState("");
  const [addedLines, setAddedLines] = useState<AddedLineDraft[]>([]);
  const [isAddLineDialogOpen, setIsAddLineDialogOpen] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await ordersApi.receivingList();
      setOrders(data);
      setSelectedId((prev) => prev ?? data[0]?.id ?? null);
    } catch {
      setMsg({ type: "error", text: "Unable to load receiving queue." });
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    try {
      const data = await ordersApi.receivingDetail(id);
      setDetail(data);
      setReceivedDate(data.receivedDate?.slice(0, 10) ?? todayIso());
      setAddedLines([]);
      setItemQuery("");
      setSelectedItemId("");
      setAddQty("");
      const nextState: Record<number, { isReceived: boolean; quantityAsReceived: string }> = {};
      data.lines.forEach((line) => {
        nextState[line.id] = {
          isReceived: line.isReceived,
          quantityAsReceived: String(line.quantityAsReceived ?? 0),
        };
      });
      setLineState(nextState);
    } catch {
      setDetail(null);
      setMsg({ type: "error", text: "Unable to load order details." });
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
    orderLookupsApi
      .items()
      .then(setItems)
      .catch(() => setMsg({ type: "error", text: "Unable to load item lookup list." }));
  }, [loadQueue]);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const filteredItems = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      `${i.itemNo} ${i.itemDescription ?? ""}`.toLowerCase().includes(q)
    );
  }, [items, itemQuery]);

  const addTrailerLine = () => {
    const qty = Number(addQty);
    if (!selectedItemId) {
      setMsg({ type: "error", text: "Select an item before adding a line." });
      return;
    }
    if (Number.isNaN(qty) || qty <= 0) {
      setMsg({ type: "error", text: "Added line quantity must be greater than zero." });
      return;
    }
    const selected = items.find((i) => String(i.id) === selectedItemId);
    if (!selected) return;
    const label = selected.itemDescription
      ? `${selected.itemNo} - ${selected.itemDescription}`
      : selected.itemNo;
    setAddedLines((prev) => [
      ...prev,
      { itemId: selected.id, itemLabel: label, quantityAsReceived: qty },
    ]);
    setSelectedItemId("");
    setItemQuery("");
    setAddQty("");
    setIsAddLineDialogOpen(false);
    setMsg(null);
  };

  const completeReceiving = async () => {
    if (!detail) return;
    if (!receivedDate) {
      setMsg({ type: "error", text: "Received date is required." });
      return;
    }

    let lines: CompleteReceivingRequest["lines"];
    try {
      lines = detail.lines.map((line) => {
        const state = lineState[line.id];
        const qty = Number(state?.quantityAsReceived ?? "0");
        if (Number.isNaN(qty) || qty < 0) {
          throw new Error(`Line ${line.lineNo} has an invalid quantity.`);
        }
        return {
          lineId: line.id,
          isReceived: state?.isReceived ?? false,
          quantityAsReceived: qty,
        };
      });
    } catch (err) {
      setMsg({ type: "error", text: (err as Error).message });
      return;
    }

    const payload: CompleteReceivingRequest = {
      receivedDate: `${receivedDate}T00:00:00`,
      lines,
      addedLines: addedLines.map((line) => ({
        itemId: line.itemId,
        quantityAsReceived: line.quantityAsReceived,
      })),
    };

    setSaving(true);
    setMsg(null);
    try {
      await ordersApi.completeReceiving(detail.id, payload);
      setMsg({
        type: "success",
        text: `Order ${detail.salesOrderNo} marked as ${getOrderStatusDisplayLabel("Received")}.`,
      });
      const refreshedQueue = await ordersApi.receivingList();
      setOrders(refreshedQueue);
      setSelectedId(refreshedQueue[0]?.id ?? null);
      setView("queue");
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMsg({ type: "error", text: body?.message ?? "Failed to complete receiving." });
    } finally {
      setSaving(false);
    }
  };

  const setLineReceived = (lineId: number, isReceived: boolean, fallbackQty: number) => {
    setLineState((prev) => ({
      ...prev,
      [lineId]: {
        ...(prev[lineId] ?? { quantityAsReceived: String(fallbackQty) }),
        isReceived,
        quantityAsReceived: isReceived ? prev[lineId]?.quantityAsReceived ?? String(fallbackQty) : "0",
      },
    }));
  };

  const setLineQty = (lineId: number, value: string) => {
    setLineState((prev) => ({
      ...prev,
      [lineId]: {
        ...(prev[lineId] ?? { isReceived: true }),
        quantityAsReceived: value,
      },
    }));
  };

  const openOrder = (id: number) => {
    setSelectedId(id);
    setView("detail");
    setMsg(null);
  };

  const openAddLineDialog = () => {
    setItemQuery("");
    setSelectedItemId("");
    setAddQty("");
    setIsAddLineDialogOpen(true);
  };

  const canAddLine = Boolean(selectedItemId) && Number(addQty) > 0;

  return (
    <div className={styles.page}>
      {view === "queue" && (
        <div className={styles.headerArea}>
          <div className={styles.headerContent}>
            <Title1>Tank Receiving</Title1>
            {msg && (
              <MessageBar intent={msg.type}>
                <MessageBarBody>{msg.text}</MessageBarBody>
              </MessageBar>
            )}
          </div>
        </div>
      )}

      <div className={styles.contentArea}>
        {view === "queue" ? (
          <div className={styles.queuePanel}>
            {loadingList ? (
              <Spinner label="Loading receiving queue..." />
            ) : orders.length === 0 ? (
              <Body1>No orders ready for receiving.</Body1>
            ) : (
              orders.map((order) => (
                <Card
                  key={order.id}
                  className={`${styles.queueCard} ${
                    selectedId === order.id ? styles.queueCardSelected : ""
                  }`}
                  onClick={() => openOrder(order.id)}
                >
                  {(() => {
                    const orderDisplay = order.ipadOrderNo
                      ? `${order.salesOrderNo} - ${order.ipadOrderNo}`
                      : order.salesOrderNo;
                    const pickupLocation = [
                      order.pickUpCity,
                      order.pickUpState,
                      order.pickUpPostalCode,
                      order.pickUpCountry,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <>
                        <span className={styles.queueMoveIconBadge} title={order.receivingMode}>
                          {order.receivingMode === "Trailer Pickup" ? (
                            <VehicleTruckProfile24Regular />
                          ) : (
                            <ArrowDownload24Regular />
                          )}
                        </span>
                        <CardHeader
                          header={<span className={styles.queueOrderNo}>{orderDisplay}</span>}
                        />
                        <Body1 className={styles.queueMeta}>Customer: {order.customerName}</Body1>
                        <Body1 className={styles.queueAddress}>{pickupLocation || "--"}</Body1>
                        <div className={styles.queueMetaInline}>
                          <span>Site: {order.siteName}</span>
                          <span>Priority: {order.priority ?? "--"}</span>
                        </div>
                        <Body1 className={styles.queueItemsSummary}>
                          Items Ordered: {order.itemsOrderedSummary || "--"}
                        </Body1>
                      </>
                    );
                  })()}
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className={styles.detailPanel}>
            {msg && (
              <MessageBar intent={msg.type}>
                <MessageBarBody>{msg.text}</MessageBarBody>
              </MessageBar>
            )}
            <div className={styles.detailHeader}>
              <div className={styles.detailHeaderLeft}>
                <Button
                  appearance="secondary"
                  className={styles.compactActionButton}
                  icon={<ArrowLeft24Regular />}
                  onClick={() => setView("queue")}
                >
                  Back
                </Button>
              </div>
              <div className={styles.detailHeaderRight}>
                <div className={styles.detailReceivedRow}>
                  <span className={styles.detailReceivedLabel}>Received</span>
                  <Input
                    type="date"
                    value={receivedDate}
                    onChange={(_, data) => setReceivedDate(data.value)}
                    className={styles.detailDateInput}
                    aria-label="Received date"
                  />
                </div>
                <Button
                  appearance="primary"
                  className={styles.actionButton}
                  icon={<CheckmarkCircle24Regular />}
                  disabled={saving || !detail}
                  onClick={completeReceiving}
                >
                  {saving ? "Marking..." : "Mark Received"}
                </Button>
              </div>
            </div>

            {loadingDetail ? (
              <Spinner label="Loading order..." />
            ) : !detail ? (
              <Body1>Select an order to start receiving.</Body1>
            ) : (
              <>
                <div className={styles.detailSummaryBar}>
                  <span className={styles.detailSummaryItem}>Order: {detail.salesOrderNo}</span>
                  <span className={styles.detailSummaryItem}>Customer: {detail.customerName}</span>
                  <span className={styles.detailSummaryItem}>Address: {detail.pickUpAddress ?? "--"}</span>
                  <span className={`${styles.detailSummaryItem} ${styles.detailTrailer}`}>
                    Trailer: {detail.trailerNo ?? "--"}
                  </span>
                </div>
                <div className={styles.detailCommentsRow}>
                  Order Comments: {detail.orderComments ?? "--"}
                </div>

                <Dialog
                  open={isAddLineDialogOpen}
                  onOpenChange={(_, data) => setIsAddLineDialogOpen(data.open)}
                >
                  <DialogSurface className={styles.addLineDialogSurface}>
                    <DialogBody>
                      <DialogTitle>Add New Line Item Received</DialogTitle>
                      <DialogContent>
                        <div className={styles.addLineDialogForm}>
                          <Field label="Item" required>
                            <Combobox
                              className={styles.addLineField}
                              value={itemQuery}
                              selectedOptions={selectedItemId ? [selectedItemId] : []}
                              onChange={(e) => {
                                setItemQuery(e.target.value);
                                if (!e.target.value) setSelectedItemId("");
                              }}
                              onOptionSelect={(_, data) => {
                                setSelectedItemId(data.optionValue ?? "");
                                setItemQuery(data.optionText ?? "");
                              }}
                              placeholder="Type to search item..."
                              listbox={{
                                className: styles.addLineListbox,
                                style: { maxHeight: "320px", overflowY: "scroll" },
                              }}
                            >
                              {filteredItems.map((item) => (
                                <Option key={item.id} value={String(item.id)}>
                                  {item.itemDescription
                                    ? `${item.itemNo} - ${item.itemDescription}`
                                    : item.itemNo}
                                </Option>
                              ))}
                            </Combobox>
                          </Field>

                          <div className={styles.addLineDialogRow}>
                            <Field label="Quantity As Received" required>
                              <Input
                                className={styles.addLineField}
                                type="number"
                                value={addQty}
                                onChange={(_, data) => setAddQty(data.value)}
                              />
                            </Field>
                          </div>
                        </div>
                      </DialogContent>
                      <DialogActions>
                        <Button
                          appearance="secondary"
                          onClick={() => setIsAddLineDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          appearance="primary"
                          disabled={!canAddLine}
                          onClick={addTrailerLine}
                        >
                          Save
                        </Button>
                      </DialogActions>
                    </DialogBody>
                  </DialogSurface>
                </Dialog>

                <Card>
                  <div className={styles.sectionHeaderRow}>
                    <Body1 className={styles.sectionTitle}>Reconcile Ordered vs Received</Body1>
                    <Button
                      appearance="primary"
                      className={styles.actionButton}
                      icon={<Add24Regular />}
                      onClick={openAddLineDialog}
                    >
                      Add New Item
                    </Button>
                  </div>
                  <div className={styles.lineList} style={{ marginTop: tokens.spacingVerticalM }}>
                    {detail.lines.map((line) => {
                      const state = lineState[line.id];
                      const isReceived = state?.isReceived ?? false;
                      return (
                        <div className={styles.lineCard} key={line.id}>
                          <div className={styles.lineHeader}>
                          <div className={styles.lineHeaderMain}>
                            <span className={styles.lineTitle}>
                              {line.itemNo} - {line.itemDescription}
                            </span>
                          </div>
                          <span className={styles.lineOrdered}>Ordered: {line.quantityAsOrdered}</span>
                          </div>
                          <div className={styles.lineControls}>
                            <Button
                              appearance={isReceived ? "primary" : "secondary"}
                              className={styles.lineDecisionButton}
                              icon={<Checkmark24Regular />}
                              aria-label="Mark line as received"
                              title="Received"
                              style={
                                isReceived
                                  ? {
                                      backgroundColor: "#107c10",
                                      color: "#ffffff",
                                      borderColor: "#107c10",
                                    }
                                  : {
                                      borderWidth: "2px",
                                      borderColor: "#107c10",
                                      color: "#107c10",
                                    }
                              }
                              onClick={() =>
                                setLineReceived(line.id, true, line.quantityAsReceived ?? 0)
                              }
                            />
                            <Button
                              appearance={!isReceived ? "primary" : "secondary"}
                              className={styles.lineDecisionButton}
                              icon={<Dismiss24Regular />}
                              aria-label="Mark line as not received"
                              title="Not Received"
                              style={
                                !isReceived
                                  ? {
                                      backgroundColor: "#d13438",
                                      color: "#ffffff",
                                      borderColor: "#d13438",
                                    }
                                  : {
                                      borderWidth: "2px",
                                      borderColor: "#d13438",
                                      color: "#d13438",
                                    }
                              }
                              onClick={() =>
                                setLineReceived(line.id, false, line.quantityAsReceived ?? 0)
                              }
                            />
                            <Field label="Qty Received">
                              <Input
                                className={`${styles.touchInput} ${styles.qtyField}`}
                                type="number"
                                value={state?.quantityAsReceived ?? "0"}
                                onChange={(_, data) => setLineQty(line.id, data.value)}
                                disabled={!isReceived}
                              />
                            </Field>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {addedLines.length > 0 && (
                  <Card>
                    <Body1 className={styles.sectionTitle}>Added Line Items</Body1>
                    <div className={styles.addedList} style={{ marginTop: tokens.spacingVerticalM }}>
                      {addedLines.map((line, idx) => (
                        <div className={styles.addedItemRow} key={`${line.itemId}-${idx}`}>
                          <span>{line.itemLabel}</span>
                          <span>Qty Received: {line.quantityAsReceived}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
