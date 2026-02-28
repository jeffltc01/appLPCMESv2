import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Body1,
  Button,
  Card,
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ordersApi } from "../services/orders";
import { setupApi } from "../services/setup";
import { ApiError } from "../services/api";
import type {
  OrderRouteExecution,
  OrderWorkspaceRole,
  ProductionOrderListItem,
  RouteStepAdjustmentRequest,
  RouteStepExecution,
} from "../types/order";
import type { WorkCenter } from "../types/setup";

type QueueMode = "routeReview" | "supervisorDecision";

type EditableStep = {
  stepInstanceId: number;
  lineId: number;
  stepCode: string;
  stepName: string;
  stepSequence: number;
  workCenterId: number;
  isRequired: boolean;
  isNew?: boolean;
  markedForRemoval?: boolean;
};

const useStyles = makeStyles({
  root: { display: "grid", gap: tokens.spacingVerticalM },
  grid: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: tokens.spacingHorizontalM,
    alignItems: "start",
  },
  section: { display: "grid", gap: tokens.spacingVerticalS },
  queueBtn: { justifyContent: "flex-start", minHeight: "44px" },
  rowActions: { display: "flex", gap: tokens.spacingHorizontalS, flexWrap: "wrap" },
});

function flattenRouteSteps(routeExecution: OrderRouteExecution): EditableStep[] {
  return routeExecution.routes.flatMap((route) =>
    route.steps.map((step) => ({
      stepInstanceId: step.stepInstanceId,
      lineId: route.lineId,
      stepCode: step.stepCode,
      stepName: step.stepName,
      stepSequence: step.stepSequence,
      workCenterId: step.workCenterId,
      isRequired: step.isRequired,
      isNew: false,
      markedForRemoval: false,
    }))
  );
}

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (typeof error.body === "object" && error.body && "message" in error.body) {
      const msg = (error.body as { message?: unknown }).message;
      if (typeof msg === "string") return msg;
    }
    return `Request failed (${error.status}).`;
  }
  if (error instanceof Error) return error.message;
  return "Request failed.";
}

