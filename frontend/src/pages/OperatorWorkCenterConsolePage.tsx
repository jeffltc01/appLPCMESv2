import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Body1,
  Caption1,
  Button,
  Card,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title1,
  Title3,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ordersApi } from "../services/orders";
import { ApiError } from "../services/api";
import type {
  OperatorActivityLogItem,
  OrderRouteExecution,
  OrderWorkspaceRole,
  WorkCenterQueueItem,
} from "../types/order";

type MessageState = {
  type: "success" | "error" | "warning" | "info";
  title: string;
  text: string;
};

type StepCaptureState = {
  usage: boolean;
  scrap: boolean;
  serials: boolean;
  checklist: boolean;
  trailer: boolean;
  serialLoadVerified: boolean;
  packingSlip: boolean;
  bol: boolean;
};

type OperatorAction =
  | "scanIn"
  | "addUsage"
  | "addScrap"
  | "addSerial"
  | "addChecklist"
  | "captureTrailer"
  | "verifySerials"
  | "generatePackingSlip"
  | "generateBol"
  | "correctDuration"
  | "scanOutAndComplete";

const emptyCaptureState: StepCaptureState = {
  usage: false,
  scrap: false,
  serials: false,
  checklist: false,
  trailer: false,
  serialLoadVerified: false,
  packingSlip: false,
  bol: false,
};

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  topBanner: {
    backgroundColor: "#123046",
    color: "#ffffff",
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
  },
  topBannerMeta: {
    display: "flex",
    gap: tokens.spacingHorizontalL,
    flexWrap: "wrap",
  },
  bannerTitle: {
    color: "#ffffff",
    margin: 0,
  },
  bannerCaption: {
    color: "rgba(255,255,255,0.9)",
  },
  controlRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: tokens.spacingHorizontalS,
    alignItems: "end",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  actionButton: {
    minHeight: "44px",
  },
  queueButton: {
    marginBottom: tokens.spacingVerticalS,
    minHeight: "44px",
  },
  scanActionRow: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
    marginBottom: tokens.spacingVerticalS,
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "#E0EFF8",
    color: "#123046",
    borderRadius: tokens.borderRadiusCircular,
    padding: `2px ${tokens.spacingHorizontalS}`,
    fontWeight: tokens.fontWeightSemibold,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  subsection: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  warningText: {
    color: tokens.colorPaletteRedForeground1,
  },
});

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (
      typeof error.body === "object" &&
      error.body !== null &&
      "message" in error.body &&
      typeof (error.body as { message?: unknown }).message === "string"
    ) {
      return (error.body as { message: string }).message;
    }
    return `Request failed (${error.status}).`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Operator action failed.";
}

