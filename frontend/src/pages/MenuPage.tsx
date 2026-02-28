import {
  Body1,
  Button,
  Card,
  Field,
  Input,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title1,
  Title3,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ClipboardTask24Regular,
  Filter24Regular,
  VehicleTruckProfile24Regular,
  Receipt24Regular,
  Board24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkspaceCurrentStatus, ordersApi } from "../services/orders";
import type { HoldOverlayType, OrderDraftListItem } from "../types/order";

const NAV_ITEMS = [
  { key: "orderEntry", label: "Order Entry", icon: <ClipboardTask24Regular />, path: "/orders" },
  { key: "workCenter", label: "Work Center", icon: <Board24Regular />, path: "/operator/work-center" },
  { key: "transportation", label: "Transportation", icon: <VehicleTruckProfile24Regular />, path: "/transportation" },
  { key: "receiving", label: "Receiving", icon: <VehicleTruckProfile24Regular />, path: "/receiving" },
  { key: "invoicing", label: "Invoicing", icon: <Receipt24Regular />, path: "/invoices" },
  { key: "plantManager", label: "Plant Manager", icon: <Board24Regular /> },
];

const ADMIN_MENU_ITEMS = [
  { key: "product-lines", label: "Product Lines", path: "/setup/production-lines", enabled: true },
  { key: "items", label: "Items", path: "/setup/items", enabled: true },
  { key: "work-centers", label: "Work Centers", path: "/setup/work-centers", enabled: true },
  { key: "tablet-setup", label: "Tablet Setup", path: "/setup/tablet", enabled: true },
  { key: "route-templates", label: "Route Templates", path: "/setup/route-templates", enabled: true },
  { key: "users-roles", label: "Users & Roles", path: "/setup/users-roles", enabled: true },
  { key: "order-audit-log", label: "Order Audit Log", path: "/setup/order-audit-log", enabled: true },
];

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#FCFCFC",
  },
  content: {
    display: "grid",
    gridTemplateRows: "44px 52px auto",
    minWidth: 0,
  },
  topUtility: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalL,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2,
    fontSize: "12px",
  },
  topMenu: {
    backgroundColor: "#123046",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: tokens.spacingHorizontalL,
    paddingLeft: tokens.spacingHorizontalL,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  brand: {
    fontWeight: 700,
    fontSize: "16px",
    letterSpacing: "0.02em",
  },
  menuButtons: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    flexWrap: "wrap",
  },
  menuButton: {
    minHeight: "34px",
  },
  headerBar: {
    backgroundColor: "#123046",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: tokens.spacingHorizontalL,
    paddingLeft: tokens.spacingHorizontalL,
  },
  headerActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
  headerActionButton: {
    minHeight: "32px",
  },
  filterPanel: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1.5fr) minmax(180px, 1fr) auto auto",
    gap: tokens.spacingHorizontalS,
    alignItems: "end",
    padding: tokens.spacingVerticalS,
    backgroundColor: "#FFFFFF",
    borderRadius: "4px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  body: {
    display: "grid",
    gap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalL,
    paddingRight: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalL,
    backgroundColor: "#F5F5F5",
  },
  kpiStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  kpiCard: {
    display: "grid",
    gap: tokens.spacingVerticalXS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  kpiValue: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#123046",
  },
  card: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalM,
  },
  itemList: {
    display: "grid",
    gap: tokens.spacingVerticalS,
  },
  barRow: {
    display: "grid",
    gridTemplateColumns: "160px minmax(0, 1fr) 40px",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    fontSize: "13px",
    color: tokens.colorNeutralForeground2,
  },
  barTrack: {
    height: "10px",
    backgroundColor: "#E8E8E8",
    borderRadius: "999px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#2B3B84",
  },
  lowerGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  clickableRow: {
    cursor: "pointer",
  },
  muted: {
    color: tokens.colorNeutralForeground2,
  },
  riskWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  donut: {
    width: "168px",
    height: "168px",
    borderRadius: "999px",
    backgroundImage:
      "conic-gradient(#2B3B84 0 50%, #017CC5 50% 78%, #0095EB 78% 100%)",
    display: "grid",
    placeItems: "center",
    margin: "0 auto",
  },
  donutInner: {
    width: "98px",
    height: "98px",
    borderRadius: "999px",
    backgroundColor: "#FFFFFF",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    color: "#123046",
    fontWeight: 700,
  },
  legend: {
    display: "grid",
    gap: tokens.spacingVerticalXS,
    alignContent: "center",
    fontSize: "13px",
    color: tokens.colorNeutralForeground2,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
  },
});

type FilterState = {
  search: string;
  status: string;
};

const LIFECYCLE_STAGE_KEYS = [
  "Draft",
  "PendingOrderEntryValidation",
  "InboundLogisticsPlanned",
  "ReadyForProduction",
  "InvoiceReady",
] as const;

