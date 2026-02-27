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
import type {
  RouteRuleSimulationResponse,
  RouteTemplateAssignmentUpsert,
  RouteTemplateSummary,
} from "../types/setup";

const defaultForm: RouteTemplateAssignmentUpsert = {
  assignmentName: "",
  priority: 1000,
  revisionNo: 1,
  isActive: true,
  customerId: null,
  siteId: null,
  itemId: null,
  itemType: null,
  orderPriorityMin: null,
  orderPriorityMax: null,
  pickUpViaId: null,
  shipToViaId: null,
  routeTemplateId: 0,
  supervisorGateOverride: null,
  effectiveFromUtc: null,
  effectiveToUtc: null,
};

export function SetupAssignmentsPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof setupApi.listAssignments>>>([]);
  const [templates, setTemplates] = useState<RouteTemplateSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<RouteTemplateAssignmentUpsert>(defaultForm);
  const [simInput, setSimInput] = useState({ customerId: 0, siteId: 0, itemId: 0, itemType: "" });
  const [simResult, setSimResult] = useState<RouteRuleSimulationResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ intent: "success" | "error"; text: string } | null>(null);

  const load = async () => {
    const [assignmentRows, templateRows] = await Promise.all([setupApi.listAssignments(), setupApi.listRouteTemplates()]);
    setRows(assignmentRows);
    setTemplates(templateRows);
  };

  useEffect(() => {
    void load().catch(() => setMessage({ intent: "error", text: "Failed to load assignment setup data." }));
  }, []);

  const selectAssignment = async (id: number) => {
    try {
      const item = await setupApi.getAssignment(id);
      setSelectedId(id);
      setForm({
        assignmentName: item.assignmentName,
        priority: item.priority,
        revisionNo: item.revisionNo,
        isActive: item.isActive,
        customerId: item.customerId,
        siteId: item.siteId,
        itemId: item.itemId,
        itemType: item.itemType,
        orderPriorityMin: item.orderPriorityMin,
        orderPriorityMax: item.orderPriorityMax,
        pickUpViaId: item.pickUpViaId,
        shipToViaId: item.shipToViaId,
        routeTemplateId: item.routeTemplateId,
        supervisorGateOverride: item.supervisorGateOverride,
        effectiveFromUtc: item.effectiveFromUtc,
        effectiveToUtc: item.effectiveToUtc,
      });
    } catch {
      setMessage({ intent: "error", text: "Failed to load assignment detail." });
    }
  };

  const save = async () => {
    if (!form.assignmentName.trim() || form.routeTemplateId <= 0) {
      setMessage({ intent: "error", text: "Assignment name and route template are required." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload: RouteTemplateAssignmentUpsert = {
        ...form,
        assignmentName: form.assignmentName.trim(),
        itemType: form.itemType?.trim() || null,
      };
      if (selectedId) await setupApi.updateAssignment(selectedId, payload);
      else await setupApi.createAssignment(payload);
      await load();
      setMessage({ intent: "success", text: selectedId ? "Assignment updated." : "Assignment created." });
      if (!selectedId) setForm(defaultForm);
    } catch {
      setMessage({ intent: "error", text: "Failed to save assignment." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await setupApi.deleteAssignment(selectedId);
      setSelectedId(null);
      setForm(defaultForm);
      await load();
      setMessage({ intent: "success", text: "Assignment deleted." });
    } catch {
      setMessage({ intent: "error", text: "Delete failed. Assignment may be referenced by active route instances." });
    } finally {
      setBusy(false);
    }
  };

  const simulate = async () => {
    if (simInput.customerId <= 0 || simInput.siteId <= 0 || simInput.itemId <= 0) {
      setMessage({ intent: "error", text: "Simulation requires customer, site, and item IDs." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await setupApi.simulateRoute({
        customerId: simInput.customerId,
        siteId: simInput.siteId,
        itemId: simInput.itemId,
        itemType: simInput.itemType.trim() || null,
      });
      setSimResult(result);
      setMessage({ intent: "success", text: result.matched ? "Simulation match found." : "No assignment matched." });
    } catch {
      setMessage({ intent: "error", text: "Simulation failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Title2>Setup - Route Assignments & Simulation</Title2>
      <Body1>Maintain assignment precedence rules and simulate route resolution outcomes.</Body1>

      {message ? (
        <MessageBar intent={message.intent}>
          <MessageBarBody>{message.text}</MessageBarBody>
        </MessageBar>
      ) : null}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Revision</TableHeaderCell>
              <TableHeaderCell>Template</TableHeaderCell>
              <TableHeaderCell>Active</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} onClick={() => void selectAssignment(row.id)}>
                <TableCell>{row.assignmentName}</TableCell>
                <TableCell>{row.priority}</TableCell>
                <TableCell>{row.revisionNo}</TableCell>
                <TableCell>{row.routeTemplateId}</TableCell>
                <TableCell>{row.isActive ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card style={{ display: "grid", gap: 8 }}>
        <Body1>
          <strong>{selectedId ? `Edit Assignment #${selectedId}` : "Create Assignment"}</strong>
        </Body1>
        <Field label="Assignment Name">
          <Input value={form.assignmentName} onChange={(_, d) => setForm((p) => ({ ...p, assignmentName: d.value }))} />
        </Field>
        <Field label="Priority (lower wins)">
          <Input value={String(form.priority)} onChange={(_, d) => setForm((p) => ({ ...p, priority: Number(d.value) || 0 }))} />
        </Field>
        <Field label="Revision No">
          <Input value={String(form.revisionNo)} onChange={(_, d) => setForm((p) => ({ ...p, revisionNo: Number(d.value) || 0 }))} />
        </Field>
        <Field label="Route Template ID">
          <Input
            value={String(form.routeTemplateId)}
            onChange={(_, d) => setForm((p) => ({ ...p, routeTemplateId: Number(d.value) || 0 }))}
          />
        </Field>
        <Body1>
          Available templates: {templates.map((t) => `${t.id}:${t.routeTemplateCode}`).join(", ") || "none"}
        </Body1>
        <Field label="Customer ID (optional)">
          <Input
            value={form.customerId ? String(form.customerId) : ""}
            onChange={(_, d) => setForm((p) => ({ ...p, customerId: d.value ? Number(d.value) : null }))}
          />
        </Field>
        <Field label="Site ID (optional)">
          <Input
            value={form.siteId ? String(form.siteId) : ""}
            onChange={(_, d) => setForm((p) => ({ ...p, siteId: d.value ? Number(d.value) : null }))}
          />
        </Field>
        <Field label="Item ID (optional)">
          <Input
            value={form.itemId ? String(form.itemId) : ""}
            onChange={(_, d) => setForm((p) => ({ ...p, itemId: d.value ? Number(d.value) : null }))}
          />
        </Field>
        <Field label="Item Type (optional)">
          <Input value={form.itemType ?? ""} onChange={(_, d) => setForm((p) => ({ ...p, itemType: d.value || null }))} />
        </Field>
        <Field label="Order Priority Min (optional)">
          <Input
            value={form.orderPriorityMin ? String(form.orderPriorityMin) : ""}
            onChange={(_, d) => setForm((p) => ({ ...p, orderPriorityMin: d.value ? Number(d.value) : null }))}
          />
        </Field>
        <Field label="Order Priority Max (optional)">
          <Input
            value={form.orderPriorityMax ? String(form.orderPriorityMax) : ""}
            onChange={(_, d) => setForm((p) => ({ ...p, orderPriorityMax: d.value ? Number(d.value) : null }))}
          />
        </Field>
        <Field label="Effective From UTC (optional)">
          <Input
            value={form.effectiveFromUtc ?? ""}
            onChange={(_, d) => setForm((p) => ({ ...p, effectiveFromUtc: d.value || null }))}
          />
        </Field>
        <Field label="Effective To UTC (optional)">
          <Input value={form.effectiveToUtc ?? ""} onChange={(_, d) => setForm((p) => ({ ...p, effectiveToUtc: d.value || null }))} />
        </Field>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Switch checked={form.isActive} onChange={(_, d) => setForm((p) => ({ ...p, isActive: d.checked }))} />
          <Body1>Active</Body1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button appearance="primary" onClick={() => void save()} disabled={busy}>
            Save Assignment
          </Button>
          <Button
            onClick={() => {
              setSelectedId(null);
              setForm(defaultForm);
            }}
            disabled={busy}
          >
            New
          </Button>
          <Button onClick={() => void remove()} disabled={busy || !selectedId}>
            Delete
          </Button>
        </div>
      </Card>

      <Card style={{ display: "grid", gap: 8 }}>
        <Body1>
          <strong>Simulation</strong>
        </Body1>
        <Field label="Customer ID">
          <Input value={String(simInput.customerId || "")} onChange={(_, d) => setSimInput((p) => ({ ...p, customerId: Number(d.value) || 0 }))} />
        </Field>
        <Field label="Site ID">
          <Input value={String(simInput.siteId || "")} onChange={(_, d) => setSimInput((p) => ({ ...p, siteId: Number(d.value) || 0 }))} />
        </Field>
        <Field label="Item ID">
          <Input value={String(simInput.itemId || "")} onChange={(_, d) => setSimInput((p) => ({ ...p, itemId: Number(d.value) || 0 }))} />
        </Field>
        <Field label="Item Type (optional)">
          <Input value={simInput.itemType} onChange={(_, d) => setSimInput((p) => ({ ...p, itemType: d.value }))} />
        </Field>
        <Button appearance="primary" onClick={() => void simulate()} disabled={busy}>
          Run Simulation
        </Button>
        {simResult ? (
          <Card>
            <Body1>Matched: {simResult.matched ? "Yes" : "No"}</Body1>
            <Body1>Tier: {simResult.matchTierLabel ?? "--"}</Body1>
            <Body1>Assignment: {simResult.assignment?.assignmentName ?? "--"}</Body1>
            <Body1>Template: {simResult.routeTemplate?.routeTemplateCode ?? "--"}</Body1>
            <Body1>Steps: {simResult.routeTemplate?.steps.length ?? 0}</Body1>
          </Card>
        ) : null}
      </Card>
    </div>
  );
}
