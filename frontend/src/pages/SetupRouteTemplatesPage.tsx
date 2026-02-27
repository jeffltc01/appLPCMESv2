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
import type { RouteTemplateStepUpsert, RouteTemplateUpsert } from "../types/setup";

const newStep = (): RouteTemplateStepUpsert => ({
  stepSequence: 1,
  stepCode: "",
  stepName: "",
  workCenterId: 1,
  isRequired: true,
  dataCaptureMode: "ElectronicRequired",
  timeCaptureMode: "Automated",
  requiresScan: true,
  requiresUsageEntry: false,
  requiresScrapEntry: false,
  requiresSerialCapture: false,
  requiresChecklistCompletion: false,
  checklistTemplateId: null,
  checklistFailurePolicy: "BlockCompletion",
  requireScrapReasonWhenBad: true,
  requiresTrailerCapture: false,
  requiresSerialLoadVerification: false,
  generatePackingSlipOnComplete: false,
  generateBolOnComplete: false,
  requiresAttachment: false,
  requiresSupervisorApproval: false,
  autoQueueNextStep: true,
  slaMinutes: null,
});

const defaultForm: RouteTemplateUpsert = {
  routeTemplateCode: "",
  routeTemplateName: "",
  description: "",
  isActive: true,
  versionNo: 1,
  steps: [newStep()],
};

