import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Body1,
  Button,
  Card,
  Field,
  Input,
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
import { ArrowClockwise24Regular } from "@fluentui/react-icons";
import { HelpEntryPoint } from "../components/help/HelpEntryPoint";
import { getWorkspaceCurrentStatus, ordersApi } from "../services/orders";
import type { OrderDraftListItem } from "../types/order";

const INVOICE_CANDIDATE_STATUSES = new Set(["DispatchedOrPickupReleased", "InvoiceReady"]);

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: tokens.spacingVerticalL,
  },
  shell: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  controls: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "end",
  },
  tableCard: {
    border: "1px solid #e8e8e8",
  },
  tableWrap: {
    overflow: "auto",
  },
  muted: {
    color: tokens.colorNeutralForeground2,
  },
  errorBanner: {
    border: "1px solid #e8b3b3",
    borderRadius: "4px",
    backgroundColor: "#fff5f5",
    padding: "10px 12px",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  errorTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#8a2f2f",
    marginRight: "4px",
  },
  errorMessage: {
    fontSize: "13px",
    color: "#8a2f2f",
  },
  clickableRow: {
    cursor: "pointer",
  },
});

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString();
}

function lifecycleStatusForOrder(order: OrderDraftListItem): string {
  return order.orderLifecycleStatus ?? getWorkspaceCurrentStatus(order.orderStatus);
}

export function InvoicePage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderDraftListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadOrders = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersApi.list({
        page: 1,
        pageSize: 200,
        search: (query ?? "").trim() || undefined,
      });
      const filtered = result.items.filter((order) =>
        INVOICE_CANDIDATE_STATUSES.has(lifecycleStatusForOrder(order))
      );
      setOrders(filtered);
    } catch {
      setError("Unable to load invoice queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders("");
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div>
            <Title2>Invoice Queue</Title2>
          </div>
          <div className={styles.headerActions}>
            <HelpEntryPoint route="/invoices" />
            <Button appearance="secondary" onClick={() => navigate("/")}>
              Back to Dashboard
            </Button>
            <Button
              appearance="secondary"
              icon={<ArrowClockwise24Regular />}
              onClick={() => void loadOrders(search)}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh Queue"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className={styles.errorBanner}>
            <span className={styles.errorTitle}>Error</span>
            <span className={styles.errorMessage}>{error}</span>
          </div>
        ) : null}

        <Card className={styles.tableCard}>
          <div className={styles.controls}>
            <Field label="Search">
              <Input
                value={search}
                onChange={(_, data) => setSearch(data.value)}
                placeholder="Order no, customer, or status"
              />
            </Field>
            <Button appearance="secondary" onClick={() => void loadOrders(search)} disabled={loading}>
              {loading ? "Loading..." : "Search"}
            </Button>
          </div>
          <div className={styles.tableWrap}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Order No</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Lifecycle Status</TableHeaderCell>
                  <TableHeaderCell>Order Date</TableHeaderCell>
                  <TableHeaderCell>Site</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const lifecycleStatus = lifecycleStatusForOrder(order);
                  return (
                    <TableRow
                      key={order.id}
                      className={styles.clickableRow}
                      onClick={() => navigate(`/invoices/${order.id}`)}
                    >
                      <TableCell>{order.salesOrderNo}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{lifecycleStatus}</TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>{order.siteName}</TableCell>
                    </TableRow>
                  );
                })}
                {!loading && orders.length === 0 ? (
                  <TableRow>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>No invoice candidates found.</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
