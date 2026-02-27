import { useEffect, useState } from "react";
import {
  Body1,
  Button,
  Card,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title2,
} from "@fluentui/react-components";
import { setupApi } from "../services/setup";
import type { WorkCenterUpsert } from "../types/setup";

const defaultForm: WorkCenterUpsert = {
  workCenterCode: "",
  workCenterName: "",
  siteId: 1,
  description: "",
  isActive: true,
  defaultTimeCaptureMode: "Automated",
  requiresScanByDefault: true,
};

export function SetupWorkCentersPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof setupApi.listWorkCenters>>>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<WorkCenterUpsert>(defaultForm);
  const [message, setMessage] = useState<{ intent: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setRows(await setupApi.listWorkCenters());
  };

  useEffect(() => {
    void load().catch(() => setMessage({ intent: "error", text: "Failed to load work centers." }));
  }, []);

  const onSelect = async (id: number) => {
    try {
      const item = await setupApi.getWorkCenter(id);
      setSelectedId(id);
      setForm({
        workCenterCode: item.workCenterCode,
        workCenterName: item.workCenterName,
        siteId: item.siteId,
        description: item.description ?? "",
        isActive: item.isActive,
        defaultTimeCaptureMode: item.defaultTimeCaptureMode,
        requiresScanByDefault: item.requiresScanByDefault,
      });
    } catch {
      setMessage({ intent: "error", text: "Failed to load work center detail." });
    }
  };

  const save = async () => {
    if (!form.workCenterCode.trim() || !form.workCenterName.trim()) {
      setMessage({ intent: "error", text: "Work center code and name are required." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (selectedId) {
        await setupApi.updateWorkCenter(selectedId, { ...form, description: form.description?.trim() || null });
      } else {
        await setupApi.createWorkCenter({ ...form, description: form.description?.trim() || null });
      }
      await load();
      setMessage({ intent: "success", text: selectedId ? "Work center updated." : "Work center created." });
      if (!selectedId) setForm(defaultForm);
    } catch {
      setMessage({ intent: "error", text: "Failed to save work center." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await setupApi.deleteWorkCenter(selectedId);
      setSelectedId(null);
      setForm(defaultForm);
      await load();
      setMessage({ intent: "success", text: "Work center deleted." });
    } catch {
      setMessage({ intent: "error", text: "Delete failed. Item may be referenced by route data." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Title2>Setup - Work Centers</Title2>
      <Body1>Maintain work center master records used by route templates and execution queues.</Body1>
      {message ? (
        <MessageBar intent={message.intent}>
          <MessageBarBody>{message.text}</MessageBarBody>
        </MessageBar>
      ) : null}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Code</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Site</TableHeaderCell>
              <TableHeaderCell>Mode</TableHeaderCell>
              <TableHeaderCell>Active</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} onClick={() => void onSelect(row.id)}>
                <TableCell>{row.workCenterCode}</TableCell>
                <TableCell>{row.workCenterName}</TableCell>
                <TableCell>{row.siteId}</TableCell>
                <TableCell>{row.defaultTimeCaptureMode}</TableCell>
                <TableCell>{row.isActive ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card style={{ display: "grid", gap: 8 }}>
        <Body1>
          <strong>{selectedId ? `Edit Work Center #${selectedId}` : "Create Work Center"}</strong>
        </Body1>
        <Field label="Work Center Code">
          <Input value={form.workCenterCode} onChange={(_, d) => setForm((prev) => ({ ...prev, workCenterCode: d.value }))} />
        </Field>
        <Field label="Work Center Name">
          <Input value={form.workCenterName} onChange={(_, d) => setForm((prev) => ({ ...prev, workCenterName: d.value }))} />
        </Field>
        <Field label="Site ID">
          <Input value={String(form.siteId)} onChange={(_, d) => setForm((prev) => ({ ...prev, siteId: Number(d.value) || 0 }))} />
        </Field>
        <Field label="Description">
          <Input value={form.description ?? ""} onChange={(_, d) => setForm((prev) => ({ ...prev, description: d.value }))} />
        </Field>
        <Field label="Default Time Capture Mode (Automated/Manual/Hybrid)">
          <Input
            value={form.defaultTimeCaptureMode}
            onChange={(_, d) =>
              setForm((prev) => ({
                ...prev,
                defaultTimeCaptureMode: (d.value as WorkCenterUpsert["defaultTimeCaptureMode"]) || "Automated",
              }))
            }
          />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Switch checked={form.isActive} onChange={(_, d) => setForm((prev) => ({ ...prev, isActive: d.checked }))} />
            <Body1>Active</Body1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Switch
              checked={form.requiresScanByDefault}
              onChange={(_, d) => setForm((prev) => ({ ...prev, requiresScanByDefault: d.checked }))}
            />
            <Body1>Requires Scan By Default</Body1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button appearance="primary" onClick={() => void save()} disabled={busy}>
            Save
          </Button>
          <Button onClick={() => { setSelectedId(null); setForm(defaultForm); }} disabled={busy}>
            New
          </Button>
          <Button onClick={() => void remove()} disabled={busy || !selectedId}>
            Delete
          </Button>
        </div>
      </Card>
    </div>
  );
}
