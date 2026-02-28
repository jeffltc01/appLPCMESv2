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
import { ArrowClockwise24Regular } from "@fluentui/react-icons";
import { HelpEntryPoint } from "../components/help/HelpEntryPoint";
import { ordersApi } from "../services/orders";
import type { ReceivingOrderListItem } from "../types/order";

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

function buildAddress(order: ReceivingOrderListItem): string {
  const parts = [
    order.pickUpAddress,
    order.pickUpCity,
    order.pickUpState,
    order.pickUpPostalCode,
    order.pickUpCountry,
  ]
    .map((part) => part?.trim())
    .filter((part) => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : "-";
}

export function ReceivingQueuePage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ReceivingOrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersApi.receivingList();
      setOrders(result);
    } catch {
      setError("Unable to load receiving queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return orders;
    }
    return orders.filter((order) => {
      const haystack = [
        order.salesOrderNo,
        order.customerName,
        order.siteName,
        order.receivingMode,
        order.itemsOrderedSummary,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [orders, search]);

  const countLabel = `${filteredOrders.length} order(s) in receiving queue`;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div>
            <Title2>Receiving Queue</Title2>
            <Body1 className={styles.muted}>{countLabel}</Body1>
          </div>
          <div className={styles.headerActions}>
            <HelpEntryPoint route="/receiving" />
            <Button appearance="secondary" onClick={() => navigate("/")}>
              Back to Dashboard
            </Button>
            <Button
              appearance="secondary"
              icon={<ArrowClockwise24Regular />}
              onClick={() => void loadOrders()}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh Queue"}
            </Button>
          </div>
        </div>

        {error ? <Body1>{error}</Body1> : null}

        <Card className={styles.tableCard}>
          <div className={styles.controls}>
            <Field label="Search">
              <Input
                value={search}
                onChange={(_, data) => setSearch(data.value)}
                placeholder="Order no, customer, site, mode..."
              />
            </Field>
          </div>
          <div className={styles.tableWrap}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Order No</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Mode</TableHeaderCell>
                  <TableHeaderCell>Pickup Scheduled</TableHeaderCell>
                  <TableHeaderCell>Line Count</TableHeaderCell>
                  <TableHeaderCell>Ordered Qty</TableHeaderCell>
                  <TableHeaderCell>Pickup Address</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={styles.clickableRow}
                    onClick={() => navigate(`/receiving/${order.id}`)}
                  >
                    <TableCell>{order.salesOrderNo}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.receivingMode}</TableCell>
                    <TableCell>{formatDate(order.pickupScheduledDate)}</TableCell>
                    <TableCell>{order.lineCount}</TableCell>
                    <TableCell>{order.totalOrderedQuantity}</TableCell>
                    <TableCell>{buildAddress(order)}</TableCell>
                  </TableRow>
                ))}
                {!loading && filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>No receiving candidates found.</TableCell>
                    <TableCell>-</TableCell>
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
