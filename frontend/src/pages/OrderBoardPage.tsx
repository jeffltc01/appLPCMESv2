import { useCallback, useEffect, useMemo, useState } from "react";
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
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { getWorkspaceCurrentStatus, ordersApi } from "../services/orders";
import type { OrderDraftListItem, OrderWorkspaceRole } from "../types/order";

const ROLE_FILTER_MAP: Record<OrderWorkspaceRole, string[]> = {
  Office: ["Draft", "PendingOrderEntryValidation", "InvoiceReady"],
  Transportation: [
    "InboundLogisticsPlanned",
    "InboundInTransit",
    "OutboundLogisticsPlanned",
    "DispatchedOrPickupReleased",
  ],
  Receiving: ["ReceivedPendingReconciliation"],
  Production: ["ReadyForProduction", "InProduction", "ProductionCompletePendingApproval"],
  Supervisor: ["ProductionCompletePendingApproval", "ProductionComplete"],
  Quality: ["ProductionCompletePendingApproval", "ProductionComplete"],
  PlantManager: [],
  Admin: [],
};

const ROLES: OrderWorkspaceRole[] = [
  "Office",
  "Transportation",
  "Receiving",
  "Production",
  "Supervisor",
  "Quality",
  "PlantManager",
  "Admin",
];

const useStyles = makeStyles({
  page: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalM },
  filters: {
    display: "grid",
    gridTemplateColumns: "220px 1fr auto",
    gap: tokens.spacingHorizontalM,
    alignItems: "end",
  },
  tableRow: {
    cursor: "pointer",
    ":hover": { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
});

export function OrderBoardPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [role, setRole] = useState<OrderWorkspaceRole>("Office");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationMsg, setMigrationMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [rows, setRows] = useState<OrderDraftListItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ordersApi.list({ page: 1, pageSize: 300, search: search || undefined });
      setRows(result.items);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const allowedStatuses = ROLE_FILTER_MAP[role];
    if (allowedStatuses.length === 0) {
      return rows;
    }
    return rows.filter((row) => {
      const status = getWorkspaceCurrentStatus(row.orderLifecycleStatus ?? row.orderStatus);
      return allowedStatuses.includes(status);
    });
  }, [role, rows]);

  const runMigration = async (dryRun: boolean) => {
    setMigrating(true);
    setMigrationMsg(null);
    try {
      const result = await ordersApi.migrateLifecycleStatuses(dryRun);
      setMigrationMsg({
        type: "success",
        text: `${dryRun ? "Dry run" : "Migration"} complete: scanned ${result.totalOrdersScanned}, already initialized ${result.ordersAlreadyInitialized}, updated ${result.ordersUpdated}.`,
      });

      if (!dryRun) {
        await load();
      }
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : "Lifecycle migration request failed.";
      setMigrationMsg({ type: "error", text });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className={styles.page}>
      <Title2>Role Queue / Order Board</Title2>
      <Card>
        <div className={styles.filters}>
          <Field label="Role View">
            <Dropdown
              value={role}
              selectedOptions={[role]}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  setRole(data.optionValue as OrderWorkspaceRole);
                }
              }}
            >
              {ROLES.map((value) => (
                <Option key={value} value={value}>
                  {value}
                </Option>
              ))}
            </Dropdown>
          </Field>
          <Field label="Search">
            <Input
              placeholder="Order #, customer, PO..."
              value={search}
              onChange={(_, data) => setSearch(data.value)}
            />
          </Field>
          <Button onClick={() => void load()}>Refresh</Button>
        </div>
      </Card>

      {role === "Admin" ? (
        <Card>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Body1>
              <strong>Admin migration tools:</strong> initialize lifecycle status on historical
              orders.
            </Body1>
            <Button disabled={migrating} onClick={() => void runMigration(true)}>
              {migrating ? "Running..." : "Dry Run Lifecycle Migration"}
            </Button>
            <Button
              appearance="primary"
              disabled={migrating}
              onClick={() => void runMigration(false)}
            >
              {migrating ? "Running..." : "Apply Lifecycle Migration"}
            </Button>
          </div>
          {migrationMsg ? (
            <MessageBar intent={migrationMsg.type} style={{ marginTop: 10 }}>
              <MessageBarBody>{migrationMsg.text}</MessageBarBody>
            </MessageBar>
          ) : null}
        </Card>
      ) : null}

      <Card>
        {loading ? (
          <Spinner label="Loading queue..." />
        ) : filteredRows.length === 0 ? (
          <Body1>No orders in this queue.</Body1>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Order</TableHeaderCell>
                <TableHeaderCell>Customer</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Site</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => {
                const status = getWorkspaceCurrentStatus(
                  row.orderLifecycleStatus ?? row.orderStatus
                );
                return (
                  <TableRow
                    key={row.id}
                    className={styles.tableRow}
                    onClick={() => navigate(`/orders/${row.id}/workspace`)}
                  >
                    <TableCell>{row.salesOrderNo}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{status}</TableCell>
                    <TableCell>{row.siteName}</TableCell>
                    <TableCell>
                      <Button
                        appearance="primary"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/orders/${row.id}/workspace`);
                        }}
                      >
                        Open Workspace
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
