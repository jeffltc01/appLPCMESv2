import {
  Body1,
  Caption1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";

interface WorkflowDates {
  orderCreatedDate: string;
  readyForPickupDate: string | null;
  pickupScheduledDate: string | null;
  receivedDate: string | null;
  readyToShipDate: string | null;
  readyToInvoiceDate: string | null;
}

interface WorkflowWidgetProps {
  currentStatus: string | null | undefined;
  dates: WorkflowDates;
  onAdvanceStatus?: (targetStatus: string) => void;
  canAdvance?: boolean;
  isAdvancing?: boolean;
}

type WorkflowStep = {
  key: string;
  label: string;
  getDate: (dates: WorkflowDates) => string | null;
};

const WORKFLOW_STEPS: WorkflowStep[] = [
  { key: "New", label: "New", getDate: (d) => d.orderCreatedDate },
  {
    key: "Ready for Pickup",
    label: "Ready for Pickup",
    getDate: (d) => d.readyForPickupDate,
  },
  {
    key: "Pickup Scheduled",
    label: "Pickup Scheduled",
    getDate: (d) => d.pickupScheduledDate,
  },
  { key: "Received", label: "Received", getDate: (d) => d.receivedDate },
  {
    key: "Ready to Ship",
    label: "Ready to Ship",
    getDate: (d) => d.readyToShipDate,
  },
  {
    key: "Ready to Invoice",
    label: "Ready to Invoice",
    getDate: (d) => d.readyToInvoiceDate,
  },
];

const useStyles = makeStyles({
  container: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacingVerticalM,
  },
  track: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(120px, 1fr))",
    gap: tokens.spacingHorizontalS,
  },
  step: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
  },
  marker: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  markerDone: {
    border: `2px solid ${tokens.colorPaletteGreenForeground1}`,
    backgroundColor: tokens.colorPaletteGreenBackground3,
    color: "#fff",
  },
  markerCurrent: {
    border: `2px solid ${tokens.colorBrandForeground1}`,
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: `0 0 0 2px ${tokens.colorBrandBackground2}`,
  },
  doneText: {
    color: tokens.colorPaletteGreenForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  currentText: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  upcomingText: {
    color: tokens.colorNeutralForeground3,
  },
  unknown: {
    color: tokens.colorPaletteDarkOrangeForeground1,
  },
  stepClickable: {
    cursor: "pointer",
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalXXS,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  nextText: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
});

function formatDate(raw: string | null): string | null {
  if (!raw) return null;

  const formatDateOnly = (dt: Date) =>
    dt.toLocaleDateString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  // Preserve DB wall-clock time to avoid timezone shifts (e.g. 12:48 becoming 6:48 PM).
  const wallClockMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (wallClockMatch) {
    const [, year, month, day, hour, minute, second] = wallClockMatch;
    const dt = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second ?? "0")
    );
    return formatDateOnly(dt);
  }

  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) {
    return formatDateOnly(dt);
  }

  // DateOnly values serialized as YYYY-MM-DD.
  return raw;
}

export function OrderWorkflowWidget({
  currentStatus,
  dates,
  onAdvanceStatus,
  canAdvance = true,
  isAdvancing = false,
}: WorkflowWidgetProps) {
  const styles = useStyles();
  const currentIdx = WORKFLOW_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className={styles.container}>
      {currentIdx < 0 && currentStatus ? (
        <div className={styles.header}>
          <Caption1 className={styles.unknown}>Unknown status: {currentStatus}</Caption1>
        </div>
      ) : null}

      <div className={styles.track}>
        {WORKFLOW_STEPS.map((step, idx) => {
          const isCurrent = idx === currentIdx;
          const isDone = currentIdx >= 0 && idx < currentIdx;
          const isPrevious = currentIdx >= 0 && idx === currentIdx - 1;
          const isNext = currentIdx >= 0 && idx === currentIdx + 1;
          const isClickable =
            Boolean(onAdvanceStatus) &&
            canAdvance &&
            !isAdvancing &&
            (isPrevious || isNext);
          const dateText = formatDate(step.getDate(dates));

          return (
            <div
              className={`${styles.step} ${isClickable ? styles.stepClickable : ""}`}
              key={step.key}
              onClick={isClickable ? () => onAdvanceStatus?.(step.key) : undefined}
            >
              <div
                className={`${styles.marker} ${isCurrent ? styles.markerCurrent : ""} ${
                  isDone ? styles.markerDone : ""
                }`}
              >
                {isDone ? "✓" : isCurrent ? "●" : ""}
              </div>
              <Body1
                className={
                  isDone
                    ? styles.doneText
                    : isCurrent
                    ? styles.currentText
                    : styles.upcomingText
                }
              >
                {step.label}
              </Body1>
              {isDone && dateText ? (
                <Caption1 className={styles.doneText}>{dateText}</Caption1>
              ) : isCurrent && dateText ? (
                <Caption1 className={styles.currentText}>{dateText}</Caption1>
              ) : isClickable ? (
                <Caption1 className={styles.nextText}>
                  {isAdvancing
                    ? "Updating..."
                    : isPrevious
                    ? (dateText ?? "—")
                    : "Click to advance"}
                </Caption1>
              ) : (
                <Caption1 className={styles.upcomingText}>—</Caption1>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
