import {
  Badge,
  Body1,
  Button,
  Caption1,
  Field,
  Input,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { ArrowRight20Regular, Flag20Regular } from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import type {
  ApplyHoldRequest,
  ClearHoldRequest,
  HoldOverlayType,
  OrderWorkflowStatus,
  OrderWorkspaceRole,
} from "../../types/order";
import type { StatusReasonCode as PolicyStatusReasonCode } from "../../types/policy";
import {
  ORDER_LIFECYCLE_SEQUENCE,
  getHoldOverlayMetadata,
  getOrderStatusDisplayLabel,
} from "../../types/order";
import {
  getSuggestedWorkspaceActions,
  getWorkspaceActionState,
} from "../../services/orders";

const OVERLAY_CHOICES: HoldOverlayType[] = [
  "OnHoldCustomer",
  "OnHoldQuality",
  "OnHoldLogistics",
  "ExceptionQuantityMismatch",
  "ExceptionDocumentation",
  "ReworkOpen",
  "Cancelled",
];

const useStyles = makeStyles({
  cardTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#123046",
    marginBottom: "10px",
  },
  hero: {
    borderRadius: "10px",
    padding: "12px",
    background:
      "linear-gradient(132deg, rgba(18,48,70,1) 0%, rgba(43,59,132,1) 60%, rgba(1,124,197,1) 100%)",
    color: "#ffffff",
    display: "grid",
    gap: "8px",
    marginBottom: "10px",
  },
  heroMeta: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    opacity: 0.85,
  },
  heroCurrent: {
    fontSize: "20px",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  progressTrack: {
    height: "8px",
    borderRadius: "999px",
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
    backgroundColor: "#ffffff",
  },
  heroSummary: {
    fontSize: "12px",
    opacity: 0.9,
  },
  compactHero: {
    marginBottom: 0,
    padding: "10px",
    gap: "6px",
  },
  compactHeroCurrent: {
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  overlayFields: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: tokens.spacingHorizontalS,
  },
  overlayFieldsSingleColumn: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: tokens.spacingVerticalS,
    alignContent: "start",
  },
  fullRow: {
    gridColumn: "1 / -1",
  },
  select: {
    minHeight: "32px",
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: `0 ${tokens.spacingHorizontalS}`,
  },
  lifecycleInstruction: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#017CC5",
    marginBottom: "8px",
    fontWeight: 600,
  },
  lifecycleList: {
    display: "grid",
    gap: "6px",
    marginBottom: "10px",
  },
  lifecycleItem: {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #e8e8e8",
    fontSize: "12px",
  },
  lifecycleItemLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
  },
  currentStageIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid #4f95cc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    flexShrink: 0,
  },
  currentStageIconDot: {
    width: "3px",
    height: "3px",
    borderRadius: "50%",
    backgroundColor: "#4f95cc",
  },
  completedStageIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    borderTop: "2px solid #9fbe76",
    borderRight: "2px solid #9fbe76",
    borderBottom: "2px solid #9fbe76",
    borderLeft: "2px solid #9fbe76",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#7ea453",
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1,
  },
  nextStageIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    borderTop: "2px solid #4f95cc",
    borderRight: "2px solid #4f95cc",
    borderBottom: "2px solid #4f95cc",
    borderLeft: "2px solid #4f95cc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#017CC5",
  },
  queuedStageIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    borderTop: "2px solid #9aa6b2",
    borderRight: "2px solid #9aa6b2",
    borderBottom: "2px solid #9aa6b2",
    borderLeft: "2px solid #9aa6b2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#6E6E6E",
  },
  lifecycleItemCurrent: {
    backgroundColor: "#dff6dd",
    border: "1px solid #80c782",
    color: "#155724",
  },
  lifecycleItemDone: {
    backgroundColor: "#f8fffa",
    border: "1px solid #cde7cf",
  },
  lifecycleItemNext: {
    border: "1px solid #017CC5",
    backgroundColor: "#e8f4ff",
    boxShadow: "0 0 0 2px rgba(1,124,197,0.15)",
    cursor: "pointer",
    color: "#0c4f78",
  },
  lifecycleItemBlocked: {
    border: "1px solid #d9b0b0",
    backgroundColor: "#fff5f5",
    boxShadow: "none",
    cursor: "not-allowed",
    color: "#8a4d4d",
  },
  lifecycleItemQueued: {
    backgroundColor: "#f4f6fb",
    border: "1px solid #d6ddeb",
    color: "#4f5f78",
  },
  currentStageOverlayTrigger: {
    minWidth: "26px",
    width: "26px",
    height: "26px",
    padding: 0,
  },
  currentStageOverlayTag: {
    position: "relative",
    maxWidth: "none",
    whiteSpace: "nowrap",
  },
  currentStageOverlayTagButton: {
    position: "absolute",
    top: "-11px",
    right: "-10px",
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
  },
  blockedBadge: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    borderTop: "2px solid #c85b5b",
    borderRight: "2px solid #c85b5b",
    borderBottom: "2px solid #c85b5b",
    borderLeft: "2px solid #c85b5b",
    position: "relative",
    flexShrink: 0,
  },
  blockedSlash: {
    position: "absolute",
    width: "12px",
    height: "2px",
    backgroundColor: "#c85b5b",
    top: "8px",
    left: "2px",
    transform: "rotate(-35deg)",
  },
  flipShell: {
    perspective: "1000px",
  },
  flipCard: {
    position: "relative",
    marginTop: tokens.spacingVerticalS,
    transformStyle: "preserve-3d",
    transformOrigin: "center center",
    transform: "rotateY(0deg)",
    transitionDuration: "340ms",
    transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    transitionProperty: "transform",
  },
  flipCardActive: {
    transform: "rotateY(180deg)",
  },
  flipFace: {
    position: "absolute",
    inset: 0,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
    backfaceVisibility: "hidden",
    overflowY: "auto",
    overflowX: "hidden",
    scrollbarGutter: "stable",
  },
  flipFaceFront: {
    transform: "rotateY(0deg)",
  },
  flipFaceBack: {
    transform: "rotateY(180deg)",
  },
  flipHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacingVerticalS,
    gap: tokens.spacingHorizontalS,
  },
  flipActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
});