const NEEDS_REVIEW_STATUSES = new Set(["Draft", "PendingOrderEntryValidation"]);
const READY_TO_RELEASE_STATUSES = new Set(["ProductionComplete", "OutboundLogisticsPlanned"]);
const NON_RISK_OVERLAYS = new Set<HoldOverlayType>(["Cancelled"]);

function getLifecycleStatus(order: OrderDraftListItem): string {
  const rawStatus = order.orderLifecycleStatus ?? order.orderStatus;
  return getWorkspaceCurrentStatus(rawStatus);
}

export function MenuPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderDraftListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<FilterState>({ search: "", status: "all" });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({ search: "", status: "all" });

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await ordersApi.list({ page: 1, pageSize: 200 });
        setOrders(response.items);
      } catch {
        setError("Unable to load order metrics.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const search = appliedFilters.search.trim().toLowerCase();
    return orders.filter((order) => {
      const lifecycleStatus = getLifecycleStatus(order);
      const statusMatches =
        appliedFilters.status === "all" || lifecycleStatus === appliedFilters.status;
      const searchMatches =
        !search ||
        order.salesOrderNo.toLowerCase().includes(search) ||
        order.customerName.toLowerCase().includes(search) ||
        lifecycleStatus.toLowerCase().includes(search);

      return statusMatches && searchMatches;
    });
  }, [orders, appliedFilters]);

  const kpis = useMemo(() => {
    const openOrders = filteredOrders.length;
    const needsReview = filteredOrders.filter((order) =>
      NEEDS_REVIEW_STATUSES.has(getLifecycleStatus(order))
    ).length;
    const lateRisk = filteredOrders.filter((order) => {
      if (!order.holdOverlay) {
        return false;
      }
      return !NON_RISK_OVERLAYS.has(order.holdOverlay);
    }).length;
    const readyToRelease = filteredOrders.filter((order) =>
      READY_TO_RELEASE_STATUSES.has(getLifecycleStatus(order))
    ).length;

    return { openOrders, needsReview, lateRisk, readyToRelease };
  }, [filteredOrders]);

  const intakeRows = useMemo(() => {
    const counts = LIFECYCLE_STAGE_KEYS.map((status) => ({
      name:
        status === "PendingOrderEntryValidation"
          ? "Pending Validation"
          : status === "InboundLogisticsPlanned"
          ? "Inbound Planned"
          : status === "ReadyForProduction"
          ? "Production Ready"
          : status === "InvoiceReady"
          ? "Invoice Ready"
          : status,
      count: filteredOrders.filter((order) => getLifecycleStatus(order) === status).length,
    }));
    const maxCount = Math.max(1, ...counts.map((row) => row.count));
    return counts.map((row) => ({
      ...row,
      widthPercent: Math.round((row.count / maxCount) * 100),
    }));
  }, [filteredOrders]);

  const riskMix = useMemo(() => {
    const total = filteredOrders.length;
    if (total === 0) {
      return { low: 0, medium: 0, high: 0, total: 0 };
    }

    const high = filteredOrders.filter((order) => Boolean(order.holdOverlay)).length;
    const medium = filteredOrders.filter(
      (order) =>
        !order.holdOverlay && NEEDS_REVIEW_STATUSES.has(getLifecycleStatus(order))
    ).length;
    const low = Math.max(0, total - high - medium);

    return { low, medium, high, total };
  }, [filteredOrders]);

  const queueRows = useMemo(() => filteredOrders.slice(0, 5), [filteredOrders]);
  const hasAnyData = orders.length > 0;
  const hasFilteredData = filteredOrders.length > 0;
  const riskLowEnd = riskMix.total === 0 ? 0 : Math.round((riskMix.low / riskMix.total) * 100);
  const riskMediumEnd =
    riskMix.total === 0
      ? 0
      : riskLowEnd + Math.round((riskMix.medium / riskMix.total) * 100);
  const donutGradient = `conic-gradient(#2B3B84 0 ${riskLowEnd}%, #017CC5 ${riskLowEnd}% ${riskMediumEnd}%, #0095EB ${riskMediumEnd}% 100%)`;

  const applyFilters = () => setAppliedFilters(pendingFilters);
  const resetFilters = () => {
    const reset = { search: "", status: "all" };
    setPendingFilters(reset);
    setAppliedFilters(reset);
  };

  return (
    <div className={styles.page}>
      <main className={styles.content}>
        <div className={styles.topUtility}>
          <span>Order Analyst</span>
          <span>Site: Houston</span>
        </div>

        <div className={styles.topMenu}>
          <div className={styles.brand}>LPC Order Ops</div>
          <div className={styles.menuButtons}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.key}
                icon={item.icon}
                appearance={item.key === "orderEntry" ? "primary" : "secondary"}
                className={styles.menuButton}
                onClick={item.path ? () => navigate(item.path) : undefined}
              >
                {item.label}
              </Button>
            ))}
            <Menu positioning="below-end">
              <MenuTrigger disableButtonEnhancement>
                <Button
                  icon={<Settings24Regular />}
                  appearance="secondary"
                  className={styles.menuButton}
                >
                  Admin Maintenance
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {ADMIN_MENU_ITEMS.map((item) => (
                    <MenuItem
                      key={item.key}
                      disabled={!item.enabled}
                      onClick={item.enabled ? () => navigate(item.path) : undefined}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>

        <div className={styles.headerBar}>
          <Title1>Order Entry Workspace</Title1>
          <div className={styles.headerActions}>
            <Button
              className={styles.headerActionButton}
              appearance="secondary"
              icon={<Filter24Regular />}
              onClick={() => setShowFilters((current) => !current)}
            >
              Filters
            </Button>
            <Button
              className={styles.headerActionButton}
              appearance="primary"
              onClick={() => navigate("/orders/new", { state: { backTo: "/" } })}
            >
              New Sales Order
            </Button>
          </div>
        </div>

        <section className={styles.body}>
          {showFilters ? (
            <div className={styles.filterPanel}>
              <Field label="Search">
                <Input
                  value={pendingFilters.search}
                  onChange={(_, data) =>
                    setPendingFilters((current) => ({ ...current, search: data.value }))
                  }
                  placeholder="SO, customer, status"
                />
              </Field>
              <Field label="Lifecycle Status">
                <Select
                  value={pendingFilters.status}
                  onChange={(event) =>
                    setPendingFilters((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  <option value="all">All statuses</option>
                  {LIFECYCLE_STAGE_KEYS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button appearance="primary" onClick={applyFilters}>
                Apply
              </Button>
              <Button appearance="secondary" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          ) : null}

          {isLoading ? <Body1>Loading metrics...</Body1> : null}
          {error ? <Body1>{error}</Body1> : null}

          <div className={styles.kpiStrip}>
            <Card className={styles.kpiCard}>
              <Body1>Open Orders</Body1>
              <div className={styles.kpiValue}>{kpis.openOrders}</div>
            </Card>
            <Card className={styles.kpiCard}>
              <Body1>Needs Review</Body1>
              <div className={styles.kpiValue}>{kpis.needsReview}</div>
            </Card>
            <Card className={styles.kpiCard}>
              <Body1>Late Risk</Body1>
              <div className={styles.kpiValue}>{kpis.lateRisk}</div>
            </Card>
            <Card className={styles.kpiCard}>
              <Body1>Ready to Release</Body1>
              <div className={styles.kpiValue}>{kpis.readyToRelease}</div>
            </Card>
          </div>

          <Card className={styles.card}>
            <div className={styles.cardHeader}>
              <Title3>Order Intake by Lifecycle Stage</Title3>
              <Body1>Last 24 hours</Body1>
            </div>
            <div className={styles.itemList}>
              {intakeRows.map((row) => (
                <div key={row.name} className={styles.barRow}>
                  <span>{row.name}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${row.widthPercent}%` }} />
                  </div>
                  <span>{row.count}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className={styles.lowerGrid}>
            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Title3>Open Order Queue</Title3>
                <Body1>{hasFilteredData ? "Filtered result set" : "No orders in view"}</Body1>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Order</TableHeaderCell>
                    <TableHeaderCell>Customer</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Site</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueRows.map((order) => (
                    <TableRow
                      key={order.id}
                      className={styles.clickableRow}
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <TableCell>{order.salesOrderNo}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{getLifecycleStatus(order)}</TableCell>
                      <TableCell>{order.siteName}</TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && !hasFilteredData ? (
                    <TableRow>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>No matching orders.</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </Card>

            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Title3>Order Risk Mix</Title3>
              </div>
              <div className={styles.riskWrap}>
                <div className={styles.donut} style={{ backgroundImage: donutGradient }}>
                  <div className={styles.donutInner}>
                    <div>{riskMix.total}</div>
                    <div style={{ fontSize: "11px", fontWeight: 500 }}>Total</div>
                  </div>
                </div>
                <div className={styles.legend}>
                  <div className={styles.legendItem}>
                    <span className={styles.dot} style={{ backgroundColor: "#2B3B84" }} />
                    <span>Low risk ({riskMix.low})</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.dot} style={{ backgroundColor: "#017CC5" }} />
                    <span>Medium risk ({riskMix.medium})</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.dot} style={{ backgroundColor: "#0095EB" }} />
                    <span>High risk ({riskMix.high})</span>
                  </div>
                  {!hasAnyData ? <span className={styles.muted}>No order data available.</span> : null}
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
