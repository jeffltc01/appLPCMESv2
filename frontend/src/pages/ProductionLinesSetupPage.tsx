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
import { useNavigate } from "react-router-dom";
import { setupApi } from "../services/setup";
import type { ProductionLine, ProductionLineShowWhere } from "../types/setup";
import { ApiError } from "../services/api";

const useStyles = makeStyles({
  page: {
    padding: tokens.spacingHorizontalL,
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nav: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
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

  const title = useMemo(() => (editing ? "Edit Production Line" : "Add Production Line"), [editing]);

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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Title2>Setup - Production Lines</Title2>
        <div className={styles.nav}>
          <Button appearance="secondary" onClick={() => navigate("/setup/items")}>
            Items Setup
          </Button>
          <Button appearance="secondary" onClick={() => navigate("/setup/work-centers")}>
            Work Centers Setup
          </Button>
          <Button appearance="secondary" onClick={() => navigate("/setup/users-roles")}>
            Users & Roles Setup
          </Button>
          <Button appearance="secondary" onClick={() => navigate("/")}>
            Home
          </Button>
          <Button appearance="primary" onClick={openCreate}>
            Add Production Line
          </Button>
        </div>
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {loading ? (
        <Body1>Loading...</Body1>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Code</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Show Where</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>
                  {row.showWhere
                    .map((value) => SHOW_WHERE_OPTIONS.find((opt) => opt.value === value)?.label ?? value)
                    .join(", ")}
                </TableCell>
                <TableCell>
                  <div className={styles.actions}>
                    <Button appearance="secondary" onClick={() => openEdit(row)}>
                      Edit
                    </Button>
                    <Button appearance="secondary" onClick={() => void remove(row)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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
