import { useEffect, useMemo, useState } from "react";
import {
  Body1,
  Button,
  Checkbox,
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
  Title1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { setupApi } from "../services/setup";
import type { ProductionLine, ProductionLineShowWhere } from "../types/setup";
import { ApiError } from "../services/api";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
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
  headerActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  content: {
    padding: "16px 20px",
    overflow: "auto",
  },
  contentStack: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  tableContainer: {
    maxHeight: "72vh",
    overflow: "auto",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  gridHeaderRow: {
    display: "grid",
    gridTemplateColumns: "10% 20% 50% 20%",
    width: "100%",
    position: "sticky",
    top: 0,
    zIndex: 2,
    alignItems: "center",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontWeight: 600,
    backgroundColor: tokens.colorNeutralBackground1,
    minWidth: "900px",
  },
  gridBody: {
    minWidth: "900px",
  },
  gridBodyRow: {
    display: "grid",
    gridTemplateColumns: "10% 20% 50% 20%",
    width: "100%",
    alignItems: "start",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  codeColumn: {
    width: "100%",
  },
  nameColumn: {
    width: "100%",
  },
  showWhereColumn: {
    width: "100%",
  },
  actionsColumn: {
    width: "100%",
  },
  gridCell: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    minWidth: 0,
  },
  form: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  showWhereGrid: {
    display: "grid",
    gap: tokens.spacingVerticalXS,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
  showWhereInline: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
    width: "100%",
  },
  showWhereOption: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    minWidth: 0,
  },
  showWhereOptionLabel: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
});

const SHOW_WHERE_OPTIONS: Array<{ value: ProductionLineShowWhere; label: string }> = [
  { value: "OrderComments", label: "Order Comments" },
  { value: "OrderProduct", label: "Order Product" },
  { value: "OrderReceiving", label: "Order Receiving" },
  { value: "JobMaterialUsed", label: "Job Material Used" },
];

interface FormState {
  code: string;
  name: string;
  showWhere: ProductionLineShowWhere[];
}

const EMPTY_FORM: FormState = {
  code: "",
  name: "",
  showWhere: ["OrderProduct"],
};

