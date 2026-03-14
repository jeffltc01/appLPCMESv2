import { useEffect, useState } from "react";
import {
  Body1,
  Button,
  Card,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Title1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { setupApi } from "../services/setup";

const useStyles = makeStyles({
  page: { minHeight: "100vh", backgroundColor: "#f5f5f5" },
  main: {
    display: "grid",
    gridTemplateRows: "44px 56px minmax(0, 1fr)",
    minWidth: 0,
  },
  utilityBar: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: "0 24px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e8e8e8",
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
  },
  headerBar: {
    backgroundColor: "#123046",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  headerActions: { display: "flex", gap: tokens.spacingHorizontalS, flexWrap: "wrap" },
  content: { padding: "16px 20px", overflow: "auto" },
  card: {
    maxWidth: "400px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  formGrid: { display: "grid", gap: tokens.spacingVerticalM },
  actionRow: { display: "flex", gap: tokens.spacingHorizontalS },
  helper: { color: tokens.colorNeutralForeground2, fontSize: "12px" },
});

const MIN_LOOKBACK = 7;
const MAX_LOOKBACK = 365;

export function ScheduleSettingsPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [throughputLookbackDays, setThroughputLookbackDays] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await setupApi.getScheduleSettings();
      setThroughputLookbackDays(String(settings.throughputLookbackDays));
    } catch {
      setError("Failed to load schedule settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    const num = parseInt(throughputLookbackDays.trim(), 10);
    if (isNaN(num) || num < MIN_LOOKBACK || num > MAX_LOOKBACK) {
      setError(`Throughput lookback must be between ${MIN_LOOKBACK} and ${MAX_LOOKBACK} days.`);
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      await setupApi.updateScheduleSettings({ throughputLookbackDays: num });
      setInfo("Schedule settings saved.");
    } catch {
      setError("Failed to save schedule settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.utilityBar}>
          <span>Admin</span>
        </div>
        <header className={styles.headerBar}>
          <Title1 style={{ color: "#ffffff" }}>Schedule Settings</Title1>
          <div className={styles.headerActions}>
            <Button appearance="secondary" onClick={() => navigate("/")}>
              Back to Dashboard
            </Button>
          </div>
        </header>
        <div className={styles.content}>
          {error ? (
            <MessageBar intent="error" style={{ marginBottom: 16 }}>
              <MessageBarBody>{error}</MessageBarBody>
            </MessageBar>
          ) : null}
          {info ? (
            <MessageBar intent="success" style={{ marginBottom: 16 }}>
              <MessageBarBody>{info}</MessageBarBody>
            </MessageBar>
          ) : null}
          <Card className={styles.card}>
            <div style={{ padding: 20 }}>
              <div className={styles.formGrid}>
                <Field
                  label="Throughput lookback (days)"
                  hint={`Time window used to calculate the historical average and peak throughput per product line shown on the schedule board. Valid range: ${MIN_LOOKBACK}–${MAX_LOOKBACK}.`}
                >
                  <Input
                    type="number"
                    min={MIN_LOOKBACK}
                    max={MAX_LOOKBACK}
                    value={throughputLookbackDays}
                    onChange={(_, d) => setThroughputLookbackDays(d.value)}
                    disabled={loading}
                    placeholder={`${MIN_LOOKBACK}–${MAX_LOOKBACK}`}
                  />
                </Field>
                <div className={styles.actionRow}>
                  <Button
                    appearance="primary"
                    onClick={save}
                    disabled={loading || saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
