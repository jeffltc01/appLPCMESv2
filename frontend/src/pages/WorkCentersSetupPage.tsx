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
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
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
import { ApiError } from "../services/api";
import { orderLookupsApi } from "../services/orders";
import { setupApi } from "../services/setup";
import type { WorkCenter } from "../types/setup";
import type { Lookup } from "../types/customer";

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
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
});

type TimeCaptureMode = "Automated" | "Manual" | "Hybrid";

interface FormState {
  workCenterCode: string;
  workCenterName: string;
  siteId: string;
  description: string;
  isActive: boolean;
  defaultTimeCaptureMode: TimeCaptureMode;
  requiresScanByDefault: boolean;
}

const EMPTY_FORM: FormState = {
  workCenterCode: "",
  workCenterName: "",
  siteId: "",
  description: "",
  isActive: true,
  defaultTimeCaptureMode: "Automated",
  requiresScanByDefault: true,
};

export function WorkCentersSetupPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [rows, setRows] = useState<WorkCenter[]>([]);
  const [sites, setSites] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkCenter | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => (editing ? "Edit Work Center" : "Add Work Center"), [editing]);

  const siteNameById = useMemo(
    () => new Map(sites.map((site) => [site.id, site.name])),
    [sites]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [workCenters, siteLookups] = await Promise.all([setupApi.listWorkCenters(), orderLookupsApi.sites()]);
      setRows(workCenters);
      setSites(siteLookups);
    } catch {
      setError("Failed to load work centers.");
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

  const openEdit = (row: WorkCenter) => {
    setEditing(row);
    setForm({
      workCenterCode: row.workCenterCode,
      workCenterName: row.workCenterName,
      siteId: String(row.siteId),
      description: row.description ?? "",
      isActive: row.isActive,
      defaultTimeCaptureMode: row.defaultTimeCaptureMode,
      requiresScanByDefault: row.requiresScanByDefault,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.workCenterCode.trim() || !form.workCenterName.trim()) {
      setError("Work Center Code and Name are required.");
      return;
    }
    if (!form.siteId) {
      setError("Site is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        workCenterCode: form.workCenterCode.trim(),
        workCenterName: form.workCenterName.trim(),
        siteId: Number(form.siteId),
        description: form.description.trim() || null,
        isActive: form.isActive,
        defaultTimeCaptureMode: form.defaultTimeCaptureMode,
        requiresScanByDefault: form.requiresScanByDefault,
      };
      if (editing) {
        await setupApi.updateWorkCenter(editing.id, payload);
      } else {
        await setupApi.createWorkCenter(payload);
      }
      setDialogOpen(false);
      await load();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to save work center.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: WorkCenter) => {
    if (!window.confirm(`Delete work center '${row.workCenterCode}'?`)) return;
    setError(null);
    try {
      await setupApi.deleteWorkCenter(row.id);
      await load();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to delete work center.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Title2>Setup - Work Centers</Title2>
        <div className={styles.nav}>
          <Button appearance="secondary" onClick={() => navigate("/setup/production-lines")}>
            Production Lines Setup
          </Button>
          <Button appearance="secondary" onClick={() => navigate("/setup/users-roles")}>
            Users & Roles Setup
          </Button>
          <Button appearance="secondary" onClick={() => navigate("/")}>
            Home
          </Button>
          <Button appearance="primary" onClick={openCreate}>
            Add Work Center
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
              <TableHeaderCell>Site</TableHeaderCell>
              <TableHeaderCell>Time Capture Mode</TableHeaderCell>
              <TableHeaderCell>Active</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.workCenterCode}</TableCell>
                <TableCell>{row.workCenterName}</TableCell>
                <TableCell>{siteNameById.get(row.siteId) ?? `Site ${row.siteId}`}</TableCell>
                <TableCell>{row.defaultTimeCaptureMode}</TableCell>
                <TableCell>{row.isActive ? "Yes" : "No"}</TableCell>
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
                <div className={styles.formRow}>
                  <Field label="Work Center Code" required>
                    <Input
                      value={form.workCenterCode}
                      onChange={(_, d) => setForm((prev) => ({ ...prev, workCenterCode: d.value }))}
                    />
                  </Field>
                  <Field label="Work Center Name" required>
                    <Input
                      value={form.workCenterName}
                      onChange={(_, d) => setForm((prev) => ({ ...prev, workCenterName: d.value }))}
                    />
                  </Field>
                </div>

                <div className={styles.formRow}>
                  <Field label="Site" required>
                    <Dropdown
                      value={form.siteId ? (siteNameById.get(Number(form.siteId)) ?? "") : ""}
                      selectedOptions={form.siteId ? [form.siteId] : []}
                      onOptionSelect={(_, data) =>
                        setForm((prev) => ({ ...prev, siteId: data.optionValue ?? "" }))
                      }
                    >
                      {sites.map((site) => (
                        <Option key={site.id} value={String(site.id)}>
                          {site.name}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Default Time Capture Mode" required>
                    <Dropdown
                      value={form.defaultTimeCaptureMode}
                      selectedOptions={[form.defaultTimeCaptureMode]}
                      onOptionSelect={(_, data) =>
                        setForm((prev) => ({
                          ...prev,
                          defaultTimeCaptureMode: (data.optionValue as TimeCaptureMode) ?? "Automated",
                        }))
                      }
                    >
                      <Option value="Automated">Automated</Option>
                      <Option value="Manual">Manual</Option>
                      <Option value="Hybrid">Hybrid</Option>
                    </Dropdown>
                  </Field>
                </div>

                <Field label="Description">
                  <Input
                    value={form.description}
                    onChange={(_, d) => setForm((prev) => ({ ...prev, description: d.value }))}
                  />
                </Field>

                <Checkbox
                  label="Active"
                  checked={form.isActive}
                  onChange={(_, d) => setForm((prev) => ({ ...prev, isActive: Boolean(d.checked) }))}
                />
                <Checkbox
                  label="Requires Scan By Default"
                  checked={form.requiresScanByDefault}
                  onChange={(_, d) =>
                    setForm((prev) => ({ ...prev, requiresScanByDefault: Boolean(d.checked) }))
                  }
                />
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
