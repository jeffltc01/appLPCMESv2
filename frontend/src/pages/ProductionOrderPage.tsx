import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Body1,
  Button,
  MessageBar,
  MessageBarBody,
  Spinner,
  Tab,
  TabList,
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
import { ArrowLeft24Regular, ArrowUpload24Regular, Delete24Regular } from "@fluentui/react-icons";
import { ordersApi } from "../services/orders";
import { ApiError } from "../services/api";
import type { OrderAttachment, ProductionOrderDetail } from "../types/order";

type TabValue = "details" | "lines" | "attachments";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    flexWrap: "wrap",
  },
  titleWrap: {
    flexGrow: 1,
  },
  readOnlyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalL,
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  readOnlyItem: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  readOnlyLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  readOnlyValue: {
    marginTop: tokens.spacingVerticalXS,
  },
  center: {
    display: "flex",
    justifyContent: "center",
    marginTop: tokens.spacingVerticalXXL,
  },
  actionsRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalM,
    flexWrap: "wrap",
  },
  hiddenInput: {
    display: "none",
  },
  fileLink: {
    color: tokens.colorBrandForeground1,
    textDecorationLine: "none",
  },
});

const toMb = (sizeBytes: number) => `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;

export function ProductionOrderPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<TabValue>("details");
  const [detail, setDetail] = useState<ProductionOrderDetail | null>(null);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyAttachmentId, setBusyAttachmentId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId || Number.isNaN(orderId)) {
      setMsg({ type: "error", text: "Invalid order id." });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const [orderData, attachmentData] = await Promise.all([
        ordersApi.productionDetail(orderId),
        ordersApi.attachments(orderId),
      ]);
      setDetail(orderData);
      setAttachments(attachmentData);
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMsg({
        type: "error",
        text: body?.message ?? "Unable to load production order.",
      });
      setDetail(null);
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const uploadAttachment = async (file?: File) => {
    if (!file || !detail) return;
    setUploading(true);
    setMsg(null);
    try {
      await ordersApi.uploadAttachment(detail.id, file);
      const updated = await ordersApi.attachments(detail.id);
      setAttachments(updated);
      setMsg({ type: "success", text: "Attachment uploaded." });
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setMsg({ type: "error", text: body?.message ?? "Failed to upload attachment." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const deleteAttachment = async (attachment: OrderAttachment) => {
    if (!detail) return;
    if (!window.confirm(`Delete attachment "${attachment.fileName}"?`)) {
      return;
    }

    setBusyAttachmentId(attachment.id);
    setMsg(null);
    try {
      await ordersApi.deleteAttachment(detail.id, attachment.id);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      setMsg({ type: "success", text: "Attachment deleted." });
    } catch {
      setMsg({ type: "error", text: "Failed to delete attachment." });
    } finally {
      setBusyAttachmentId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="large" label="Loading production order..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className={styles.center}>
        <Body1>Production order not found.</Body1>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate("/production")}
        />
        <div className={styles.titleWrap}>
          <Title2>{`${detail.salesOrderNo} (${detail.orderStatus})`}</Title2>
        </div>
      </div>

      {msg && (
        <MessageBar intent={msg.type} style={{ marginBottom: tokens.spacingVerticalM }}>
          <MessageBarBody>{msg.text}</MessageBarBody>
        </MessageBar>
      )}

      <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as TabValue)}>
        <Tab value="details">Details</Tab>
        <Tab value="lines">Lines ({detail.lines.length})</Tab>
        <Tab value="attachments">Attachments ({attachments.length})</Tab>
      </TabList>

      {tab === "details" && (
        <div className={styles.readOnlyGrid}>
          <div className={styles.readOnlyItem}>
            <Body1 className={styles.readOnlyLabel}>Customer</Body1>
            <Body1 className={styles.readOnlyValue}>{detail.customerName}</Body1>
          </div>
          <div className={styles.readOnlyItem}>
            <Body1 className={styles.readOnlyLabel}>Received Date</Body1>
            <Body1 className={styles.readOnlyValue}>
              {detail.receivedDate?.slice(0, 10) ?? "--"}
            </Body1>
          </div>
          <div className={styles.readOnlyItem}>
            <Body1 className={styles.readOnlyLabel}>Pickup Address</Body1>
            <Body1 className={styles.readOnlyValue}>{detail.pickUpAddress ?? "--"}</Body1>
          </div>
          <div className={styles.readOnlyItem}>
            <Body1 className={styles.readOnlyLabel}>Trailer</Body1>
            <Body1 className={styles.readOnlyValue}>{detail.trailerNo ?? "--"}</Body1>
          </div>
          <div className={styles.readOnlyItem}>
            <Body1 className={styles.readOnlyLabel}>Comments</Body1>
            <Body1 className={styles.readOnlyValue}>{detail.orderComments ?? "--"}</Body1>
          </div>
        </div>
      )}

      {tab === "lines" && (
        <div style={{ marginTop: tokens.spacingVerticalL }}>
          {detail.lines.length === 0 ? (
            <Body1>No lines available.</Body1>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Line</TableHeaderCell>
                  <TableHeaderCell>Item</TableHeaderCell>
                  <TableHeaderCell>Qty Ordered</TableHeaderCell>
                  <TableHeaderCell>Qty Received</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.lineNo}</TableCell>
                    <TableCell>
                      {line.itemNo} - {line.itemDescription}
                    </TableCell>
                    <TableCell>{line.quantityAsOrdered}</TableCell>
                    <TableCell>{line.quantityAsReceived}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {tab === "attachments" && (
        <div style={{ marginTop: tokens.spacingVerticalL }}>
          <div className={styles.actionsRow}>
            <input
              ref={fileInputRef}
              className={styles.hiddenInput}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,.txt"
              onChange={(event) => void uploadAttachment(event.target.files?.[0])}
            />
            <Button
              appearance="primary"
              icon={<ArrowUpload24Regular />}
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Uploading..." : "Upload Attachment"}
            </Button>
          </div>

          {attachments.length === 0 ? (
            <Body1>No attachments yet.</Body1>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>File Name</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Size</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attachments.map((attachment) => {
                  const downloadUrl = ordersApi.attachmentDownloadUrl(detail.id, attachment.id);
                  return (
                    <TableRow key={attachment.id}>
                      <TableCell>{attachment.fileName}</TableCell>
                      <TableCell>{attachment.contentType}</TableCell>
                      <TableCell>{toMb(attachment.sizeBytes)}</TableCell>
                      <TableCell>{new Date(attachment.createdAtUtc).toLocaleString()}</TableCell>
                      <TableCell>
                        <div style={{ display: "flex", gap: tokens.spacingHorizontalS }}>
                          <a className={styles.fileLink} href={downloadUrl} target="_blank" rel="noreferrer">
                            View
                          </a>
                          <a className={styles.fileLink} href={downloadUrl} download>
                            Download
                          </a>
                          <Button
                            appearance="subtle"
                            icon={<Delete24Regular />}
                            size="small"
                            disabled={busyAttachmentId === attachment.id}
                            onClick={() => void deleteAttachment(attachment)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
