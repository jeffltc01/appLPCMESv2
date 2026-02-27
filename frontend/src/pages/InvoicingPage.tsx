import { useCallback, useEffect, useState } from "react";
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
  Title1,
} from "@fluentui/react-components";
import { ordersApi } from "../services/orders";
import type { OrderAttachment, OrderDraftListItem } from "../types/order";

const INVOICE_READY_STATUSES = new Set(["Ready to Invoice", "InvoiceReady"]);

export function InvoicingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<OrderDraftListItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDraftListItem | null>(null);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [finalReviewConfirmed, setFinalReviewConfirmed] = useState(false);
  const [sendAttachmentEmail, setSendAttachmentEmail] = useState(false);
  const [recipientSummary, setRecipientSummary] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadInvoiceReadyOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ordersApi.list({ page: 1, pageSize: 200 });
      const rows = response.items.filter((row) => INVOICE_READY_STATUSES.has(row.orderStatus));
      setOrders(rows);
      setSelectedOrder((prev) => prev ?? rows[0] ?? null);
      setMessage(null);
    } catch {
      setMessage({ type: "error", text: "Unable to load invoice-ready orders." });
    } finally {
      setLoading(false);
    }
  }, []);

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
      .then(setAttachments)
      .catch(() => setMessage({ type: "error", text: "Unable to load attachments for selected order." }));
  }, [selectedOrder]);

  const submitInvoice = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await ordersApi.submitInvoice(selectedOrder.id, {
        finalReviewConfirmed,
        sendAttachmentEmail,
        selectedAttachmentIds: sendAttachmentEmail ? attachments.map((a) => a.id) : null,
        attachmentRecipientSummary: sendAttachmentEmail ? recipientSummary : null,
        attachmentSkipReason: sendAttachmentEmail ? null : skipReason,
        submittedByEmpNo: "UI",
      });
      setMessage({ type: "success", text: `Invoice submitted for ${selectedOrder.salesOrderNo}.` });
      setFinalReviewConfirmed(false);
      setRecipientSummary("");
      setSkipReason("");
      await loadInvoiceReadyOrders();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Invoice submission failed.";
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
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
                  onClick={() => setSelectedOrder(order)}
                >
                  {order.salesOrderNo} - {order.customerName}
                </Button>
              ))
            )}
          </Card>

          <Card>
            <Body1 style={{ fontWeight: 700, marginBottom: 8 }}>
              Submit Invoice {selectedOrder ? `(${selectedOrder.salesOrderNo})` : ""}
            </Body1>
            <Checkbox
              label="Final office review completed"
              checked={finalReviewConfirmed}
              onChange={(_, data) => setFinalReviewConfirmed(!!data.checked)}
            />
            <Checkbox
              label="Send attachment email"
              checked={sendAttachmentEmail}
              onChange={(_, data) => setSendAttachmentEmail(!!data.checked)}
            />
            {sendAttachmentEmail ? (
              <Field label="Recipient summary" required>
                <Input value={recipientSummary} onChange={(_, data) => setRecipientSummary(data.value)} />
              </Field>
            ) : (
              <Field label="Skip reason" required>
                <Input value={skipReason} onChange={(_, data) => setSkipReason(data.value)} />
              </Field>
            )}
            <Body1>Attachments: {attachments.length}</Body1>
            <Button
              appearance="primary"
              disabled={!selectedOrder || saving}
              onClick={submitInvoice}
            >
              {saving ? "Submitting..." : "Submit Invoice"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
