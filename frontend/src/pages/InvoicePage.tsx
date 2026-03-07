import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
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
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ArrowClockwise24Regular } from "@fluentui/react-icons";
import { HelpEntryPoint } from "../components/help/HelpEntryPoint";
import { PageHeader } from "../components/layout/PageHeader";
import { getWorkspaceCurrentStatus, ordersApi } from "../services/orders";
import type { OrderDraftListItem } from "../types/order";
import { formatOrderDisplayNo } from "../utils/orderNumber";

const INVOICE_CANDIDATE_STATUSES = new Set(["DispatchedOrPickupReleased", "InvoiceReady"]);

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  main: {
    display: "grid",
    gridTemplateRows: "56px minmax(0, 1fr)",
    height: "100vh",
    minWidth: 0,
  },
  shell: {
    maxWidth: "1200px",
    width: "100%",
    height: "100%",
    minHeight: 0,
    margin: "0 auto",
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  content: {
    padding: tokens.spacingVerticalL,
    overflow: "hidden",
    minHeight: 0,
  },
  controls: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "end",
  },
  tableCard: {
    border: "1px solid #e8e8e8",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  tableWrap: {
    overflow: "auto",
    minHeight: 0,
    flex: 1,
    border: "1px solid #e8e8e8",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
  },
  tableHeaderCell: {
    backgroundColor: "#123046",
    color: "#ffffff",
    fontWeight: 700,
    borderBottom: "1px solid #123046",
    position: "sticky",
    top: 0,
    zIndex: 1,
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
      <main className={styles.main}>
        <PageHeader
          title="Invoice Queue"
          actions={
            <>
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
              <HelpEntryPoint route="/invoices" />
            </>
          }
        />
        <section className={styles.content}>
          <div className={styles.shell}>
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
                      <TableHeaderCell className={styles.tableHeaderCell}>Order No</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Customer</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Lifecycle Status</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Order Date</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Site</TableHeaderCell>
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
                          <TableCell>
                            {formatOrderDisplayNo(order.salesOrderNo, order.ipadOrderNo)}
                          </TableCell>
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
        </section>
      </main>
    </div>
  );
}
