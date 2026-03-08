import {
  Body1,
  Button,
  Card,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Title1,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import {
  ClipboardCheckmark24Regular,
  ClipboardTask24Regular,
  VehicleTruckProfile24Regular,
  Receipt24Regular,
  Board24Regular,
  PeopleTeam24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { formatCurrentUserDisplayName } from "../auth/userDisplay";
import { getWorkspaceCurrentStatus, ordersApi } from "../services/orders";
import type { OrderDraftListItem } from "../types/order";

const NAV_ITEMS = [
  { key: "orderEntry", label: "Order Entry", icon: <ClipboardTask24Regular />, path: "/orders" },
  { key: "transportation", label: "Transportation", icon: <VehicleTruckProfile24Regular />, path: "/transportation" },
  { key: "receiving", label: "Receiving", icon: <ClipboardCheckmark24Regular />, path: "/receiving" },
  { key: "invoicing", label: "Invoicing", icon: <Receipt24Regular />, path: "/invoices" },
  { key: "plantManager", label: "Plant Manager", icon: <PeopleTeam24Regular />, path: "/plant-manager" },
  { key: "workCenter", label: "Work Center", icon: <Board24Regular />, path: "/operator/work-center" },
];

const ADMIN_MENU_ITEMS = [
  { key: "product-lines", label: "Product Lines", path: "/setup/production-lines", enabled: true },
  { key: "items", label: "Items", path: "/setup/items", enabled: true },
  { key: "work-centers", label: "Work Centers", path: "/setup/work-centers", enabled: true },
  { key: "tablet-setup", label: "Tablet Setup", path: "/setup/tablet", enabled: true },
  { key: "route-templates", label: "Route Templates", path: "/setup/route-templates", enabled: true },
  { key: "users", label: "Users", path: "/setup/users", enabled: true },
  { key: "roles", label: "Roles", path: "/setup/roles", enabled: true },
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
  utilityLogoutButton: {
    minHeight: "28px",
  },
  topMenu: {
    backgroundColor: "#123046",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  brand: {
    fontWeight: 700,
    fontSize: "16px",
    letterSpacing: "0.02em",
  },
  dashboardNavStrip: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },
  dashboardNavButton: {
    minHeight: "68px",
    width: "168px",
    maxWidth: "168px",
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
    gap: tokens.spacingVerticalS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "8px",
    background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
    paddingTop: tokens.spacingVerticalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
  },
  kpiHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground2,
    fontWeight: 600,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  kpiIconWrap: {
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    display: "grid",
    placeItems: "center",
    backgroundColor: "#E0EFF8",
    color: "#123046",
  },
  kpiValue: {
    fontSize: "30px",
    fontWeight: 700,
    color: "#123046",
    lineHeight: 1,
  },
  kpiHint: {
    color: tokens.colorNeutralForeground3,
    fontSize: "12px",
  },
  kpiAccentOpen: {
    borderTop: "4px solid #123046",
  },
  kpiAccentAwaitingReceipt: {
    borderTop: "4px solid #017CC5",
  },
  kpiAccentInProduction: {
    borderTop: "4px solid #2B3B84",
  },
  kpiAccentAwaitingInvoicing: {
    borderTop: "4px solid #0095EB",
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
  chartsGrid: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  chartsTopRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  chartsBottomRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  chartCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "grid",
    gap: tokens.spacingVerticalS,
  },
  chartTitle: {
    color: "#123046",
    fontWeight: 700,
    fontSize: "14px",
  },
  chartSubtitle: {
    color: tokens.colorNeutralForeground2,
    fontSize: "12px",
  },
  bucketChart: {
    width: "100%",
    height: "220px",
  },
  lineChartWrap: {
    width: "100%",
    height: "220px",
  },
  lineChartAxisLabel: {
    fontSize: "12px",
    fill: tokens.colorNeutralForeground2,
  },
  noData: {
    color: tokens.colorNeutralForeground2,
    fontSize: "12px",
  },
});

const LIFECYCLE_STAGE_KEYS = [
  "Draft",
  "PendingOrderEntryValidation",
  "InboundLogisticsPlanned",
  "ReadyForProduction",
  "InvoiceReady",
] as const;

const NEEDS_REVIEW_STATUSES = new Set(["Draft", "PendingOrderEntryValidation"]);
const AWAITING_RECEIPT_STATUSES = new Set([
  "Draft",
  "PendingOrderEntryValidation",
  "InboundLogisticsPlanned",
  "InboundInTransit",
]);
const IN_PRODUCTION_STATUSES = new Set([
  "ReceivedPendingReconciliation",
  "ReadyForProduction",
  "InProduction",
  "ProductionCompletePendingApproval",
  "ProductionComplete",
  "OutboundLogisticsPlanned",
]);
const AWAITING_INVOICING_STATUSES = new Set(["DispatchedOrPickupReleased", "InvoiceReady"]);

function getLifecycleStatus(order: OrderDraftListItem): string {
  const rawStatus = order.orderLifecycleStatus ?? order.orderStatus;
  return getWorkspaceCurrentStatus(rawStatus);
}

type MonthlyAveragePoint = {
  month: string;
  value: number;
};

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function toMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString(undefined, { month: "short", year: "2-digit" });
}

