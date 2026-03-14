import {
  Badge,
  Body1,
  Button,
  Card,
  Input,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowLeft24Regular,
  ArrowRight24Regular,
  Print24Regular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { ordersApi, orderLookupsApi } from "../services/orders";
import type { ScheduleBoard, ScheduleOrderCard } from "../types/order";
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

  const loadSites = useCallback(async () => {
    try {
      const list = await orderLookupsApi.sites();
      setSites(list);
      if (list.length > 0 && siteId === null) {
        setSiteId(list[0].id);
      }
    } catch {
      setError("Unable to load sites.");
    }
  }, [siteId]);

  const loadSchedule = useCallback(async () => {
    if (!weekOf) return;
    setLoading(true);
    setError(null);
    try {
      const result = await ordersApi.getSchedule({
        weekOf,
        siteId: siteId ?? undefined,
        lookbackDays: 90,
      });
      setData(result);
    } catch {
      setError("Unable to load schedule.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [weekOf, siteId]);

  useEffect(() => {
    void loadSites();
  }, []);

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

  return (
    <div className={`${styles.page} schedule-board-page`}>
      <PageHeader
        className="schedule-board-print-hide"
        title="Schedule board"
        actions={
          <Button
            className="schedule-board-print-hide"
            appearance="subtle"
            icon={<Print24Regular />}
            onClick={handlePrint}
            aria-label="Print"
          >
            Print
          </Button>
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

          {data?.productLines && data.productLines.length > 0 ? (
            <div className={styles.capacityPills}>
              {data.productLines.slice(0, 8).map((pl) => (
                <span
                  key={pl.code}
                  className={styles.pill}
                  style={{
                    borderLeftColor: pl.colorHex ?? tokens.colorNeutralStroke2,
                    borderLeftWidth: "4px",
                  }}
                >
                  {pl.code} avg {Math.round(pl.historicalAvgPerWeek)}
                </span>
              ))}
            </div>
          ) : null}
        </div>

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
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function OrderCard({
  card,
  styles,
  onDragStart,
  onClick,
  carriedOver,
}: {
  card: ScheduleOrderCard;
  styles: ReturnType<typeof useStyles>;
  onDragStart: (e: React.DragEvent, card: ScheduleOrderCard) => void;
  onClick: () => void;
  carriedOver?: boolean;
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
    </Card>
  );
}
