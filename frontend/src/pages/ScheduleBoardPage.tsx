import {
  Badge,
  Body1,
  Button,
  Card,
  Checkbox,
  Input,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowDown24Regular,
  ArrowLeft24Regular,
  ArrowRight24Regular,
  ArrowUp24Regular,
  Print24Regular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { ordersApi, orderLookupsApi } from "../services/orders";
import type {
  ScheduleBoard,
  ScheduleOrderCard,
  ProductLineScheduleInfo,
} from "../types/order";
import type { Lookup } from "../types/customer";
import { brandColors } from "../theme";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: brandColors.pageBackground,
  },
  body: {
    padding: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
    flexWrap: "wrap",
  },
  weekNav: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  capacityPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
  pill: {
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 600,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  boardArea: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    overflowX: "auto",
    minHeight: "400px",
  },
  sidebar: {
    minWidth: "260px",
    maxWidth: "260px",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    flexShrink: 0,
  },
  column: {
    minWidth: "200px",
    maxWidth: "200px",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    flexShrink: 0,
    border: `1px dashed ${brandColors.lightBlueTint}`,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  columnHeader: {
    fontWeight: 700,
    fontSize: "14px",
    marginBottom: tokens.spacingVerticalXS,
  },
  orderCard: {
    padding: tokens.spacingVerticalS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: "#fff",
    cursor: "grab",
    display: "grid",
    gap: tokens.spacingVerticalXS,
  },
  orderCardBanner: {
    padding: "2px 6px",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 600,
    margin: `-${tokens.spacingVerticalS} -${tokens.spacingVerticalS} ${tokens.spacingVerticalXS} -${tokens.spacingVerticalS}`,
  },
  orderNo: {
    fontWeight: 700,
  },
  dropZone: {
    minHeight: "60px",
    border: `2px dashed ${brandColors.lightBlueTint}`,
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.colorNeutralForeground3,
    fontSize: "12px",
  },
  errorBanner: {
    border: `1px solid ${brandColors.themeRed}`,
    backgroundColor: "#fff5f5",
    padding: tokens.spacingVerticalM,
    color: brandColors.themeRed,
    marginBottom: tokens.spacingVerticalM,
  },
  overdue: {
    color: brandColors.themeRed,
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalXS,
  },
  searchBox: {
    marginBottom: tokens.spacingVerticalS,
  },
  bulkToolbar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
  },
  orderCardWithCheckbox: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
  },
  orderCardContent: {
    flex: 1,
    minWidth: 0,
    display: "grid",
    gap: tokens.spacingVerticalXS,
  },
  capacitySection: {
    marginBottom: tokens.spacingVerticalS,
  },
  capacitySectionTitle: {
    fontWeight: 700,
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalS,
  },
  capacityPillWithStatus: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 600,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  pillTargetBadge: {
    fontSize: "10px",
    fontWeight: 700,
    color: tokens.colorNeutralForeground2,
    marginLeft: "2px",
  },
  capacityDetailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
  capacityCard: {
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "4px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  capacityCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalXS,
  },
  capacityCardBody: {
    marginBottom: tokens.spacingVerticalXS,
  },
});

