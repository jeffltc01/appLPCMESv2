import { useEffect, useState } from "react";
import {
  Body1,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Switch,
  Title1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../services/api";
import { setupApi } from "../services/setup";
import type { LookupOptionAdmin, LookupOptionUpsert } from "../types/setup";

const useStyles = makeStyles({
  page: { minHeight: "100vh", backgroundColor: "#f5f5f5" },
  main: { display: "grid", gridTemplateRows: "44px 56px minmax(0, 1fr)", minWidth: 0 },
  utilityBar: {
    display: "flex", justifyContent: "flex-end", alignItems: "center", gap: tokens.spacingHorizontalM,
    padding: "0 24px", backgroundColor: "#ffffff", borderBottom: "1px solid #e8e8e8", fontSize: "12px",
    color: tokens.colorNeutralForeground2,
  },
  headerBar: {
    backgroundColor: "#123046", color: "#ffffff", display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  headerActions: { display: "flex", gap: tokens.spacingHorizontalS, flexWrap: "wrap" },
  content: { padding: "16px 20px", overflow: "auto" },
  tableContainer: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: "auto",
  },
  row: { display: "grid", gridTemplateColumns: "16% 36% 10% 10% 14% 14%", minWidth: "980px" },
  headerRow: {
    fontWeight: 700, color: "#fff", backgroundColor: "#123046", position: "sticky", top: 0, zIndex: 1,
    borderBottom: "1px solid #123046",
  },
  bodyRow: { borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  cell: { padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}` },
  actions: { display: "flex", gap: tokens.spacingHorizontalS },
  form: { display: "grid", gap: tokens.spacingVerticalM },
});

const EMPTY_FORM: LookupOptionUpsert = { code: "", displayName: "", isActive: true, sortOrder: 100 };

export function ValveTypesSetupPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [rows, setRows] = useState<LookupOptionAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LookupOptionAdmin | null>(null);
  const [form, setForm] = useState<LookupOptionUpsert>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await setupApi.listValveTypes());
    } catch {
      setError("Failed to load valve types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (row: LookupOptionAdmin) => {
    setEditing(row);
    setForm({
      code: row.code,
      displayName: row.displayName,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.code.trim() || !form.displayName.trim()) {
      setError("Code and display name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: form.code.trim(),
        displayName: form.displayName.trim(),
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };
      if (editing) {
        await setupApi.updateValveType(editing.id, payload);
      } else {
        await setupApi.createValveType(payload);
      }
      setDialogOpen(false);
      await load();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string; detail?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to save valve type.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: LookupOptionAdmin) => {
    if (!window.confirm(`Delete valve type '${row.displayName}'?`)) return;
    setError(null);
    try {
      await setupApi.deleteValveType(row.id);
      await load();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string; detail?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to delete valve type.");
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.utilityBar}><span>Order Analyst</span><span>Site: Houston</span></div>
        <header className={styles.headerBar}>
          <Title1 style={{ color: "#ffffff" }}>Valve Type Maintenance</Title1>
          <div className={styles.headerActions}>
            <Button appearance="secondary" onClick={() => navigate("/")}>Home</Button>
            <Button appearance="primary" onClick={openCreate}>Add Valve Type</Button>
          </div>
        </header>
        <section className={styles.content}>
          {error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}
          {loading ? <Body1>Loading...</Body1> : (
            <div className={styles.tableContainer}>
              <div className={`${styles.row} ${styles.headerRow}`}>
                <div className={styles.cell}>Code</div>
                <div className={styles.cell}>Display Name</div>
                <div className={styles.cell}>Sort</div>
                <div className={styles.cell}>Active</div>
                <div className={styles.cell}>In Use</div>
                <div className={styles.cell}>Actions</div>
              </div>
              {rows.map((row) => (
                <div key={row.id} className={`${styles.row} ${styles.bodyRow}`}>
                  <div className={styles.cell}>{row.code}</div>
                  <div className={styles.cell}>{row.displayName}</div>
                  <div className={styles.cell}>{row.sortOrder}</div>
                  <div className={styles.cell}>{row.isActive ? "Yes" : "No"}</div>
                  <div className={styles.cell}>{row.isInUse ? "Yes" : "No"}</div>
                  <div className={styles.cell}>
                    <div className={styles.actions}>
                      <Button appearance="secondary" onClick={() => openEdit(row)}>Edit</Button>
                      <Button appearance="secondary" onClick={() => void remove(row)}>Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Dialog open={dialogOpen} onOpenChange={(_, data) => setDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{editing ? "Edit Valve Type" : "Add Valve Type"}</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <Field label="Code" required>
                  <Input value={form.code} onChange={(_, d) => setForm((p) => ({ ...p, code: d.value }))} />
                </Field>
                <Field label="Display Name" required>
                  <Input value={form.displayName} onChange={(_, d) => setForm((p) => ({ ...p, displayName: d.value }))} />
                </Field>
                <Field label="Sort Order">
                  <Input
                    type="number"
                    value={String(form.sortOrder)}
                    onChange={(_, d) => setForm((p) => ({ ...p, sortOrder: Number(d.value || "0") }))}
                  />
                </Field>
                <Switch
                  label="Active"
                  checked={form.isActive}
                  onChange={(_, data) => setForm((p) => ({ ...p, isActive: data.checked }))}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button appearance="primary" onClick={() => void save()} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