export function SupervisorRouteReviewPage() {
  const styles = useStyles();
  const [mode, setMode] = useState<QueueMode>("routeReview");
  const [routeQueue, setRouteQueue] = useState<ProductionOrderListItem[]>([]);
  const [supervisorQueue, setSupervisorQueue] = useState<ProductionOrderListItem[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [routeExecution, setRouteExecution] = useState<OrderRouteExecution | null>(null);
  const [baselineSteps, setBaselineSteps] = useState<EditableStep[]>([]);
  const [editableSteps, setEditableSteps] = useState<EditableStep[]>([]);
  const [reviewerEmpNo, setReviewerEmpNo] = useState("SUP001");
  const [actingRole, setActingRole] = useState<OrderWorkspaceRole>("Supervisor");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ intent: "success" | "error"; text: string } | null>(null);
  const [newStepLineId, setNewStepLineId] = useState<number>(0);
  const [newStepCode, setNewStepCode] = useState("");
  const [newStepName, setNewStepName] = useState("");
  const [newStepSequence, setNewStepSequence] = useState<number>(1);
  const [newStepWorkCenterId, setNewStepWorkCenterId] = useState<number>(0);
  const [newStepIsRequired, setNewStepIsRequired] = useState(false);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);

  const activeQueue = mode === "routeReview" ? routeQueue : supervisorQueue;

  const loadQueues = async () => {
    const [pendingRouteReview, pendingSupervisorReview] = await Promise.all([
      ordersApi.pendingRouteReview(),
      ordersApi.pendingSupervisorReview(),
    ]);
    setRouteQueue(pendingRouteReview);
    setSupervisorQueue(pendingSupervisorReview);
    setSelectedOrderId((prev) => prev ?? pendingRouteReview[0]?.id ?? pendingSupervisorReview[0]?.id ?? null);
  };

  useEffect(() => {
    void loadQueues().catch(() => setMessage({ intent: "error", text: "Failed to load supervisor queues." }));
    void setupApi
      .listWorkCenters()
      .then((rows) => setWorkCenters(rows.filter((wc) => wc.isActive)))
      .catch(() => setMessage({ intent: "error", text: "Failed to load work centers." }));
  }, []);

  useEffect(() => {
    if (!selectedOrderId) {
      setRouteExecution(null);
      setBaselineSteps([]);
      setEditableSteps([]);
      return;
    }
    void ordersApi
      .orderRouteExecution(selectedOrderId)
      .then((result) => {
        setRouteExecution(result);
        const flattened = flattenRouteSteps(result);
        setBaselineSteps(flattened);
        setEditableSteps(flattened);
        const firstLineId = result.routes[0]?.lineId ?? 0;
        const maxSequence = flattened.length > 0 ? Math.max(...flattened.map((s) => s.stepSequence)) : 0;
        const firstWorkCenterId = flattened[0]?.workCenterId ?? 0;
        setNewStepLineId(firstLineId);
        setNewStepSequence(maxSequence + 1);
        setNewStepWorkCenterId(firstWorkCenterId);
      })
      .catch(() => setMessage({ intent: "error", text: "Failed to load route execution details." }));
  }, [selectedOrderId]);

  const baselineMap = useMemo(
    () => new Map(baselineSteps.map((step) => [step.stepInstanceId, step])),
    [baselineSteps]
  );
  const lineOptions = useMemo(
    () =>
      (routeExecution?.routes ?? []).map((route) => ({
        lineId: route.lineId,
      })),
    [routeExecution]
  );

  const stepStateById = useMemo(() => {
    const lookup = new Map<number, RouteStepExecution>();
    for (const route of routeExecution?.routes ?? []) {
      for (const step of route.steps) {
        lookup.set(step.stepInstanceId, step);
      }
    }
    return lookup;
  }, [routeExecution]);

  const diffRows = useMemo(() => {
    const rows: Array<{
      key: string;
      kind: "add" | "remove" | "update";
      stepInstanceId: number;
      stepCode: string;
      sequenceBefore: number | null;
      sequenceAfter: number | null;
      workCenterBefore: number | null;
      workCenterAfter: number | null;
    }> = [];

    for (const step of editableSteps) {
      const base = baselineMap.get(step.stepInstanceId);
      if (!base && step.isNew) {
        rows.push({
          key: `add-${step.stepInstanceId}`,
          kind: "add",
          stepInstanceId: step.stepInstanceId,
          stepCode: step.stepCode,
          sequenceBefore: null,
          sequenceAfter: step.stepSequence,
          workCenterBefore: null,
          workCenterAfter: step.workCenterId,
        });
        continue;
      }

      if (!base) continue;
      if (step.markedForRemoval) {
        rows.push({
          key: `remove-${step.stepInstanceId}`,
          kind: "remove",
          stepInstanceId: step.stepInstanceId,
          stepCode: step.stepCode,
          sequenceBefore: base.stepSequence,
          sequenceAfter: null,
          workCenterBefore: base.workCenterId,
          workCenterAfter: null,
        });
        continue;
      }

      const sequenceChanged = base.stepSequence !== step.stepSequence;
      const workCenterChanged = base.workCenterId !== step.workCenterId;
      if (sequenceChanged || workCenterChanged) {
        rows.push({
          key: `update-${step.stepInstanceId}`,
          kind: "update",
          stepInstanceId: step.stepInstanceId,
          stepCode: step.stepCode,
          sequenceBefore: base.stepSequence,
          sequenceAfter: step.stepSequence,
          workCenterBefore: base.workCenterId,
          workCenterAfter: step.workCenterId,
        });
      }
    }

    return rows;
  }, [editableSteps, baselineMap]);

  const stepAdjustments = useMemo<RouteStepAdjustmentRequest[]>(
    () => {
      const adjustments: RouteStepAdjustmentRequest[] = [];
      for (const step of editableSteps) {
        const base = baselineMap.get(step.stepInstanceId);
        if (step.isNew) {
          adjustments.push({
            lineId: step.lineId,
            stepSequence: step.stepSequence,
            workCenterId: step.workCenterId,
            stepCode: step.stepCode,
            stepName: step.stepName,
            isRequired: step.isRequired,
            remove: false,
          });
          continue;
        }

        if (!base) continue;
        if (step.markedForRemoval) {
          adjustments.push({
            stepInstanceId: step.stepInstanceId,
            remove: true,
          });
          continue;
        }

        const sequenceChanged = base.stepSequence !== step.stepSequence;
        const workCenterChanged = base.workCenterId !== step.workCenterId;
        if (sequenceChanged || workCenterChanged) {
          adjustments.push({
            stepInstanceId: step.stepInstanceId,
            stepSequence: step.stepSequence,
            workCenterId: step.workCenterId,
          });
        }
      }

      return adjustments;
    },
    [editableSteps, baselineMap]
  );

  const updateStep = (stepId: number, patch: Partial<EditableStep>) => {
    setEditableSteps((prev) => prev.map((step) => (step.stepInstanceId === stepId ? { ...step, ...patch } : step)));
  };

  const addDraftStep = () => {
    if (!newStepCode.trim() || !newStepName.trim() || newStepLineId <= 0 || newStepSequence <= 0 || newStepWorkCenterId <= 0) {
      setMessage({ intent: "error", text: "New step requires line, code, name, sequence, and work center." });
      return;
    }

    const tempId = -Date.now();
    setEditableSteps((prev) => [
      ...prev,
      {
        stepInstanceId: tempId,
        lineId: newStepLineId,
        stepCode: newStepCode.trim(),
        stepName: newStepName.trim(),
        stepSequence: newStepSequence,
        workCenterId: newStepWorkCenterId,
        isRequired: newStepIsRequired,
        isNew: true,
        markedForRemoval: false,
      },
    ]);
    setNewStepCode("");
    setNewStepName("");
    setNewStepSequence((prev) => prev + 1);
    setMessage(null);
  };

  const runRouteAction = async (action: "validate" | "adjust" | "reopen") => {
    if (!selectedOrderId) return;
    if (!reviewerEmpNo.trim()) {
      setMessage({ intent: "error", text: "Reviewer employee number is required." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        isAdjusted: action === "adjust",
        notes: notes.trim() || null,
        reviewerEmpNo: reviewerEmpNo.trim(),
        actingRole,
        adjustments: action === "adjust" ? stepAdjustments : null,
      };
      if (action === "validate") await ordersApi.validateRoute(selectedOrderId, payload);
      if (action === "adjust") await ordersApi.adjustRoute(selectedOrderId, payload);
      if (action === "reopen") await ordersApi.reopenRoute(selectedOrderId, payload);

      await loadQueues();
      const refreshed = await ordersApi.orderRouteExecution(selectedOrderId);
      setRouteExecution(refreshed);
      const flattened = flattenRouteSteps(refreshed);
      setBaselineSteps(flattened);
      setEditableSteps(flattened);
      setMessage({ intent: "success", text: `Route ${action} completed.` });
    } catch (error) {
      setMessage({ intent: "error", text: getApiErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const runSupervisorDecision = async (action: "approve" | "reject") => {
    if (!selectedOrderId) return;
    if (!reviewerEmpNo.trim()) {
      setMessage({ intent: "error", text: "Supervisor employee number is required." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload = { empNo: reviewerEmpNo.trim(), notes: notes.trim() || null, actingRole };
      if (action === "approve") await ordersApi.supervisorApprove(selectedOrderId, payload);
      if (action === "reject") await ordersApi.supervisorReject(selectedOrderId, payload);
      await loadQueues();
      setMessage({ intent: "success", text: `Supervisor ${action} completed.` });
    } catch (error) {
      setMessage({ intent: "error", text: getApiErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.root}>
      <Title2>Supervisor Route Review & Decision Queue</Title2>
      <Body1>
        Review route plans before execution, preview step changes, then validate/adjust/reopen routes or approve/reject
        pending supervisor decisions.
      </Body1>

      {message ? (
        <MessageBar intent={message.intent}>
          <MessageBarBody>{message.text}</MessageBarBody>
        </MessageBar>
      ) : null}

      <div className={styles.grid}>
        <Card className={styles.section}>
          <div className={styles.rowActions}>
            <Button appearance={mode === "routeReview" ? "primary" : "secondary"} onClick={() => setMode("routeReview")}>
              Route Review Queue
            </Button>
            <Button
              appearance={mode === "supervisorDecision" ? "primary" : "secondary"}
              onClick={() => setMode("supervisorDecision")}
            >
              Supervisor Decision Queue
            </Button>
          </div>
          {activeQueue.length === 0 ? (
            <Body1>No orders in this queue.</Body1>
          ) : (
            activeQueue.map((order) => (
              <Button
                key={order.id}
                className={styles.queueBtn}
                appearance={selectedOrderId === order.id ? "primary" : "secondary"}
                onClick={() => setSelectedOrderId(order.id)}
              >
                {order.salesOrderNo} ({order.customerName})
              </Button>
            ))
          )}
        </Card>

        <div className={styles.section}>
          <Card className={styles.section}>
            <Body1>
              <strong>Selected Order:</strong> {selectedOrderId ?? "None"}
            </Body1>
            <Field label="Acting Role">
              <Input value={actingRole} onChange={(_, d) => setActingRole((d.value as OrderWorkspaceRole) || "Supervisor")} />
            </Field>
            <Field label="Reviewer / Supervisor Emp No">
              <Input value={reviewerEmpNo} onChange={(_, d) => setReviewerEmpNo(d.value)} />
            </Field>
            <Field label="Notes">
              <Input value={notes} onChange={(_, d) => setNotes(d.value)} />
            </Field>
            <div className={styles.rowActions}>
              {mode === "routeReview" ? (
                <>
                  <Button disabled={busy || !selectedOrderId} onClick={() => void runRouteAction("validate")}>
                    Validate
                  </Button>
                  <Button appearance="primary" disabled={busy || !selectedOrderId} onClick={() => void runRouteAction("adjust")}>
                    Adjust
                  </Button>
                  <Button disabled={busy || !selectedOrderId} onClick={() => void runRouteAction("reopen")}>
                    Reopen
                  </Button>
                </>
              ) : (
                <>
                  <Button appearance="primary" disabled={busy || !selectedOrderId} onClick={() => void runSupervisorDecision("approve")}>
                    Approve
                  </Button>
                  <Button disabled={busy || !selectedOrderId} onClick={() => void runSupervisorDecision("reject")}>
                    Reject
                  </Button>
                </>
              )}
            </div>
          </Card>

          <Card className={styles.section}>
            <Body1>
              <strong>Route Steps (Editable Draft)</strong>
            </Body1>
            {editableSteps.length === 0 ? (
              <Body1>No route steps found for this order.</Body1>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Step</TableHeaderCell>
                    <TableHeaderCell>Line</TableHeaderCell>
                    <TableHeaderCell>State</TableHeaderCell>
                    <TableHeaderCell>Required</TableHeaderCell>
                    <TableHeaderCell>Sequence</TableHeaderCell>
                    <TableHeaderCell>Work Center ID</TableHeaderCell>
                    <TableHeaderCell>Action</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableSteps.map((step) => (
                    <TableRow key={step.stepInstanceId}>
                      <TableCell>
                        {step.stepCode} - {step.stepName}
                      </TableCell>
                      <TableCell>{step.lineId}</TableCell>
                      <TableCell>{stepStateById.get(step.stepInstanceId)?.state ?? "--"}</TableCell>
                      <TableCell>{step.isRequired ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Input
                          value={String(step.stepSequence)}
                          onChange={(_, d) => updateStep(step.stepInstanceId, { stepSequence: Number(d.value) || 0 })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={String(step.workCenterId)}
                          onChange={(_, d) => updateStep(step.stepInstanceId, { workCenterId: Number(d.value) || 0 })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          appearance={step.markedForRemoval ? "primary" : "secondary"}
                          disabled={step.isRequired}
                          onClick={() =>
                            updateStep(step.stepInstanceId, { markedForRemoval: !step.markedForRemoval })
                          }
                        >
                          {step.markedForRemoval ? "Undo Remove" : "Remove"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card className={styles.section}>
            <Body1>
              <strong>Add Step</strong>
            </Body1>
            <div className={styles.rowActions}>
              <Field label="Line ID">
                <Dropdown
                  selectedOptions={newStepLineId > 0 ? [String(newStepLineId)] : []}
                  value={newStepLineId > 0 ? String(newStepLineId) : ""}
                  onOptionSelect={(_, data) => setNewStepLineId(Number(data.optionValue) || 0)}
                >
                  {lineOptions.map((line) => (
                    <Option key={line.lineId} value={String(line.lineId)} text={String(line.lineId)}>
                      {line.lineId}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Step Code">
                <Input value={newStepCode} onChange={(_, d) => setNewStepCode(d.value)} />
              </Field>
              <Field label="Step Name">
                <Input value={newStepName} onChange={(_, d) => setNewStepName(d.value)} />
              </Field>
              <Field label="Sequence">
                <Input value={String(newStepSequence || "")} onChange={(_, d) => setNewStepSequence(Number(d.value) || 0)} />
              </Field>
              <Field label="Work Center ID">
                <Dropdown
                  selectedOptions={newStepWorkCenterId > 0 ? [String(newStepWorkCenterId)] : []}
                  value={
                    newStepWorkCenterId > 0
                      ? `${newStepWorkCenterId} - ${workCenters.find((wc) => wc.id === newStepWorkCenterId)?.workCenterName ?? ""}`
                      : ""
                  }
                  onOptionSelect={(_, data) => setNewStepWorkCenterId(Number(data.optionValue) || 0)}
                >
                  {workCenters.map((workCenter) => (
                    <Option
                      key={workCenter.id}
                      value={String(workCenter.id)}
                      text={`${workCenter.id} - ${workCenter.workCenterName}`}
                    >
                      {workCenter.id} - {workCenter.workCenterName}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Required Step">
                <Switch
                  checked={newStepIsRequired}
                  onChange={(_, data) => setNewStepIsRequired(data.checked)}
                  label={newStepIsRequired ? "Required" : "Optional"}
                />
              </Field>
            </div>
            <Button onClick={addDraftStep}>Add Draft Step</Button>
          </Card>

          <Card className={styles.section}>
            <div className={styles.rowActions}>
              <Body1>
                <strong>Diff Preview</strong>
              </Body1>
              <Badge appearance="filled">{diffRows.length} changed step(s)</Badge>
            </div>
            {diffRows.length === 0 ? (
              <Body1>No add/remove/resequence/work-center changes in the draft.</Body1>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Step</TableHeaderCell>
                    <TableHeaderCell>Change</TableHeaderCell>
                    <TableHeaderCell>Sequence</TableHeaderCell>
                    <TableHeaderCell>Work Center</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diffRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>{row.stepCode}</TableCell>
                      <TableCell>
                        {row.kind.toUpperCase()}
                      </TableCell>
                      <TableCell>
                        {row.sequenceBefore ?? "--"} → {row.sequenceAfter ?? "--"}
                      </TableCell>
                      <TableCell>
                        {row.workCenterBefore ?? "--"} → {row.workCenterAfter ?? "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