function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "-";
  const parsed = new Date(value + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getWeekMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function getWeekRange(weekOf: string): { start: string; end: string } {
  const start = new Date(weekOf + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    start: start.toLocaleDateString([], { month: "short", day: "numeric" }),
    end: end.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
  };
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function getDayDate(weekOf: string, dayIndex: number): Date {
  const start = new Date(weekOf + "T00:00:00");
  start.setDate(start.getDate() + dayIndex);
  return start;
}

type CapacityStatus = "OK" | "Warning" | "Danger" | "No baseline";

function computeCapacityStatus(
  current: number,
  reference: number,
  peak: number
): CapacityStatus {
  if (reference <= 0 && peak <= 0) return "No baseline";
  if (current > peak) return "Danger";
  if (current > reference) return "Warning";
  return "OK";
}

function computeCurrentThisWeek(
  weekPool: ScheduleOrderCard[],
  dayAssigned: ScheduleOrderCard[]
): Map<string, number> {
  const map = new Map<string, number>();
  const orders = [...weekPool, ...dayAssigned];
  for (const order of orders) {
    for (const pl of order.productLineSummary) {
      const code = pl.productLineCode;
      map.set(code, (map.get(code) ?? 0) + pl.qty);
    }
  }
  return map;
}

export function ScheduleBoardPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [sites, setSites] = useState<Lookup[]>([]);
  const [siteId, setSiteId] = useState<number | null>(null);
  const [weekOf, setWeekOf] = useState(() => getWeekMonday(new Date()));
  const [data, setData] = useState<ScheduleBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCapacityDetail, setShowCapacityDetail] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());
  const [selectedBulkDay, setSelectedBulkDay] = useState<number>(0);


  const toggleSelection = useCallback((orderId: number) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedOrderIds(new Set()), []);

  const loadSites = useCallback(async () => {
    try {
      const list = await orderLookupsApi.sites();
      setSites(list);
    } catch {
      setError("Unable to load sites.");
    }
  }, []);

  const loadSchedule = useCallback(async () => {
    if (!weekOf) return;
    setLoading(true);
    setError(null);
    try {
      const result = await ordersApi.getSchedule({
        weekOf,
        siteId: siteId ?? undefined,
      });
      setData(result);
    } catch {
      setError("Unable to load schedule.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [weekOf, siteId]);

  const bulkAssignToWeek = useCallback(async () => {
    if (selectedOrderIds.size === 0) return;
    await ordersApi.bulkAssignSchedule({
      orderIds: Array.from(selectedOrderIds),
      scheduleWeekOf: weekOf,
      changedByEmpNo: "EMP001",
    });
    clearSelection();
    void loadSchedule();
  }, [selectedOrderIds, weekOf, loadSchedule, clearSelection]);

  const bulkAssignToDay = useCallback(async () => {
    if (selectedOrderIds.size === 0) return;
    const dayDate = getDayDate(weekOf, selectedBulkDay);
    await ordersApi.bulkAssignSchedule({
      orderIds: Array.from(selectedOrderIds),
      scheduleWeekOf: weekOf,
      targetDateUtc: dayDate.toISOString(),
      changedByEmpNo: "EMP001",
    });
    clearSelection();
    void loadSchedule();
  }, [selectedOrderIds, weekOf, selectedBulkDay, loadSchedule, clearSelection]);

  const bulkUnschedule = useCallback(async () => {
    if (selectedOrderIds.size === 0) return;
    await ordersApi.bulkAssignSchedule({
      orderIds: Array.from(selectedOrderIds),
      scheduleWeekOf: null,
      targetDateUtc: null,
      changedByEmpNo: "EMP001",
    });
    clearSelection();
    void loadSchedule();
  }, [selectedOrderIds, loadSchedule, clearSelection]);

  useEffect(() => {
    void loadSites();
  }, [loadSites]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const weekRange = useMemo(() => getWeekRange(weekOf), [weekOf]);

  const handlePrevWeek = () => {
    const d = new Date(weekOf + "T00:00:00");
    d.setDate(d.getDate() - 7);
    setWeekOf(getWeekMonday(d));
  };

  const handleNextWeek = () => {
    const d = new Date(weekOf + "T00:00:00");
    d.setDate(d.getDate() + 7);
    setWeekOf(getWeekMonday(d));
  };

  const handleToday = () => {
    setWeekOf(getWeekMonday(new Date()));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDragStart = (e: React.DragEvent, card: ScheduleOrderCard) => {
    e.dataTransfer.setData("application/json", JSON.stringify(card));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (
    e: React.DragEvent,
    target: { scheduleWeekOf?: string; targetDateUtc?: string } | "unscheduled"
  ) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const card = JSON.parse(raw) as ScheduleOrderCard;
    if (target === "unscheduled") {
      await ordersApi.updateSchedule(card.orderId, {
        scheduleWeekOf: null,
        targetDateUtc: null,
        changedByEmpNo: "EMP001",
      });
    } else {
      await ordersApi.updateSchedule(card.orderId, {
        scheduleWeekOf: target.scheduleWeekOf ?? undefined,
        targetDateUtc: target.targetDateUtc ?? undefined,
        changedByEmpNo: "EMP001",
      });
    }
    void loadSchedule();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const filteredUnscheduled = useMemo(() => {
    if (!data?.unscheduled) return [];
    if (!search.trim()) return data.unscheduled;
    const q = search.trim().toLowerCase();
    return data.unscheduled.filter(
      (c) =>
        c.orderNo.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.productLineSummary.some(
          (s) =>
            s.productLineCode.toLowerCase().includes(q) ||
            s.productLineName.toLowerCase().includes(q)
        )
    );
  }, [data?.unscheduled, search]);

  const dayColumns = useMemo(() => {
    return WEEKDAYS.map((day, i) => ({
      day,
      date: getDayDate(weekOf, i),
    }));
  }, [weekOf]);

  const dayAssignedByDay = useMemo(() => {
    if (!data?.dayAssigned) return new Map<number, ScheduleOrderCard[]>();
    const map = new Map<number, ScheduleOrderCard[]>();
    dayColumns.forEach((col, i) => {
      const dayStart = new Date(col.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(col.date);
      dayEnd.setHours(23, 59, 59, 999);
      const cards = data.dayAssigned.filter((c) => {
        if (!c.targetDateUtc) return false;
        const t = new Date(c.targetDateUtc);
        return t >= dayStart && t <= dayEnd;
      });
      map.set(i, cards);
    });
    return map;
  }, [data?.dayAssigned, dayColumns]);

  const productLineCodesOnSchedule = useMemo(() => {
    const cards = [
      ...(data?.unscheduled ?? []),
      ...(data?.carryover ?? []),
      ...(data?.weekPool ?? []),
      ...(data?.dayAssigned ?? []),
    ];
    const codes = new Set<string>();
    for (const card of cards) {
      for (const s of card.productLineSummary ?? []) {
        codes.add(s.productLineCode);
      }
    }
    return codes;
  }, [data?.unscheduled, data?.carryover, data?.weekPool, data?.dayAssigned]);

  const capacityMetrics = useMemo(() => {
    if (!data?.productLines) return [];
    const currentByCode = computeCurrentThisWeek(
      data.weekPool ?? [],
      data.dayAssigned ?? []
    );
    const lookback = data.throughputLookbackDays;
    return data.productLines
      .filter((pl) => productLineCodesOnSchedule.has(pl.code))
      .map((pl) => {
      const current = currentByCode.get(pl.code) ?? 0;
      const reference =
        pl.weeklyCapacityTarget ?? Math.round(pl.historicalAvgPerWeek);
      const peak = Math.ceil(pl.historicalPeakPerWeek);
      const status = computeCapacityStatus(current, reference, peak);
      const hasTarget = pl.weeklyCapacityTarget != null;
      return {
        pl,
        current,
        reference,
        peak,
        status,
        hasTarget,
        lookback,
      };
    });
  }, [data?.productLines, data?.weekPool, data?.dayAssigned, data?.throughputLookbackDays, productLineCodesOnSchedule]);

  return (
    <div className={`${styles.page} schedule-board-page`}>
      <PageHeader
        className="schedule-board-print-hide"
        title="Schedule board"
        actions={
          <>
            <Button
              className="schedule-board-print-hide"
              appearance="secondary"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </Button>
            <Button
              className="schedule-board-print-hide"
              appearance="subtle"
              icon={<Print24Regular />}
              onClick={handlePrint}
              aria-label="Print"
            >
              Print
            </Button>
          </>
        }
      />
      <main className={styles.body}>
        <div className="schedule-board-print-only" style={{ marginBottom: 16, fontSize: 18, fontWeight: 700 }}>
          Schedule board – {weekRange.start} – {weekRange.end}
        </div>
        {error ? (
          <div className={styles.errorBanner}>{error}</div>
        ) : null}

        <div className={`${styles.topBar} schedule-board-print-hide`}>
          <select
            value={siteId ?? ""}
            onChange={(e) => setSiteId(e.target.value ? Number(e.target.value) : null)}
            style={{ padding: "6px 10px", minWidth: "140px" }}
          >
            <option value="">All sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div className={styles.weekNav}>
            <Button
              appearance="subtle"
              icon={<ArrowLeft24Regular />}
              onClick={handlePrevWeek}
              aria-label="Previous week"
            />
            <Body1>
              {weekRange.start} – {weekRange.end}
            </Body1>
            <Button
              appearance="subtle"
              icon={<ArrowRight24Regular />}
              onClick={handleNextWeek}
              aria-label="Next week"
            />
            <Button appearance="secondary" onClick={handleToday}>
              Today
            </Button>
          </div>

          <Button
            appearance="subtle"
            icon={showCapacityDetail ? <ArrowUp24Regular /> : <ArrowDown24Regular />}
            onClick={() => setShowCapacityDetail((v) => !v)}
            aria-label={showCapacityDetail ? "Hide detail" : "Show detail"}
          >
            {showCapacityDetail ? "Hide detail" : "Show detail"}
          </Button>
        </div>

        {capacityMetrics.length > 0 ? (
          <div className={`${styles.capacitySection} schedule-board-print-hide`}>
            <div className={styles.capacitySectionTitle}>THIS WEEK</div>
            <div className={styles.capacityPills}>
              {capacityMetrics.map(({ pl, current, reference, status, hasTarget }) => (
                <span
                  key={pl.code}
                  className={styles.capacityPillWithStatus}
                  style={{
                    backgroundColor:
                      status === "Danger"
                        ? "rgba(164, 38, 44, 0.15)"
                        : status === "Warning"
                          ? "rgba(237, 125, 49, 0.15)"
                          : status === "OK"
                            ? "rgba(16, 124, 16, 0.15)"
                            : "#f5f5f5",
                    borderColor:
                      status === "Danger"
                        ? brandColors.themeRed
                        : status === "Warning"
                          ? tokens.colorPaletteMarigoldBackground1
                          : status === "OK"
                            ? tokens.colorPaletteGreenBackground1
                            : tokens.colorNeutralStroke2,
                  }}
                >
                  {pl.code} {current}/{reference}
                  {hasTarget ? (
                    <span className={styles.pillTargetBadge} title="Target set">T</span>
                  ) : null}{" "}
                  <Badge
                    color={
                      status === "Danger"
                        ? "danger"
                        : status === "Warning"
                          ? "warning"
                          : "informative"
                    }
                  >
                    {status === "No baseline" ? "OK" : status}
                  </Badge>
                </span>
              ))}
            </div>
            {showCapacityDetail ? (
              <div className={styles.capacityDetailGrid}>
                {capacityMetrics.map(({ pl, current, reference, peak, status, hasTarget }) => (
                  <CapacityDetailCard
                    key={pl.code}
                    styles={styles}
                    pl={pl}
                    current={current}
                    reference={reference}
                    peak={peak}
                    status={status}
                    hasTarget={hasTarget}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <Body1>Loading schedule...</Body1>
        ) : (
          <div className={`${styles.boardArea} schedule-board-area`}>
            <div className={`${styles.sidebar} schedule-board-sidebar`}>
              <div className={styles.sectionTitle}>
                UNSCHEDULED ({filteredUnscheduled.length})
              </div>
              <Input
                placeholder="Search orders..."
                value={search}
                onChange={(_, d) => setSearch(d.value)}
                className={styles.searchBox}
              />
              <div
                className={styles.dropZone}
                onDrop={(e) => handleDrop(e, "unscheduled")}
                onDragOver={handleDragOver}
              >
                Drop to unschedule
              </div>
              {filteredUnscheduled.map((card) => (
                <OrderCard
                  key={card.orderId}
                  card={card}
                  styles={styles}
                  onDragStart={handleDragStart}
                  onClick={() => navigate(`/orders/${card.orderId}`)}
                  isSelected={selectedOrderIds.has(card.orderId)}
                  onToggleSelection={() => toggleSelection(card.orderId)}
                />
              ))}

              {data?.carryover && data.carryover.length > 0 ? (
                <>
                  <div className={styles.sectionTitle}>
                    CARRIED OVER ({data.carryover.length})
                  </div>
                  {data.carryover.map((card) => (
                    <OrderCard
                      key={card.orderId}
                      card={card}
                      styles={styles}
                      onDragStart={handleDragStart}
                      onClick={() => navigate(`/orders/${card.orderId}`)}
                      carriedOver
                      isSelected={selectedOrderIds.has(card.orderId)}
                      onToggleSelection={() => toggleSelection(card.orderId)}
                    />
                  ))}
                </>
              ) : null}
            </div>

            <div className={`${styles.column} schedule-board-column`}>
              <div className={styles.columnHeader}>
                This week ({data?.weekPool?.length ?? 0})
              </div>
              <div
                className={styles.dropZone}
                onDrop={(e) =>
                  handleDrop(e, { scheduleWeekOf: weekOf })
                }
                onDragOver={handleDragOver}
              >
                Drop for week
              </div>
              {data?.weekPool?.map((card) => (
                <OrderCard
                  key={card.orderId}
                  card={card}
                  styles={styles}
                  onDragStart={handleDragStart}
                  onClick={() => navigate(`/orders/${card.orderId}`)}
                  isSelected={selectedOrderIds.has(card.orderId)}
                  onToggleSelection={() => toggleSelection(card.orderId)}
                />
              ))}
            </div>

            {dayColumns.map((col, i) => (
              <div key={col.day} className={`${styles.column} schedule-board-column`}>
                <div className={styles.columnHeader}>
                  {col.day} {col.date.toLocaleDateString([], { month: "short", day: "numeric" })}
                </div>
                <div
                  className={styles.dropZone}
                  onDrop={(e) =>
                    handleDrop(e, {
                      scheduleWeekOf: weekOf,
                      targetDateUtc: col.date.toISOString(),
                    })
                  }
                  onDragOver={handleDragOver}
                >
                  Drop here
                </div>
                {(dayAssignedByDay.get(i) ?? []).map((card) => (
                  <OrderCard
                    key={card.orderId}
                    card={card}
                    styles={styles}
                    onDragStart={handleDragStart}
                    onClick={() => navigate(`/orders/${card.orderId}`)}
                    isSelected={selectedOrderIds.has(card.orderId)}
                    onToggleSelection={() => toggleSelection(card.orderId)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {selectedOrderIds.size > 0 ? (
          <div
            className={`${styles.bulkToolbar} schedule-board-print-hide`}
            role="toolbar"
            aria-label="Bulk schedule actions"
          >
            <Body1>{selectedOrderIds.size} selected</Body1>
            <Button appearance="primary" onClick={bulkAssignToWeek}>
              Assign to this week
            </Button>
            <select
              value={selectedBulkDay}
              onChange={(e) => setSelectedBulkDay(Number(e.target.value))}
              style={{ padding: "6px 10px", minWidth: "100px" }}
              aria-label="Select day for bulk assign"
            >
              {dayColumns.map((col, i) => (
                <option key={col.day} value={i}>
                  {col.day} {col.date.toLocaleDateString([], { month: "short", day: "numeric" })}
                </option>
              ))}
            </select>
            <Button appearance="secondary" onClick={bulkAssignToDay}>
              Assign to day
            </Button>
            <Button appearance="secondary" onClick={bulkUnschedule}>
              Unschedule
            </Button>
            <Button appearance="subtle" onClick={clearSelection}>
              Clear selection
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function CapacityDetailCard({
  styles,
  pl,
  current,
  reference,
  peak,
  status,
  hasTarget,
}: {
  styles: ReturnType<typeof useStyles>;
  pl: ProductLineScheduleInfo;
  current: number;
  reference: number;
  peak: number;
  status: CapacityStatus;
  hasTarget: boolean;
}) {
  let summaryText: string;
  if (status === "No baseline") {
    summaryText = "No historical baseline (no completed orders in lookback)";
  } else if (status === "Danger") {
    summaryText = `Over peak by ${current - peak}`;
  } else if (status === "Warning") {
    summaryText = `Over reference, under peak`;
  } else {
    summaryText = `${reference - current} remaining to reference`;
  }

  return (
    <div className={styles.capacityCard}>
      <div className={styles.capacityCardHeader}>
        <span>{pl.code}</span>
        <Badge
          color={
            status === "Danger"
              ? "danger"
              : status === "Warning"
                ? "warning"
                : "informative"
          }
        >
          {status === "No baseline" ? "OK" : status}
        </Badge>
      </div>
      <div className={styles.capacityCardBody}>
        <div style={{ fontSize: "12px", display: "grid", gap: 2 }}>
          <span>
            {hasTarget ? "Target" : "Avg"}: {reference}/wk
          </span>
          <span>Peak: {peak}/wk</span>
          <span
            style={{
              fontWeight: 600,
              color:
                status === "Danger"
                  ? brandColors.themeRed
                  : status === "Warning"
                    ? tokens.colorPaletteMarigoldBackground1
                    : status === "OK"
                      ? tokens.colorPaletteGreenBackground1
                      : tokens.colorNeutralForeground2,
            }}
          >
            This week: {current}
          </span>
        </div>
        <span
          style={{
            fontSize: "10px",
            color: tokens.colorNeutralForeground2,
            display: "block",
            marginTop: 4,
          }}
        >
          {summaryText}
        </span>
      </div>
    </div>
  );
}

function OrderCard({
  card,
  styles,
  onDragStart,
  onClick,
  carriedOver,
  isSelected,
  onToggleSelection,
}: {
  card: ScheduleOrderCard;
  styles: ReturnType<typeof useStyles>;
  onDragStart: (e: React.DragEvent, card: ScheduleOrderCard) => void;
  onClick: () => void;
  carriedOver?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}) {
  const primaryPl = card.productLineSummary[0];
  const color = primaryPl?.colorHex ?? "#666";
  const isOverdue =
    card.requestedDateUtc &&
    new Date(card.requestedDateUtc) < new Date();

  return (
    <Card
      className={styles.orderCard}
      draggable
      onDragStart={(e) => onDragStart(e, card)}
      onClick={onClick}
    >
      <div className={styles.orderCardWithCheckbox}>
        {onToggleSelection ? (
          <Checkbox
            checked={isSelected ?? false}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelection();
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select order ${card.orderNo}`}
          />
        ) : null}
        <div className={styles.orderCardContent}>
          <div
            className={styles.orderCardBanner}
            style={{ backgroundColor: color }}
          >
            {primaryPl?.productLineCode ?? "?"}
            {carriedOver ? " · Carried over" : ""}
          </div>
          <span className={styles.orderNo}>{card.orderNo}</span>
          <Body1>{card.customerName}</Body1>
          <Body1>Qty: {card.totalQty}</Body1>
          <Body1 className={isOverdue ? styles.overdue : undefined}>
            {card.requestedDateUtc
              ? `Req: ${formatDateOnly(card.requestedDateUtc.slice(0, 10))}`
              : "No req. date"}
          </Body1>
          {isOverdue ? <Badge color="danger">Overdue</Badge> : null}
        </div>
      </div>
    </Card>
  );
}
