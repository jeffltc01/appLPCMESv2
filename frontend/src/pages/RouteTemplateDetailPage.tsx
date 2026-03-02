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
  Select,
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
import { itemLookupsApi } from "../services/items";
import { orderLookupsApi } from "../services/orders";
import { setupApi } from "../services/setup";
import type { Lookup } from "../types/customer";
import type { OrderItemLookup } from "../types/order";
import type {
  RouteTemplateAssignment,
  RouteTemplateAssignmentUpsert,
  RouteTemplateDetail,
  RouteTemplateStep,
  RouteTemplateStepUpsert,
} from "../types/setup";

type WorkCenter = { id: number; workCenterCode: string; workCenterName: string };
type DataCaptureMode = "ElectronicRequired" | "ElectronicOptional" | "PaperOnly";
type TimeCaptureMode = "Automated" | "Manual" | "Hybrid";
type ProcessingMode = "BatchQuantity" | "SingleUnit";
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

type SupervisorGateOverrideState = "default" | "yes" | "no";

interface AssignmentFormState {
  assignmentName: string;
  priority: string;
  revisionNo: string;
  isActive: boolean;
  customerIdText: string;
  siteIdText: string;
  itemIdText: string;
  itemType: string;
  orderPriorityMinText: string;
  orderPriorityMaxText: string;
  pickUpViaIdText: string;
  shipToViaIdText: string;
  supervisorGateOverride: SupervisorGateOverrideState;
  effectiveFromUtcText: string;
  effectiveToUtcText: string;
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
  assignmentHint: {
    color: tokens.colorNeutralForeground2,
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
  processingModeOverride: null,
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

const EMPTY_ASSIGNMENT_FORM: AssignmentFormState = {
  assignmentName: "",
  priority: "1000",
  revisionNo: "1",
  isActive: true,
  customerIdText: "__any",
  siteIdText: "__any",
  itemIdText: "__any",
  itemType: "__any",
  orderPriorityMinText: "__any",
  orderPriorityMaxText: "__any",
  pickUpViaIdText: "__any",
  shipToViaIdText: "__any",
  supervisorGateOverride: "default",
  effectiveFromUtcText: "",
  effectiveToUtcText: "",
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
    processingModeOverride: step.processingModeOverride,
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

function resolveDropdownValue(data: { optionValue?: string; optionText?: string }): string | undefined {
  return data.optionValue ?? data.optionText;
}

function toAssignmentForm(assignment: RouteTemplateAssignment): AssignmentFormState {
  return {
    assignmentName: assignment.assignmentName,
    priority: String(assignment.priority),
    revisionNo: String(assignment.revisionNo),
    isActive: assignment.isActive,
    customerIdText: assignment.customerId != null ? String(assignment.customerId) : "__any",
    siteIdText: assignment.siteId != null ? String(assignment.siteId) : "__any",
    itemIdText: assignment.itemId != null ? String(assignment.itemId) : "__any",
    itemType: assignment.itemType ?? "__any",
    orderPriorityMinText: assignment.orderPriorityMin != null ? String(assignment.orderPriorityMin) : "__any",
    orderPriorityMaxText: assignment.orderPriorityMax != null ? String(assignment.orderPriorityMax) : "__any",
    pickUpViaIdText: assignment.pickUpViaId != null ? String(assignment.pickUpViaId) : "__any",
    shipToViaIdText: assignment.shipToViaId != null ? String(assignment.shipToViaId) : "__any",
    supervisorGateOverride:
      assignment.supervisorGateOverride == null ? "default" : assignment.supervisorGateOverride ? "yes" : "no",
    effectiveFromUtcText: assignment.effectiveFromUtc ? assignment.effectiveFromUtc.slice(0, 16) : "",
    effectiveToUtcText: assignment.effectiveToUtc ? assignment.effectiveToUtc.slice(0, 16) : "",
  };
}

function parseOptionalUtcTimestamp(value: string): string | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function buildAssignmentScope(assignment: RouteTemplateAssignment): string {
  const parts: string[] = [];
  if (assignment.customerId != null) parts.push(`Customer ${assignment.customerId}`);
  if (assignment.siteId != null) parts.push(`Site ${assignment.siteId}`);
  if (assignment.itemId != null) parts.push(`Item ${assignment.itemId}`);
  if (assignment.itemType) parts.push(`Item Type ${assignment.itemType}`);
  return parts.length > 0 ? parts.join(", ") : "Global Default";
}

const ANY_OPTION_VALUE = "__any";
const PRIORITY_OPTIONS = Array.from({ length: 10 }, (_, index) => String(index + 1));

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
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignments, setAssignments] = useState<RouteTemplateAssignment[]>([]);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignmentEditingId, setAssignmentEditingId] = useState<number | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormState>(EMPTY_ASSIGNMENT_FORM);
  const [customers, setCustomers] = useState<Lookup[]>([]);
  const [sites, setSites] = useState<Lookup[]>([]);
  const [shipVias, setShipVias] = useState<Lookup[]>([]);
  const [items, setItems] = useState<OrderItemLookup[]>([]);
  const [itemTypes, setItemTypes] = useState<string[]>([]);

