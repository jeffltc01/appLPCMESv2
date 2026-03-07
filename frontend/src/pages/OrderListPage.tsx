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
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { Add24Regular } from "@fluentui/react-icons";
import { ordersApi } from "../services/orders";
import type { OrderDraftListItem } from "../types/order";
import { HelpEntryPoint } from "../components/help/HelpEntryPoint";
import { PageHeader } from "../components/layout/PageHeader";
import { formatOrderDisplayNo } from "../utils/orderNumber";

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
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  tableMeta: {
    color: tokens.colorNeutralForeground2,
    fontSize: "12px",
    padding: "0 4px 4px",
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
  clickableRow: {
    cursor: "pointer",
    ":nth-child(even)": {
      backgroundColor: "#fcfcfc",
    },
    ":hover": {
      backgroundColor: "#e0eff8",
    },
  },
  dataCell: {
    borderBottom: "1px solid #e8e8e8",
    paddingTop: "10px",
    paddingBottom: "10px",
  },
  orderNo: {
    color: "#123046",
    fontWeight: 700,
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "2px 10px",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  statusPillInfo: {
    backgroundColor: "#e0eff8",
    color: "#123046",
  },
  statusPillInProgress: {
    backgroundColor: "#fff3cd",
    color: "#856404",
  },
  statusPillReady: {
    backgroundColor: "#d1ecf1",
    color: "#0c5460",
  },
  statusPillComplete: {
    backgroundColor: "#f5f5f5",
    color: "#6e6e6e",
  },
  statusPillDefault: {
    backgroundColor: "#f5f5f5",
    color: "#242424",
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

function getLifecyclePillClass(
  styles: ReturnType<typeof useStyles>,
  lifecycleStatus: string | null | undefined
): string {
  const status = (lifecycleStatus ?? "").toLowerCase();
  if (!status) {
    return styles.statusPillDefault;
  }
  if (status.includes("invoice") && status.includes("invoiced")) {
    return styles.statusPillComplete;
  }
  if (status.includes("invoice")) {
    return styles.statusPillReady;
  }
  if (status.includes("production")) {
    return styles.statusPillInProgress;
  }
  if (status.includes("draft") || status.includes("pending") || status.includes("inbound")) {
    return styles.statusPillInfo;
  }
  return styles.statusPillDefault;
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
        <PageHeader
          title="Sales Orders"
          actions={
            <>
              <Button appearance="secondary" onClick={() => navigate("/")}>
                Back to Dashboard
              </Button>
              <Button
                appearance="secondary"
                icon={<Add24Regular />}
                onClick={() => navigate("/orders/new")}
              >
                Create New Order
              </Button>
              <HelpEntryPoint route="/orders" />
            </>
          }
        />

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
              <Body1 className={styles.tableMeta}>
                {loading ? "Loading sales orders..." : `${orders.length} sales order(s)`}
              </Body1>
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
                      <TableHeaderCell className={styles.tableHeaderCell}>Order No</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Customer</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Lifecycle Status</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Legacy Status</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Order Date</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Site</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className={styles.clickableRow}
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <TableCell className={styles.dataCell}>
                          <span className={styles.orderNo}>
                            {formatOrderDisplayNo(order.salesOrderNo, order.ipadOrderNo)}
                          </span>
                        </TableCell>
                        <TableCell className={styles.dataCell}>{order.customerName}</TableCell>
                        <TableCell className={styles.dataCell}>
                          <span
                            className={mergeClasses(
                              styles.statusPill,
                              getLifecyclePillClass(styles, order.orderLifecycleStatus)
                            )}
                          >
                            {order.orderLifecycleStatus ?? "-"}
                          </span>
                        </TableCell>
                        <TableCell className={styles.dataCell}>{order.orderStatus}</TableCell>
                        <TableCell className={styles.dataCell}>{formatDate(order.orderDate)}</TableCell>
                        <TableCell className={styles.dataCell}>{order.siteName}</TableCell>
                      </TableRow>
                    ))}
                    {!loading && orders.length === 0 ? (
                      <TableRow>
                        <TableCell className={styles.dataCell}>-</TableCell>
                        <TableCell className={styles.dataCell}>-</TableCell>
                        <TableCell className={styles.dataCell}>No orders found.</TableCell>
                        <TableCell className={styles.dataCell}>-</TableCell>
                        <TableCell className={styles.dataCell}>-</TableCell>
                        <TableCell className={styles.dataCell}>-</TableCell>
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
