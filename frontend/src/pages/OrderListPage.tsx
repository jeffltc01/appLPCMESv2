import { useEffect, useMemo, useState } from "react";
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
import { Add24Regular } from "@fluentui/react-icons";
import { ordersApi } from "../services/orders";
import type { OrderDraftListItem } from "../types/order";
import { HelpEntryPoint } from "../components/help/HelpEntryPoint";

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
  clickableRow: {
    cursor: "pointer",
  },
  muted: {
    color: tokens.colorNeutralForeground2,
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

  const filteredCountLabel = useMemo(() => {
    if (!search.trim()) {
      return `${orders.length} order(s)`;
    }
    return `${orders.length} result(s)`;
  }, [orders.length, search]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div>
            <Title2>Sales Orders</Title2>
            <Body1 className={styles.muted}>{filteredCountLabel}</Body1>
          </div>
          <div className={styles.headerActions}>
            <HelpEntryPoint route="/orders" />
            <Button appearance="secondary" onClick={() => navigate("/transportation")}>
              Transportation Dispatch
            </Button>
            <Button appearance="secondary" onClick={() => navigate("/invoices")}>
              Invoice Screen
            </Button>
            <Button
              appearance="primary"
              icon={<Add24Regular />}
              onClick={() => navigate("/orders/new")}
            >
              Create New Order
            </Button>
          </div>
        </div>

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
          {error ? <Body1>{error}</Body1> : null}
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
                    <TableCell>{order.salesOrderNo}</TableCell>
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
    </div>
  );
}