  const pageTitle = isNew ? "Add Route Template" : "Edit Route Template";
  const parsedTemplateId = !isNew && templateId ? Number(templateId) : null;

  const workCenterLabelById = useMemo(
    () => new Map(workCenters.map((w) => [w.id, `${w.workCenterCode} - ${w.workCenterName}`])),
    [workCenters]
  );
  const customerLabelById = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers]);
  const siteLabelById = useMemo(() => new Map(sites.map((site) => [site.id, site.name])), [sites]);
  const shipViaLabelById = useMemo(() => new Map(shipVias.map((via) => [via.id, via.name])), [shipVias]);
  const itemLabelById = useMemo(
    () => new Map(items.map((item) => [item.id, `${item.itemNo}${item.itemDescription ? ` - ${item.itemDescription}` : ""}`])),
    [items]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [centers, loadedCustomers, loadedSites, loadedShipVias, loadedItems, loadedItemTypes] =
          await Promise.all([
            setupApi.listWorkCenters(),
            orderLookupsApi.activeCustomers(),
            orderLookupsApi.sites(),
            orderLookupsApi.shipVias(),
            orderLookupsApi.items(),
            itemLookupsApi.itemTypes(),
          ]);
        setWorkCenters(
          centers.map((center) => ({
            id: center.id,
            workCenterCode: center.workCenterCode,
            workCenterName: center.workCenterName,
          }))
        );
        setCustomers(loadedCustomers);
        setSites(loadedSites);
        setShipVias(loadedShipVias);
        setItems(loadedItems);
        setItemTypes(loadedItemTypes);

        if (!isNew) {
          if (!parsedTemplateId || !Number.isInteger(parsedTemplateId) || parsedTemplateId <= 0) {
            setError("Invalid route template id.");
            return;
          }
          const [detail, allAssignments]: [RouteTemplateDetail, RouteTemplateAssignment[]] = await Promise.all([
            setupApi.getRouteTemplate(parsedTemplateId),
            setupApi.listAssignments(),
          ]);
          setForm({
            routeTemplateCode: detail.routeTemplateCode,
            routeTemplateName: detail.routeTemplateName,
            description: detail.description ?? "",
            isActive: detail.isActive,
            versionNo: String(detail.versionNo),
            steps: detail.steps.map(toStepForm),
          });
          setAssignments(allAssignments.filter((assignment) => assignment.routeTemplateId === parsedTemplateId));
        } else {
          setForm(EMPTY_TEMPLATE_FORM);
          setAssignments([]);
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
      processingModeOverride: stepEditor.processingModeOverride,
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
            processingModeOverride: step.processingModeOverride,
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

  const openCreateAssignment = () => {
    setAssignmentEditingId(null);
    setAssignmentForm(EMPTY_ASSIGNMENT_FORM);
    setAssignmentDialogOpen(true);
  };

  const openEditAssignment = (assignment: RouteTemplateAssignment) => {
    setAssignmentEditingId(assignment.id);
    setAssignmentForm(toAssignmentForm(assignment));
    setAssignmentDialogOpen(true);
  };

  const saveAssignment = async () => {
    if (!parsedTemplateId || !Number.isInteger(parsedTemplateId) || parsedTemplateId <= 0) {
      setError("Save the route template before creating assignment rules.");
      return;
    }
    if (!assignmentForm.assignmentName.trim()) {
      setError("Assignment name is required.");
      return;
    }

    const priority = Number(assignmentForm.priority);
    if (!Number.isInteger(priority) || priority <= 0) {
      setError("Priority must be a positive whole number.");
      return;
    }

    const revisionNo = Number(assignmentForm.revisionNo);
    if (!Number.isInteger(revisionNo) || revisionNo <= 0) {
      setError("Revision must be a positive whole number.");
      return;
    }

    const customerId =
      assignmentForm.customerIdText === ANY_OPTION_VALUE ? null : Number(assignmentForm.customerIdText);
    const siteId = assignmentForm.siteIdText === ANY_OPTION_VALUE ? null : Number(assignmentForm.siteIdText);
    const itemId = assignmentForm.itemIdText === ANY_OPTION_VALUE ? null : Number(assignmentForm.itemIdText);
    const orderPriorityMin =
      assignmentForm.orderPriorityMinText === ANY_OPTION_VALUE ? null : Number(assignmentForm.orderPriorityMinText);
    const orderPriorityMax =
      assignmentForm.orderPriorityMaxText === ANY_OPTION_VALUE ? null : Number(assignmentForm.orderPriorityMaxText);
    const pickUpViaId =
      assignmentForm.pickUpViaIdText === ANY_OPTION_VALUE ? null : Number(assignmentForm.pickUpViaIdText);
    const shipToViaId =
      assignmentForm.shipToViaIdText === ANY_OPTION_VALUE ? null : Number(assignmentForm.shipToViaIdText);

    const numericFields = [
      customerId,
      siteId,
      itemId,
      orderPriorityMin,
      orderPriorityMax,
      pickUpViaId,
      shipToViaId,
    ];
    if (numericFields.some((value) => Number.isNaN(value) || (value != null && value <= 0))) {
      setError("Optional numeric assignment fields must be positive whole numbers.");
      return;
    }

    const effectiveFromUtc = parseOptionalUtcTimestamp(assignmentForm.effectiveFromUtcText);
    const effectiveToUtc = parseOptionalUtcTimestamp(assignmentForm.effectiveToUtcText);
    if (effectiveFromUtc === undefined || effectiveToUtc === undefined) {
      setError("Effective dates must be valid date/time values.");
      return;
    }

    const payload: RouteTemplateAssignmentUpsert = {
      assignmentName: assignmentForm.assignmentName.trim(),
      priority,
      revisionNo,
      isActive: assignmentForm.isActive,
      customerId,
      siteId,
      itemId,
      itemType: assignmentForm.itemType === ANY_OPTION_VALUE ? null : assignmentForm.itemType.trim(),
      orderPriorityMin,
      orderPriorityMax,
      pickUpViaId,
      shipToViaId,
      routeTemplateId: parsedTemplateId,
      supervisorGateOverride:
        assignmentForm.supervisorGateOverride === "default"
          ? null
          : assignmentForm.supervisorGateOverride === "yes",
      effectiveFromUtc,
      effectiveToUtc,
    };

    setAssignmentSaving(true);
    setError(null);
    try {
      if (assignmentEditingId) {
        await setupApi.updateAssignment(assignmentEditingId, payload);
      } else {
        await setupApi.createAssignment(payload);
      }

      const refreshed = await setupApi.listAssignments();
      setAssignments(refreshed.filter((assignment) => assignment.routeTemplateId === parsedTemplateId));
      setAssignmentDialogOpen(false);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to save assignment rule.");
    } finally {
      setAssignmentSaving(false);
    }
  };

  const removeAssignment = async (assignmentId: number) => {
    if (!parsedTemplateId || !Number.isInteger(parsedTemplateId) || parsedTemplateId <= 0) {
      setError("Invalid route template id.");
      return;
    }

    setAssignmentSaving(true);
    setError(null);
    try {
      await setupApi.deleteAssignment(assignmentId);
      const refreshed = await setupApi.listAssignments();
      setAssignments(refreshed.filter((assignment) => assignment.routeTemplateId === parsedTemplateId));
    } catch {
      setError("Failed to remove assignment rule.");
    } finally {
      setAssignmentSaving(false);
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

            {!loading ? (
              <Card className={styles.card}>
                <div className={styles.sectionTitle}>Applies To (Assignment Rules)</div>
                {isNew ? (
                  <Body1 className={styles.assignmentHint}>
                    Save this route template first, then add assignment rules to control where it applies.
                  </Body1>
                ) : (
                  <div className={styles.form}>
                    <div className={styles.sectionHeader}>
                      <Body1>Define customer/site/item matching for this template.</Body1>
                      <Button appearance="secondary" onClick={openCreateAssignment} disabled={assignmentSaving}>
                        Add Assignment Rule
                      </Button>
                    </div>
                    <div className={styles.stepsTableWrap}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Name</TableHeaderCell>
                            <TableHeaderCell>Scope</TableHeaderCell>
                            <TableHeaderCell>Priority</TableHeaderCell>
                            <TableHeaderCell>Revision</TableHeaderCell>
                            <TableHeaderCell>Active</TableHeaderCell>
                            <TableHeaderCell>Actions</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignments.map((assignment) => (
                            <TableRow key={assignment.id}>
                              <TableCell>{assignment.assignmentName}</TableCell>
                              <TableCell>{buildAssignmentScope(assignment)}</TableCell>
                              <TableCell>{assignment.priority}</TableCell>
                              <TableCell>{assignment.revisionNo}</TableCell>
                              <TableCell>{assignment.isActive ? "Yes" : "No"}</TableCell>
                              <TableCell>
                                <div className={styles.actions}>
                                  <Button appearance="secondary" onClick={() => openEditAssignment(assignment)}>
                                    Edit
                                  </Button>
                                  <Button
                                    appearance="secondary"
                                    onClick={() => void removeAssignment(assignment.id)}
                                    disabled={assignmentSaving}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {assignments.length === 0 ? (
                            <TableRow>
                              <TableCell>-</TableCell>
                              <TableCell>No assignment rules configured.</TableCell>
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
                )}
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
                          dataCaptureMode:
                            (resolveDropdownValue(data) as DataCaptureMode | undefined) ?? current.dataCaptureMode,
                        }))
                      }
                    >
                      <Option value="ElectronicRequired">ElectronicRequired</Option>
                      <Option value="ElectronicOptional">ElectronicOptional</Option>
                      <Option value="PaperOnly">PaperOnly</Option>
                    </Dropdown>
                  </Field>
                  <Field label="Time Capture Mode" required>
                    <Select
                      value={stepEditor.timeCaptureMode}
                      onChange={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          timeCaptureMode: (data.value as TimeCaptureMode) ?? current.timeCaptureMode,
                        }))
                      }
                    >
                      <option value="Automated">Automated</option>
                      <option value="Manual">Manual</option>
                      <option value="Hybrid">Hybrid</option>
                    </Select>
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="Processing Mode Override">
                    <Dropdown
                      value={stepEditor.processingModeOverride ?? "Work Center Default"}
                      selectedOptions={[stepEditor.processingModeOverride ?? "__default"]}
                      onOptionSelect={(_, data) =>
                        setStepEditor((current) => ({
                          ...current,
                          processingModeOverride:
                            resolveDropdownValue(data) === "__default"
                              ? null
                              : ((resolveDropdownValue(data) as ProcessingMode | undefined) ??
                                current.processingModeOverride),
                        }))
                      }
                    >
                      <Option value="__default">Work Center Default</Option>
                      <Option value="BatchQuantity">BatchQuantity</Option>
                      <Option value="SingleUnit">SingleUnit</Option>
                    </Dropdown>
                  </Field>
                  <div />
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
                            (resolveDropdownValue(data) as ChecklistFailurePolicy | undefined) ??
                            current.checklistFailurePolicy,
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

      <Dialog open={assignmentDialogOpen} onOpenChange={(_, data) => setAssignmentDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{assignmentEditingId ? "Edit Assignment Rule" : "Add Assignment Rule"}</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <div className={styles.formRow}>
                  <Field label="Assignment Name" required>
                    <Input
                      value={assignmentForm.assignmentName}
                      onChange={(_, data) =>
                        setAssignmentForm((current) => ({ ...current, assignmentName: data.value }))
                      }
                    />
                  </Field>
                  <Field label="Item Type">
                    <Dropdown
                      value={
                        assignmentForm.itemType === ANY_OPTION_VALUE
                          ? "Any Item Type"
                          : assignmentForm.itemType
                      }
                      selectedOptions={[assignmentForm.itemType]}
                      onOptionSelect={(_, data) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          itemType: data.optionValue ?? ANY_OPTION_VALUE,
                        }))
                      }
                    >
                      <Option value={ANY_OPTION_VALUE}>Any Item Type</Option>
                      {itemTypes.map((itemType) => (
                        <Option key={itemType} value={itemType}>
                          {itemType}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="Priority" required>
                    <Input
                      type="number"
                      min={1}
                      value={assignmentForm.priority}
                      onChange={(_, data) => setAssignmentForm((current) => ({ ...current, priority: data.value }))}
                    />
                  </Field>
                  <Field label="Revision No" required>
                    <Input
                      type="number"
                      min={1}
                      value={assignmentForm.revisionNo}
                      onChange={(_, data) =>
                        setAssignmentForm((current) => ({ ...current, revisionNo: data.value }))
                      }
                    />
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="Customer">
                    <Dropdown
                      value={
                        assignmentForm.customerIdText === ANY_OPTION_VALUE
                          ? "Any Customer"
                          : customerLabelById.get(Number(assignmentForm.customerIdText)) ?? "Any Customer"
                      }
                      selectedOptions={[assignmentForm.customerIdText]}
                      onOptionSelect={(_, data) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          customerIdText: data.optionValue ?? ANY_OPTION_VALUE,
                        }))
                      }
                    >
                      <Option value={ANY_OPTION_VALUE}>Any Customer</Option>
                      {customers.map((customer) => (
                        <Option key={customer.id} value={String(customer.id)}>
                          {customer.name}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Site">
                    <Dropdown
                      value={
                        assignmentForm.siteIdText === ANY_OPTION_VALUE
                          ? "Any Site"
                          : siteLabelById.get(Number(assignmentForm.siteIdText)) ?? "Any Site"
                      }
                      selectedOptions={[assignmentForm.siteIdText]}
                      onOptionSelect={(_, data) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          siteIdText: data.optionValue ?? ANY_OPTION_VALUE,
                        }))
                      }
                    >
                      <Option value={ANY_OPTION_VALUE}>Any Site</Option>
                      {sites.map((site) => (
                        <Option key={site.id} value={String(site.id)}>
                          {site.name}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="Item">
                    <Dropdown
                      value={
                        assignmentForm.itemIdText === ANY_OPTION_VALUE
                          ? "Any Item"
                          : itemLabelById.get(Number(assignmentForm.itemIdText)) ?? "Any Item"
                      }
                      selectedOptions={[assignmentForm.itemIdText]}
                      onOptionSelect={(_, data) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          itemIdText: data.optionValue ?? ANY_OPTION_VALUE,
                        }))
                      }
                    >
                      <Option value={ANY_OPTION_VALUE}>Any Item</Option>
                      {items.map((item) => {
                        const label = `${item.itemNo}${item.itemDescription ? ` - ${item.itemDescription}` : ""}`;
                        return (
                          <Option key={item.id} value={String(item.id)} text={label}>
                            {label}
                          </Option>
                        );
                      })}
                    </Dropdown>
                  </Field>
                  <Field label="Supervisor Gate Override">
                    <Dropdown
                      value={
                        assignmentForm.supervisorGateOverride === "default"
                          ? "Template Default"
                          : assignmentForm.supervisorGateOverride === "yes"
                          ? "Yes"
                          : "No"
                      }
                      selectedOptions={[assignmentForm.supervisorGateOverride]}
                      onOptionSelect={(_, data) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          supervisorGateOverride:
                            (data.optionValue as SupervisorGateOverrideState) ?? "default",
                        }))
                      }
                    >
                      <Option value="default">Template Default</Option>
                      <Option value="yes">Yes</Option>
                      <Option value="no">No</Option>
                    </Dropdown>
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="Order Priority Min">
                    <Dropdown
                      value={
                        assignmentForm.orderPriorityMinText === ANY_OPTION_VALUE
                          ? "Any Minimum"
                          : assignmentForm.orderPriorityMinText
                      }
                      selectedOptions={[assignmentForm.orderPriorityMinText]}
                      onOptionSelect={(_, data) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          orderPriorityMinText: data.optionValue ?? ANY_OPTION_VALUE,
                        }))
                      }
                    >
                      <Option value={ANY_OPTION_VALUE}>Any Minimum</Option>
                      {PRIORITY_OPTIONS.map((priority) => (
                        <Option key={`min-priority-${priority}`} value={priority}>
                          {priority}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Order Priority Max">
                    <Dropdown
                      value={
                        assignmentForm.orderPriorityMaxText === ANY_OPTION_VALUE
                          ? "Any Maximum"
                          : assignmentForm.orderPriorityMaxText
                      }
                      selectedOptions={[assignmentForm.orderPriorityMaxText]}
                      onOptionSelect={(_, data) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          orderPriorityMaxText: data.optionValue ?? ANY_OPTION_VALUE,
                        }))
                      }
                    >
                      <Option value={ANY_OPTION_VALUE}>Any Maximum</Option>
                      {PRIORITY_OPTIONS.map((priority) => (
                        <Option key={`max-priority-${priority}`} value={priority}>
                          {priority}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="Pick Up Via">
                    <Dropdown
                      value={
                        assignmentForm.pickUpViaIdText === ANY_OPTION_VALUE
                          ? "Any Pick Up Via"
                          : shipViaLabelById.get(Number(assignmentForm.pickUpViaIdText)) ?? "Any Pick Up Via"
                      }
                      selectedOptions={[assignmentForm.pickUpViaIdText]}
                      onOptionSelect={(_, data) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          pickUpViaIdText: data.optionValue ?? ANY_OPTION_VALUE,
                        }))
                      }
                    >
                      <Option value={ANY_OPTION_VALUE}>Any Pick Up Via</Option>
                      {shipVias.map((shipVia) => (
                        <Option key={shipVia.id} value={String(shipVia.id)}>
                          {shipVia.name}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Ship To Via">
                    <Dropdown
                      value={
                        assignmentForm.shipToViaIdText === ANY_OPTION_VALUE
                          ? "Any Ship To Via"
                          : shipViaLabelById.get(Number(assignmentForm.shipToViaIdText)) ?? "Any Ship To Via"
                      }
                      selectedOptions={[assignmentForm.shipToViaIdText]}
                      onOptionSelect={(_, data) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          shipToViaIdText: data.optionValue ?? ANY_OPTION_VALUE,
                        }))
                      }
                    >
                      <Option value={ANY_OPTION_VALUE}>Any Ship To Via</Option>
                      {shipVias.map((shipVia) => (
                        <Option key={shipVia.id} value={String(shipVia.id)}>
                          {shipVia.name}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="Effective From (UTC)">
                    <Input
                      type="datetime-local"
                      value={assignmentForm.effectiveFromUtcText}
                      onChange={(_, data) =>
                        setAssignmentForm((current) => ({ ...current, effectiveFromUtcText: data.value }))
                      }
                    />
                  </Field>
                  <Field label="Effective To (UTC)">
                    <Input
                      type="datetime-local"
                      value={assignmentForm.effectiveToUtcText}
                      onChange={(_, data) =>
                        setAssignmentForm((current) => ({ ...current, effectiveToUtcText: data.value }))
                      }
                    />
                  </Field>
                </div>
                <Checkbox
                  label="Active"
                  checked={assignmentForm.isActive}
                  onChange={(_, data) =>
                    setAssignmentForm((current) => ({ ...current, isActive: Boolean(data.checked) }))
                  }
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setAssignmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={() => void saveAssignment()} disabled={assignmentSaving}>
                {assignmentSaving ? "Saving..." : "Save Assignment Rule"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
