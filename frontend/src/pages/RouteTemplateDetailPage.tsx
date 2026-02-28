import { useEffect, useMemo, useState } from "react";
import {
  Body1,
  Button,
  Card,
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
  Title1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../services/api";
import { setupApi } from "../services/setup";
import type { RouteTemplateDetail, RouteTemplateStep, RouteTemplateStepUpsert } from "../types/setup";

type WorkCenter = { id: number; workCenterCode: string; workCenterName: string };
type DataCaptureMode = "ElectronicRequired" | "ElectronicOptional" | "PaperOnly";
type TimeCaptureMode = "Automated" | "Manual" | "Hybrid";
type ChecklistFailurePolicy = "BlockCompletion" | "AllowWithSupervisorOverride";

interface StepFormState extends RouteTemplateStepUpsert {
  localId: string;
}

interface TemplateFormState {
  routeTemplateCode: string;
  routeTemplateName: string;
  description: string;
  isActive: boolean;
  versionNo: string;
  steps: StepFormState[];
}

interface StepEditorState extends RouteTemplateStepUpsert {
  checklistTemplateIdText: string;
  slaMinutesText: string;
}

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
  card: {
    border: "1px solid #d8d8d8",
    borderRadius: "4px",
    padding: "12px",
    backgroundColor: "#ffffff",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#123046",
    marginBottom: "10px",
  },
  nav: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
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
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingVerticalXS,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
  stepsTableWrap: {
    maxHeight: "360px",
    overflowY: "auto",
    border: "1px solid #e8e8e8",
    borderRadius: "4px",
  },
});

const EMPTY_STEP_EDITOR: StepEditorState = {
  stepSequence: 1,
  stepCode: "",
  stepName: "",
  workCenterId: 0,
  isRequired: true,
  dataCaptureMode: "ElectronicRequired",
  timeCaptureMode: "Automated",
  requiresScan: true,
  requiresUsageEntry: false,
  requiresScrapEntry: false,
  requiresSerialCapture: false,
  requiresChecklistCompletion: false,
  checklistTemplateId: null,
  checklistTemplateIdText: "",
  checklistFailurePolicy: "BlockCompletion",
  requireScrapReasonWhenBad: false,
  requiresTrailerCapture: false,
  requiresSerialLoadVerification: false,
  generatePackingSlipOnComplete: false,
  generateBolOnComplete: false,
  requiresAttachment: false,
  requiresSupervisorApproval: false,
  autoQueueNextStep: true,
  slaMinutes: null,
  slaMinutesText: "",
};

const EMPTY_TEMPLATE_FORM: TemplateFormState = {
  routeTemplateCode: "",
  routeTemplateName: "",
  description: "",
  isActive: true,
  versionNo: "1",
  steps: [],
};