export function ProductionLinesSetupPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionLine | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [savingShowWhereIds, setSavingShowWhereIds] = useState<Set<number>>(new Set());

  const title = useMemo(() => (editing ? "Edit Product Line" : "Add Product Line"), [editing]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await setupApi.listProductionLines());
    } catch {
      setError("Failed to load production lines.");
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

  const openEdit = (row: ProductionLine) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      showWhere: row.showWhere,
    });
    setDialogOpen(true);
  };

  const toggleShowWhere = (value: ProductionLineShowWhere, checked: boolean) => {
    setForm((prev) => {
      if (checked) {
        return { ...prev, showWhere: [...new Set([...prev.showWhere, value])] };
      }
      return { ...prev, showWhere: prev.showWhere.filter((v) => v !== value) };
    });
  };

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setError("Code and Name are required.");
      return;
    }
    if (form.showWhere.length === 0) {
      setError("Select at least one Show Where option.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        showWhere: form.showWhere,
      };
      if (editing) {
        await setupApi.updateProductionLine(editing.id, payload);
      } else {
        await setupApi.createProductionLine(payload);
      }
      setDialogOpen(false);
      await load();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to save production line.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: ProductionLine) => {
    if (!window.confirm(`Delete production line '${row.code}'?`)) return;
    setError(null);
    try {
      await setupApi.deleteProductionLine(row.id);
      await load();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to delete production line.");
    }
  };

  const updateShowWhereFromList = async (
    row: ProductionLine,
    value: ProductionLineShowWhere,
    checked: boolean
  ) => {
    const nextShowWhere = checked
      ? [...new Set([...row.showWhere, value])]
      : row.showWhere.filter((entry) => entry !== value);
    if (nextShowWhere.length === 0) {
      setError("Select at least one Show Where option.");
      return;
    }

    const previousShowWhere = row.showWhere;
    setError(null);
    setRows((currentRows) =>
      currentRows.map((currentRow) =>
        currentRow.id === row.id ? { ...currentRow, showWhere: nextShowWhere } : currentRow
      )
    );
    setSavingShowWhereIds((current) => {
      const next = new Set(current);
      next.add(row.id);
      return next;
    });

    try {
      await setupApi.updateProductionLine(row.id, {
        code: row.code,
        name: row.name,
        showWhere: nextShowWhere,
      });
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.id === row.id ? { ...currentRow, showWhere: previousShowWhere } : currentRow
        )
      );
      setError(body?.message ?? body?.detail ?? "Failed to update Show Where.");
    } finally {
      setSavingShowWhereIds((current) => {
        const next = new Set(current);
        next.delete(row.id);
        return next;
      });
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.utilityBar}>
          <span>Order Analyst</span>
          <span>Site: Houston</span>
        </div>

        <header className={styles.headerBar}>
          <Title1 style={{ color: "#ffffff" }}>Product Lines Maintenance</Title1>
          <div className={styles.headerActions}>
            <Button appearance="secondary" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button appearance="primary" onClick={openCreate}>
              Add Product Line
            </Button>
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.contentStack}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}

            {loading ? (
              <Body1>Loading...</Body1>
            ) : (
              <div className={styles.tableContainer}>
                <div className={styles.gridHeaderRow}>
                  <div className={`${styles.gridCell} ${styles.codeColumn}`}>Code</div>
                  <div className={`${styles.gridCell} ${styles.nameColumn}`}>Name</div>
                  <div className={`${styles.gridCell} ${styles.showWhereColumn}`}>Show Where</div>
                  <div className={`${styles.gridCell} ${styles.actionsColumn}`}>Actions</div>
                </div>
                <div className={styles.gridBody}>
                  {rows.map((row) => (
                    <div key={row.id} className={styles.gridBodyRow}>
                      <div className={`${styles.gridCell} ${styles.codeColumn}`}>{row.code}</div>
                      <div className={`${styles.gridCell} ${styles.nameColumn}`}>{row.name}</div>
                      <div className={`${styles.gridCell} ${styles.showWhereColumn}`}>
                        <div className={styles.showWhereInline}>
                          {SHOW_WHERE_OPTIONS.map((option) => (
                            <div key={`${row.id}-${option.value}`} className={styles.showWhereOption}>
                              <Checkbox
                                aria-label={option.label}
                                checked={row.showWhere.includes(option.value)}
                                disabled={savingShowWhereIds.has(row.id)}
                                onChange={(_, data) =>
                                  void updateShowWhereFromList(row, option.value, Boolean(data.checked))
                                }
                              />
                              <span className={styles.showWhereOptionLabel} title={option.label}>
                                {option.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`${styles.gridCell} ${styles.actionsColumn}`}>
                        <div className={styles.actions}>
                          <Button appearance="secondary" onClick={() => openEdit(row)}>
                            Edit
                          </Button>
                          <Button appearance="secondary" onClick={() => void remove(row)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Dialog open={dialogOpen} onOpenChange={(_, data) => setDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <Field label="Code" required>
                  <Input value={form.code} onChange={(_, d) => setForm((prev) => ({ ...prev, code: d.value }))} />
                </Field>
                <Field label="Name" required>
                  <Input value={form.name} onChange={(_, d) => setForm((prev) => ({ ...prev, name: d.value }))} />
                </Field>
                <Field label="Show Where" required>
                  <div className={styles.showWhereGrid}>
                    {SHOW_WHERE_OPTIONS.map((option) => (
                      <Checkbox
                        key={option.value}
                        label={option.label}
                        checked={form.showWhere.includes(option.value)}
                        onChange={(_, d) => toggleShowWhere(option.value, Boolean(d.checked))}
                      />
                    ))}
                  </div>
                </Field>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
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
