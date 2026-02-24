import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  makeStyles,
  tokens,
  Title2,
  Input,
  Dropdown,
  Option,
  Button,
  Spinner,
  Body1,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@fluentui/react-components";
import { Add24Regular, Search24Regular } from "@fluentui/react-icons";
import { customersApi } from "../services/customers";
import type { CustomerListItem, PaginatedResponse } from "../types/customer";
import { CustomerStatusBadge } from "../components/customers/CustomerStatusBadge";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
  },
  filters: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  searchBox: {
    minWidth: "250px",
  },
  statusDropdown: {
    minWidth: "140px",
  },
  tableRow: {
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  pager: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
  },
  center: {
    display: "flex",
    justifyContent: "center",
    marginTop: tokens.spacingVerticalXXL,
  },
});

const STATUS_OPTIONS = ["Active", "Inactive", "All"];
const PAGE_SIZE = 25;

export function CustomerListPage() {
  const navigate = useNavigate();
  const styles = useStyles();

  const [data, setData] = useState<PaginatedResponse<CustomerListItem> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Active");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await customersApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

  return (
    <div>
      <div className={styles.header}>
        <Title2>Customers</Title2>
        <Button
          appearance="primary"
          icon={<Add24Regular />}
          onClick={() => navigate("/customers/new")}
        >
          New Customer
        </Button>
      </div>

      <div className={styles.filters}>
        <Input
          className={styles.searchBox}
          contentBefore={<Search24Regular />}
          placeholder="Search name, code, or email..."
          value={search}
          onChange={(_, d) => setSearch(d.value)}
        />
        <Dropdown
          className={styles.statusDropdown}
          placeholder="Status"
          value={status}
          selectedOptions={[status]}
          onOptionSelect={(_, d) => setStatus(d.optionValue ?? "Active")}
        >
          {STATUS_OPTIONS.map((s) => (
            <Option key={s} value={s}>
              {s}
            </Option>
          ))}
        </Dropdown>
      </div>

      {loading ? (
        <div className={styles.center}>
          <Spinner size="large" label="Loading customers..." />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className={styles.center}>
          <Body1>No customers found.</Body1>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Code</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Bill To</TableHeaderCell>
                <TableHeaderCell>Ship To</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((c) => (
                <TableRow
                  key={c.id}
                  className={styles.tableRow}
                  onClick={() => navigate(`/customers/${c.id}`)}
                >
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.customerCode}</TableCell>
                  <TableCell>
                    <CustomerStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.billToAddress}</TableCell>
                  <TableCell>{c.shipToAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className={styles.pager}>
            <Button
              appearance="subtle"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Body1>
              Page {page} of {totalPages} ({data.totalCount} total)
            </Body1>
            <Button
              appearance="subtle"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
