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
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Add24Regular } from "@fluentui/react-icons";
import { ordersApi } from "../services/orders";
import type { OrderDraftListItem } from "../types/order";
import { HelpEntryPoint } from "../components/help/HelpEntryPoint";
import { formatOrderDisplayNo } from "../utils/orderNumber";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  main: {
    display: "grid",
    gridTemplateRows: "44px 56px minmax(0, 1fr)",
    height: "100vh",
    minWidth: 0,
  },
  utilityBar: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  headerTitle: {
    color: "#ffffff",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  content: {
    padding: "16px 20px",
    overflow: "hidden",
    minHeight: 0,
  },
  shell: {
    maxWidth: "1200px",
    height: "100%",
    minHeight: 0,
    margin: "0 auto",
    display: "grid",
    gap: tokens.spacingVerticalM,
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
  },
  tableWrap: {
    overflow: "auto",
    minHeight: 0,
    flex: 1,
  },
  clickableRow: {
    cursor: "pointer",
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

export function OrderListPage() {
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
        pageSize: 100,
        search: (query ?? "").trim() || undefined,
      });
      setOrders(result.items);
    } catch {
      setError("Unable to load orders.");
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
        <div className={styles.utilityBar}>
          <Button appearance="subtle" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
          <HelpEntryPoint route="/orders" />
        </div>
        <header className={styles.headerBar}>
          <Title2 className={styles.headerTitle}>Sales Orders</Title2>
          <div className={styles.headerActions}>
            <Button
              appearance="secondary"
              icon={<Add24Regular />}
              onClick={() => navigate("/orders/new")}
            >
              Create New Order
            </Button>
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.shell}>
            <Card className={styles.tableCard}>
              <div className={styles.controls}>
                <Field label="Search">
                  <Input
                    value={search}
                    onChange={(_, data) => setSearch(data.value)}
                    placeholder="Order no, customer, or status"
                  />
                </Field>
                <Button
                  appearance="secondary"
                  onClick={() => void loadOrders(search)}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Search"}
                </Button>
              </div>
              {error ? (
                <div className={styles.errorBanner}>
                  <span className={styles.errorTitle}>Error</span>
                  <span className={styles.errorMessage}>{error}</span>
                </div>
              ) : null}
              <div className={styles.tableWrap}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Order No</TableHeaderCell>
                      <TableHeaderCell>Customer</TableHeaderCell>
                      <TableHeaderCell>Lifecycle Status</TableHeaderCell>
                      <TableHeaderCell>Legacy Status</TableHeaderCell>
                      <TableHeaderCell>Order Date</TableHeaderCell>
                      <TableHeaderCell>Site</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className={styles.clickableRow}
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <TableCell>
                          {formatOrderDisplayNo(order.salesOrderNo, order.ipadOrderNo)}
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{order.orderLifecycleStatus ?? "-"}</TableCell>
                        <TableCell>{order.orderStatus}</TableCell>
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                        <TableCell>{order.siteName}</TableCell>
                      </TableRow>
                    ))}
                    {!loading && orders.length === 0 ? (
                      <TableRow>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>No orders found.</TableCell>
                        <TableCell>-</TableCell>
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
