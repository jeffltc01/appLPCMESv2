import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Body1,
  Button,
  Card,
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title2,
} from "@fluentui/react-components";
import { orderLookupsApi, ordersApi } from "../services/orders";
import type { Lookup } from "../types/customer";
import type { OrderKpiDiagnostics, OrderKpiDiagnosticsItem } from "../types/order";

type IssueType = "all" | "missingTimestamp" | "missingReasonCode" | "missingOwnership" | "invalidOrdering";

const ISSUE_OPTIONS: { key: IssueType; label: string }[] = [
  { key: "all", label: "All issues" },
  { key: "missingTimestamp", label: "Missing timestamps" },
  { key: "missingReasonCode", label: "Missing reason codes" },
  { key: "missingOwnership", label: "Missing ownership fields" },
  { key: "invalidOrdering", label: "Invalid timestamp ordering" },
];

export function KpiDiagnosticsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Lookup[]>([]);
  const [siteId, setSiteId] = useState<string>("all");
  const [issueType, setIssueType] = useState<IssueType>("all");
  const [fromUtc, setFromUtc] = useState("");
  const [toUtc, setToUtc] = useState("");
  const [result, setResult] = useState<OrderKpiDiagnostics | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [siteRows, diagnostics] = await Promise.all([
        orderLookupsApi.sites(),
        ordersApi.kpiDiagnostics({
          siteId: siteId === "all" ? undefined : Number(siteId),
          issueType,
          fromUtc: fromUtc ? new Date(fromUtc).toISOString() : undefined,
          toUtc: toUtc ? new Date(toUtc).toISOString() : undefined,
        }),
      ]);
      setSites(siteRows);
      setResult(diagnostics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load KPI diagnostics.");
    } finally {
      setLoading(false);
    }
  }, [siteId, issueType, fromUtc, toUtc]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Title2>KPI Diagnostics</Title2>
      <Body1>
        Investigate KPI data quality gaps and jump directly to affected order workspaces.
      </Body1>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <Field label="Issue Type">
            <Dropdown
              value={ISSUE_OPTIONS.find((option) => option.key === issueType)?.label}
              selectedOptions={[issueType]}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  setIssueType(data.optionValue as IssueType);
                }
              }}
            >
              {ISSUE_OPTIONS.map((option) => (
                <Option key={option.key} value={option.key}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </Field>
          <Field label="Site">
            <Dropdown
              value={siteId === "all" ? "All sites" : sites.find((site) => String(site.id) === siteId)?.name ?? "All sites"}
              selectedOptions={[siteId]}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  setSiteId(data.optionValue);
                }
              }}
            >
              <Option key="all" value="all">
                All sites
              </Option>
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

      {error ? (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      ) : null}

      <Card>
        {loading ? (
          <Spinner label="Loading KPI diagnostics..." />
        ) : result ? (
          <>
            <Body1>
              Generated {new Date(result.generatedUtc).toLocaleString()} • Affected orders:{" "}
              {result.totalAffectedOrders}
            </Body1>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Order</TableHeaderCell>
                  <TableHeaderCell>Lifecycle</TableHeaderCell>
                  <TableHeaderCell>Site</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Missing Time</TableHeaderCell>
                  <TableHeaderCell>Missing Reason</TableHeaderCell>
                  <TableHeaderCell>Missing Owner</TableHeaderCell>
                  <TableHeaderCell>Invalid Ordering</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((item: OrderKpiDiagnosticsItem) => (
                  <TableRow key={item.orderId}>
                    <TableCell>{item.salesOrderNo}</TableCell>
                    <TableCell>{item.lifecycleStatus}</TableCell>
                    <TableCell>{item.siteId}</TableCell>
                    <TableCell>{item.customerId}</TableCell>
                    <TableCell>{item.missingTimestampCount}</TableCell>
                    <TableCell>{item.missingReasonCodeCount}</TableCell>
                    <TableCell>{item.missingOwnershipCount}</TableCell>
                    <TableCell>{item.invalidOrderingCount}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => navigate(`/orders/${item.orderId}/workspace`)}>
                        Open Workspace
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <Body1>No data yet.</Body1>
        )}
      </Card>
    </div>
  );
}
