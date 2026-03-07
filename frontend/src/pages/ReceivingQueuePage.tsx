import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
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
import { ordersApi } from "../services/orders";
import type { ReceivingOrderListItem } from "../types/order";
import { formatOrderDisplayNo } from "../utils/orderNumber";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  main: {
    display: "grid",
    gridTemplateRows: "56px minmax(0, 1fr)",
    minHeight: "100vh",
  },
  shell: {
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  content: {
    padding: tokens.spacingVerticalL,
  },
  controls: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "end",
  },
  siteSelect: {
    minWidth: "280px",
  },
  tableCard: {
    border: "1px solid #e8e8e8",
  },
  tableWrap: {
    overflow: "auto",
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
  if ((order.receivingMode ?? "").trim().toLowerCase() === "customer drop off") {
    return "-";
  }

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
  const [siteFilter, setSiteFilter] = useState("All");

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

  const siteOptions = useMemo(() => {
    const sites = new Set<string>();
    for (const order of orders) {
      const name = order.siteName?.trim();
      if (name) {
        sites.add(name);
      }
    }
    return [...sites].sort((a, b) => a.localeCompare(b));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (siteFilter !== "All" && order.siteName !== siteFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        formatOrderDisplayNo(order.salesOrderNo, order.ipadOrderNo),
        order.customerName,
        order.siteName,
        order.receivingMode,
        order.itemsOrderedSummary,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [orders, search, siteFilter]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <PageHeader
          title="Receiving Queue"
          actions={
            <>
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
              <HelpEntryPoint route="/receiving" />
            </>
          }
        />
        <section className={styles.content}>
          <div className={styles.shell}>
            {error ? <Body1>{error}</Body1> : null}

            <Card className={styles.tableCard}>
              <div className={styles.controls}>
                <Field label="Site">
                  <Select
                    className={styles.siteSelect}
                    value={siteFilter}
                    onChange={(_, data) => setSiteFilter(data.value)}
                  >
                    <option value="All">All Sites</option>
                    {siteOptions.map((siteName) => (
                      <option key={siteName} value={siteName}>
                        {siteName}
                      </option>
                    ))}
                  </Select>
                </Field>
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
                      <TableHeaderCell className={styles.tableHeaderCell}>Order No</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Customer</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Mode</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Pickup Scheduled</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Line Count</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Ordered Qty</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Pickup Address</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className={styles.clickableRow}
                        onClick={() => navigate(`/receiving/${order.id}`)}
                      >
                        <TableCell>
                          {formatOrderDisplayNo(order.salesOrderNo, order.ipadOrderNo)}
                        </TableCell>
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
        </section>
      </main>
    </div>
  );
}
