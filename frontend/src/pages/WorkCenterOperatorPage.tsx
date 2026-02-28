import { useEffect, useMemo, useState } from "react";
import {
  Body1,
  Button,
  Card,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
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
import { useNavigate } from "react-router-dom";
import { orderLookupsApi, ordersApi } from "../services/orders";
import { readTabletSetup } from "../features/tabletSetupStorage";
import type { Lookup } from "../types/customer";
import type {
  LineRouteExecution,
  OrderRouteExecution,
  RouteStepExecution,
  WorkCenterQueueItem,
} from "../types/order";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#F5F5F5",
    padding: tokens.spacingHorizontalL,
    display: "grid",
    gap: tokens.spacingVerticalM,
    alignContent: "start",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  context: {
    display: "flex",
    gap: tokens.spacingHorizontalL,
    flexWrap: "wrap",
  },
  largeButton: {
    minHeight: "44px",
    minWidth: "120px",
  },
  card: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  queueRow: {
    cursor: "pointer",
  },
  selectedQueueRow: {
    backgroundColor: "#E0EFF8",
  },
  actionRow: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  splitGrid: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  requiredLabel: {
    color: "#8A8886",
    fontSize: "12px",
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalS,
    color: "#123046",
    fontWeight: 600,
  },
});

type CaptureProgress = {
  usageDone: boolean;
  scrapDone: boolean;
  serialDone: boolean;
  checklistDone: boolean;
};

const EMPTY_CAPTURE_PROGRESS: CaptureProgress = {
  usageDone: false,
  scrapDone: false,
  serialDone: false,
  checklistDone: false,
};

const DEFAULT_ROLE = "Production" as const;

function getActiveLineRoute(
  execution: OrderRouteExecution | null,
  selectedQueueItem: WorkCenterQueueItem | null
): LineRouteExecution | null {
  if (!execution || !selectedQueueItem) {
    return null;
  }
  return execution.routes.find((route) => route.lineId === selectedQueueItem.lineId) ?? null;
}

function getSelectedStep(
  lineRoute: LineRouteExecution | null,
  selectedQueueItem: WorkCenterQueueItem | null,
  workCenterId: number
): RouteStepExecution | null {
  if (!lineRoute) {
    return null;
  }
  if (selectedQueueItem) {
    const exact = lineRoute.steps.find(
      (step) => step.stepInstanceId === selectedQueueItem.stepInstanceId
    );
    if (exact) {
      return exact;
    }
  }
  return (
    lineRoute.steps.find((step) => step.workCenterId === workCenterId && step.state !== "Completed") ??
    lineRoute.steps[0] ??
    null
  );
}

