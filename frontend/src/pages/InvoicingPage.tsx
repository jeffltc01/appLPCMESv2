import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Body1,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  Tab,
  TabList,
  Title1,
} from "@fluentui/react-components";
import { ordersApi } from "../services/orders";
import type { OrderAttachment, OrderDraftListItem } from "../types/order";

const INVOICE_READY_STATUSES = new Set(["Ready to Invoice", "InvoiceReady"]);
type WizardStep = "review" | "attachments" | "submit";

function generateCorrelationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ui-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function InvoicingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedOrderIdFromRoute = searchParams.get("orderId");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<OrderDraftListItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDraftListItem | null>(null);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<number[]>([]);
  const [step, setStep] = useState<WizardStep>("review");
  const [reviewPaperworkConfirmed, setReviewPaperworkConfirmed] = useState(false);
  const [reviewPricingConfirmed, setReviewPricingConfirmed] = useState(false);
  const [reviewBillingConfirmed, setReviewBillingConfirmed] = useState(false);
  const [sendAttachmentEmail, setSendAttachmentEmail] = useState(false);
  const [recipientSummary, setRecipientSummary] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadInvoiceReadyOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ordersApi.list({ page: 1, pageSize: 200 });
      const rows = response.items.filter((row) => INVOICE_READY_STATUSES.has(row.orderStatus));
      setOrders(rows);
      setSelectedOrder((prev) => {
        if (selectedOrderIdFromRoute) {
          const byRoute = rows.find((row) => String(row.id) === selectedOrderIdFromRoute);
          if (byRoute) return byRoute;
        }
        return prev ?? rows[0] ?? null;
      });
      setMessage(null);
    } catch {
      setMessage({ type: "error", text: "Unable to load invoice-ready orders." });
    } finally {
      setLoading(false);
    }
  }, [selectedOrderIdFromRoute]);

  useEffect(() => {
    void loadInvoiceReadyOrders();
  }, [loadInvoiceReadyOrders]);

  useEffect(() => {
    if (!selectedOrder) {
      setAttachments([]);
      return;
    }

    void ordersApi
      .attachments(selectedOrder.id)
      .then((items) => {
        setAttachments(items);
        setSelectedAttachmentIds(items.map((item) => item.id));
      })
      .catch(() => setMessage({ type: "error", text: "Unable to load attachments for selected order." }));
  }, [selectedOrder]);

  const finalReviewConfirmed =
    reviewPaperworkConfirmed && reviewPricingConfirmed && reviewBillingConfirmed;

  const canProceedFromAttachments = useMemo(() => {
    if (sendAttachmentEmail) {
      return Boolean(recipientSummary.trim()) && selectedAttachmentIds.length > 0;
    }
    return Boolean(skipReason.trim());
  }, [recipientSummary, selectedAttachmentIds, sendAttachmentEmail, skipReason]);

  const submitInvoice = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const generatedCorrelationId = generateCorrelationId();
      await ordersApi.submitInvoice(selectedOrder.id, {
        finalReviewConfirmed,
        sendAttachmentEmail,
        selectedAttachmentIds: sendAttachmentEmail ? selectedAttachmentIds : null,
        attachmentRecipientSummary: sendAttachmentEmail ? recipientSummary : null,
        attachmentSkipReason: sendAttachmentEmail ? null : skipReason,
        correlationId: generatedCorrelationId,
        submittedByEmpNo: "UI",
      });
      setCorrelationId(generatedCorrelationId);
      setMessage({ type: "success", text: `Invoice submitted for ${selectedOrder.salesOrderNo}.` });
      setReviewPaperworkConfirmed(false);
      setReviewPricingConfirmed(false);
      setReviewBillingConfirmed(false);
      setRecipientSummary("");
      setSkipReason("");
      setStep("review");
      await loadInvoiceReadyOrders();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Invoice submission failed.";
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  };

  const moveToAttachments = () => {
    if (!finalReviewConfirmed) {
      setMessage({ type: "error", text: "Complete all review confirmations to continue." });
      return;
    }
    setMessage(null);
    setStep("attachments");
  };

  const moveToSubmit = () => {
    if (!canProceedFromAttachments) {
      setMessage({
        type: "error",
        text: sendAttachmentEmail
          ? "Pick at least one attachment and provide recipient details."
          : "Provide a reason when skipping attachment email.",
      });
      return;
    }
    setMessage(null);
    setStep("submit");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Title1>Invoicing Submission</Title1>
      {message && (
        <MessageBar intent={message.type}>
          <MessageBarBody>{message.text}</MessageBarBody>
        </MessageBar>
      )}
      {loading ? (
        <Spinner label="Loading invoice-ready orders..." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Card>
            <Body1 style={{ fontWeight: 700, marginBottom: 8 }}>Invoice Ready Queue</Body1>
            {orders.length === 0 ? (
              <Body1>No invoice-ready orders found.</Body1>
            ) : (
              orders.map((order) => (
                <Button
                  key={order.id}
                  appearance={selectedOrder?.id === order.id ? "primary" : "secondary"}
                  style={{ marginBottom: 8 }}
                  onClick={() => {
                    setSelectedOrder(order);
                    setStep("review");
                    setMessage(null);
                    navigate(`/invoicing?orderId=${order.id}`);
                  }}
                >
                  {order.salesOrderNo} - {order.customerName}
                </Button>
              ))
            )}
            {selectedOrder ? (
              <Button
                appearance="secondary"
                onClick={() => navigate(`/orders/${selectedOrder.id}/workspace`)}
              >
                Open Workspace
              </Button>
            ) : null}
          </Card>

          <Card>
            <Body1 style={{ fontWeight: 700, marginBottom: 8 }}>
              Invoice Wizard {selectedOrder ? `(${selectedOrder.salesOrderNo})` : ""}
            </Body1>
            <TabList
              selectedValue={step}
              onTabSelect={(_, data) => setStep(data.value as WizardStep)}
            >
              <Tab value="review">1. Review</Tab>
              <Tab value="attachments">2. Attachments</Tab>
              <Tab value="submit">3. Submit</Tab>
            </TabList>
            {step === "review" ? (
              <>
                <Body1>
                  Confirm details before submitting invoice to ERP staging (cannot be reversed
                  from this dialog).
                </Body1>
                <Checkbox
                  label="Required paperwork is present"
                  checked={reviewPaperworkConfirmed}
                  onChange={(_, data) => setReviewPaperworkConfirmed(Boolean(data.checked))}
                />
                <Checkbox
                  label="Quantity and pricing reviewed"
                  checked={reviewPricingConfirmed}
                  onChange={(_, data) => setReviewPricingConfirmed(Boolean(data.checked))}
                />
                <Checkbox
                  label="Customer and billing details reviewed"
                  checked={reviewBillingConfirmed}
                  onChange={(_, data) => setReviewBillingConfirmed(Boolean(data.checked))}
                />
                <Button appearance="primary" onClick={moveToAttachments} disabled={!selectedOrder}>
                  Continue to Attachments
                </Button>
              </>
            ) : null}
            {step === "attachments" ? (
              <>
                <Checkbox
                  label="Send attachment email"
                  checked={sendAttachmentEmail}
                  onChange={(_, data) => setSendAttachmentEmail(Boolean(data.checked))}
                />
                <Body1>Attachments available: {attachments.length}</Body1>
                {attachments.map((attachment) => (
                  <Checkbox
                    key={attachment.id}
                    label={attachment.fileName}
                    checked={selectedAttachmentIds.includes(attachment.id)}
                    onChange={(_, data) => {
                      setSelectedAttachmentIds((prev) => {
                        if (data.checked) {
                          return prev.includes(attachment.id) ? prev : [...prev, attachment.id];
                        }
                        return prev.filter((id) => id !== attachment.id);
                      });
                    }}
                  />
                ))}
                {sendAttachmentEmail ? (
                  <Field label="Recipient summary" required>
                    <Input
                      value={recipientSummary}
                      onChange={(_, data) => setRecipientSummary(data.value)}
                    />
                  </Field>
                ) : (
                  <Field label="Skip reason" required>
                    <Input
                      value={skipReason}
                      onChange={(_, data) => setSkipReason(data.value)}
                    />
                  </Field>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <Button onClick={() => setStep("review")}>Back</Button>
                  <Button appearance="primary" onClick={moveToSubmit}>
                    Continue to Submit
                  </Button>
                </div>
              </>
            ) : null}
            {step === "submit" ? (
              <>
                <Body1>
                  Submit invoice for <strong>{selectedOrder?.salesOrderNo ?? "--"}</strong> to ERP
                  staging.
                </Body1>
                <Body1>
                  Mode: {sendAttachmentEmail ? "Email attachments and continue" : "Skip email"}
                </Body1>
                <Body1>
                  Correlation ID preview:{" "}
                  <code>{correlationId ?? "(generated on submit)"}</code>
                </Body1>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button onClick={() => setStep("attachments")}>Back</Button>
                  <Button
                    appearance="primary"
                    disabled={!selectedOrder || saving}
                    onClick={submitInvoice}
                  >
                    {saving ? "Submitting..." : "Submit Invoice"}
                  </Button>
                </div>
              </>
            ) : null}
          </Card>
        </div>
      )}
    </div>
  );
}
