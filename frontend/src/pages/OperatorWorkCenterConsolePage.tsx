import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Body1,
  Button,
  Card,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  Title1,
} from "@fluentui/react-components";
import { ordersApi } from "../services/orders";
import type { OrderRouteExecution, WorkCenterQueueItem } from "../types/order";

export function OperatorWorkCenterConsolePage() {
  const [workCenterId, setWorkCenterId] = useState("1");
  const [queue, setQueue] = useState<WorkCenterQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<WorkCenterQueueItem | null>(null);
  const [routeExecution, setRouteExecution] = useState<OrderRouteExecution | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadQueue = useCallback(async () => {
    const id = Number(workCenterId);
    if (!Number.isFinite(id) || id <= 0) return;
    setLoading(true);
    try {
      const rows = await ordersApi.workCenterQueue(id);
      setQueue(rows);
      setSelected((prev) => prev ?? rows[0] ?? null);
      setMessage(null);
    } catch {
      setMessage({ type: "error", text: "Unable to load work-center queue." });
    } finally {
      setLoading(false);
    }
  }, [workCenterId]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (!selected) {
      setRouteExecution(null);
      return;
    }
    void ordersApi
      .lineRouteExecution(selected.orderId, selected.lineId)
      .then(setRouteExecution)
      .catch(() => setMessage({ type: "error", text: "Unable to load route execution details." }));
  }, [selected]);

  const selectedStep = useMemo(
    () =>
      selected
        ? routeExecution?.routes
            .flatMap((route) => route.steps)
            .find((step) => step.stepInstanceId === selected.stepInstanceId)
        : undefined,
    [routeExecution, selected]
  );

  const performAction = async (action: "scanIn" | "scanOut" | "complete") => {
    if (!selected) return;
    try {
      if (action === "scanIn") {
        await ordersApi.scanIn(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: "OP001",
          deviceId: "UI",
        });
      } else if (action === "scanOut") {
        await ordersApi.scanOut(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: "OP001",
          deviceId: "UI",
        });
      } else {
        await ordersApi.completeStep(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: "OP001",
          notes: "Completed from operator console",
        });
      }

      setMessage({ type: "success", text: `Step action ${action} completed.` });
      await loadQueue();
      setRouteExecution(await ordersApi.lineRouteExecution(selected.orderId, selected.lineId));
    } catch (error) {
      const text = error instanceof Error ? error.message : "Step action failed.";
      setMessage({ type: "error", text });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Title1>Operator Work-Center Console</Title1>
      {message && (
        <MessageBar intent={message.type}>
          <MessageBarBody>{message.text}</MessageBarBody>
        </MessageBar>
      )}
      <Field label="Work Center Id">
        <Input value={workCenterId} onChange={(_, data) => setWorkCenterId(data.value)} />
      </Field>
      <Button onClick={loadQueue} appearance="secondary">
        Refresh Queue
      </Button>

      {loading ? (
        <Spinner label="Loading queue..." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Card>
            <Body1 style={{ fontWeight: 700, marginBottom: 8 }}>Queue</Body1>
            {queue.length === 0 ? (
              <Body1>No queue entries for this work center.</Body1>
            ) : (
              queue.map((item) => (
                <Button
                  key={item.stepInstanceId}
                  appearance={selected?.stepInstanceId === item.stepInstanceId ? "primary" : "secondary"}
                  style={{ marginBottom: 8 }}
                  onClick={() => setSelected(item)}
                >
                  {item.salesOrderNo} - {item.stepName} ({item.stepState})
                </Button>
              ))
            )}
          </Card>
          <Card>
            <Body1 style={{ fontWeight: 700, marginBottom: 8 }}>Step Actions</Body1>
            {selected ? (
              <>
                <Body1>Order: {selected.salesOrderNo}</Body1>
                <Body1>Step: {selected.stepCode} - {selected.stepName}</Body1>
                <Body1>Current State: {selectedStep?.state ?? selected.stepState}</Body1>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Button onClick={() => performAction("scanIn")}>Scan In</Button>
                  <Button onClick={() => performAction("scanOut")}>Scan Out</Button>
                  <Button appearance="primary" onClick={() => performAction("complete")}>
                    Complete
                  </Button>
                </div>
              </>
            ) : (
              <Body1>Select a queue row to execute actions.</Body1>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
