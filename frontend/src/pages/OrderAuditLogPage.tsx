import {
  Body1,
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
  Title2,
  makeStyles,
} from "@fluentui/react-components";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ordersApi } from "../services/orders";
import type { OrderFieldAudit } from "../types/order";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: "16px 20px",
    display: "grid",
    gap: "12px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
    gap: "8px",
    alignItems: "end",
  },
  card: {
    backgroundColor: "#fff",
  },
});

export function OrderAuditLogPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [rows, setRows] = useState<OrderFieldAudit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actorEmpNo, setActorEmpNo] = useState("");
  const [entityName, setEntityName] = useState("all");
  const [fieldName, setFieldName] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  const loadRows = async (nextPage = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersApi.globalAuditTrail({
        page: nextPage,
        pageSize,
        search: search.trim() || undefined,
        actorEmpNo: actorEmpNo.trim() || undefined,
        entityName: entityName === "all" ? undefined : entityName,
        fieldName: fieldName.trim() || undefined,
      });
      setRows(response.items);
      setTotalCount(response.totalCount);
      setPage(response.page);
    } catch {
      setError("Unable to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRows(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Title2>Order Audit Log</Title2>
        <Button appearance="secondary" onClick={() => navigate("/")}>
          Back to Menu
        </Button>
      </div>

      <Card className={styles.card}>
        <div className={styles.filterRow}>
          <Field label="Search">
            <Input
              value={search}
              onChange={(_, data) => setSearch(data.value)}
              placeholder="Order, field, old/new value"
            />
          </Field>
          <Field label="Entity">
            <Select value={entityName} onChange={(event) => setEntityName(event.target.value)}>
              <option value="all">All</option>
              <option value="SalesOrder">SalesOrder</option>
              <option value="SalesOrderDetail">SalesOrderDetail</option>
            </Select>
          </Field>
          <Field label="Field Name">
            <Input value={fieldName} onChange={(_, data) => setFieldName(data.value)} />
          </Field>
          <Field label="Actor EmpNo">
            <Input value={actorEmpNo} onChange={(_, data) => setActorEmpNo(data.value)} />
          </Field>
          <Button appearance="primary" onClick={() => void loadRows(1)}>
            Apply
          </Button>
        </div>
      </Card>

      <Card className={styles.card}>
        {isLoading ? <Body1>Loading audit log...</Body1> : null}
        {error ? <Body1>{error}</Body1> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Occurred UTC</TableHeaderCell>
              <TableHeaderCell>Order</TableHeaderCell>
              <TableHeaderCell>Entity</TableHeaderCell>
              <TableHeaderCell>Field</TableHeaderCell>
              <TableHeaderCell>Old</TableHeaderCell>
              <TableHeaderCell>New</TableHeaderCell>
              <TableHeaderCell>Actor</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.occurredUtc}</TableCell>
                <TableCell>{row.salesOrderNo}</TableCell>
                <TableCell>{row.entityName}</TableCell>
                <TableCell>{row.fieldName}</TableCell>
                <TableCell>{row.oldValue ?? "-"}</TableCell>
                <TableCell>{row.newValue ?? "-"}</TableCell>
                <TableCell>{row.actorEmpNo ?? "-"}</TableCell>
                <TableCell>{row.actionType}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
          <Body1>
            Page {page} of {totalPages} ({totalCount} rows)
          </Body1>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              appearance="secondary"
              disabled={page <= 1 || isLoading}
              onClick={() => void loadRows(page - 1)}
            >
              Previous
            </Button>
            <Button
              appearance="secondary"
              disabled={page >= totalPages || isLoading}
              onClick={() => void loadRows(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
