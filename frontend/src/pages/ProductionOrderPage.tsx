import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Body1,
  Button,
  Field,
  Input,
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
  Textarea,
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ArrowLeft24Regular, ArrowUpload24Regular, Delete24Regular } from "@fluentui/react-icons";
import { ordersApi } from "../services/orders";
import { ApiError } from "../services/api";
import type { OrderAttachment, OrderDraftDetail, ProductionOrderDetail } from "../types/order";
import { OrderWorkflowWidget } from "../components/orders/OrderWorkflowWidget";

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
  tabContent: {
    marginTop: tokens.spacingVerticalL,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    maxWidth: "820px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalS,
  },
  priceCell: {
    textAlign: "right" as const,
  },
  lineCellTall: {
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
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
const toDisplay = (value: string | number | null | undefined) =>
  value == null || value === "" ? "--" : String(value);
const toBoolDisplay = (value: number | null | undefined) =>
  value == null ? "--" : value === 1 ? "Yes" : "No";
const toFeatureDisplay = (value: boolean | null | undefined) =>
  value == null ? "--" : value ? "Yes" : "No";

export function ProductionOrderPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<TabValue>("details");
  const [detail, setDetail] = useState<ProductionOrderDetail | null>(null);
  const [orderHeader, setOrderHeader] = useState<OrderDraftDetail | null>(null);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyAttachmentId, setBusyAttachmentId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const productionLineRows = useMemo(() => {
    const receivedById = new Map((detail?.lines ?? []).map((line) => [line.id, line]));
    const detailedLines = orderHeader?.lines ?? [];

    if (detailedLines.length > 0) {
      return detailedLines.map((line) => {
        const receivingLine = receivedById.get(line.id);
        return {
          id: line.id,
          lineNo: line.lineNo,
          itemText: `${line.itemNo} - ${line.itemDescription}`,
          quantityAsReceived: receivingLine?.quantityAsReceived ?? "--",
          tankColor: toDisplay(line.colorName),
          lidColor: toDisplay(line.lidColorName),
          collar: toFeatureDisplay(line.needCollars),
          decal: toFeatureDisplay(line.needDecals),
          filler: toFeatureDisplay(line.needFillers),
          footring: toFeatureDisplay(line.needFootRings),
          gauge: toDisplay(line.gauges),
          valve: toDisplay(line.valveType),
        };
      });
    }

    return (detail?.lines ?? []).map((line) => ({
      id: line.id,
      lineNo: line.lineNo,
      itemText: `${line.itemNo} - ${line.itemDescription}`,
      quantityAsReceived: line.quantityAsReceived,
      tankColor: "--",
      lidColor: "--",
      collar: "--",
      decal: "--",
      filler: "--",
      footring: "--",
      gauge: "--",
      valve: "--",
    }));
  }, [detail, orderHeader]);

  const loadOrder = useCallback(async () => {
    if (!orderId || Number.isNaN(orderId)) {
      setMsg({ type: "error", text: "Invalid order id." });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const [orderData, fullOrderResult] = await Promise.all([
        ordersApi.productionDetail(orderId),
        ordersApi.get(orderId).catch(() => null),
      ]);
      setDetail(orderData);
      setOrderHeader(fullOrderResult);

      try {
        const attachmentData = await ordersApi.attachments(orderId);
        setAttachments(attachmentData);
      } catch (err) {
        const apiError = err as ApiError;
        const body = apiError.body as { message?: string } | undefined;
        setAttachments([]);
        setMsg({
          type: "error",
          text: body?.message ?? "Order loaded, but attachments could not be loaded.",
        });
      }
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

      <OrderWorkflowWidget
        currentStatus={detail.orderStatus}
        dates={{
          orderCreatedDate: orderHeader?.orderCreatedDate ?? detail.receivedDate ?? "",
          readyForPickupDate:
            orderHeader?.readyForPickupDate ??
            orderHeader?.pickupScheduledDate ??
            detail.receivedDate ??
            orderHeader?.readyToShipDate ??
            orderHeader?.readyToInvoiceDate ??
            null,
          pickupScheduledDate: orderHeader?.pickupScheduledDate ?? null,
          receivedDate: detail.receivedDate ?? orderHeader?.receivedDate ?? null,
          readyToShipDate: orderHeader?.readyToShipDate ?? null,
          readyToInvoiceDate: orderHeader?.readyToInvoiceDate ?? null,
        }}
        canAdvance={false}
      />

      <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as TabValue)}>
        <Tab value="details">Details</Tab>
        <Tab value="lines">Lines ({detail.lines.length})</Tab>
        <Tab value="attachments">Attachments ({attachments.length})</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {tab === "details" && (
          <div className={styles.form}>
            <div className={styles.row}>
              <Field label="Customer">
                <Input value={detail.customerName} readOnly />
              </Field>
              <Field label="Received Date">
                <Input value={detail.receivedDate?.slice(0, 10) ?? ""} type="date" readOnly />
              </Field>
            </div>

            <div className={styles.row}>
              <Field label="Return Scrap">
                <Input value={toBoolDisplay(orderHeader?.returnScrap)} readOnly />
              </Field>
              <Field label="Return Brass">
                <Input value={toBoolDisplay(orderHeader?.returnBrass)} readOnly />
              </Field>
            </div>

            <div className={styles.row}>
              <Field label="Pickup Address">
                <Textarea value={toDisplay(detail.pickUpAddress)} rows={3} readOnly />
              </Field>
              <Field label="Trailer">
                <Input value={toDisplay(detail.trailerNo)} readOnly />
              </Field>
            </div>

            <Field label="Comments">
              <Textarea value={toDisplay(detail.orderComments)} rows={4} readOnly />
            </Field>
          </div>
        )}

        {tab === "lines" && (
          <div>
            <div className={styles.sectionHeader}>
              <Body1 style={{ fontWeight: tokens.fontWeightSemibold }}>Order Lines</Body1>
            </div>

            {productionLineRows.length === 0 ? (
              <Body1>No lines available.</Body1>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Line</TableHeaderCell>
                    <TableHeaderCell>Item</TableHeaderCell>
                    <TableHeaderCell>Qty Received</TableHeaderCell>
                    <TableHeaderCell>Tank Color</TableHeaderCell>
                    <TableHeaderCell>Lid Color</TableHeaderCell>
                    <TableHeaderCell>Collar</TableHeaderCell>
                    <TableHeaderCell>Decal</TableHeaderCell>
                    <TableHeaderCell>Filler</TableHeaderCell>
                    <TableHeaderCell>Footring</TableHeaderCell>
                    <TableHeaderCell>Gauge</TableHeaderCell>
                    <TableHeaderCell>Valve</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionLineRows.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className={styles.lineCellTall}>{line.lineNo}</TableCell>
                      <TableCell className={styles.lineCellTall}>{line.itemText}</TableCell>
                      <TableCell className={`${styles.lineCellTall} ${styles.priceCell}`}>
                        {line.quantityAsReceived}
                      </TableCell>
                      <TableCell className={styles.lineCellTall}>{line.tankColor}</TableCell>
                      <TableCell className={styles.lineCellTall}>{line.lidColor}</TableCell>
                      <TableCell className={styles.lineCellTall}>{line.collar}</TableCell>
                      <TableCell className={styles.lineCellTall}>{line.decal}</TableCell>
                      <TableCell className={styles.lineCellTall}>{line.filler}</TableCell>
                      <TableCell className={styles.lineCellTall}>{line.footring}</TableCell>
                      <TableCell className={styles.lineCellTall}>{line.gauge}</TableCell>
                      <TableCell className={styles.lineCellTall}>{line.valve}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {tab === "attachments" && (
          <div>
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
    </div>
  );
}