export interface LifecycleNavigatorProps {
  currentStatus: string;
  compact?: boolean;
  showCurrentStageCard?: boolean;
  canAdvance?: boolean;
  isAdvancing?: boolean;
  holdOverlay?: HoldOverlayType | null;
  statusReasonCode?: string | null;
  statusOwnerRole?: string | null;
  statusNote?: string | null;
  onAdvanceStatus?: (targetStatus: OrderWorkflowStatus) => void | Promise<void>;
  onApplyOverlay?: (payload: ApplyHoldRequest) => void | Promise<void>;
  onClearOverlay?: (payload: ClearHoldRequest) => void | Promise<void>;
  actingRole?: OrderWorkspaceRole;
  actingEmpNo?: string;
  isMutatingOverlay?: boolean;
  overlayReasonOptions?: PolicyStatusReasonCode[];
  onCreateReasonCode?: (overlayType: HoldOverlayType, codeName: string) => void | Promise<void>;
  onUpdateReasonCode?: (id: number, overlayType: HoldOverlayType, codeName: string) => void | Promise<void>;
  onDeleteReasonCode?: (id: number) => void | Promise<void>;
}

export function LifecycleNavigator({
  currentStatus,
  compact = false,
  showCurrentStageCard = true,
  canAdvance = true,
  isAdvancing = false,
  holdOverlay = null,
  statusReasonCode,
  statusOwnerRole,
  statusNote,
  onAdvanceStatus,
  onApplyOverlay,
  onClearOverlay,
  actingRole = "Office",
  actingEmpNo = "UI",
  isMutatingOverlay = false,
  overlayReasonOptions = [],
  onCreateReasonCode,
  onUpdateReasonCode,
  onDeleteReasonCode,
}: LifecycleNavigatorProps) {
  const styles = useStyles();
  const [selectedOverlay, setSelectedOverlay] = useState<HoldOverlayType>("OnHoldCustomer");
  const [reasonCode, setReasonCode] = useState("");
  const [selectedReasonId, setSelectedReasonId] = useState("");
  const [reasonEditorCodeName, setReasonEditorCodeName] = useState("");
  const [note, setNote] = useState("");
  const [customerReadyRetryUtc, setCustomerReadyRetryUtc] = useState("");
  const [customerReadyLastContactUtc, setCustomerReadyLastContactUtc] = useState("");
  const [customerReadyContactName, setCustomerReadyContactName] = useState("");
  const [clearNote, setClearNote] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isMutatingReasonCatalog, setIsMutatingReasonCatalog] = useState(false);

  const currentStageIndex = ORDER_LIFECYCLE_SEQUENCE.indexOf(currentStatus as OrderWorkflowStatus);
  const overlayMeta = getHoldOverlayMetadata(holdOverlay);
  const isForwardBlocked = Boolean(overlayMeta?.blocksForwardTransitions);
  const completionPct =
    currentStageIndex < 0
      ? 0
      : Math.round(((currentStageIndex + 1) / ORDER_LIFECYCLE_SEQUENCE.length) * 100);

  if (compact) {
    return (
      <div>
        <div className={styles.cardTitle}>Lifecycle Navigator</div>
        {showCurrentStageCard ? (
          <div className={mergeClasses(styles.hero, styles.compactHero)}>
            <div className={styles.heroMeta}>Current Stage</div>
            <div className={styles.compactHeroCurrent}>{getOrderStatusDisplayLabel(currentStatus)}</div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const transitionStatesByTarget = useMemo(() => {
    const states = new Map<OrderWorkflowStatus, { enabled: boolean; reason?: string }>();
    const suggestedActions = getSuggestedWorkspaceActions(currentStatus);
    for (const action of suggestedActions) {
      const actionState = getWorkspaceActionState(
        actingRole,
        action,
        currentStatus,
        holdOverlay,
        false
      );
      if (actionState.targetStatus) {
        states.set(actionState.targetStatus, {
          enabled: actionState.enabled,
          reason: actionState.reason,
        });
      }
    }
    return states;
  }, [actingRole, currentStatus, holdOverlay]);

  const enabledTransitionTargets = useMemo(() => {
    return [...transitionStatesByTarget.entries()]
      .filter(([, state]) => state.enabled)
      .map(([target]) => target)
      .sort(
        (a, b) =>
          ORDER_LIFECYCLE_SEQUENCE.indexOf(a) - ORDER_LIFECYCLE_SEQUENCE.indexOf(b)
      );
  }, [transitionStatesByTarget]);

  const primaryNextStage = useMemo(() => {
    return enabledTransitionTargets[0] ?? null;
  }, [enabledTransitionTargets]);

  const startStageIndex = Math.max(currentStageIndex - 1, 0);
  const visibleStages = useMemo(() => {
    const base = ORDER_LIFECYCLE_SEQUENCE.slice(startStageIndex, startStageIndex + 3);
    if (primaryNextStage && !base.includes(primaryNextStage)) {
      const withPrimary = [...base];
      withPrimary[withPrimary.length - 1] = primaryNextStage;
      return withPrimary;
    }
    return base;
  }, [startStageIndex, primaryNextStage]);

  const flipHeight =
    !holdOverlay && selectedOverlay === "OnHoldCustomer"
      ? 360
      : holdOverlay
      ? 110
      : 260;

  const reasonOptionsForOverlay = useMemo(
    () => overlayReasonOptions.filter((option) => option.overlayType === selectedOverlay),
    [overlayReasonOptions, selectedOverlay]
  );

  useEffect(() => {
    if (reasonOptionsForOverlay.length === 0) {
      setSelectedReasonId("");
      setReasonCode("");
      setReasonEditorCodeName("");
      return;
    }

    const current = reasonOptionsForOverlay.find((option) => String(option.id) === selectedReasonId);
    const effective = current ?? reasonOptionsForOverlay[0];
    setSelectedReasonId(String(effective.id));
    setReasonCode(effective.codeName);
    setReasonEditorCodeName(effective.codeName);
  }, [reasonOptionsForOverlay, selectedReasonId]);

  const handleApplyOverlay = async () => {
    if (!onApplyOverlay) {
      return;
    }

    if (!reasonCode.trim()) {
      setValidationMessage("Reason code is required to apply an overlay.");
      return;
    }

    if (
      selectedOverlay === "OnHoldCustomer" &&
      (!customerReadyRetryUtc || !customerReadyLastContactUtc || !customerReadyContactName.trim())
    ) {
      setValidationMessage(
        "Customer hold requires retry date, last contact date, and contact name."
      );
      return;
    }

    setValidationMessage(null);
    await onApplyOverlay({
      holdOverlay: selectedOverlay,
      actingRole,
      appliedByEmpNo: actingEmpNo,
      reasonCode: reasonCode.trim(),
      note: note.trim() || null,
      customerReadyRetryUtc:
        selectedOverlay === "OnHoldCustomer" ? new Date(customerReadyRetryUtc).toISOString() : null,
      customerReadyLastContactUtc:
        selectedOverlay === "OnHoldCustomer"
          ? new Date(customerReadyLastContactUtc).toISOString()
          : null,
      customerReadyContactName:
        selectedOverlay === "OnHoldCustomer" ? customerReadyContactName.trim() : null,
    });
    setIsEditorOpen(false);
  };

  const handleCreateReasonCode = async () => {
    if (!onCreateReasonCode) {
      return;
    }

    if (!reasonEditorCodeName.trim()) {
      setValidationMessage("Reason code name is required.");
      return;
    }

    setValidationMessage(null);
    setIsMutatingReasonCatalog(true);
    try {
      await onCreateReasonCode(selectedOverlay, reasonEditorCodeName.trim());
      setReasonCode(reasonEditorCodeName.trim());
    } finally {
      setIsMutatingReasonCatalog(false);
    }
  };

  const handleUpdateReasonCode = async () => {
    if (!onUpdateReasonCode || !selectedReasonId) {
      return;
    }

    if (!reasonEditorCodeName.trim()) {
      setValidationMessage("Reason code name is required.");
      return;
    }

    setValidationMessage(null);
    setIsMutatingReasonCatalog(true);
    try {
      await onUpdateReasonCode(Number(selectedReasonId), selectedOverlay, reasonEditorCodeName.trim());
      setReasonCode(reasonEditorCodeName.trim());
    } finally {
      setIsMutatingReasonCatalog(false);
    }
  };

  const handleDeleteReasonCode = async () => {
    if (!onDeleteReasonCode || !selectedReasonId) {
      return;
    }

    setValidationMessage(null);
    setIsMutatingReasonCatalog(true);
    try {
      await onDeleteReasonCode(Number(selectedReasonId));
      setSelectedReasonId("");
      setReasonCode("");
      setReasonEditorCodeName("");
    } finally {
      setIsMutatingReasonCatalog(false);
    }
  };

  const handleClearOverlay = async () => {
    if (!onClearOverlay) {
      return;
    }

    await onClearOverlay({
      actingRole,
      clearedByEmpNo: actingEmpNo,
      note: clearNote.trim() || null,
    });
    setIsEditorOpen(false);
  };

  return (
    <div>
      <div className={styles.cardTitle}>Lifecycle Navigator</div>
      {showCurrentStageCard ? (
        <div className={styles.hero}>
          <div className={styles.heroMeta}>Current Stage</div>
          <div className={styles.heroCurrent}>{getOrderStatusDisplayLabel(currentStatus)}</div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      ) : null}

      <div className={styles.flipShell}>
        <div
          className={mergeClasses(styles.flipCard, isEditorOpen && styles.flipCardActive)}
          style={{ height: `${flipHeight}px` }}
          data-testid="overlay-flip-editor"
        >
          <div className={mergeClasses(styles.flipFace, styles.flipFaceFront)}>
            <div className={styles.flipHeader}>
              <Body1 aria-hidden />
            </div>
            <div className={styles.lifecycleList}>
              {visibleStages.map((stage, offset) => {
                const absoluteIndex = startStageIndex + offset;
                const isDone = absoluteIndex < currentStageIndex;
                const isCurrent = absoluteIndex === currentStageIndex;
                const isNext = stage === primaryNextStage;
                const transitionState = transitionStatesByTarget.get(stage);
                const hasTransition = Boolean(transitionState);
                const isClickable =
                  Boolean(hasTransition) &&
                  Boolean(canAdvance) &&
                  Boolean(onAdvanceStatus) &&
                  !isAdvancing &&
                  Boolean(transitionState?.enabled);
                const isBlockedNext =
                  (isNext && (!canAdvance || isForwardBlocked || !transitionState?.enabled)) ||
                  (hasTransition && !transitionState?.enabled);

                return (
                  <div
                    key={`flip-front-${stage}`}
                    className={mergeClasses(
                      styles.lifecycleItem,
                      isCurrent && styles.lifecycleItemCurrent,
                      isDone && styles.lifecycleItemDone,
                      isNext && styles.lifecycleItemNext,
                      isBlockedNext && styles.lifecycleItemBlocked,
                      !isCurrent && !isNext && !isDone && styles.lifecycleItemQueued
                    )}
                    onClick={isClickable ? () => onAdvanceStatus?.(stage) : undefined}
                    onKeyDown={
                      isClickable
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onAdvanceStatus?.(stage);
                            }
                          }
                        : undefined
                    }
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    aria-label={isClickable ? `Advance to ${stage}` : undefined}
                  >
                    <span className={styles.lifecycleItemLabel}>
                      {isDone ? (
                        <span className={styles.completedStageIcon} aria-hidden>
                          ✓
                        </span>
                      ) : isCurrent ? (
                        <span className={styles.currentStageIcon} aria-hidden>
                          <span className={styles.currentStageIconDot} />
                          <span className={styles.currentStageIconDot} />
                          <span className={styles.currentStageIconDot} />
                        </span>
                      ) : isNext || hasTransition ? (
                        isBlockedNext ? (
                          <span className={styles.blockedBadge} aria-hidden data-testid="blocked-advance-indicator">
                            <span className={styles.blockedSlash} />
                          </span>
                        ) : (
                          <span className={styles.nextStageIcon} aria-hidden>
                            <ArrowRight20Regular />
                          </span>
                        )
                      ) : (
                        <span className={styles.queuedStageIcon} aria-hidden>
                          <ArrowRight20Regular />
                        </span>
                      )}
                      {getOrderStatusDisplayLabel(stage)}
                    </span>
                    {hasTransition && !transitionState?.enabled ? (
                      <Caption1>{transitionState?.reason ?? "Transition blocked."}</Caption1>
                    ) : null}
                    {isCurrent && !holdOverlay && (onApplyOverlay || onClearOverlay) ? (
                      <Button
                        appearance="subtle"
                        size="small"
                        className={styles.currentStageOverlayTrigger}
                        aria-label="Edit overlay on bottom current stage"
                        onClick={(event) => {
                          event.stopPropagation();
                          setIsEditorOpen((previous) => !previous);
                        }}
                      >
                        <Flag20Regular />
                      </Button>
                    ) : null}
                    {isCurrent && holdOverlay ? (
                      <button
                        type="button"
                        className={styles.currentStageOverlayTagButton}
                        aria-label={`Open overlay details for ${overlayMeta?.displayLabel ?? holdOverlay}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setIsEditorOpen(true);
                        }}
                      >
                        <Badge className={styles.currentStageOverlayTag} color="danger" appearance="filled">
                          {overlayMeta?.displayLabel ?? holdOverlay}
                        </Badge>
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={mergeClasses(styles.flipFace, styles.flipFaceBack)}>
            <div className={styles.flipHeader}>
              <Body1>{holdOverlay ? "Overlay Details" : "Apply Overlay"}</Body1>
              <div className={styles.flipActions}>
                <Button
                  appearance="subtle"
                  onClick={() => setIsEditorOpen(false)}
                  disabled={isMutatingOverlay}
                >
                  Done
                </Button>
              </div>
            </div>
            {holdOverlay ? (
              <>
                <Caption1>
                  Owner: {statusOwnerRole ?? "Unassigned"} | Reason: {statusReasonCode ?? "Not set"}
                </Caption1>
                {statusNote ? <Caption1>Note: {statusNote}</Caption1> : null}
                {isForwardBlocked ? (
                  <Caption1>Forward transitions are blocked while this overlay is active.</Caption1>
                ) : null}
                {onClearOverlay ? (
                  <div className={styles.overlayFields}>
                    <Field className={styles.fullRow} label="Clear note">
                      <Input
                        value={clearNote}
                        onChange={(_, data) => setClearNote(data.value)}
                        placeholder="Optional clear note"
                      />
                    </Field>
                    <Button
                      className={styles.fullRow}
                      appearance="secondary"
                      onClick={handleClearOverlay}
                      disabled={isMutatingOverlay}
                    >
                      {isMutatingOverlay ? "Clearing..." : "Clear Overlay"}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : onApplyOverlay ? (
              <div className={styles.overlayFieldsSingleColumn}>
                <Field label="Overlay type">
                  <select
                    className={styles.select}
                    value={selectedOverlay}
                    onChange={(event) => setSelectedOverlay(event.target.value as HoldOverlayType)}
                    aria-label="Overlay type"
                  >
                    {OVERLAY_CHOICES.map((overlay) => {
                      const metadata = getHoldOverlayMetadata(overlay);
                      return (
                        <option key={overlay} value={overlay}>
                          {metadata?.displayLabel ?? overlay}
                        </option>
                      );
                    })}
                  </select>
                </Field>
                <Field label="Reason code" required>
                  {reasonOptionsForOverlay.length > 0 ? (
                    <select
                      className={styles.select}
                      value={selectedReasonId}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        setSelectedReasonId(nextId);
                        const selected = reasonOptionsForOverlay.find((option) => String(option.id) === nextId);
                        setReasonCode(selected?.codeName ?? "");
                        setReasonEditorCodeName(selected?.codeName ?? "");
                      }}
                      aria-label="Reason code"
                    >
                      <option value="">Select reason code</option>
                      {reasonOptionsForOverlay.map((option) => (
                        <option key={option.id} value={String(option.id)}>
                          {option.codeName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={reasonCode}
                      onChange={(_, data) => setReasonCode(data.value)}
                      placeholder="e.g., CustomerNotReadyForPickup"
                    />
                  )}
                </Field>
                {onCreateReasonCode || onUpdateReasonCode || onDeleteReasonCode ? (
                  <>
                    <Field className={styles.fullRow} label="Manage reason code name">
                      <Input
                        value={reasonEditorCodeName}
                        onChange={(_, data) => setReasonEditorCodeName(data.value)}
                        placeholder="Reason code name"
                      />
                    </Field>
                    <div className={styles.fullRow} style={{ display: "flex", gap: tokens.spacingHorizontalS }}>
                      <Button
                        appearance="secondary"
                        onClick={handleCreateReasonCode}
                        disabled={isMutatingReasonCatalog || isMutatingOverlay}
                      >
                        Add Code
                      </Button>
                      <Button
                        appearance="secondary"
                        onClick={handleUpdateReasonCode}
                        disabled={!selectedReasonId || isMutatingReasonCatalog || isMutatingOverlay}
                      >
                        Edit Code
                      </Button>
                      <Button
                        appearance="secondary"
                        onClick={handleDeleteReasonCode}
                        disabled={!selectedReasonId || isMutatingReasonCatalog || isMutatingOverlay}
                      >
                        Delete Code
                      </Button>
                    </div>
                  </>
                ) : null}
                <Field className={styles.fullRow} label="Status note">
                  <Input
                    value={note}
                    onChange={(_, data) => setNote(data.value)}
                    placeholder="Optional context"
                  />
                </Field>
                {selectedOverlay === "OnHoldCustomer" ? (
                  <>
                    <Field label="Customer ready retry UTC" required>
                      <Input
                        type="datetime-local"
                        value={customerReadyRetryUtc}
                        onChange={(_, data) => setCustomerReadyRetryUtc(data.value)}
                      />
                    </Field>
                    <Field label="Customer last contact UTC" required>
                      <Input
                        type="datetime-local"
                        value={customerReadyLastContactUtc}
                        onChange={(_, data) => setCustomerReadyLastContactUtc(data.value)}
                      />
                    </Field>
                    <Field className={styles.fullRow} label="Customer contact name" required>
                      <Input
                        value={customerReadyContactName}
                        onChange={(_, data) => setCustomerReadyContactName(data.value)}
                        placeholder="Contact at customer site"
                      />
                    </Field>
                  </>
                ) : null}
                {validationMessage ? (
                  <Caption1 className={styles.fullRow}>{validationMessage}</Caption1>
                ) : null}
                <Button
                  className={styles.fullRow}
                  appearance="primary"
                  onClick={handleApplyOverlay}
                  disabled={isMutatingOverlay}
                >
                  {isMutatingOverlay ? "Applying..." : "Apply Overlay"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