function diffDays(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return (end.getTime() - start.getTime()) / msPerDay;
}

function buildMonthlyAverage(
  orders: OrderDraftListItem[],
  getStart: (order: OrderDraftListItem) => Date | null,
  getEnd: (order: OrderDraftListItem) => Date | null
): MonthlyAveragePoint[] {
  const totals = new Map<string, { total: number; count: number }>();
  for (const order of orders) {
    const start = getStart(order);
    const end = getEnd(order);
    if (!start || !end) {
      continue;
    }
    const days = diffDays(start, end);
    if (days < 0) {
      continue;
    }
    const monthKey = toMonthKey(end);
    const current = totals.get(monthKey) ?? { total: 0, count: 0 };
    totals.set(monthKey, { total: current.total + days, count: current.count + 1 });
  }

  return Array.from(totals.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, aggregate]) => ({
      month,
      value: Math.round((aggregate.total / aggregate.count) * 10) / 10,
    }))
    .slice(-12);
}

function buildNiceTicks(maxValue: number, targetTickCount = 5): number[] {
  if (maxValue <= 0) {
    return [0, 1];
  }

  const safeTargetCount = Math.max(2, targetTickCount);
  const rawStep = maxValue / (safeTargetCount - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;

  let niceStep: number;
  if (residual <= 1) {
    niceStep = 1 * magnitude;
  } else if (residual <= 2) {
    niceStep = 2 * magnitude;
  } else if (residual <= 5) {
    niceStep = 5 * magnitude;
  } else {
    niceStep = 10 * magnitude;
  }

  const niceMax = Math.ceil(maxValue / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let value = 0; value <= niceMax; value += niceStep) {
    ticks.push(value);
  }
  if (ticks[ticks.length - 1] !== niceMax) {
    ticks.push(niceMax);
  }
  return ticks;
}

export function MenuPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [orders, setOrders] = useState<OrderDraftListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allOrders: OrderDraftListItem[] = [];
        let page = 1;
        let totalCount = Number.POSITIVE_INFINITY;

        while (allOrders.length < totalCount) {
          const response = await ordersApi.list({ page });
          allOrders.push(...response.items);
          totalCount = response.totalCount;

          if (response.items.length === 0) {
            break;
          }
          page += 1;
        }

        setOrders(allOrders);
      } catch {
        setError("Unable to load order metrics.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders;
  }, [orders]);

  const kpis = useMemo(() => {
    const openOrders = filteredOrders.filter(
      (order) => getLifecycleStatus(order) !== "Invoiced"
    ).length;
    const awaitingReceipt = filteredOrders.filter((order) =>
      AWAITING_RECEIPT_STATUSES.has(getLifecycleStatus(order))
    ).length;
    const inProduction = filteredOrders.filter((order) =>
      IN_PRODUCTION_STATUSES.has(getLifecycleStatus(order))
    ).length;
    const awaitingInvoicing = filteredOrders.filter((order) =>
      AWAITING_INVOICING_STATUSES.has(getLifecycleStatus(order))
    ).length;

    return { openOrders, awaitingReceipt, inProduction, awaitingInvoicing };
  }, [filteredOrders]);

  const openOrderAgingChart = useMemo(() => {
    const now = new Date();
    const buckets = [
      { key: "0-15", label: "0-15", count: 0 },
      { key: "16-30", label: "16-30", count: 0 },
      { key: "31-60", label: "31-60", count: 0 },
      { key: "60-plus", label: ">60", count: 0 },
    ];

    for (const order of filteredOrders) {
      if (getLifecycleStatus(order) === "Invoiced") {
        continue;
      }
      const orderDate = toDate(order.orderDate);
      if (!orderDate) {
        continue;
      }
      const ageDays = Math.floor(diffDays(orderDate, now));
      if (ageDays <= 15) {
        buckets[0].count += 1;
      } else if (ageDays <= 30) {
        buckets[1].count += 1;
      } else if (ageDays <= 60) {
        buckets[2].count += 1;
      } else {
        buckets[3].count += 1;
      }
    }

    const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));
    const ticks = buildNiceTicks(maxCount);
    const yAxisMax = ticks[ticks.length - 1] ?? maxCount;
    return {
      buckets,
      maxCount,
      yAxisMax,
      ticks,
    };
  }, [filteredOrders]);
  const avgDaysToPickupByMonth = useMemo(
    () => buildMonthlyAverage(filteredOrders, (order) => toDate(order.orderDate), (order) => toDate(order.receivedDate)),
    [filteredOrders]
  );
  const avgDaysToManufacturerByMonth = useMemo(
    () => buildMonthlyAverage(filteredOrders, (order) => toDate(order.receivedDate), (order) => toDate(order.readyToInvoiceDate)),
    [filteredOrders]
  );
  const avgDaysToInvoiceByMonth = useMemo(
    () => buildMonthlyAverage(filteredOrders, (order) => toDate(order.readyToInvoiceDate), (order) => toDate(order.invoiceDate)),
    [filteredOrders]
  );
  const avgTotalOrderToInvoiceByMonth = useMemo(
    () => buildMonthlyAverage(filteredOrders, (order) => toDate(order.orderDate), (order) => toDate(order.invoiceDate)),
    [filteredOrders]
  );

  const currentUserLabel = formatCurrentUserDisplayName(
    session?.displayName,
    "Unknown User"
  );
  const currentSiteLabel = session?.siteName || "Unassigned";
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };
  const renderLineChart = (points: MonthlyAveragePoint[], goalDays?: number) => {
    if (points.length === 0) {
      return <span className={styles.noData}>No data available for this chart yet.</span>;
    }

    const width = 520;
    const height = 220;
    const leftPad = 44;
    const rightPad = 12;
    const topPad = 12;
    const bottomPad = 28;
    const plotWidth = width - leftPad - rightPad;
    const plotHeight = height - topPad - bottomPad;
    const dataMax = Math.max(1, ...points.map((point) => point.value), goalDays ?? 0);
    const yTicks = buildNiceTicks(dataMax);
    const maxY = yTicks[yTicks.length - 1] ?? dataMax;
    const avgYValue = points.reduce((sum, point) => sum + point.value, 0) / points.length;
    const coordinates = points.map((point, index) => {
      const x =
        leftPad +
        (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
      const y = topPad + (1 - point.value / maxY) * plotHeight;
      return { ...point, x, y };
    });
    const polylinePoints = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
    const avgLineY = topPad + (1 - avgYValue / maxY) * plotHeight;
    const goalLineY =
      goalDays !== undefined ? topPad + (1 - Math.min(goalDays, maxY) / maxY) * plotHeight : null;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.lineChartWrap} role="img" aria-label="Monthly average days chart">
        {yTicks.map((tick) => {
          if (tick === 0) {
            return null;
          }
          const y = topPad + (1 - tick / maxY) * plotHeight;
          return (
            <g key={`line-y-tick-${tick}`}>
              <line x1={leftPad} y1={y} x2={width - rightPad} y2={y} stroke="#D2D2D2" />
              <text
                x={leftPad - 6}
                y={y + 4}
                textAnchor="end"
                className={styles.lineChartAxisLabel}
                data-line-chart-y-tick="true"
              >
                {tick}
              </text>
            </g>
          );
        })}
        <line x1={leftPad} y1={topPad} x2={leftPad} y2={height - bottomPad} stroke="#D2D2D2" />
        <line x1={leftPad} y1={height - bottomPad} x2={width - rightPad} y2={height - bottomPad} stroke="#D2D2D2" />
        <text
          x={leftPad - 6}
          y={height - bottomPad + 4}
          textAnchor="end"
          className={styles.lineChartAxisLabel}
          data-line-chart-y-tick="true"
        >
          0
        </text>
        {goalLineY !== null ? (
          <>
            <line
              x1={leftPad}
              y1={goalLineY}
              x2={width - rightPad}
              y2={goalLineY}
              stroke="#107C10"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
            <text
              x={leftPad + 4}
              y={Math.max(topPad + 10, goalLineY - 4)}
              textAnchor="start"
              className={styles.lineChartAxisLabel}
            >
              Goal {Math.round(goalDays)}d
            </text>
          </>
        ) : null}
        <line
          x1={leftPad}
          y1={avgLineY}
          x2={width - rightPad}
          y2={avgLineY}
          stroke="#6E6E6E"
          strokeDasharray="6 4"
          strokeWidth="1.5"
        />
        <text
          x={width - rightPad}
          y={Math.max(topPad + 10, avgLineY - 6)}
          textAnchor="end"
          className={styles.lineChartAxisLabel}
        >
          Avg {Math.round(avgYValue)}d
        </text>
        <polyline fill="none" stroke="#123046" strokeWidth="2.5" points={polylinePoints} />
        {coordinates.map((point) => (
          <g key={point.month}>
            <circle cx={point.x} cy={point.y} r="3.5" fill="#017CC5" />
            <text x={point.x} y={height - 10} textAnchor="middle" className={styles.lineChartAxisLabel}>
              {toMonthLabel(point.month)}
            </text>
          </g>
        ))}
      </svg>
    );
  };
  const renderAgingBucketChart = () => {
    const width = 560;
    const height = 220;
    const leftPad = 44;
    const rightPad = 12;
    const topPad = 12;
    const bottomPad = 38;
    const plotWidth = width - leftPad - rightPad;
    const plotHeight = height - topPad - bottomPad;
    const plotBottom = topPad + plotHeight;
    const bucketBand = plotWidth / openOrderAgingChart.buckets.length;
    const barWidth = Math.min(80, Math.max(44, bucketBand * 0.62));
    const yFor = (value: number) => topPad + (1 - value / openOrderAgingChart.yAxisMax) * plotHeight;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.bucketChart}
        role="img"
        aria-label="Open order aging buckets chart"
      >
        {openOrderAgingChart.ticks.map((tick, index) => {
          const y = yFor(tick);
          return (
            <g key={`aging-grid-${index}`}>
              <line x1={leftPad} y1={y} x2={width - rightPad} y2={y} stroke="#B8B8B8" />
              <text
                x={leftPad - 10}
                y={y + 4}
                textAnchor="end"
                className={styles.lineChartAxisLabel}
                data-aging-chart-y-tick="true"
              >
                {tick}
              </text>
            </g>
          );
        })}
        <line x1={leftPad} y1={topPad} x2={leftPad} y2={plotBottom} stroke="#D2D2D2" />
        <line x1={leftPad} y1={plotBottom} x2={width - rightPad} y2={plotBottom} stroke="#D2D2D2" />
        {openOrderAgingChart.buckets.map((bucket, index) => {
          const xCenter = leftPad + bucketBand * (index + 0.5);
          const barHeight = (bucket.count / openOrderAgingChart.yAxisMax) * plotHeight;
          const barY = plotBottom - barHeight;
          const labelY = Math.max(topPad + 10, barY - 6);
          return (
            <g
              key={bucket.key}
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() =>
                navigate({
                  pathname: "/orders",
                  search: `?agingBucket=${encodeURIComponent(bucket.key)}`,
                })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate({
                    pathname: "/orders",
                    search: `?agingBucket=${encodeURIComponent(bucket.key)}`,
                  });
                }
              }}
            >
              <rect
                x={xCenter - barWidth / 2}
                y={barY}
                width={barWidth}
                height={barHeight}
                rx={6}
                fill="url(#agingBarGradient)"
              />
              <text x={xCenter} y={labelY} textAnchor="middle" fontSize="12" fill="#123046" fontWeight="600">
                {bucket.count}
              </text>
              <text x={xCenter} y={height - 10} textAnchor="middle" className={styles.lineChartAxisLabel}>
                {bucket.label} days
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="agingBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#017CC5" />
            <stop offset="100%" stopColor="#123046" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className={styles.page}>
      <main className={styles.content}>
        <div className={styles.topUtility}>
          <span>{currentUserLabel}</span>
          <Button
            className={styles.utilityLogoutButton}
            appearance="secondary"
            onClick={() => void handleLogout()}
          >
            Logout
          </Button>
          <span>Site: {currentSiteLabel}</span>
        </div>

        <div className={styles.topMenu}>
        </div>

        <div className={styles.headerBar}>
          <Title1>LP Cylinder</Title1>
          <div className={styles.headerActions} />
        </div>

        <section className={styles.body}>
          {isLoading ? <Body1>Loading metrics...</Body1> : null}
          {error ? <Body1>{error}</Body1> : null}

          <div className={styles.dashboardNavStrip}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.key}
                icon={item.icon}
                appearance="secondary"
                className={styles.dashboardNavButton}
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
                  className={styles.dashboardNavButton}
                >
                  Admin
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

          <div className={styles.kpiStrip}>
            <Card className={mergeClasses(styles.kpiCard, styles.kpiAccentOpen)}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiIconWrap}>
                  <ClipboardTask24Regular />
                </span>
                <span>Total Open Orders</span>
              </div>
              <div className={styles.kpiValue}>{kpis.openOrders}</div>
              <span className={styles.kpiHint}>All non-invoiced orders</span>
            </Card>
            <Card className={mergeClasses(styles.kpiCard, styles.kpiAccentAwaitingReceipt)}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiIconWrap}>
                  <ClipboardCheckmark24Regular />
                </span>
                <span>Total Awaiting Receipt</span>
              </div>
              <div className={styles.kpiValue}>{kpis.awaitingReceipt}</div>
              <span className={styles.kpiHint}>Not yet received at plant</span>
            </Card>
            <Card className={mergeClasses(styles.kpiCard, styles.kpiAccentInProduction)}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiIconWrap}>
                  <Board24Regular />
                </span>
                <span>Total In Production</span>
              </div>
              <div className={styles.kpiValue}>{kpis.inProduction}</div>
              <span className={styles.kpiHint}>Received but not yet shipped</span>
            </Card>
            <Card className={mergeClasses(styles.kpiCard, styles.kpiAccentAwaitingInvoicing)}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiIconWrap}>
                  <Receipt24Regular />
                </span>
                <span>Total Awaiting Invoicing</span>
              </div>
              <div className={styles.kpiValue}>{kpis.awaitingInvoicing}</div>
              <span className={styles.kpiHint}>Shipped/released and not invoiced</span>
            </Card>
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartsTopRow}>
              <Card className={styles.chartCard}>
                <span className={styles.chartTitle}>Open Order Aging Buckets</span>
                <span className={styles.chartSubtitle}>From order date to today for non-invoiced orders</span>
                {renderAgingBucketChart()}
              </Card>

              <Card className={styles.chartCard}>
                <span className={styles.chartTitle}>Avg Total Days Order to Invoice (Monthly)</span>
                <span className={styles.chartSubtitle}>Order date to invoiced date</span>
                {renderLineChart(avgTotalOrderToInvoiceByMonth, 14)}
              </Card>
            </div>

            <div className={styles.chartsBottomRow}>
              <Card className={styles.chartCard}>
                <span className={styles.chartTitle}>Avg Days to Pickup (Monthly)</span>
                <span className={styles.chartSubtitle}>Order date to received date</span>
                {renderLineChart(avgDaysToPickupByMonth)}
              </Card>

              <Card className={styles.chartCard}>
                <span className={styles.chartTitle}>Avg Days to Manufacturer (Monthly)</span>
                <span className={styles.chartSubtitle}>Received date to ready-to-invoice date</span>
                {renderLineChart(avgDaysToManufacturerByMonth)}
              </Card>

              <Card className={styles.chartCard}>
                <span className={styles.chartTitle}>Avg Days to Invoice (Monthly)</span>
                <span className={styles.chartSubtitle}>Ready-to-invoice date to invoiced date</span>
                {renderLineChart(avgDaysToInvoiceByMonth)}
              </Card>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