function createLocalId() {
  return `step-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toStepForm(step: RouteTemplateStep): StepFormState {
  return {
    localId: createLocalId(),
    stepSequence: step.stepSequence,
    stepCode: step.stepCode,
    stepName: step.stepName,
    workCenterId: step.workCenterId,
    isRequired: step.isRequired,
    dataCaptureMode: step.dataCaptureMode,
    timeCaptureMode: step.timeCaptureMode,
    requiresScan: step.requiresScan,
    requiresUsageEntry: step.requiresUsageEntry,
    requiresScrapEntry: step.requiresScrapEntry,
    requiresSerialCapture: step.requiresSerialCapture,
    requiresChecklistCompletion: step.requiresChecklistCompletion,
    checklistTemplateId: step.checklistTemplateId,
    checklistFailurePolicy: step.checklistFailurePolicy,
    requireScrapReasonWhenBad: step.requireScrapReasonWhenBad,
    requiresTrailerCapture: step.requiresTrailerCapture,
    requiresSerialLoadVerification: step.requiresSerialLoadVerification,
    generatePackingSlipOnComplete: step.generatePackingSlipOnComplete,
    generateBolOnComplete: step.generateBolOnComplete,
    requiresAttachment: step.requiresAttachment,
    requiresSupervisorApproval: step.requiresSupervisorApproval,
    autoQueueNextStep: step.autoQueueNextStep,
    slaMinutes: step.slaMinutes,
  };
}

function toStepEditor(step: StepFormState): StepEditorState {
  return {
    ...step,
    checklistTemplateIdText: step.checklistTemplateId != null ? String(step.checklistTemplateId) : "",
    slaMinutesText: step.slaMinutes != null ? String(step.slaMinutes) : "",
  };
}

function parseOptionalInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

export function RouteTemplateDetailPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { templateId } = useParams();
  const isNew = templateId === "new";

  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormState>(EMPTY_TEMPLATE_FORM);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [stepEditingLocalId, setStepEditingLocalId] = useState<string | null>(null);
  const [stepEditor, setStepEditor] = useState<StepEditorState>(EMPTY_STEP_EDITOR);

  const pageTitle = isNew ? "Add Route Template" : "Edit Route Template";
  const parsedTemplateId = !isNew && templateId ? Number(templateId) : null;

  const workCenterLabelById = useMemo(
    () => new Map(workCenters.map((w) => [w.id, `${w.workCenterCode} - ${w.workCenterName}`])),
    [workCenters]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const centers = await setupApi.listWorkCenters();
        setWorkCenters(
          centers.map((center) => ({
            id: center.id,
            workCenterCode: center.workCenterCode,
            workCenterName: center.workCenterName,
          }))
        );

        if (!isNew) {
          if (!parsedTemplateId || !Number.isInteger(parsedTemplateId) || parsedTemplateId <= 0) {
            setError("Invalid route template id.");
            return;
          }
          const detail: RouteTemplateDetail = await setupApi.getRouteTemplate(parsedTemplateId);
          setForm({
            routeTemplateCode: detail.routeTemplateCode,
            routeTemplateName: detail.routeTemplateName,
            description: detail.description ?? "",
            isActive: detail.isActive,
            versionNo: String(detail.versionNo),
            steps: detail.steps.map(toStepForm),
          });
        } else {
          setForm(EMPTY_TEMPLATE_FORM);
        }
      } catch {
        setError("Failed to load route template.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isNew, parsedTemplateId]);

  const openCreateStep = () => {
    const nextSequence =
      form.steps.length === 0 ? 1 : Math.max(...form.steps.map((step) => step.stepSequence)) + 1;
    setStepEditingLocalId(null);
    setStepEditor({
      ...EMPTY_STEP_EDITOR,
      stepSequence: nextSequence,
      workCenterId: workCenters[0]?.id ?? 0,
    });
    setStepDialogOpen(true);
  };

  const openEditStep = (step: StepFormState) => {
    setStepEditingLocalId(step.localId);
    setStepEditor(toStepEditor(step));
    setStepDialogOpen(true);
  };

  const removeStep = (localId: string) => {
    setForm((current) => ({
      ...current,
      steps: current.steps.filter((step) => step.localId !== localId),
    }));
  };

  const saveStep = () => {
    if (!stepEditor.stepCode.trim() || !stepEditor.stepName.trim()) {
      setError("Step code and step name are required.");
      return;
    }
    if (!stepEditor.workCenterId) {
      setError("Work center is required for each step.");
      return;
    }
    if (!Number.isInteger(stepEditor.stepSequence) || stepEditor.stepSequence <= 0) {
      setError("Step sequence must be a positive integer.");
      return;
    }

    const checklistTemplateId = parseOptionalInteger(stepEditor.checklistTemplateIdText);
    if (Number.isNaN(checklistTemplateId) || (checklistTemplateId != null && checklistTemplateId <= 0)) {
      setError("Checklist Template Id must be a positive whole number when provided.");
      return;
    }

    const slaMinutes = parseOptionalInteger(stepEditor.slaMinutesText);
    if (Number.isNaN(slaMinutes) || (slaMinutes != null && slaMinutes <= 0)) {
      setError("SLA Minutes must be a positive whole number when provided.");
      return;
    }

    setError(null);
    const updatedStep: StepFormState = {
      localId: stepEditingLocalId ?? createLocalId(),
      stepSequence: stepEditor.stepSequence,
      stepCode: stepEditor.stepCode,
      stepName: stepEditor.stepName,
      workCenterId: stepEditor.workCenterId,
      isRequired: stepEditor.isRequired,
      dataCaptureMode: stepEditor.dataCaptureMode,
      timeCaptureMode: stepEditor.timeCaptureMode,
      requiresScan: stepEditor.requiresScan,
      requiresUsageEntry: stepEditor.requiresUsageEntry,
      requiresScrapEntry: stepEditor.requiresScrapEntry,
      requiresSerialCapture: stepEditor.requiresSerialCapture,
      requiresChecklistCompletion: stepEditor.requiresChecklistCompletion,
      checklistTemplateId,
      checklistFailurePolicy: stepEditor.checklistFailurePolicy,
      requireScrapReasonWhenBad: stepEditor.requireScrapReasonWhenBad,
      requiresTrailerCapture: stepEditor.requiresTrailerCapture,
      requiresSerialLoadVerification: stepEditor.requiresSerialLoadVerification,
      generatePackingSlipOnComplete: stepEditor.generatePackingSlipOnComplete,
      generateBolOnComplete: stepEditor.generateBolOnComplete,
      requiresAttachment: stepEditor.requiresAttachment,
      requiresSupervisorApproval: stepEditor.requiresSupervisorApproval,
      autoQueueNextStep: stepEditor.autoQueueNextStep,
      slaMinutes,
    };

    setForm((current) => {
      const duplicateSequence = current.steps.some(
        (step) => step.stepSequence === updatedStep.stepSequence && step.localId !== updatedStep.localId
      );
      if (duplicateSequence) {
        setError("Step sequence must be unique within the template.");
        return current;
      }

      if (!stepEditingLocalId) {
        return { ...current, steps: [...current.steps, updatedStep].sort((a, b) => a.stepSequence - b.stepSequence) };
      }

      return {
        ...current,
        steps: current.steps
          .map((step) => (step.localId === stepEditingLocalId ? updatedStep : step))
          .sort((a, b) => a.stepSequence - b.stepSequence),
      };
    });

    setStepDialogOpen(false);
  };

  const saveTemplate = async () => {
    if (!form.routeTemplateCode.trim() || !form.routeTemplateName.trim()) {
      setError("Route template code and name are required.");
      return;
    }
    const versionNo = Number(form.versionNo);
    if (!Number.isInteger(versionNo) || versionNo <= 0) {
      setError("Version must be a positive whole number.");
      return;
    }
    if (form.steps.length === 0) {
      setError("At least one step is required.");
      return;
    }
    if (!isNew && (!parsedTemplateId || !Number.isInteger(parsedTemplateId))) {
      setError("Invalid route template id.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        routeTemplateCode: form.routeTemplateCode.trim(),
        routeTemplateName: form.routeTemplateName.trim(),
        description: form.description.trim() || null,
        isActive: form.isActive,
        versionNo,
        steps: form.steps
          .slice()
          .sort((a, b) => a.stepSequence - b.stepSequence)
          .map((step) => ({
            stepSequence: step.stepSequence,
            stepCode: step.stepCode.trim(),
            stepName: step.stepName.trim(),
            workCenterId: step.workCenterId,
            isRequired: step.isRequired,
            dataCaptureMode: step.dataCaptureMode,
            timeCaptureMode: step.timeCaptureMode,
            requiresScan: step.requiresScan,
            requiresUsageEntry: step.requiresUsageEntry,
            requiresScrapEntry: step.requiresScrapEntry,
            requiresSerialCapture: step.requiresSerialCapture,
            requiresChecklistCompletion: step.requiresChecklistCompletion,
            checklistTemplateId: step.checklistTemplateId,
            checklistFailurePolicy: step.checklistFailurePolicy,
            requireScrapReasonWhenBad: step.requireScrapReasonWhenBad,
            requiresTrailerCapture: step.requiresTrailerCapture,
            requiresSerialLoadVerification: step.requiresSerialLoadVerification,
            generatePackingSlipOnComplete: step.generatePackingSlipOnComplete,
            generateBolOnComplete: step.generateBolOnComplete,
            requiresAttachment: step.requiresAttachment,
            requiresSupervisorApproval: step.requiresSupervisorApproval,
            autoQueueNextStep: step.autoQueueNextStep,
            slaMinutes: step.slaMinutes,
          })),
      };

      if (isNew) {
        await setupApi.createRouteTemplate(payload);
      } else {
        await setupApi.updateRouteTemplate(parsedTemplateId!, payload);
      }

      navigate("/setup/route-templates");
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to save route template.");
    } finally {
      setSaving(false);
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
          <Title1 style={{ color: "#ffffff" }}>{pageTitle}</Title1>
          <div className={styles.headerActions}>
            <Button appearance="secondary" onClick={() => navigate("/setup/route-templates")}>
              Back to Route Templates
            </Button>
            <Button appearance="secondary" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button appearance="primary" disabled={saving || loading} onClick={() => void saveTemplate()}>
              {saving ? "Saving..." : "Save Route Template"}
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

            <Card className={styles.card}>
              {loading ? (
                <Body1>Loading...</Body1>
              ) : (
                <div className={styles.form}>
                  <div className={styles.sectionTitle}>Template Details</div>
                  <div className={styles.formRow}>
                    <Field label="Route Template Code" required>
                      <Input
                        value={form.routeTemplateCode}
                        onChange={(_, data) =>
                          setForm((current) => ({ ...current, routeTemplateCode: data.value }))
                        }
                      />
                    </Field>
                    <Field label="Route Template Name" required>
                      <Input
                        value={form.routeTemplateName}
                        onChange={(_, data) =>
                          setForm((current) => ({ ...current, routeTemplateName: data.value }))
                        }
                      />
                    </Field>
                  </div>
                  <div className={styles.formRow}>
                    <Field label="Description">
                      <Input
                        value={form.description}
                        onChange={(_, data) =>
                          setForm((current) => ({ ...current, description: data.value }))
                        }
                      />
                    </Field>
                    <Field label="Version No" required>
                      <Input
                        type="number"
                        min={1}
                        value={form.versionNo}
                        onChange={(_, data) =>
                          setForm((current) => ({ ...current, versionNo: data.value }))
                        }
                      />
                    </Field>
                  </div>
                  <Checkbox
                    label="Active"
                    checked={form.isActive}
                    onChange={(_, data) =>
                      setForm((current) => ({ ...current, isActive: Boolean(data.checked) }))
                    }
                  />
                </div>
              )}
            </Card>

            {!loading ? (
              <Card className={styles.card}>
                <div className={styles.sectionTitle}>Route Steps</div>
                <div className={styles.form}>
                  <div className={styles.sectionHeader}>
                    <Button appearance="secondary" onClick={openCreateStep}>
                      Add Step
                    </Button>
                  </div>

                  <div className={styles.stepsTableWrap}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>Seq</TableHeaderCell>
                          <TableHeaderCell>Code</TableHeaderCell>
                          <TableHeaderCell>Name</TableHeaderCell>
                          <TableHeaderCell>Work Center</TableHeaderCell>
                          <TableHeaderCell>Required</TableHeaderCell>
                          <TableHeaderCell>Actions</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {form.steps
                          .slice()
                          .sort((a, b) => a.stepSequence - b.stepSequence)
                          .map((step) => (
                            <TableRow key={step.localId}>
                              <TableCell>{step.stepSequence}</TableCell>
                              <TableCell>{step.stepCode}</TableCell>
                              <TableCell>{step.stepName}</TableCell>
                              <TableCell>{workCenterLabelById.get(step.workCenterId) ?? step.workCenterId}</TableCell>
                              <TableCell>{step.isRequired ? "Yes" : "No"}</TableCell>
                              <TableCell>
                                <div className={styles.actions}>
                                  <Button appearance="secondary" onClick={() => openEditStep(step)}>
                                    Edit
                                  </Button>
                                  <Button appearance="secondary" onClick={() => removeStep(step.localId)}>
                                    Remove
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        {form.steps.length === 0 ? (
                          <TableRow>
                            <TableCell>-</TableCell>
                            <TableCell>No steps added.</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>-</TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        </section>
      </main>

      <Dialog open={stepDialogOpen} onOpenChange={(_, data) => setStepDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{stepEditingLocalId ? "Edit Step" : "Add Step"}</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <div className={styles.formRow}>
                  <Field label="Step Sequence" required>
                    <Input
                      type="number"
                      min={1}
                      value={String(stepEditor.stepSequence)}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          stepSequence: Number(data.value || "0"),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Work Center" required>
                    <Dropdown
                      value={
                        stepEditor.workCenterId
                          ? workCenterLabelById.get(stepEditor.workCenterId) ?? ""
                          : ""
                      }
                      selectedOptions={stepEditor.workCenterId ? [String(stepEditor.workCenterId)] : []}
                      onOptionSelect={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          workCenterId: Number(data.optionValue ?? "0"),
                        }))
                      }
                    >
                      {workCenters.map((center) => (
                        <Option
                          key={center.id}
                          value={String(center.id)}
                          text={`${center.workCenterCode} - ${center.workCenterName}`}
                        >
                          {center.workCenterCode} - {center.workCenterName}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="Step Code" required>
                    <Input
                      value={stepEditor.stepCode}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({ ...current, stepCode: data.value }))
                      }
                    />
                  </Field>
                  <Field label="Step Name" required>
                    <Input
                      value={stepEditor.stepName}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({ ...current, stepName: data.value }))
                      }
                    />
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="Data Capture Mode" required>
                    <Dropdown
                      value={stepEditor.dataCaptureMode}
                      selectedOptions={[stepEditor.dataCaptureMode]}
                      onOptionSelect={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          dataCaptureMode: (data.optionValue as DataCaptureMode) ?? "ElectronicRequired",
                        }))
                      }
                    >
                      <Option value="ElectronicRequired">ElectronicRequired</Option>
                      <Option value="ElectronicOptional">ElectronicOptional</Option>
                      <Option value="PaperOnly">PaperOnly</Option>
                    </Dropdown>
                  </Field>
                  <Field label="Time Capture Mode" required>
                    <Dropdown
                      value={stepEditor.timeCaptureMode}
                      selectedOptions={[stepEditor.timeCaptureMode]}
                      onOptionSelect={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          timeCaptureMode: (data.optionValue as TimeCaptureMode) ?? "Automated",
                        }))
                      }
                    >
                      <Option value="Automated">Automated</Option>
                      <Option value="Manual">Manual</Option>
                      <Option value="Hybrid">Hybrid</Option>
                    </Dropdown>
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="Checklist Failure Policy" required>
                    <Dropdown
                      value={stepEditor.checklistFailurePolicy}
                      selectedOptions={[stepEditor.checklistFailurePolicy]}
                      onOptionSelect={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          checklistFailurePolicy:
                            (data.optionValue as ChecklistFailurePolicy) ?? "BlockCompletion",
                        }))
                      }
                    >
                      <Option value="BlockCompletion">BlockCompletion</Option>
                      <Option value="AllowWithSupervisorOverride">AllowWithSupervisorOverride</Option>
                    </Dropdown>
                  </Field>
                  <Field label="Checklist Template Id">
                    <Input
                      type="number"
                      min={1}
                      value={stepEditor.checklistTemplateIdText}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({ ...current, checklistTemplateIdText: data.value }))
                      }
                    />
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="SLA Minutes">
                    <Input
                      type="number"
                      min={1}
                      value={stepEditor.slaMinutesText}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({ ...current, slaMinutesText: data.value }))
                      }
                    />
                  </Field>
                  <Field label="Required">
                    <Checkbox
                      label="Is Required"
                      checked={stepEditor.isRequired}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({ ...current, isRequired: Boolean(data.checked) }))
                      }
                    />
                  </Field>
                </div>
                <Field label="Step Flags">
                  <div className={styles.checkboxGrid}>
                    <Checkbox
                      label="Requires Scan"
                      checked={stepEditor.requiresScan}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({ ...current, requiresScan: Boolean(data.checked) }))
                      }
                    />
                    <Checkbox
                      label="Requires Usage Entry"
                      checked={stepEditor.requiresUsageEntry}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({ ...current, requiresUsageEntry: Boolean(data.checked) }))
                      }
                    />
                    <Checkbox
                      label="Requires Scrap Entry"
                      checked={stepEditor.requiresScrapEntry}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({ ...current, requiresScrapEntry: Boolean(data.checked) }))
                      }
                    />
                    <Checkbox
                      label="Requires Serial Capture"
                      checked={stepEditor.requiresSerialCapture}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({ ...current, requiresSerialCapture: Boolean(data.checked) }))
                      }
                    />
                    <Checkbox
                      label="Requires Checklist Completion"
                      checked={stepEditor.requiresChecklistCompletion}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          requiresChecklistCompletion: Boolean(data.checked),
                        }))
                      }
                    />
                    <Checkbox
                      label="Require Scrap Reason When Bad"
                      checked={stepEditor.requireScrapReasonWhenBad}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          requireScrapReasonWhenBad: Boolean(data.checked),
                        }))
                      }
                    />
                    <Checkbox
                      label="Requires Trailer Capture"
                      checked={stepEditor.requiresTrailerCapture}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({ ...current, requiresTrailerCapture: Boolean(data.checked) }))
                      }
                    />
                    <Checkbox
                      label="Requires Serial Load Verification"
                      checked={stepEditor.requiresSerialLoadVerification}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          requiresSerialLoadVerification: Boolean(data.checked),
                        }))
                      }
                    />
                    <Checkbox
                      label="Generate Packing Slip On Complete"
                      checked={stepEditor.generatePackingSlipOnComplete}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          generatePackingSlipOnComplete: Boolean(data.checked),
                        }))
                      }
                    />
                    <Checkbox
                      label="Generate BOL On Complete"
                      checked={stepEditor.generateBolOnComplete}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          generateBolOnComplete: Boolean(data.checked),
                        }))
                      }
                    />
                    <Checkbox
                      label="Requires Attachment"
                      checked={stepEditor.requiresAttachment}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({ ...current, requiresAttachment: Boolean(data.checked) }))
                      }
                    />
                    <Checkbox
                      label="Requires Supervisor Approval"
                      checked={stepEditor.requiresSupervisorApproval}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          requiresSupervisorApproval: Boolean(data.checked),
                        }))
                      }
                    />
                    <Checkbox
                      label="Auto Queue Next Step"
                      checked={stepEditor.autoQueueNextStep}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({ ...current, autoQueueNextStep: Boolean(data.checked) }))
                      }
                    />
                  </div>
                </Field>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setStepDialogOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={saveStep}>
                Save Step
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