export function OperatorWorkCenterConsolePage() {
  const styles = useStyles();
  const [workCenterId, setWorkCenterId] = useState("1");
  const [queue, setQueue] = useState<WorkCenterQueueItem[]>([]);
  const [activityLog, setActivityLog] = useState<OperatorActivityLogItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [routeExecution, setRouteExecution] = useState<OrderRouteExecution | null>(null);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [scanValue, setScanValue] = useState("");
  const [autoLoadNext, setAutoLoadNext] = useState(true);
  const [lastAction, setLastAction] = useState<OperatorAction | null>(null);
  const [captureByStepId, setCaptureByStepId] = useState<Record<number, StepCaptureState>>({});
  const [supervisorOverrideEmpNo, setSupervisorOverrideEmpNo] = useState("");
  const [supervisorOverrideReason, setSupervisorOverrideReason] = useState("");
  const [verifiedSerialNosCsv, setVerifiedSerialNosCsv] = useState("");
  const [manualDurationMinutes, setManualDurationMinutes] = useState("");
  const [manualDurationReason, setManualDurationReason] = useState("");
  const [trailerNo, setTrailerNo] = useState("");
  const [usagePartItemId, setUsagePartItemId] = useState("");
  const [usageQty, setUsageQty] = useState("");
  const [usageUom, setUsageUom] = useState("");
  const [scrapQty, setScrapQty] = useState("");
  const [scrapReasonId, setScrapReasonId] = useState("");
  const [scrapNotes, setScrapNotes] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [serialManufacturer, setSerialManufacturer] = useState("");
  const [serialCondition, setSerialCondition] = useState("Good");
  const [serialScrapReasonId, setSerialScrapReasonId] = useState("");
  const [checklistTemplateItemId, setChecklistTemplateItemId] = useState("");
  const [checklistLabel, setChecklistLabel] = useState("");
  const [checklistRequired, setChecklistRequired] = useState(true);
  const [checklistResult, setChecklistResult] = useState("Pass");
  const [checklistNotes, setChecklistNotes] = useState("");
  const [actingRole, setActingRole] = useState<OrderWorkspaceRole>("Production");
  const [actingEmpNo, setActingEmpNo] = useState("OP001");
  const [timerNow, setTimerNow] = useState(() => Date.now());
  const scanInputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(
    () => queue.find((item) => item.stepInstanceId === selectedStepId) ?? null,
    [queue, selectedStepId]
  );

  const loadQueue = useCallback(async (preferredStepId?: number | null) => {
    const id = Number(workCenterId);
    if (!Number.isFinite(id) || id <= 0) {
      setMessage({
        type: "warning",
        title: "Invalid work center",
        text: "Work center ID must be a positive number.",
      });
      return;
    }
    setLoadingQueue(true);
    try {
      const rows = await ordersApi.workCenterQueue(id);
      setQueue(rows);
      const requestedStepId = preferredStepId ?? null;
      const nextStepId =
        requestedStepId && rows.some((row) => row.stepInstanceId === requestedStepId)
          ? requestedStepId
          : (rows[0]?.stepInstanceId ?? null);
      setSelectedStepId(nextStepId);
    } catch {
      setMessage({
        type: "error",
        title: "Queue load failed",
        text: "Unable to load work-center queue. Check network and retry.",
      });
    } finally {
      setLoadingQueue(false);
    }
  }, [workCenterId]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    const timerId = window.setInterval(() => setTimerNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const focusScanField = useCallback(() => {
    window.setTimeout(() => scanInputRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    focusScanField();
  }, [focusScanField, selectedStepId]);

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
      .catch(() =>
        setMessage({
          type: "error",
          title: "Route load failed",
          text: "Unable to load route execution details.",
        })
      );
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

  const selectedLine = useMemo(
    () => routeExecution?.routes.find((route) => route.lineId === selected?.lineId),
    [routeExecution, selected?.lineId]
  );

  const stepCaptureState = useMemo(
    () => (selected ? captureByStepId[selected.stepInstanceId] ?? emptyCaptureState : emptyCaptureState),
    [captureByStepId, selected]
  );

  const hasActivity = useCallback(
    (stepId: number, fragments: string[]) =>
      activityLog.some((entry) => {
        if (entry.orderLineRouteStepInstanceId !== stepId) return false;
        const type = entry.actionType.toLowerCase();
        return fragments.some((fragment) => type.includes(fragment.toLowerCase()));
      }),
    [activityLog]
  );

  const stepEvidence = useMemo(() => {
    if (!selected) {
      return emptyCaptureState;
    }
    const stepId = selected.stepInstanceId;
    return {
      usage: stepCaptureState.usage || hasActivity(stepId, ["usage"]),
      scrap: stepCaptureState.scrap || hasActivity(stepId, ["scrap"]),
      serials:
        stepCaptureState.serials ||
        hasActivity(stepId, ["serialcapture", "addserial", "serial captured", "serial"]),
      checklist: stepCaptureState.checklist || hasActivity(stepId, ["checklist"]),
      trailer: stepCaptureState.trailer || hasActivity(stepId, ["trailer"]),
      serialLoadVerified:
        stepCaptureState.serialLoadVerified || hasActivity(stepId, ["serialloadverified", "verify"]),
      packingSlip: stepCaptureState.packingSlip || hasActivity(stepId, ["packingslip"]),
      bol: stepCaptureState.bol || hasActivity(stepId, ["billoflading", "generatebol"]),
    };
  }, [hasActivity, selected, stepCaptureState]);

  const completionWarnings = useMemo(() => {
    if (!selectedStep) return ["Select a queue row to begin."];

    const warnings: string[] = [];
    if (selectedStep.state !== "InProgress") {
      warnings.push("Step must be in progress. Scan in before completing.");
    }
    if (selectedStep.blockedReason) {
      warnings.push(`Blocked: ${selectedStep.blockedReason}`);
    }
    if (selectedStep.dataCaptureMode !== "PaperOnly") {
      if (selectedStep.requiresUsageEntry && !stepEvidence.usage) warnings.push("Usage entry is required.");
      if (selectedStep.requiresScrapEntry && !stepEvidence.scrap) warnings.push("Scrap entry is required.");
      if (selectedStep.requiresSerialCapture && !stepEvidence.serials) warnings.push("Serial capture is required.");
      if (selectedStep.requiresChecklistCompletion && !stepEvidence.checklist)
        warnings.push("Checklist completion is required.");
    }
    if (selectedStep.requiresTrailerCapture && !stepEvidence.trailer) warnings.push("Trailer capture is required.");
    if (selectedStep.requiresSerialLoadVerification && !stepEvidence.serialLoadVerified)
      warnings.push("Serial load verification is required.");
    if (selectedStep.generatePackingSlipOnComplete && !stepEvidence.packingSlip)
      warnings.push("Packing slip generation is required.");
    if (selectedStep.generateBolOnComplete && !stepEvidence.bol)
      warnings.push("Bill of lading generation is required.");
    if (
      selectedStep.checklistFailurePolicy === "AllowWithSupervisorOverride" &&
      (supervisorOverrideEmpNo.trim() || supervisorOverrideReason.trim()) &&
      (!supervisorOverrideEmpNo.trim() || !supervisorOverrideReason.trim())
    ) {
      warnings.push("Provide both supervisor override employee number and reason.");
    }
    return warnings;
  }, [selectedStep, stepEvidence, supervisorOverrideEmpNo, supervisorOverrideReason]);

  const timerChip = useMemo(() => {
    if (!selectedStep?.scanInUtc) return "00:00:00";
    const started = new Date(selectedStep.scanInUtc).getTime();
    if (!Number.isFinite(started)) return "00:00:00";
    const elapsedMs = Math.max(0, timerNow - started);
    const seconds = Math.floor(elapsedMs / 1000);
    const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }, [selectedStep?.scanInUtc, timerNow]);
  const currentClock = useMemo(() => new Date(timerNow).toLocaleTimeString(), [timerNow]);

  const refreshSelectedData = useCallback(
    async (item: WorkCenterQueueItem) => {
      const [route, logs] = await Promise.all([
        ordersApi.lineRouteExecution(item.orderId, item.lineId),
        ordersApi.orderWorkCenterActivityLog(item.orderId),
      ]);
      setRouteExecution(route);
      setActivityLog(logs);
    },
    []
  );

  const markStepCapture = useCallback((stepId: number, key: keyof StepCaptureState) => {
    setCaptureByStepId((prev) => ({
      ...prev,
      [stepId]: {
        ...(prev[stepId] ?? emptyCaptureState),
        [key]: true,
      },
    }));
  }, []);

  const performAction = async (action: OperatorAction) => {
    if (!selected) return;
    setActionBusy(true);
    setLastAction(action);
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
      } else if (action === "addUsage") {
        const partItemId = Number(usagePartItemId);
        const quantityUsed = Number(usageQty);
        if (!Number.isFinite(partItemId) || partItemId <= 0) {
          throw new Error("Usage part item ID must be a positive number.");
        }
        if (!Number.isFinite(quantityUsed) || quantityUsed <= 0) {
          throw new Error("Usage quantity must be greater than zero.");
        }
        await ordersApi.addStepUsage(selected.orderId, selected.lineId, selected.stepInstanceId, {
          partItemId,
          quantityUsed,
          uom: usageUom.trim() || null,
          recordedByEmpNo: empNoToUse,
          actingRole: roleToUse,
        });
        markStepCapture(selected.stepInstanceId, "usage");
      } else if (action === "addScrap") {
        const quantityScrapped = Number(scrapQty);
        const parsedScrapReasonId = Number(scrapReasonId);
        if (!Number.isFinite(quantityScrapped) || quantityScrapped <= 0) {
          throw new Error("Scrap quantity must be greater than zero.");
        }
        if (!Number.isFinite(parsedScrapReasonId) || parsedScrapReasonId <= 0) {
          throw new Error("Scrap reason ID must be a positive number.");
        }
        await ordersApi.addStepScrap(selected.orderId, selected.lineId, selected.stepInstanceId, {
          quantityScrapped,
          scrapReasonId: parsedScrapReasonId,
          notes: scrapNotes.trim() || null,
          recordedByEmpNo: empNoToUse,
          actingRole: roleToUse,
        });
        markStepCapture(selected.stepInstanceId, "scrap");
      } else if (action === "addSerial") {
        if (!serialNo.trim()) throw new Error("Serial number is required.");
        if (!serialManufacturer.trim()) throw new Error("Serial manufacturer is required.");
        if (serialCondition === "Bad" && !serialScrapReasonId.trim()) {
          throw new Error("Scrap reason is required when serial condition is Bad.");
        }
        await ordersApi.addStepSerial(selected.orderId, selected.lineId, selected.stepInstanceId, {
          serialNo: serialNo.trim(),
          manufacturer: serialManufacturer.trim(),
          conditionStatus: serialCondition,
          scrapReasonId: serialScrapReasonId.trim() ? Number(serialScrapReasonId) : null,
          recordedByEmpNo: empNoToUse,
          actingRole: roleToUse,
        });
        markStepCapture(selected.stepInstanceId, "serials");
      } else if (action === "captureTrailer") {
        await ordersApi.captureTrailer(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          trailerNo: trailerNo.trim(),
          notes: "Captured from operator console",
          actingRole: roleToUse,
        });
        markStepCapture(selected.stepInstanceId, "trailer");
      } else if (action === "verifySerials") {
        await ordersApi.verifySerialLoad(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          verifiedSerialNos,
          notes: "Verified from operator console",
          actingRole: roleToUse,
        });
        markStepCapture(selected.stepInstanceId, "serialLoadVerified");
      } else if (action === "addChecklist") {
        const templateItemId = Number(checklistTemplateItemId);
        if (!Number.isFinite(templateItemId) || templateItemId <= 0) {
          throw new Error("Checklist template item ID must be a positive number.");
        }
        if (!checklistLabel.trim()) throw new Error("Checklist item label is required.");
        await ordersApi.addStepChecklist(selected.orderId, selected.lineId, selected.stepInstanceId, {
          checklistTemplateItemId: templateItemId,
          itemLabel: checklistLabel.trim(),
          isRequiredItem: checklistRequired,
          resultStatus: checklistResult,
          resultNotes: checklistNotes.trim() || null,
          completedByEmpNo: empNoToUse,
          actingRole: roleToUse,
        });
        markStepCapture(selected.stepInstanceId, "checklist");
      } else if (action === "generatePackingSlip") {
        await ordersApi.generatePackingSlip(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          regenerate: false,
          notes: "Generated from operator console",
          actingRole: roleToUse,
        });
        markStepCapture(selected.stepInstanceId, "packingSlip");
      } else if (action === "generateBol") {
        await ordersApi.generateBol(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          regenerate: false,
          notes: "Generated from operator console",
          actingRole: roleToUse,
        });
        markStepCapture(selected.stepInstanceId, "bol");
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
        await ordersApi.scanOut(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          deviceId: "UI",
          actingRole: roleToUse,
        });
        await ordersApi.completeStep(selected.orderId, selected.lineId, selected.stepInstanceId, {
          empNo: empNoToUse,
          notes: "Completed from operator console",
          actingRole: roleToUse,
          supervisorOverrideEmpNo: supervisorOverrideEmpNo || null,
          supervisorOverrideReason: supervisorOverrideReason || null,
          supervisorOverrideActingRole: supervisorOverrideEmpNo ? "Supervisor" : null,
          serialLoadVerified: stepEvidence.serialLoadVerified,
          verifiedSerialNos: verifiedSerialNos.length > 0 ? verifiedSerialNos : null,
        });
      }

      const currentStepId = selected.stepInstanceId;
      await loadQueue(currentStepId);
      if (action === "scanOutAndComplete" && autoLoadNext) {
        const previousIndex = queue.findIndex((item) => item.stepInstanceId === currentStepId);
        const nextItem = queue[previousIndex + 1] ?? queue[0] ?? null;
        if (nextItem) {
          setSelectedStepId(nextItem.stepInstanceId);
          await refreshSelectedData(nextItem);
          setMessage({
            type: "success",
            title: "Step completed",
            text: `Completed successfully. Auto-loaded next queue item ${nextItem.salesOrderNo}.`,
          });
        } else {
          setMessage({
            type: "success",
            title: "Step completed",
            text: "Completed successfully. Queue is now empty.",
          });
        }
      } else {
        await refreshSelectedData(selected);
        setMessage({
          type: "success",
          title: "Action successful",
          text: `Step action ${action} completed.`,
        });
      }
      focusScanField();
    } catch (error) {
      const text = getApiErrorMessage(error);
      const isConflict = error instanceof ApiError && error.status === 409;
      const isNetwork =
        (error instanceof Error && /network|fetch/i.test(error.message)) ||
        (error instanceof TypeError && /fetch/i.test(error.message));
      if (isConflict) {
        await loadQueue(selected.stepInstanceId);
        await refreshSelectedData(selected);
        setMessage({
          type: "warning",
          title: "Sequence or concurrency conflict",
          text: `${text} Latest state reloaded. Review blockers and retry.`,
        });
      } else if (isNetwork) {
        setMessage({
          type: "error",
          title: "Network/API failure",
          text: "Unsaved form data has been retained. Check connection and retry.",
        });
      } else {
        setMessage({
          type: "error",
          title: "Action failed",
          text,
        });
      }
      focusScanField();
    } finally {
      setActionBusy(false);
    }
  };

  const scanHints = useMemo(
    () => queue.map((item) => [item.salesOrderNo, item.stepCode, String(item.stepInstanceId)]).flat(),
    [queue]
  );

  const handleScanSubmit = () => {
    const token = scanValue.trim().toLowerCase();
    if (!token) return;
    const matched =
      queue.find(
        (item) =>
          item.salesOrderNo.toLowerCase() === token ||
          item.stepCode.toLowerCase() === token ||
          String(item.stepInstanceId) === token
      ) ?? null;
    if (!matched) {
      setMessage({
        type: "warning",
        title: "Invalid scan",
        text: `Scan token not found in queue. Expected one of: ${scanHints.slice(0, 4).join(", ")}...`,
      });
      focusScanField();
      return;
    }
    setSelectedStepId(matched.stepInstanceId);
    setMessage({
      type: "info",
      title: "Queue item selected",
      text: `Selected ${matched.salesOrderNo} / ${matched.stepCode}.`,
    });
    focusScanField();
  };

  return (
    <div className={styles.root}>
      <div className={styles.topBanner}>
        <Title1 className={styles.bannerTitle}>Operator Work-Center Console</Title1>
        <div className={styles.topBannerMeta}>
          <Caption1 className={styles.bannerCaption}>Work Center: {workCenterId}</Caption1>
          <Caption1 className={styles.bannerCaption}>Operator: {actingEmpNo || "n/a"}</Caption1>
          <Caption1 className={styles.bannerCaption}>Current Time: {currentClock}</Caption1>
        </div>
      </div>
      {message && (
        <MessageBar intent={message.type}>
          <MessageBarBody>
            <MessageBarTitle>{message.title}</MessageBarTitle>
            {message.text}
          </MessageBarBody>
        </MessageBar>
      )}
      <Card>
        <div className={styles.controlRow}>
          <Field label="Work Center ID">
            <Input value={workCenterId} onChange={(_, data) => setWorkCenterId(data.value)} />
          </Field>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Switch checked={autoLoadNext} onChange={(_, data) => setAutoLoadNext(data.checked)} />
            <Body1>Auto-load next queue item</Body1>
          </div>
          <Button appearance="secondary" onClick={() => void loadQueue(selectedStepId)} disabled={loadingQueue}>
            Refresh Queue
          </Button>
        </div>
      </Card>

      {loadingQueue ? (
        <Spinner label="Loading queue..." />
      ) : (
        <div className={styles.mainGrid}>
          <Card>
            <Title3>Queue</Title3>
            {queue.length === 0 ? (
              <Body1>No queue entries for this work center.</Body1>
            ) : (
              queue.map((item) => (
                <Button
                  key={item.stepInstanceId}
                  appearance={selectedStepId === item.stepInstanceId ? "primary" : "secondary"}
                  className={styles.queueButton}
                  onClick={() => setSelectedStepId(item.stepInstanceId)}
                >
                  {item.salesOrderNo} - {item.stepName} ({item.stepState})
                </Button>
              ))
            )}
          </Card>
          <Card>
            <Title3>Scan Panel</Title3>
            {selected ? (
              <>
                <Field label="Scan input">
                  <Input
                    ref={scanInputRef}
                    value={scanValue}
                    onChange={(_, data) => setScanValue(data.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleScanSubmit();
                    }}
                  />
                </Field>
                <div className={styles.scanActionRow}>
                  <Button className={styles.actionButton} onClick={handleScanSubmit}>
                    Select from scan
                  </Button>
                  <Button className={styles.actionButton} disabled={actionBusy} onClick={() => void performAction("scanIn")}>
                    Scan In
                  </Button>
                  <Button
                    className={styles.actionButton}
                    appearance="primary"
                    disabled={actionBusy || completionWarnings.length > 0}
                    onClick={() => void performAction("scanOutAndComplete")}
                  >
                    Scan Out &amp; Complete
                  </Button>
                  <Badge className={styles.chip} appearance="filled">
                    Timer {timerChip}
                  </Badge>
                </div>
                <Caption1>
                  State: {selectedStep?.state ?? selected.stepState} | Mode: {selectedStep?.timeCaptureMode ?? "Unknown"}
                </Caption1>
                <Caption1>Capture source: {selectedStep?.timeCaptureSource ?? "n/a"}</Caption1>
                <Caption1>Manual reason: {selectedStep?.manualDurationReason ?? "n/a"}</Caption1>
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
                <div className={styles.scanActionRow}>
                  <Button className={styles.actionButton} disabled={actionBusy} onClick={() => void performAction("captureTrailer")}>
                    Capture Trailer
                  </Button>
                  <Button className={styles.actionButton} disabled={actionBusy} onClick={() => void performAction("verifySerials")}>
                    Verify Serials
                  </Button>
                  <Button className={styles.actionButton} disabled={actionBusy} onClick={() => void performAction("generatePackingSlip")}>
                    Generate Packing Slip
                  </Button>
                  <Button className={styles.actionButton} disabled={actionBusy} onClick={() => void performAction("generateBol")}>
                    Generate BOL
                  </Button>
                  <Button className={styles.actionButton} disabled={actionBusy} onClick={() => void performAction("correctDuration")}>
                    Apply Duration
                  </Button>
                  {lastAction && (
                    <Button className={styles.actionButton} appearance="secondary" disabled={actionBusy} onClick={() => void performAction(lastAction)}>
                      Retry last action
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <Body1>Select a queue row to execute actions.</Body1>
            )}
          </Card>
          <Card>
            <Title3>Order Context</Title3>
            {selected ? (
              <>
                <Body1>Order: {selected.salesOrderNo}</Body1>
                <Body1>Customer: {selected.customerName ?? "n/a"}</Body1>
                <Body1>
                  Item: {selected.itemNo ?? "n/a"} - {selected.itemDescription ?? "n/a"}
                </Body1>
                <Body1>Promised Date: {selected.promisedDateUtc ? new Date(selected.promisedDateUtc).toLocaleDateString() : "n/a"}</Body1>
                <Body1>Priority: {selected.priority ?? "n/a"}</Body1>
                <Body1>Instructions: {selected.lineNotes ?? selected.orderComments ?? "n/a"}</Body1>
              </>
            ) : (
              <Body1>Select a queue row to view context.</Body1>
            )}
          </Card>
          <Card>
            <Title3>Line Execution Qty Grid</Title3>
            {selectedLine ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Ordered</TableHeaderCell>
                    <TableHeaderCell>Received</TableHeaderCell>
                    <TableHeaderCell>Completed</TableHeaderCell>
                    <TableHeaderCell>Scrapped</TableHeaderCell>
                    <TableHeaderCell>In Process</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{selectedLine.quantityOrdered}</TableCell>
                    <TableCell>{selectedLine.quantityReceived ?? 0}</TableCell>
                    <TableCell>{selectedLine.quantityCompleted ?? 0}</TableCell>
                    <TableCell>{selectedLine.quantityScrapped ?? 0}</TableCell>
                    <TableCell>
                      {Math.max(0, (selectedLine.quantityReceived ?? 0) - (selectedLine.quantityCompleted ?? 0) - (selectedLine.quantityScrapped ?? 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <Body1>No line details loaded.</Body1>
            )}
          </Card>
          <Card>
            <Title3>Conditional Data Panels</Title3>
            {selectedStep ? (
              <div className={styles.section}>
                {selectedStep.requiresUsageEntry && (
                  <div className={styles.subsection}>
                    <Body1 style={{ fontWeight: 600 }}>Usage Entry</Body1>
                    <Field label="Part item ID">
                      <Input value={usagePartItemId} onChange={(_, d) => setUsagePartItemId(d.value)} />
                    </Field>
                    <Field label="Quantity used">
                      <Input value={usageQty} onChange={(_, d) => setUsageQty(d.value)} />
                    </Field>
                    <Field label="UOM (optional)">
                      <Input value={usageUom} onChange={(_, d) => setUsageUom(d.value)} />
                    </Field>
                    <Button className={styles.actionButton} disabled={actionBusy} onClick={() => void performAction("addUsage")}>
                      Save Usage
                    </Button>
                  </div>
                )}
                {selectedStep.requiresScrapEntry && (
                  <div className={styles.subsection}>
                    <Body1 style={{ fontWeight: 600 }}>Scrap Entry</Body1>
                    <Field label="Scrap quantity">
                      <Input value={scrapQty} onChange={(_, d) => setScrapQty(d.value)} />
                    </Field>
                    <Field label="Scrap reason ID">
                      <Input value={scrapReasonId} onChange={(_, d) => setScrapReasonId(d.value)} />
                    </Field>
                    <Field label="Notes (optional)">
                      <Input value={scrapNotes} onChange={(_, d) => setScrapNotes(d.value)} />
                    </Field>
                    <Button className={styles.actionButton} disabled={actionBusy} onClick={() => void performAction("addScrap")}>
                      Save Scrap
                    </Button>
                  </div>
                )}
                {selectedStep.requiresSerialCapture && (
                  <div className={styles.subsection}>
                    <Body1 style={{ fontWeight: 600 }}>Serial Capture</Body1>
                    <Field label="Serial number">
                      <Input value={serialNo} onChange={(_, d) => setSerialNo(d.value)} />
                    </Field>
                    <Field label="Manufacturer">
                      <Input value={serialManufacturer} onChange={(_, d) => setSerialManufacturer(d.value)} />
                    </Field>
                    <Field label="Condition (Good/Bad)">
                      <Input value={serialCondition} onChange={(_, d) => setSerialCondition(d.value)} />
                    </Field>
                    <Field label="Scrap reason ID (required when Bad)">
                      <Input value={serialScrapReasonId} onChange={(_, d) => setSerialScrapReasonId(d.value)} />
                    </Field>
                    <Button className={styles.actionButton} disabled={actionBusy} onClick={() => void performAction("addSerial")}>
                      Save Serial
                    </Button>
                  </div>
                )}
                {selectedStep.requiresChecklistCompletion && (
                  <div className={styles.subsection}>
                    <Body1 style={{ fontWeight: 600 }}>
                      Checklist ({selectedStep.checklistFailurePolicy})
                    </Body1>
                    <Field label="Checklist template item ID">
                      <Input
                        value={checklistTemplateItemId}
                        onChange={(_, d) => setChecklistTemplateItemId(d.value)}
                      />
                    </Field>
                    <Field label="Checklist item label">
                      <Input value={checklistLabel} onChange={(_, d) => setChecklistLabel(d.value)} />
                    </Field>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Switch checked={checklistRequired} onChange={(_, d) => setChecklistRequired(d.checked)} />
                      <Body1>Required item</Body1>
                    </div>
                    <Field label="Result status (Pass/Fail)">
                      <Input value={checklistResult} onChange={(_, d) => setChecklistResult(d.value)} />
                    </Field>
                    <Field label="Checklist notes (optional)">
                      <Input value={checklistNotes} onChange={(_, d) => setChecklistNotes(d.value)} />
                    </Field>
                    <Button className={styles.actionButton} disabled={actionBusy} onClick={() => void performAction("addChecklist")}>
                      Save Checklist
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Body1>Select a queue row to view required panels.</Body1>
            )}
          </Card>
          <Card>
            <Title3>Validation / Status Footer</Title3>
            {completionWarnings.length === 0 ? (
              <Body1>All required fields are satisfied. Scan Out &amp; Complete is enabled.</Body1>
            ) : (
              completionWarnings.map((warning) => (
                <Body1 key={warning} className={styles.warningText}>
                  - {warning}
                </Body1>
              ))
            )}
            <Caption1>
              Next step preview: {queue.find((row) => row.stepInstanceId !== selectedStepId)?.salesOrderNo ?? "No next item"}
            </Caption1>
          </Card>
          <Card>
            <Title3>Order Activity Log</Title3>
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