export function WorkCenterOperatorPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const setup = readTabletSetup();

  const [queue, setQueue] = useState<WorkCenterQueueItem[]>([]);
  const [selectedQueueItem, setSelectedQueueItem] = useState<WorkCenterQueueItem | null>(null);
  const [execution, setExecution] = useState<OrderRouteExecution | null>(null);
  const [scrapReasons, setScrapReasons] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [empNo, setEmpNo] = useState(setup?.operatorEmpNo ?? "");
  const [deviceId, setDeviceId] = useState(setup?.deviceId ?? "");
  const [notes, setNotes] = useState("");
  const [manualDurationMinutes, setManualDurationMinutes] = useState("");
  const [manualDurationReason, setManualDurationReason] = useState("");

  const [usagePartItemId, setUsagePartItemId] = useState("");
  const [usageQuantity, setUsageQuantity] = useState("");
  const [scrapQuantity, setScrapQuantity] = useState("");
  const [scrapReasonId, setScrapReasonId] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [serialManufacturer, setSerialManufacturer] = useState("");
  const [serialConditionStatus, setSerialConditionStatus] = useState("Good");
  const [checklistItemId, setChecklistItemId] = useState("");
  const [checklistLabel, setChecklistLabel] = useState("");
  const [checklistStatus, setChecklistStatus] = useState("Pass");
  const [checklistNotes, setChecklistNotes] = useState("");

  const [progressByStep, setProgressByStep] = useState<Record<number, CaptureProgress>>({});

  useEffect(() => {
    if (!setup) {
      navigate("/setup/tablet", { replace: true });
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [queueRows, scrapReasonRows] = await Promise.all([
          ordersApi.workCenterQueue(setup.workCenterId),
          orderLookupsApi.scrapReasons(),
        ]);
        setQueue(queueRows);
        setSelectedQueueItem(queueRows[0] ?? null);
        setScrapReasons(scrapReasonRows);
      } catch {
        setError("Unable to load work center queue.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [navigate, setup]);

  useEffect(() => {
    if (!setup || !selectedQueueItem) {
      setExecution(null);
      return;
    }

    const loadExecution = async () => {
      setError(null);
      try {
        const executionResponse = await ordersApi.lineRouteExecution(
          selectedQueueItem.orderId,
          selectedQueueItem.lineId
        );
        setExecution(executionResponse);
      } catch {
        setError("Unable to load selected route step.");
      }
    };

    void loadExecution();
  }, [selectedQueueItem, setup]);

  const lineRoute = useMemo(
    () => getActiveLineRoute(execution, selectedQueueItem),
    [execution, selectedQueueItem]
  );
  const step = useMemo(
    () => getSelectedStep(lineRoute, selectedQueueItem, setup?.workCenterId ?? -1),
    [lineRoute, selectedQueueItem, setup?.workCenterId]
  );

  const captureProgress = step ? progressByStep[step.stepInstanceId] ?? EMPTY_CAPTURE_PROGRESS : EMPTY_CAPTURE_PROGRESS;
  const hasEmpNo = empNo.trim().length > 0;
  const hasBlockedReason = Boolean(step?.blockedReason);
  const usageSatisfied = !step?.requiresUsageEntry || captureProgress.usageDone;
  const scrapSatisfied = !step?.requiresScrapEntry || captureProgress.scrapDone;
  const serialSatisfied = !step?.requiresSerialCapture || captureProgress.serialDone;
  const checklistSatisfied = !step?.requiresChecklistCompletion || captureProgress.checklistDone;
  const canComplete =
    Boolean(step) &&
    hasEmpNo &&
    !hasBlockedReason &&
    usageSatisfied &&
    scrapSatisfied &&
    serialSatisfied &&
    checklistSatisfied;

  const withStepProgress = (patch: Partial<CaptureProgress>) => {
    if (!step) {
      return;
    }
    setProgressByStep((current) => ({
      ...current,
      [step.stepInstanceId]: {
        ...(current[step.stepInstanceId] ?? EMPTY_CAPTURE_PROGRESS),
        ...patch,
      },
    }));
  };

  const runAction = async (name: string, fn: () => Promise<void>) => {
    setBusyAction(name);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch {
      setError("Action failed. Please retry.");
    } finally {
      setBusyAction(null);
    }
  };

  const scanIn = async () => {
    if (!step || !selectedQueueItem || !setup || !hasEmpNo) {
      return;
    }
    await runAction("scanIn", async () => {
      await ordersApi.scanIn(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        empNo: empNo.trim(),
        deviceId: deviceId.trim() || null,
        workCenterId: setup.workCenterId,
        actingRole: DEFAULT_ROLE,
      });
      setInfo("Scan in recorded.");
    });
  };

  const scanOut = async () => {
    if (!step || !selectedQueueItem || !setup || !hasEmpNo) {
      return;
    }
    await runAction("scanOut", async () => {
      await ordersApi.scanOut(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        empNo: empNo.trim(),
        deviceId: deviceId.trim() || null,
        workCenterId: setup.workCenterId,
        actingRole: DEFAULT_ROLE,
      });
      setInfo("Scan out recorded.");
    });
  };

  const addUsage = async () => {
    if (!step || !selectedQueueItem || !hasEmpNo || !usagePartItemId || !usageQuantity) {
      return;
    }
    await runAction("addUsage", async () => {
      await ordersApi.addStepUsage(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        partItemId: Number(usagePartItemId),
        quantityUsed: Number(usageQuantity),
        recordedByEmpNo: empNo.trim(),
        actingRole: DEFAULT_ROLE,
      });
      setUsagePartItemId("");
      setUsageQuantity("");
      withStepProgress({ usageDone: true });
      setInfo("Usage recorded.");
    });
  };

  const addScrap = async () => {
    if (!step || !selectedQueueItem || !hasEmpNo || !scrapQuantity || !scrapReasonId) {
      return;
    }
    await runAction("addScrap", async () => {
      await ordersApi.addStepScrap(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        quantityScrapped: Number(scrapQuantity),
        scrapReasonId: Number(scrapReasonId),
        recordedByEmpNo: empNo.trim(),
        actingRole: DEFAULT_ROLE,
      });
      setScrapQuantity("");
      setScrapReasonId("");
      withStepProgress({ scrapDone: true });
      setInfo("Scrap recorded.");
    });
  };

  const addSerial = async () => {
    if (!step || !selectedQueueItem || !hasEmpNo || !serialNo.trim()) {
      return;
    }
    await runAction("addSerial", async () => {
      await ordersApi.addStepSerial(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        serialNo: serialNo.trim(),
        manufacturer: serialManufacturer.trim() || "Unknown",
        conditionStatus: serialConditionStatus,
        recordedByEmpNo: empNo.trim(),
        actingRole: DEFAULT_ROLE,
      });
      setSerialNo("");
      setSerialManufacturer("");
      setSerialConditionStatus("Good");
      withStepProgress({ serialDone: true });
      setInfo("Serial capture recorded.");
    });
  };

  const addChecklist = async () => {
    if (!step || !selectedQueueItem || !hasEmpNo || !checklistLabel.trim()) {
      return;
    }
    await runAction("addChecklist", async () => {
      await ordersApi.addStepChecklist(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        checklistTemplateItemId: Number(checklistItemId || 1),
        itemLabel: checklistLabel.trim(),
        isRequiredItem: true,
        resultStatus: checklistStatus,
        resultNotes: checklistNotes.trim() || null,
        completedByEmpNo: empNo.trim(),
        actingRole: DEFAULT_ROLE,
      });
      setChecklistItemId("");
      setChecklistLabel("");
      setChecklistStatus("Pass");
      setChecklistNotes("");
      withStepProgress({ checklistDone: true });
      setInfo("Checklist result recorded.");
    });
  };

  const completeStep = async () => {
    if (!step || !selectedQueueItem || !hasEmpNo || !canComplete) {
      return;
    }

    await runAction("completeStep", async () => {
      await ordersApi.completeStep(selectedQueueItem.orderId, selectedQueueItem.lineId, step.stepInstanceId, {
        empNo: empNo.trim(),
        actingRole: DEFAULT_ROLE,
        notes: notes.trim() || null,
        manualDurationMinutes: manualDurationMinutes ? Number(manualDurationMinutes) : null,
        manualDurationReason: manualDurationReason.trim() || null,
      });

      const queueRows = await ordersApi.workCenterQueue(setup?.workCenterId ?? -1);
      setQueue(queueRows);
      setSelectedQueueItem(queueRows[0] ?? null);
      setExecution(null);
      setInfo("Step completed.");
    });
  };

  if (!setup) {
    return null;
  }

  return (
    <main className={styles.page}>
      <div className={styles.topRow}>
        <div>
          <Title2>Work Center Operator</Title2>
          <Body1>
            {setup.workCenterCode} - {setup.workCenterName}
          </Body1>
        </div>
        <div className={styles.actionRow}>
          <Button className={styles.largeButton} appearance="secondary" onClick={() => navigate("/setup/tablet")}>
            Change Tablet Setup
          </Button>
          <Button className={styles.largeButton} appearance="secondary" onClick={() => navigate("/")}>
            Home
          </Button>
        </div>
      </div>

      <div className={styles.context}>
        <Field label="Operator Employee #">
          <Input value={empNo} onChange={(_, data) => setEmpNo(data.value)} />
        </Field>
        <Field label="Device ID">
          <Input value={deviceId} onChange={(_, data) => setDeviceId(data.value)} />
        </Field>
      </div>

      {error ? (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      ) : null}
      {info ? (
        <MessageBar>
          <MessageBarBody>{info}</MessageBarBody>
        </MessageBar>
      ) : null}

      <Card className={styles.card}>
        <div className={styles.sectionTitle}>Queue</div>
        {loading ? (
          <Body1>Loading queue...</Body1>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Order</TableHeaderCell>
                <TableHeaderCell>Line</TableHeaderCell>
                <TableHeaderCell>Step</TableHeaderCell>
                <TableHeaderCell>State</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((row) => (
                <TableRow
                  key={row.stepInstanceId}
                  className={mergeClasses(
                    styles.queueRow,
                    selectedQueueItem?.stepInstanceId === row.stepInstanceId
                      ? styles.selectedQueueRow
                      : undefined
                  )}
                  onClick={() => setSelectedQueueItem(row)}
                >
                  <TableCell>{row.salesOrderNo}</TableCell>
                  <TableCell>{row.lineId}</TableCell>
                  <TableCell>
                    {row.stepCode} - {row.stepName}
                  </TableCell>
                  <TableCell>{row.stepState}</TableCell>
                </TableRow>
              ))}
              {queue.length === 0 ? (
                <TableRow>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>No queued work at this center.</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className={styles.card}>
        <div className={styles.sectionTitle}>Current Step</div>
        {!step ? (
          <Body1>Select a queued line to begin.</Body1>
        ) : (
          <div className={styles.splitGrid}>
            <Body1>
              {step.stepCode} - {step.stepName} (State: {step.state})
            </Body1>
            {step.blockedReason ? <Body1>Blocked: {step.blockedReason}</Body1> : null}

            <div className={styles.actionRow}>
              <Button
                className={styles.largeButton}
                appearance="primary"
                onClick={() => void scanIn()}
                disabled={busyAction !== null || !hasEmpNo}
              >
                Scan In
              </Button>
              <Button
                className={styles.largeButton}
                appearance="secondary"
                onClick={() => void scanOut()}
                disabled={busyAction !== null || !hasEmpNo}
              >
                Scan Out
              </Button>
              <Button
                className={styles.largeButton}
                appearance="primary"
                onClick={() => void completeStep()}
                disabled={busyAction !== null || !canComplete}
              >
                Complete Step
              </Button>
            </div>

            <Field label="Completion Notes">
              <Input value={notes} onChange={(_, data) => setNotes(data.value)} />
            </Field>

            {step.timeCaptureMode === "Manual" || step.timeCaptureMode === "Hybrid" ? (
              <div className={styles.fieldGrid}>
                <Field label="Manual Duration Minutes">
                  <Input
                    value={manualDurationMinutes}
                    onChange={(_, data) => setManualDurationMinutes(data.value)}
                  />
                </Field>
                <Field label="Manual Duration Reason">
                  <Input
                    value={manualDurationReason}
                    onChange={(_, data) => setManualDurationReason(data.value)}
                  />
                </Field>
              </div>
            ) : null}

            <div>
              <div className={styles.sectionTitle}>Usage Capture</div>
              <Body1 className={styles.requiredLabel}>
                {step.requiresUsageEntry ? "Required before complete." : "Optional."}
              </Body1>
              <div className={styles.fieldGrid}>
                <Field label="Part Item Id">
                  <Input value={usagePartItemId} onChange={(_, data) => setUsagePartItemId(data.value)} />
                </Field>
                <Field label="Quantity Used">
                  <Input value={usageQuantity} onChange={(_, data) => setUsageQuantity(data.value)} />
                </Field>
              </div>
              <Button onClick={() => void addUsage()} disabled={busyAction !== null || !hasEmpNo}>
                Add Usage
              </Button>
            </div>

            <div>
              <div className={styles.sectionTitle}>Scrap Capture</div>
              <Body1 className={styles.requiredLabel}>
                {step.requiresScrapEntry ? "Required before complete." : "Optional."}
              </Body1>
              <div className={styles.fieldGrid}>
                <Field label="Scrap Quantity">
                  <Input value={scrapQuantity} onChange={(_, data) => setScrapQuantity(data.value)} />
                </Field>
                <Field label="Scrap Reason">
                  <Select value={scrapReasonId} onChange={(event) => setScrapReasonId(event.target.value)}>
                    <option value="">Select reason</option>
                    {scrapReasons.map((reason) => (
                      <option key={reason.id} value={reason.id}>
                        {reason.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Button onClick={() => void addScrap()} disabled={busyAction !== null || !hasEmpNo}>
                Add Scrap
              </Button>
            </div>

            <div>
              <div className={styles.sectionTitle}>Serial Capture</div>
              <Body1 className={styles.requiredLabel}>
                {step.requiresSerialCapture ? "Required before complete." : "Optional."}
              </Body1>
              <div className={styles.fieldGrid}>
                <Field label="Serial No">
                  <Input value={serialNo} onChange={(_, data) => setSerialNo(data.value)} />
                </Field>
                <Field label="Manufacturer">
                  <Input value={serialManufacturer} onChange={(_, data) => setSerialManufacturer(data.value)} />
                </Field>
                <Field label="Condition">
                  <Select
                    value={serialConditionStatus}
                    onChange={(event) => setSerialConditionStatus(event.target.value)}
                  >
                    <option value="Good">Good</option>
                    <option value="Bad">Bad</option>
                  </Select>
                </Field>
              </div>
              <Button onClick={() => void addSerial()} disabled={busyAction !== null || !hasEmpNo}>
                Add Serial
              </Button>
            </div>

            <div>
              <div className={styles.sectionTitle}>Checklist</div>
              <Body1 className={styles.requiredLabel}>
                {step.requiresChecklistCompletion ? "Required before complete." : "Optional."}
              </Body1>
              <div className={styles.fieldGrid}>
                <Field label="Checklist Item Id">
                  <Input value={checklistItemId} onChange={(_, data) => setChecklistItemId(data.value)} />
                </Field>
                <Field label="Checklist Label">
                  <Input value={checklistLabel} onChange={(_, data) => setChecklistLabel(data.value)} />
                </Field>
                <Field label="Result">
                  <Select value={checklistStatus} onChange={(event) => setChecklistStatus(event.target.value)}>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </Select>
                </Field>
                <Field label="Result Notes">
                  <Input value={checklistNotes} onChange={(_, data) => setChecklistNotes(data.value)} />
                </Field>
              </div>
              <Button onClick={() => void addChecklist()} disabled={busyAction !== null || !hasEmpNo}>
                Add Checklist Result
              </Button>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