export function SetupRouteTemplatesPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof setupApi.listRouteTemplates>>>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<RouteTemplateUpsert>(defaultForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ intent: "success" | "error"; text: string } | null>(null);

  const load = async () => setRows(await setupApi.listRouteTemplates());

  useEffect(() => {
    void load().catch(() => setMessage({ intent: "error", text: "Failed to load route templates." }));
  }, []);

  const selectTemplate = async (id: number) => {
    try {
      const detail = await setupApi.getRouteTemplate(id);
      setSelectedId(id);
      setForm({
        routeTemplateCode: detail.routeTemplateCode,
        routeTemplateName: detail.routeTemplateName,
        description: detail.description ?? "",
        isActive: detail.isActive,
        versionNo: detail.versionNo,
        steps: detail.steps.map((s) => ({
          stepSequence: s.stepSequence,
          stepCode: s.stepCode,
          stepName: s.stepName,
          workCenterId: s.workCenterId,
          isRequired: s.isRequired,
          dataCaptureMode: s.dataCaptureMode,
          timeCaptureMode: s.timeCaptureMode,
          requiresScan: s.requiresScan,
          requiresUsageEntry: s.requiresUsageEntry,
          requiresScrapEntry: s.requiresScrapEntry,
          requiresSerialCapture: s.requiresSerialCapture,
          requiresChecklistCompletion: s.requiresChecklistCompletion,
          checklistTemplateId: s.checklistTemplateId,
          checklistFailurePolicy: s.checklistFailurePolicy,
          requireScrapReasonWhenBad: s.requireScrapReasonWhenBad,
          requiresTrailerCapture: s.requiresTrailerCapture,
          requiresSerialLoadVerification: s.requiresSerialLoadVerification,
          generatePackingSlipOnComplete: s.generatePackingSlipOnComplete,
          generateBolOnComplete: s.generateBolOnComplete,
          requiresAttachment: s.requiresAttachment,
          requiresSupervisorApproval: s.requiresSupervisorApproval,
          autoQueueNextStep: s.autoQueueNextStep,
          slaMinutes: s.slaMinutes,
        })),
      });
    } catch {
      setMessage({ intent: "error", text: "Failed to load route template detail." });
    }
  };

  const patchStep = (index: number, patch: Partial<RouteTemplateStepUpsert>) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    }));
  };

  const addStep = () => {
    setForm((prev) => ({
      ...prev,
      steps: [...prev.steps, { ...newStep(), stepSequence: prev.steps.length + 1 }],
    }));
  };

  const removeStep = (index: number) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, stepSequence: i + 1 })),
    }));
  };

  const save = async () => {
    if (!form.routeTemplateCode.trim() || !form.routeTemplateName.trim()) {
      setMessage({ intent: "error", text: "Route template code and name are required." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload: RouteTemplateUpsert = {
        ...form,
        description: form.description?.trim() || null,
        steps: [...form.steps].sort((a, b) => a.stepSequence - b.stepSequence),
      };
      if (selectedId) await setupApi.updateRouteTemplate(selectedId, payload);
      else await setupApi.createRouteTemplate(payload);
      await load();
      setMessage({ intent: "success", text: selectedId ? "Route template updated." : "Route template created." });
      if (!selectedId) setForm(defaultForm);
    } catch {
      setMessage({ intent: "error", text: "Failed to save route template." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await setupApi.deleteRouteTemplate(selectedId);
      setSelectedId(null);
      setForm(defaultForm);
      await load();
      setMessage({ intent: "success", text: "Route template deleted." });
    } catch {
      setMessage({ intent: "error", text: "Delete failed. Template may be referenced by assignments/routes." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Title2>Setup - Route Templates</Title2>
      <Body1>Manage route templates and full step requirement flags for production execution.</Body1>
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
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>Steps</TableHeaderCell>
              <TableHeaderCell>Active</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} onClick={() => void selectTemplate(row.id)}>
                <TableCell>{row.routeTemplateCode}</TableCell>
                <TableCell>{row.routeTemplateName}</TableCell>
                <TableCell>{row.versionNo}</TableCell>
                <TableCell>{row.stepCount}</TableCell>
                <TableCell>{row.isActive ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card style={{ display: "grid", gap: 8 }}>
        <Body1>
          <strong>{selectedId ? `Edit Template #${selectedId}` : "Create Route Template"}</strong>
        </Body1>
        <Field label="Template Code">
          <Input value={form.routeTemplateCode} onChange={(_, d) => setForm((p) => ({ ...p, routeTemplateCode: d.value }))} />
        </Field>
        <Field label="Template Name">
          <Input value={form.routeTemplateName} onChange={(_, d) => setForm((p) => ({ ...p, routeTemplateName: d.value }))} />
        </Field>
        <Field label="Description">
          <Input value={form.description ?? ""} onChange={(_, d) => setForm((p) => ({ ...p, description: d.value }))} />
        </Field>
        <Field label="Version No">
          <Input value={String(form.versionNo)} onChange={(_, d) => setForm((p) => ({ ...p, versionNo: Number(d.value) || 1 }))} />
        </Field>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Switch checked={form.isActive} onChange={(_, d) => setForm((p) => ({ ...p, isActive: d.checked }))} />
          <Body1>Active</Body1>
        </div>
      </Card>

      <Card style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Body1>
            <strong>Step Flags</strong>
          </Body1>
          <Button onClick={addStep}>Add Step</Button>
        </div>
        {form.steps.map((step, index) => (
          <Card key={`${step.stepCode}-${index}`} style={{ display: "grid", gap: 8 }}>
            <Body1>
              <strong>Step {index + 1}</strong>
            </Body1>
            <Field label="Sequence">
              <Input value={String(step.stepSequence)} onChange={(_, d) => patchStep(index, { stepSequence: Number(d.value) || 0 })} />
            </Field>
            <Field label="Step Code">
              <Input value={step.stepCode} onChange={(_, d) => patchStep(index, { stepCode: d.value })} />
            </Field>
            <Field label="Step Name">
              <Input value={step.stepName} onChange={(_, d) => patchStep(index, { stepName: d.value })} />
            </Field>
            <Field label="Work Center ID">
              <Input value={String(step.workCenterId)} onChange={(_, d) => patchStep(index, { workCenterId: Number(d.value) || 0 })} />
            </Field>
            <Field label="Data Capture Mode">
              <Input
                value={step.dataCaptureMode}
                onChange={(_, d) =>
                  patchStep(index, {
                    dataCaptureMode: (d.value as RouteTemplateStepUpsert["dataCaptureMode"]) || "ElectronicRequired",
                  })
                }
              />
            </Field>
            <Field label="Time Capture Mode">
              <Input
                value={step.timeCaptureMode}
                onChange={(_, d) =>
                  patchStep(index, {
                    timeCaptureMode: (d.value as RouteTemplateStepUpsert["timeCaptureMode"]) || "Automated",
                  })
                }
              />
            </Field>
            <Field label="Checklist Failure Policy">
              <Input
                value={step.checklistFailurePolicy}
                onChange={(_, d) =>
                  patchStep(index, {
                    checklistFailurePolicy:
                      (d.value as RouteTemplateStepUpsert["checklistFailurePolicy"]) || "BlockCompletion",
                  })
                }
              />
            </Field>
            <Field label="Checklist Template ID (optional)">
              <Input
                value={step.checklistTemplateId ? String(step.checklistTemplateId) : ""}
                onChange={(_, d) => patchStep(index, { checklistTemplateId: d.value ? Number(d.value) : null })}
              />
            </Field>
            <Field label="SLA Minutes (optional)">
              <Input
                value={step.slaMinutes ? String(step.slaMinutes) : ""}
                onChange={(_, d) => patchStep(index, { slaMinutes: d.value ? Number(d.value) : null })}
              />
            </Field>

            {(
              [
                ["isRequired", "Is Required"],
                ["requiresScan", "Requires Scan"],
                ["requiresUsageEntry", "Requires Usage Entry"],
                ["requiresScrapEntry", "Requires Scrap Entry"],
                ["requiresSerialCapture", "Requires Serial Capture"],
                ["requiresChecklistCompletion", "Requires Checklist Completion"],
                ["requireScrapReasonWhenBad", "Require Scrap Reason When Bad"],
                ["requiresTrailerCapture", "Requires Trailer Capture"],
                ["requiresSerialLoadVerification", "Requires Serial Load Verification"],
                ["generatePackingSlipOnComplete", "Generate Packing Slip On Complete"],
                ["generateBolOnComplete", "Generate BOL On Complete"],
                ["requiresAttachment", "Requires Attachment"],
                ["requiresSupervisorApproval", "Requires Supervisor Approval"],
                ["autoQueueNextStep", "Auto Queue Next Step"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Switch
                  checked={Boolean(step[key])}
                  onChange={(_, d) =>
                    patchStep(index, {
                      [key]: d.checked,
                    } as Partial<RouteTemplateStepUpsert>)
                  }
                />
                <Body1>{label}</Body1>
              </div>
            ))}

            <Button disabled={form.steps.length <= 1} onClick={() => removeStep(index)}>
              Remove Step
            </Button>
          </Card>
        ))}
      </Card>

      <Card style={{ display: "flex", gap: 8 }}>
        <Button appearance="primary" disabled={busy} onClick={() => void save()}>
          Save Template
        </Button>
        <Button
          disabled={busy}
          onClick={() => {
            setSelectedId(null);
            setForm(defaultForm);
          }}
        >
          New
        </Button>
        <Button disabled={busy || !selectedId} onClick={() => void remove()}>
          Delete
        </Button>
      </Card>
    </div>
  );
}
