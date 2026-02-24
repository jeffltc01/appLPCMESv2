import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Body1,
  Button,
  Card,
  CardHeader,
  Combobox,
  Field,
  Input,
  makeStyles,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title2,
  tokens,
} from "@fluentui/react-components";
import { Add24Regular, CheckmarkCircle24Regular } from "@fluentui/react-icons";
import { ApiError } from "../services/api";
import { orderLookupsApi, ordersApi } from "../services/orders";
import type {
  CompleteReceivingRequest,
  OrderItemLookup,
  ReceivingOrderDetail,
  ReceivingOrderListItem,
} from "../types/order";

const useStyles = makeStyles({
  root: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 360px) 1fr",
    gap: tokens.spacingHorizontalL,
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  listPanel: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  listCard: {
    cursor: "pointer",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  listCardSelected: {
    border: `2px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  detailPanel: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  headerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  linesCard: {
    overflowX: "auto",
  },
  qtyInput: {
    minWidth: "120px",
  },
  touchInput: {
    "& input": {
      minHeight: "42px",
    },
  },
  addRow: {
    display: "grid",
    gridTemplateColumns: "1fr 140px auto",
    gap: tokens.spacingHorizontalM,
    alignItems: "end",
    "@media (max-width: 900px)": {
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
    padding: tokens.spacingVerticalXS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  completeButton: {
    alignSelf: "flex-start",
    minHeight: "44px",
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

  const loadQueue = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await ordersApi.receivingList();
      setOrders(data);
      setSelectedId((prev) => prev ?? data[0]?.id ?? null);
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
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
    orderLookupsApi.items().then(setItems);
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
    if (!q) return items.slice(0, 25);
    return items
      .filter((i) =>
        `${i.itemNo} ${i.itemDescription ?? ""}`.toLowerCase().includes(q)
      )
      .slice(0, 25);
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
      setMsg({ type: "success", text: `Order ${detail.salesOrderNo} marked as Received.` });
      const refreshedQueue = await ordersApi.receivingList();
      setOrders(refreshedQueue);
      setSelectedId(refreshedQueue[0]?.id ?? null);
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMsg({ type: "error", text: body?.message ?? "Failed to complete receiving." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title2 style={{ marginBottom: tokens.spacingVerticalM }}>Tank Receiving</Title2>
      {msg && (
        <MessageBar intent={msg.type} style={{ marginBottom: tokens.spacingVerticalM }}>
          <MessageBarBody>{msg.text}</MessageBarBody>
        </MessageBar>
      )}
      <div className={styles.root}>
        <div className={styles.listPanel}>
          <Body1 style={{ fontWeight: tokens.fontWeightSemibold }}>
            Pickup Scheduled Orders
          </Body1>
          {loadingList ? (
            <Spinner label="Loading receiving queue..." />
          ) : orders.length === 0 ? (
            <Body1>No orders ready for receiving.</Body1>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                className={`${styles.listCard} ${
                  selectedId === order.id ? styles.listCardSelected : ""
                }`}
                onClick={() => setSelectedId(order.id)}
              >
                <CardHeader
                  header={<Body1 style={{ fontWeight: 600 }}>{order.salesOrderNo}</Body1>}
                  description={
                    <Body1>
                      {order.customerName} - {order.lineCount} lines
                    </Body1>
                  }
                />
                <Body1>{order.pickUpAddress ?? "--"}</Body1>
              </Card>
            ))
          )}
        </div>

        <div className={styles.detailPanel}>
          {loadingDetail ? (
            <Spinner label="Loading order..." />
          ) : !detail ? (
            <Body1>Select an order to start receiving.</Body1>
          ) : (
            <>
              <Card>
                <div className={styles.headerGrid}>
                  <Field label="Order Number">
                    <Input value={detail.salesOrderNo} readOnly className={styles.touchInput} />
                  </Field>
                  <Field label="Customer">
                    <Input value={detail.customerName} readOnly className={styles.touchInput} />
                  </Field>
                  <Field label="Pick Up Address">
                    <Input value={detail.pickUpAddress ?? "--"} readOnly className={styles.touchInput} />
                  </Field>
                  <Field label="Trailer No">
                    <Input value={detail.trailerNo ?? "--"} readOnly className={styles.touchInput} />
                  </Field>
                </div>
              </Card>

              <Card>
                <Field label="Received Date">
                  <Input
                    type="date"
                    value={receivedDate}
                    onChange={(_, data) => setReceivedDate(data.value)}
                    className={styles.touchInput}
                  />
                </Field>
              </Card>

              <Card className={styles.linesCard}>
                <Body1 style={{ fontWeight: tokens.fontWeightSemibold, marginBottom: 8 }}>
                  Reconcile Ordered vs Received
                </Body1>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Line</TableHeaderCell>
                      <TableHeaderCell>Item</TableHeaderCell>
                      <TableHeaderCell>Qty Ordered</TableHeaderCell>
                      <TableHeaderCell>Received?</TableHeaderCell>
                      <TableHeaderCell>Qty Received</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.lines.map((line) => {
                      const state = lineState[line.id];
                      return (
                        <TableRow key={line.id}>
                          <TableCell>{line.lineNo}</TableCell>
                          <TableCell>
                            {line.itemNo} - {line.itemDescription}
                          </TableCell>
                          <TableCell>{line.quantityAsOrdered}</TableCell>
                          <TableCell>
                            <Switch
                              checked={state?.isReceived ?? false}
                              onChange={(_, data) =>
                                setLineState((prev) => ({
                                  ...prev,
                                  [line.id]: {
                                    ...(prev[line.id] ?? {
                                      quantityAsReceived: String(line.quantityAsReceived ?? 0),
                                    }),
                                    isReceived: data.checked,
                                    quantityAsReceived: data.checked
                                      ? prev[line.id]?.quantityAsReceived ?? String(line.quantityAsReceived ?? 0)
                                      : "0",
                                  },
                                }))
                              }
                              label={(state?.isReceived ?? false) ? "Received" : "Not received"}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className={styles.qtyInput}
                              type="number"
                              value={state?.quantityAsReceived ?? "0"}
                              onChange={(_, data) =>
                                setLineState((prev) => ({
                                  ...prev,
                                  [line.id]: {
                                    ...(prev[line.id] ?? { isReceived: true }),
                                    quantityAsReceived: data.value,
                                  },
                                }))
                              }
                              disabled={!(state?.isReceived ?? false)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>

              <Card>
                <Body1 style={{ fontWeight: tokens.fontWeightSemibold, marginBottom: 8 }}>
                  Add Trailer-Only Line
                </Body1>
                <div className={styles.addRow}>
                  <Field label="Item">
                    <Combobox
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
                      placeholder="Type item number or description..."
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
                  <Field label="Qty Received">
                    <Input
                      type="number"
                      value={addQty}
                      onChange={(_, data) => setAddQty(data.value)}
                    />
                  </Field>
                  <Button appearance="secondary" icon={<Add24Regular />} onClick={addTrailerLine}>
                    Add
                  </Button>
                </div>

                {addedLines.length > 0 && (
                  <div className={styles.addedList} style={{ marginTop: 12 }}>
                    {addedLines.map((line, idx) => (
                      <div className={styles.addedItemRow} key={`${line.itemId}-${idx}`}>
                        <span>{line.itemLabel}</span>
                        <span>Qty Received: {line.quantityAsReceived}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Button
                appearance="primary"
                className={styles.completeButton}
                icon={<CheckmarkCircle24Regular />}
                disabled={saving}
                onClick={completeReceiving}
              >
                {saving ? "Marking Received..." : "Mark Received"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
