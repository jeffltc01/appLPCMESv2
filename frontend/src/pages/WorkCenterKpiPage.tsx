import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Body1,
  Button,
  Card,
  Dropdown,
  Field,
  Input,
  Option,
  Spinner,
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
import { orderLookupsApi, ordersApi } from "../services/orders";
import type { Lookup } from "../types/customer";
import type {
  WorkCenterCycleTimeMetric,
  WorkCenterKpiSummary,
  WorkCenterQueueAgingMetric,
} from "../types/order";

const useStyles = makeStyles({
  page: { display: "grid", gap: tokens.spacingVerticalM },
  filters: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr auto",
    gap: tokens.spacingHorizontalM,
    alignItems: "end",
  },
  chartList: {
    display: "grid",
    gap: tokens.spacingVerticalS,
  },
  chartRow: {
    display: "grid",
    gridTemplateColumns: "220px 1fr 80px",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  barTrack: {
    height: "12px",
    borderRadius: "8px",
    backgroundColor: tokens.colorNeutralBackground3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#017CC5",
  },
});

function formatMinutes(value: number | null | undefined): string {
  return value == null ? "--" : `${value.toFixed(1)}m`;
}

function scalePercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(3, Math.min(100, (value / max) * 100));
}

export function WorkCenterKpiPage() {
  const styles = useStyles();
  const [sites, setSites] = useState<Lookup[]>([]);
  const [siteId, setSiteId] = useState<string>("all");
  const [fromUtc, setFromUtc] = useState("");
  const [toUtc, setToUtc] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<WorkCenterKpiSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [siteRows, kpi] = await Promise.all([
        orderLookupsApi.sites(),
        ordersApi.kpiWorkCenterSummary({
          siteId: siteId === "all" ? undefined : Number(siteId),
          fromUtc: fromUtc ? new Date(fromUtc).toISOString() : undefined,
          toUtc: toUtc ? new Date(toUtc).toISOString() : undefined,
        }),
      ]);
      setSites(siteRows);
      setSummary(kpi);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load work-center KPIs.");
    } finally {
      setLoading(false);
    }
  }, [siteId, fromUtc, toUtc]);

  useEffect(() => {
    void load();
  }, [load]);

  const cycleChartRows = summary?.stepCycleTimeByWorkCenter ?? [];
  const queueChartRows = summary?.queueAgingByWorkCenter ?? [];
  const maxCycleAvg = useMemo(
    () => Math.max(0, ...cycleChartRows.map((x) => x.avgMinutes ?? 0)),
    [cycleChartRows]
  );
  const maxQueueAge = useMemo(
    () => Math.max(0, ...queueChartRows.map((x) => x.averageAgeMinutes ?? 0)),
    [queueChartRows]
  );

  return (
    <div className={styles.page}>
      <Title2>Work Center KPI Dashboard</Title2>

      <Card>
        <div className={styles.filters}>
          <Field label="Site">
            <Dropdown
              value={siteId === "all" ? "All sites" : sites.find((s) => String(s.id) === siteId)?.name ?? "All sites"}
              selectedOptions={[siteId]}
              onOptionSelect={(_, data) => data.optionValue && setSiteId(data.optionValue)}
            >
              <Option value="all">All sites</Option>
              {sites.map((site) => (
                <Option key={site.id} value={String(site.id)}>
                  {site.name}
                </Option>
              ))}
            </Dropdown>
          </Field>
          <Field label="From (UTC)">
            <Input type="datetime-local" value={fromUtc} onChange={(_, data) => setFromUtc(data.value)} />
          </Field>
          <Field label="To (UTC)">
            <Input type="datetime-local" value={toUtc} onChange={(_, data) => setToUtc(data.value)} />
          </Field>
          <Button appearance="primary" onClick={() => void load()}>
            Apply
          </Button>
        </div>
      </Card>

      {error ? <Body1>{error}</Body1> : null}

      {loading ? (
        <Card>
          <Spinner label="Loading work-center KPIs..." />
        </Card>
      ) : summary ? (
        <>
          <Card>
            <Body1>
              Generated {new Date(summary.generatedUtc).toLocaleString()} • Work centers: {summary.totalWorkCentersEvaluated}
            </Body1>
            <Body1>
              Supervisor hold time: closed {summary.supervisorHoldTime.closedCount}, active {summary.supervisorHoldTime.activeCount}, avg
              closed{" "}
              {summary.supervisorHoldTime.averageClosedHours != null
                ? `${summary.supervisorHoldTime.averageClosedHours.toFixed(1)}h`
                : "--"}
              , avg active{" "}
              {summary.supervisorHoldTime.averageActiveAgeHours != null
                ? `${summary.supervisorHoldTime.averageActiveAgeHours.toFixed(1)}h`
                : "--"}
            </Body1>
            <Body1>
              Traceability completeness: {summary.traceabilityCompleteness.stepsWithUsageRecordedCount}/
              {summary.traceabilityCompleteness.requiredUsageStepCount} (
              {summary.traceabilityCompleteness.completenessPercent != null
                ? `${summary.traceabilityCompleteness.completenessPercent.toFixed(1)}%`
                : "--"}
              )
            </Body1>
          </Card>

          <Card>
            <Body1>
              <strong>Step cycle time (avg minutes)</strong>
            </Body1>
            <div className={styles.chartList}>
              {cycleChartRows.map((row: WorkCenterCycleTimeMetric) => {
                const avg = row.avgMinutes ?? 0;
                return (
                  <div className={styles.chartRow} key={`cycle-${row.workCenterId}`}>
                    <Body1>{row.workCenterName}</Body1>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${scalePercent(avg, maxCycleAvg)}%` }} />
                    </div>
                    <Body1>{formatMinutes(row.avgMinutes)}</Body1>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <Body1>
              <strong>Queue aging (avg age minutes)</strong>
            </Body1>
            <div className={styles.chartList}>
              {queueChartRows.map((row: WorkCenterQueueAgingMetric) => {
                const age = row.averageAgeMinutes ?? 0;
                return (
                  <div className={styles.chartRow} key={`queue-${row.workCenterId}`}>
                    <Body1>{row.workCenterName}</Body1>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${scalePercent(age, maxQueueAge)}%` }} />
                    </div>
                    <Body1>{formatMinutes(row.averageAgeMinutes)}</Body1>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <Body1>
              <strong>Scrap by reason/work center/item</strong>
            </Body1>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Work Center</TableHeaderCell>
                  <TableHeaderCell>Reason</TableHeaderCell>
                  <TableHeaderCell>Item</TableHeaderCell>
                  <TableHeaderCell>Qty Scrapped</TableHeaderCell>
                  <TableHeaderCell>Entries</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.scrapByReasonWorkCenterItem.map((row) => (
                  <TableRow key={`scrap-${row.workCenterId}-${row.scrapReasonId}-${row.itemId}`}>
                    <TableCell>{row.workCenterName}</TableCell>
                    <TableCell>{row.scrapReason}</TableCell>
                    <TableCell>{row.itemNo}</TableCell>
                    <TableCell>{row.quantityScrapped}</TableCell>
                    <TableCell>{row.entryCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : (
        <Card>
          <Body1>No KPI data available.</Body1>
        </Card>
      )}
    </div>
  );
}
