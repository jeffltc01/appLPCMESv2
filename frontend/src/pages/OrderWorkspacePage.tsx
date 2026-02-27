import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Badge,
  Body1,
  Button,
  Card,
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Tab,
  TabList,
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ArrowLeft24Regular } from "@fluentui/react-icons";
import { ApiError } from "../services/api";
import {
  getSuggestedWorkspaceActions,
  getWorkspaceActionState,
  getWorkspaceCurrentStatus,
  ordersApi,
} from "../services/orders";
import {
  ORDER_STATUS_METADATA,
  type HoldOverlayType,
  type OrderAttachment,
  type OrderDraftDetail,
  type OrderWorkspaceAction,
  type OrderWorkspaceRole,
} from "../types/order";

const LIFECYCLE_SEQUENCE = [
  "Draft",
  "PendingOrderEntryValidation",
  "InboundLogisticsPlanned",
  "InboundInTransit",
  "ReceivedPendingReconciliation",
  "ReadyForProduction",
  "InProduction",
  "ProductionCompletePendingApproval",
  "ProductionComplete",
  "OutboundLogisticsPlanned",
  "DispatchedOrPickupReleased",
  "InvoiceReady",
  "Invoiced",
] as const;

const ROLES: OrderWorkspaceRole[] = [
  "Office",
  "Transportation",
  "Receiving",
  "Production",
  "Supervisor",
  "Quality",
  "PlantManager",
  "Admin",
];

const ACTIONS: { key: OrderWorkspaceAction; label: string }[] = [
  { key: "advanceInboundPlan", label: "Plan Inbound" },
  { key: "advanceInboundTransit", label: "Start Inbound Transit" },
  { key: "markReceived", label: "Mark Received" },
  { key: "markReadyForProduction", label: "Ready For Production" },
  { key: "startProduction", label: "Start Production" },
  { key: "markProductionComplete", label: "Mark Production Complete" },
  { key: "planOutbound", label: "Plan Outbound" },
  { key: "markDispatchedOrReleased", label: "Release / Dispatch" },
  { key: "openInvoiceWizard", label: "Start Invoice Submit Wizard" },
  { key: "uploadAttachment", label: "Upload Attachment" },
  { key: "applyHold", label: "Apply Hold (placeholder)" },
];

const ACTION_LABELS: Record<OrderWorkspaceAction, string> = ACTIONS.reduce(
  (acc, action) => ({ ...acc, [action.key]: action.label }),
  {} as Record<OrderWorkspaceAction, string>
);

type TabValue =
  | "attachments"
  | "rework"
  | "promiseDate"
  | "auditLog"
  | "integrationEvents";

