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
import type {
  OperatorActivityLogItem,
  OrderRouteExecution,
  OrderWorkspaceRole,
  WorkCenterQueueItem,
} from "../types/order";

export function OperatorWorkCenterConsolePage() {
  const [workCenterId, setWorkCenterId] = useState("1");
  const [queue, setQueue] = useState<WorkCenterQueueItem[]>([]);
  const [activityLog, setActivityLog] = useState<OperatorActivityLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<WorkCenterQueueItem | null>(null);
  const [routeExecution, setRouteExecution] = useState<OrderRouteExecution | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [supervisorOverrideEmpNo, setSupervisorOverrideEmpNo] = useState("");
  const [supervisorOverrideReason, setSupervisorOverrideReason] = useState("");
  const [serialLoadVerified, setSerialLoadVerified] = useState(false);
  const [verifiedSerialNosCsv, setVerifiedSerialNosCsv] = useState("");
  const [manualDurationMinutes, setManualDurationMinutes] = useState("");
  const [manualDurationReason, setManualDurationReason] = useState("");
  const [trailerNo, setTrailerNo] = useState("");
  const [actingRole, setActingRole] = useState<OrderWorkspaceRole>("Production");
  const [actingEmpNo, setActingEmpNo] = useState("OP001");

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
      setActivityLog([]);
      return;
    }
    void Promise.all([
      ordersApi.lineRouteExecution(selected.orderId, selected.lineId),
      ordersApi.orderWorkCenterActivityLog(selected.orderId),
    ])
      .then(([route, logs]) => {
        setRouteExecution(route);
        setActivityLog(logs);
      })
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

  const performAction = async (
    action:
      | "scanIn"
      | "scanOut"
      | "captureTrailer"
      | "verifySerials"
      | "generatePackingSlip"
      | "generateBol"
      | "complete"
      | "correctDuration"
  ) => {
    if (!selected) return;
    try {
      const verifiedSerialNos = verifiedSerialNosCsv
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      const roleToUse = actingRole;
      const empNoToUse = actingEmpNo.trim() || "OP001";
      if (action === "scanIn") {
        await ordersApi.scanIn(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          deviceId: "UI",
          actingRole: roleToUse,
        });
      } else if (action === "scanOut") {
        await ordersApi.scanOut(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          deviceId: "UI",
          actingRole: roleToUse,
        });
      } else if (action === "captureTrailer") {
        await ordersApi.captureTrailer(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          trailerNo: trailerNo.trim(),
          notes: "Captured from operator console",
          actingRole: roleToUse,
        });
      } else if (action === "verifySerials") {
        await ordersApi.verifySerialLoad(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          verifiedSerialNos,
          notes: "Verified from operator console",
          actingRole: roleToUse,
        });
      } else if (action === "generatePackingSlip") {
        await ordersApi.generatePackingSlip(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          regenerate: false,
          notes: "Generated from operator console",
          actingRole: roleToUse,
        });
      } else if (action === "generateBol") {
        await ordersApi.generateBol(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          regenerate: false,
          notes: "Generated from operator console",
          actingRole: roleToUse,
        });
      } else if (action === "correctDuration") {
        const mode = selectedStep?.timeCaptureMode;
        if (!mode) {
          throw new Error("Step details are still loading. Please retry.");
        }
        const parsedDuration = Number(manualDurationMinutes);
        if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
          throw new Error("Manual duration minutes must be greater than zero.");
        }
        if (mode === "Hybrid" && !manualDurationReason.trim()) {
          throw new Error("Hybrid override requires a reason.");
        }
        await ordersApi.correctStepDuration(selected.orderId, selected.lineId, selected.stepInstanceId, {
          manualDurationMinutes: parsedDuration,
          manualDurationReason: manualDurationReason.trim() || null,
          actingRole: roleToUse,
          actingEmpNo: empNoToUse,
          notes: "Corrected from operator console",
          deviceId: "UI",
        });
      } else {
        await ordersApi.completeStep(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          notes: "Completed from operator console",
          actingRole: roleToUse,
          supervisorOverrideEmpNo: supervisorOverrideEmpNo || null,
          supervisorOverrideReason: supervisorOverrideReason || null,
          supervisorOverrideActingRole: supervisorOverrideEmpNo ? "Supervisor" : null,
          serialLoadVerified,
          verifiedSerialNos: verifiedSerialNos.length > 0 ? verifiedSerialNos : null,
        });
      }

      setMessage({ type: "success", text: `Step action ${action} completed.` });
      await loadQueue();
      const [route, logs] = await Promise.all([
        ordersApi.lineRouteExecution(selected.orderId, selected.lineId),
        ordersApi.orderWorkCenterActivityLog(selected.orderId),
      ]);
      setRouteExecution(route);
      setActivityLog(logs);
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
                <Body1>Time Capture Mode: {selectedStep?.timeCaptureMode ?? "Unknown"}</Body1>
                <Body1>Current Duration (min): {selectedStep?.durationMinutes ?? "n/a"}</Body1>
                <Body1>Manual Duration (min): {selectedStep?.manualDurationMinutes ?? "n/a"}</Body1>
                <Body1>Capture Source: {selectedStep?.timeCaptureSource ?? "n/a"}</Body1>
                <Body1>Manual Reason: {selectedStep?.manualDurationReason ?? "n/a"}</Body1>
                <Field label="Acting role">
                  <Input
                    value={actingRole}
                    onChange={(_, data) => setActingRole((data.value as OrderWorkspaceRole) || "Production")}
                  />
                </Field>
                <Field label="Acting emp no">
                  <Input value={actingEmpNo} onChange={(_, data) => setActingEmpNo(data.value)} />
                </Field>
                <Field label="Supervisor override emp no (optional)">
                  <Input
                    value={supervisorOverrideEmpNo}
                    onChange={(_, data) => setSupervisorOverrideEmpNo(data.value)}
                  />
                </Field>
                <Field label="Supervisor override reason (optional)">
                  <Input
                    value={supervisorOverrideReason}
                    onChange={(_, data) => setSupervisorOverrideReason(data.value)}
                  />
                </Field>
                <Field label="Manual duration minutes">
                  <Input
                    value={manualDurationMinutes}
                    onChange={(_, data) => setManualDurationMinutes(data.value)}
                  />
                </Field>
                <Field label="Manual duration reason (required for hybrid override)">
                  <Input
                    value={manualDurationReason}
                    onChange={(_, data) => setManualDurationReason(data.value)}
                  />
                </Field>
                <Field label="Trailer number">
                  <Input value={trailerNo} onChange={(_, data) => setTrailerNo(data.value)} />
                </Field>
                <Field label="Verified serial numbers CSV (optional)">
                  <Input
                    value={verifiedSerialNosCsv}
                    onChange={(_, data) => setVerifiedSerialNosCsv(data.value)}
                  />
                </Field>
                <Button
                  appearance={serialLoadVerified ? "primary" : "secondary"}
                  onClick={() => setSerialLoadVerified((prev) => !prev)}
                >
                  Serial Load Verified: {serialLoadVerified ? "Yes" : "No"}
                </Button>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Button onClick={() => performAction("scanIn")}>Scan In</Button>
                  <Button onClick={() => performAction("scanOut")}>Scan Out</Button>
                  <Button onClick={() => performAction("captureTrailer")}>Capture Trailer</Button>
                  <Button onClick={() => performAction("verifySerials")}>Verify Serials</Button>
                  <Button onClick={() => performAction("generatePackingSlip")}>Generate Packing Slip</Button>
                  <Button onClick={() => performAction("generateBol")}>Generate BOL</Button>
                  <Button onClick={() => performAction("correctDuration")}>Apply Duration</Button>
                  <Button appearance="primary" onClick={() => performAction("complete")}>
                    Complete
                  </Button>
                </div>
              </>
            ) : (
              <Body1>Select a queue row to execute actions.</Body1>
            )}
          </Card>
          <Card>
            <Body1 style={{ fontWeight: 700, marginBottom: 8 }}>Order Activity Log</Body1>
            {activityLog.length === 0 ? (
              <Body1>No activity records found for this order.</Body1>
            ) : (
              activityLog.slice(0, 12).map((entry) => (
                <Body1 key={entry.id}>
                  {new Date(entry.actionUtc).toLocaleString()} - {entry.actionType} - {entry.operatorEmpNo}
                </Body1>
              ))
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
