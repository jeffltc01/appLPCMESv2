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
  Switch,
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { orderLookupsApi } from "../services/orders";
import { setupApi } from "../services/setup";
import type { Lookup } from "../types/customer";
import type { WorkCenter } from "../types/setup";
import {
  clearTabletSetup,
  readTabletSetup,
  saveTabletSetup,
} from "../features/tabletSetupStorage";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#FCFCFC",
    padding: tokens.spacingHorizontalL,
    display: "grid",
    gap: tokens.spacingVerticalM,
    alignContent: "start",
  },
  heading: {
    color: "#123046",
  },
  card: {
    maxWidth: "760px",
    width: "100%",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  formGrid: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  primaryButton: {
    minHeight: "44px",
    minWidth: "150px",
  },
  secondaryButton: {
    minHeight: "44px",
  },
  helper: {
    color: tokens.colorNeutralForeground2,
  },
});

export function TabletSetupPage() {
  const styles = useStyles();
  const navigate = useNavigate();

  const [sites, setSites] = useState<Lookup[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [siteId, setSiteId] = useState("");
  const [workCenterId, setWorkCenterId] = useState("");
  const [operatorEmpNo, setOperatorEmpNo] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [lockOperatorToLoggedInUser, setLockOperatorToLoggedInUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const stored = readTabletSetup();
    if (stored) {
      setSiteId(String(stored.siteId));
      setWorkCenterId(String(stored.workCenterId));
      setOperatorEmpNo(stored.operatorEmpNo);
      setDeviceId(stored.deviceId);
      setLockOperatorToLoggedInUser(stored.lockOperatorToLoggedInUser);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [siteRows, workCenterRows] = await Promise.all([
          orderLookupsApi.sites(),
          setupApi.listWorkCenters(),
        ]);
        setSites(siteRows);
        setWorkCenters(workCenterRows.filter((row) => row.isActive));
      } catch {
        setError("Unable to load setup options.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const workCentersForSite = useMemo(() => {
    if (!siteId) {
      return [] as WorkCenter[];
    }
    return workCenters.filter((row) => row.siteId === Number(siteId));
  }, [workCenters, siteId]);

  const selectedWorkCenter = useMemo(
    () => workCenters.find((row) => row.id === Number(workCenterId)) ?? null,
    [workCenters, workCenterId]
  );

  const save = async () => {
    if (!siteId || !workCenterId || !selectedWorkCenter) {
      setError("Site and Work Center are required.");
      setInfo(null);
      return;
    }

    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      saveTabletSetup({
        siteId: Number(siteId),
        workCenterId: selectedWorkCenter.id,
        workCenterCode: selectedWorkCenter.workCenterCode,
        workCenterName: selectedWorkCenter.workCenterName,
        operatorEmpNo: operatorEmpNo.trim(),
        deviceId: deviceId.trim(),
        lockOperatorToLoggedInUser,
      });
      setInfo("Tablet setup saved.");
      navigate("/operator/work-center");
    } finally {
      setSaving(false);
    }
  };

  const clear = () => {
    clearTabletSetup();
    setSiteId("");
    setWorkCenterId("");
    setOperatorEmpNo("");
    setDeviceId("");
    setLockOperatorToLoggedInUser(false);
    setInfo("Saved tablet setup cleared.");
    setError(null);
  };

  return (
    <main className={styles.page}>
      <Title2 className={styles.heading}>Tablet Setup</Title2>
      <Body1 className={styles.helper}>
        Set this tablet to a work center once. Next use, the operator screen will remember it.
      </Body1>

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
        {loading ? (
          <Body1>Loading setup options...</Body1>
        ) : (
          <div className={styles.formGrid}>
            <Field label="Site" required>
              <Select
                value={siteId}
                onChange={(event) => {
                  setSiteId(event.target.value);
                  setWorkCenterId("");
                }}
              >
                <option value="">Select site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Work Center" required>
              <Select value={workCenterId} onChange={(event) => setWorkCenterId(event.target.value)}>
                <option value="">Select work center</option>
                {workCentersForSite.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.workCenterCode} - {row.workCenterName}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Default Operator (fallback, optional)">
              <Input value={operatorEmpNo} onChange={(_, data) => setOperatorEmpNo(data.value)} />
            </Field>

            <Field label="Device ID (optional)">
              <Input value={deviceId} onChange={(_, data) => setDeviceId(data.value)} />
            </Field>

            <Field label="Operator Identity Lock">
              <Switch
                checked={lockOperatorToLoggedInUser}
                onChange={(_, data) => setLockOperatorToLoggedInUser(data.checked)}
                label="Lock operator to logged-in user (no manual override)"
              />
            </Field>

            <div className={styles.actionRow}>
              <Button
                appearance="primary"
                className={styles.primaryButton}
                onClick={() => void save()}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save & Open Operator Screen"}
              </Button>
              <Button appearance="secondary" className={styles.secondaryButton} onClick={clear}>
                Clear Saved Setup
              </Button>
              <Button
                appearance="secondary"
                className={styles.secondaryButton}
                onClick={() => navigate("/")}
              >
                Home
              </Button>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