const useStyles = makeStyles({
  page: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalM },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" },
  topBarLeft: { display: "flex", alignItems: "center", gap: "12px" },
  topBarRight: { display: "flex", alignItems: "center", gap: "12px" },
  topField: { minWidth: "200px" },
  identityStrip: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    padding: "12px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  timeline: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "8px",
  },
  timelineStep: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: "8px",
    textAlign: "center",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  timelineDone: {
    border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
    backgroundColor: tokens.colorPaletteGreenBackground1,
  },
  timelineCurrent: {
    border: `1px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  body: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", alignItems: "start" },
  sectionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  fullWidth: { gridColumn: "1 / -1" },
  actionPanel: { display: "flex", flexDirection: "column", gap: "8px" },
  attachmentRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    gap: "8px",
    padding: "8px 0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  placeholder: {
    minHeight: "120px",
    padding: "12px",
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground3,
  },
});

export function OrderWorkspacePage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const [tab, setTab] = useState<TabValue>("attachments");
  const [order, setOrder] = useState<OrderDraftDetail | null>(null);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [role, setRole] = useState<OrderWorkspaceRole>("Office");
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideNote, setOverrideNote] = useState("");
  const [transitionReasonCode, setTransitionReasonCode] = useState("");
  const [transitionNote, setTransitionNote] = useState("");
  const [holdOverlayType, setHoldOverlayType] = useState<HoldOverlayType>("OnHoldCustomer");
  const [holdReasonCode, setHoldReasonCode] = useState("");
  const [holdNote, setHoldNote] = useState("");
  const [customerReadyRetryUtc, setCustomerReadyRetryUtc] = useState("");
  const [customerReadyLastContactUtc, setCustomerReadyLastContactUtc] = useState("");
  const [customerReadyContactName, setCustomerReadyContactName] = useState("");
  const [reworkLineId, setReworkLineId] = useState("");
  const [reworkStepId, setReworkStepId] = useState("");
  const [reworkReasonCode, setReworkReasonCode] = useState("");
  const [reworkEmpNo, setReworkEmpNo] = useState("UI");
  const [reworkNotes, setReworkNotes] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<OrderWorkspaceAction | null>(null);

  const loadWorkspace = useCallback(async () => {
    if (!Number.isFinite(orderId) || orderId <= 0) {
      setMessage({ type: "error", text: "Invalid order id." });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [nextOrder, nextAttachments] = await Promise.all([
        ordersApi.get(orderId),
        ordersApi.attachments(orderId),
      ]);
      setOrder(nextOrder);
      setAttachments(nextAttachments);
    } catch {
      setMessage({ type: "error", text: "Unable to load order workspace." });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const currentStatus = useMemo(
    () => getWorkspaceCurrentStatus(order?.orderLifecycleStatus ?? order?.orderStatus),
    [order]
  );

  const currentIdx = LIFECYCLE_SEQUENCE.indexOf(
    currentStatus as (typeof LIFECYCLE_SEQUENCE)[number]
  );
  const hasHoldOverlay = Boolean(order?.holdOverlay);
  const requiresImmediateReceiveAudit = (action: OrderWorkspaceAction) =>
    action === "markReceived" &&
    (currentStatus === "Draft" || currentStatus === "PendingOrderEntryValidation");

  const executeAction = async (action: OrderWorkspaceAction) => {
    if (!order) return;
    setMessage(null);
    const actionState = getWorkspaceActionState(
      role,
      action,
      currentStatus,
      hasHoldOverlay,
      overrideEnabled
    );
    if (!actionState.enabled) {
      setMessage({ type: "error", text: actionState.reason ?? "Action blocked by guardrail." });
      return;
    }

    if (overrideEnabled && (!overrideReason.trim() || !overrideNote.trim())) {
      setMessage({
        type: "error",
        text: "Override mode requires reason code and note before proceeding.",
      });
      return;
    }

    if (
      requiresImmediateReceiveAudit(action) &&
      (!transitionReasonCode.trim() || !transitionNote.trim())
    ) {
      setMessage({
        type: "error",
        text: "Direct Draft/Pending receive requires transition reason code and note.",
      });
      return;
    }

    if (action === "openInvoiceWizard") {
      navigate(`/invoicing?orderId=${order.id}`);
      return;
    }

    if (action === "applyHold") {
      await handleApplyHold();
      return;
    }

    if (!actionState.targetStatus) {
      return;
    }

    setActionLoading(true);
    try {
      const reasonCode = transitionReasonCode.trim() || overrideReason.trim() || undefined;
      const note = transitionNote.trim() || overrideNote.trim() || undefined;
      const updated = await ordersApi.advanceStatus(order.id, actionState.targetStatus, {
        actingRole: role,
        reasonCode,
        note,
      });
      setOrder(updated);
      setMessage({
        type: "success",
        text: `Order moved to ${updated.orderLifecycleStatus ?? updated.orderStatus}.`,
      });
      if (requiresImmediateReceiveAudit(action)) {
        setTransitionReasonCode("");
        setTransitionNote("");
      }
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMessage({
        type: "error",
        text: body?.message ?? "Unable to perform workflow action.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const runAction = async (action: OrderWorkspaceAction) => {
    if (overrideEnabled) {
      setPendingAction(action);
      return;
    }
    await executeAction(action);
  };

  const parseIsoInput = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };

  const handleApplyHold = async () => {
    if (!order) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const payload = {
        holdOverlay: holdOverlayType,
        actingRole: role,
        appliedByEmpNo: "UI",
        reasonCode: holdReasonCode.trim(),
        note: holdNote.trim() || null,
        customerReadyRetryUtc: parseIsoInput(customerReadyRetryUtc),
        customerReadyLastContactUtc: parseIsoInput(customerReadyLastContactUtc),
        customerReadyContactName: customerReadyContactName.trim() || null,
      };
      const updated = await ordersApi.applyHold(order.id, payload);
      setOrder(updated);
      setMessage({ type: "success", text: `Applied ${holdOverlayType}.` });
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMessage({ type: "error", text: body?.message ?? "Unable to apply hold." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearHold = async () => {
    if (!order || !order.holdOverlay) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const updated = await ordersApi.clearHold(order.id, {
        actingRole: role,
        clearedByEmpNo: "UI",
        note: "Cleared from workspace",
      });
      setOrder(updated);
      setMessage({ type: "success", text: "Hold cleared." });
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMessage({ type: "error", text: body?.message ?? "Unable to clear hold." });
    } finally {
      setActionLoading(false);
    }
  };

  const executeRework = async (
    action:
      | "request"
      | "approve"
      | "start"
      | "submitVerification"
      | "close"
      | "cancel"
      | "scrap"
  ) => {
    if (!order) return;
    const lineId = Number(reworkLineId);
    const stepId = Number(reworkStepId);
    if (!Number.isFinite(lineId) || !Number.isFinite(stepId) || lineId <= 0 || stepId <= 0) {
      setMessage({ type: "error", text: "Rework Line ID and Step ID are required." });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      if (action === "request") {
        await ordersApi.reworkRequest(order.id, lineId, stepId, {
          requestedByEmpNo: reworkEmpNo,
          reasonCode: reworkReasonCode,
          notes: reworkNotes || null,
        });
      } else {
        const payload = { empNo: reworkEmpNo, notes: reworkNotes || null };
        if (action === "approve") await ordersApi.reworkApprove(order.id, lineId, stepId, payload);
        if (action === "start") await ordersApi.reworkStart(order.id, lineId, stepId, payload);
        if (action === "submitVerification") {
          await ordersApi.reworkSubmitVerification(order.id, lineId, stepId, payload);
        }
        if (action === "close") await ordersApi.reworkClose(order.id, lineId, stepId, payload);
        if (action === "cancel") await ordersApi.reworkCancel(order.id, lineId, stepId, payload);
        if (action === "scrap") await ordersApi.reworkScrap(order.id, lineId, stepId, payload);
      }

      const refreshed = await ordersApi.get(order.id);
      setOrder(refreshed);
      setMessage({ type: "success", text: `Rework ${action} completed.` });
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMessage({ type: "error", text: body?.message ?? "Unable to update rework state." });
    } finally {
      setActionLoading(false);
    }
  };

  const suggestedActions = useMemo(
    () => getSuggestedWorkspaceActions(currentStatus),
    [currentStatus]
  );

  const uploadAttachment = async (file: File) => {
    if (!order) return;
    try {
      await ordersApi.uploadAttachment(order.id, file, "Other", role, "UI");
      setMessage({ type: "success", text: "Attachment uploaded." });
      setAttachments(await ordersApi.attachments(order.id));
    } catch {
      setMessage({ type: "error", text: "Attachment upload failed." });
    }
  };

  const updateAttachmentCategory = async (attachmentId: number, category: string) => {
    if (!order) return;
    try {
      await ordersApi.updateAttachmentCategory(order.id, attachmentId, category, role, "UI");
      setAttachments(await ordersApi.attachments(order.id));
      setMessage({ type: "success", text: "Attachment category updated." });
    } catch {
      setMessage({ type: "error", text: "Unable to update attachment category." });
    }
  };

  const deleteAttachment = async (attachmentId: number) => {
    if (!order) return;
    try {
      await ordersApi.deleteAttachment(order.id, attachmentId, role, "UI", "UserRequestedRemoval");
      setAttachments(await ordersApi.attachments(order.id));
      setMessage({ type: "success", text: "Attachment removed." });
    } catch {
      setMessage({ type: "error", text: "Unable to remove attachment." });
    }
  };

  if (loading) {
    return <Spinner size="large" label="Loading order workspace..." />;
  }

  if (!order) {
    return <Body1>Order not found.</Body1>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Button icon={<ArrowLeft24Regular />} onClick={() => navigate("/orderboard")}>
            Back to Queue
          </Button>
          <Title2>Order Workspace</Title2>
        </div>
        <div className={styles.topBarRight}>
          <Field label="Role View" className={styles.topField}>
            <Dropdown
              value={role}
              selectedOptions={[role]}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  setRole(data.optionValue as OrderWorkspaceRole);
                }
              }}
            >
              {ROLES.map((value) => (
                <Option key={value} value={value}>
                  {value}
                </Option>
              ))}
            </Dropdown>
          </Field>
        </div>
      </div>

      {message ? (
        <MessageBar intent={message.type}>
          <MessageBarBody>{message.text}</MessageBarBody>
        </MessageBar>
      ) : null}

      <Card>
        <div className={styles.identityStrip}>
          <Body1>
            <strong>{order.salesOrderNo}</strong>
          </Body1>
          <Body1>{order.customerName}</Body1>
          <Badge appearance="outline">{currentStatus}</Badge>
          {order.holdOverlay ? <Badge color="warning">{order.holdOverlay}</Badge> : null}
          <Body1>Owner: {order.statusOwnerRole ?? role}</Body1>
        </div>
      </Card>

      <div className={styles.timeline}>
        {LIFECYCLE_SEQUENCE.map((status, idx) => {
          const done = idx < currentIdx;
          const current = idx === currentIdx;
          const display = ORDER_STATUS_METADATA[status]?.displayLabel ?? status;
          return (
            <div
              key={status}
              className={`${styles.timelineStep} ${done ? styles.timelineDone : ""} ${
                current ? styles.timelineCurrent : ""
              }`}
            >
              <Body1>{display}</Body1>
            </div>
          );
        })}
      </div>

      <div className={styles.body}>
        <Card>
          <div className={styles.sectionGrid}>
            <Card>
              <Body1>
                <strong>Customer / Billing</strong>
              </Body1>
              <Body1>Contact: {order.contact ?? "--"}</Body1>
              <Body1>Phone: {order.phone ?? "--"}</Body1>
              <Body1>PO: {order.customerPoNo ?? "--"}</Body1>
            </Card>
            <Card>
              <Body1>
                <strong>Order Totals</strong>
              </Body1>
              <Body1>Lines: {order.lines.length}</Body1>
              <Body1>
                Qty Total: {order.lines.reduce((sum, line) => sum + line.quantityAsOrdered, 0)}
              </Body1>
              <Body1>
                Invoice Total: $
                {order.lines
                  .reduce((sum, line) => sum + (line.extension ?? 0), 0)
                  .toFixed(2)}
              </Body1>
            </Card>
            <Card>
              <Body1>
                <strong>Promise Dates</strong>
              </Body1>
              <Body1>Requested: {order.requestedDateUtc ?? "--"}</Body1>
              <Body1>Promised: {order.promisedDateUtc ?? "--"}</Body1>
              <Body1>Current Commit: {order.currentCommittedDateUtc ?? "--"}</Body1>
            </Card>
            <Card>
              <Body1>
                <strong>Quality / Rework</strong>
              </Body1>
              <Body1>Open Rework: {order.hasOpenRework ? "Yes" : "No"}</Body1>
              <Body1>Blocks Invoice: {order.reworkBlockingInvoice ? "Yes" : "No"}</Body1>
              <Body1>Reason: {order.statusReasonCode ?? "--"}</Body1>
            </Card>
          </div>
        </Card>

        <Card>
          <div className={styles.actionPanel}>
            <Body1>
              <strong>Allowed Actions</strong>
            </Body1>
            <Field label="Enable Override">
              <Input
                value={overrideEnabled ? "ON" : "OFF"}
                readOnly
                contentAfter={
                  <Button
                    appearance={overrideEnabled ? "primary" : "secondary"}
                    onClick={() => setOverrideEnabled((v) => !v)}
                  >
                    {overrideEnabled ? "Disable" : "Enable"}
                  </Button>
                }
              />
            </Field>
            {overrideEnabled ? (
              <>
                <Field label="Override Reason Code" required>
                  <Input
                    value={overrideReason}
                    onChange={(_, data) => setOverrideReason(data.value)}
                    placeholder="e.g. CustomerEscalation"
                  />
                </Field>
                <Field label="Override Note" required>
                  <Input
                    value={overrideNote}
                    onChange={(_, data) => setOverrideNote(data.value)}
                    placeholder="Short audit note..."
                  />
                </Field>
              </>
            ) : null}
            <Field
              label="Transition Reason Code"
              hint={
                currentStatus === "Draft" || currentStatus === "PendingOrderEntryValidation"
                  ? "Required for direct immediate dropoff receive."
                  : "Optional audit reason for transition."
              }
            >
              <Input
                value={transitionReasonCode}
                onChange={(_, data) => setTransitionReasonCode(data.value)}
                placeholder="e.g. EmergencyManualReceive"
              />
            </Field>
            <Field label="Transition Note">
              <Input
                value={transitionNote}
                onChange={(_, data) => setTransitionNote(data.value)}
                placeholder="Short transition context for audit..."
              />
            </Field>
            <Field label="Hold Overlay">
              <Dropdown
                value={holdOverlayType}
                selectedOptions={[holdOverlayType]}
                onOptionSelect={(_, data) =>
                  setHoldOverlayType((data.optionValue as HoldOverlayType) ?? "OnHoldCustomer")
                }
              >
                <Option value="OnHoldCustomer">OnHoldCustomer</Option>
                <Option value="OnHoldQuality">OnHoldQuality</Option>
                <Option value="OnHoldLogistics">OnHoldLogistics</Option>
                <Option value="ExceptionQuantityMismatch">ExceptionQuantityMismatch</Option>
                <Option value="ExceptionDocumentation">ExceptionDocumentation</Option>
                <Option value="Cancelled">Cancelled</Option>
              </Dropdown>
            </Field>
            <Field label="Hold Reason Code">
              <Input
                value={holdReasonCode}
                onChange={(_, data) => setHoldReasonCode(data.value)}
                placeholder="e.g. CustomerNotReadyForPickup"
              />
            </Field>
            <Field label="Hold Note">
              <Input
                value={holdNote}
                onChange={(_, data) => setHoldNote(data.value)}
                placeholder="Short hold context..."
              />
            </Field>
            {holdOverlayType === "OnHoldCustomer" ? (
              <>
                <Field label="Customer Ready Retry (ISO datetime)">
                  <Input
                    value={customerReadyRetryUtc}
                    onChange={(_, data) => setCustomerReadyRetryUtc(data.value)}
                    placeholder="2026-03-01T09:00:00Z"
                  />
                </Field>
                <Field label="Customer Last Contact (ISO datetime)">
                  <Input
                    value={customerReadyLastContactUtc}
                    onChange={(_, data) => setCustomerReadyLastContactUtc(data.value)}
                    placeholder="2026-02-28T14:30:00Z"
                  />
                </Field>
                <Field label="Customer Contact Name">
                  <Input
                    value={customerReadyContactName}
                    onChange={(_, data) => setCustomerReadyContactName(data.value)}
                  />
                </Field>
              </>
            ) : null}
            {suggestedActions.map((actionKey) => {
              const action = ACTION_LABELS[actionKey];
              const state = getWorkspaceActionState(
                role,
                actionKey,
                currentStatus,
                hasHoldOverlay,
                overrideEnabled
              );
              return (
                <Button
                  key={actionKey}
                  appearance={actionKey === "openInvoiceWizard" ? "primary" : "secondary"}
                  disabled={!state.enabled || actionLoading}
                  title={state.reason}
                  onClick={() => void runAction(actionKey)}
                >
                  {action}
                </Button>
              );
            })}
            {order.holdOverlay ? (
              <Button appearance="secondary" onClick={() => void handleClearHold()} disabled={actionLoading}>
                Clear Active Hold
              </Button>
            ) : null}
            <Field label="Add attachment">
              <input
                type="file"
                onChange={(event) => {
                  const file = (event.target as HTMLInputElement).files?.item(0);
                  if (file) {
                    void uploadAttachment(file);
                  }
                }}
              />
            </Field>
          </div>
        </Card>
      </div>

      <TabList selectedValue={tab} onTabSelect={(_, data) => setTab(data.value as TabValue)}>
        <Tab value="attachments">Attachments</Tab>
        <Tab value="rework">Rework</Tab>
        <Tab value="promiseDate">Promise Date History</Tab>
        <Tab value="auditLog">Audit Log</Tab>
        <Tab value="integrationEvents">Integration Events</Tab>
      </TabList>

      {tab === "attachments" ? (
        <Card>
          {attachments.length === 0 ? (
            <Body1>No attachments.</Body1>
          ) : (
            attachments.map((attachment) => (
              <div key={attachment.id} className={styles.attachmentRow}>
                <Body1>
                  {attachment.fileName}
                  {attachment.isInvoiceRelevant ? " (Invoice Relevant)" : ""}
                </Body1>
                <Body1>{attachment.contentType}</Body1>
                <Body1>{new Date(attachment.uploadedUtc).toLocaleString()}</Body1>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button
                    appearance="secondary"
                    onClick={() =>
                      window.open(
                        ordersApi.attachmentDownloadUrl(order.id, attachment.id, role, "UI"),
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    Download
                  </Button>
                  <Button
                    appearance="secondary"
                    onClick={() => {
                      const nextCategory = window.prompt("Update category", attachment.category);
                      if (nextCategory && nextCategory.trim()) {
                        void updateAttachmentCategory(attachment.id, nextCategory.trim());
                      }
                    }}
                  >
                    Category
                  </Button>
                  <Button appearance="secondary" onClick={() => void deleteAttachment(attachment.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card>
      ) : tab === "rework" ? (
        <Card>
          <div className={styles.sectionGrid}>
            <Field label="Line ID" required>
              <Input value={reworkLineId} onChange={(_, data) => setReworkLineId(data.value)} />
            </Field>
            <Field label="Step ID" required>
              <Input value={reworkStepId} onChange={(_, data) => setReworkStepId(data.value)} />
            </Field>
            <Field label="Actor EmpNo" required>
              <Input value={reworkEmpNo} onChange={(_, data) => setReworkEmpNo(data.value)} />
            </Field>
            <Field label="Reason Code (request only)">
              <Input value={reworkReasonCode} onChange={(_, data) => setReworkReasonCode(data.value)} />
            </Field>
            <Field label="Notes" className={styles.fullWidth}>
              <Input value={reworkNotes} onChange={(_, data) => setReworkNotes(data.value)} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button onClick={() => void executeRework("request")} disabled={actionLoading}>
              Request
            </Button>
            <Button onClick={() => void executeRework("approve")} disabled={actionLoading}>
              Approve
            </Button>
            <Button onClick={() => void executeRework("start")} disabled={actionLoading}>
              Start
            </Button>
            <Button onClick={() => void executeRework("submitVerification")} disabled={actionLoading}>
              Verification Pending
            </Button>
            <Button onClick={() => void executeRework("close")} appearance="primary" disabled={actionLoading}>
              Close
            </Button>
            <Button onClick={() => void executeRework("cancel")} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={() => void executeRework("scrap")} disabled={actionLoading}>
              Scrap
            </Button>
          </div>
        </Card>
      ) : (
        <div className={styles.placeholder}>
          {tab === "promiseDate" &&
            "Promise-date history is shown as a placeholder until governance APIs are available."}
          {tab === "auditLog" &&
            "Audit log placeholder. UI contract will map to /api/orders/{id}/audit-events later."}
          {tab === "integrationEvents" &&
            "Integration events placeholder for ERP staging status and correlation IDs."}
        </div>
      )}

      <Dialog open={pendingAction !== null} onOpenChange={(_, data) => !data.open && setPendingAction(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm Override Action</DialogTitle>
            <DialogContent>
              <Body1>
                You are executing <strong>{pendingAction ? ACTION_LABELS[pendingAction] : ""}</strong> in
                override mode.
              </Body1>
              <Body1>Reason: {overrideReason || "(missing)"}</Body1>
              <Body1>Note: {overrideNote || "(missing)"}</Body1>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setPendingAction(null)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={async () => {
                  if (!pendingAction) return;
                  const nextAction = pendingAction;
                  setPendingAction(null);
                  await executeAction(nextAction);
                }}
              >
                Confirm Override
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
