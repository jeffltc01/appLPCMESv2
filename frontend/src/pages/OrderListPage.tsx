import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
import { ordersApi, orderLookupsApi } from "../services/orders";
import type { OrderDraftListItem } from "../types/order";
import type { Lookup, PaginatedResponse } from "../types/customer";

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
    marginBottom: tokens.spacingVerticalM,
  },
  searchBox: {
    minWidth: "240px",
  },
  dropdown: {
    minWidth: "220px",
  },
  dateInput: {
    minWidth: "170px",
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

const PAGE_SIZE = 25;

export function OrderListPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState<PaginatedResponse<OrderDraftListItem> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState<Lookup[]>([]);
  const statusFilter = searchParams.get("status")?.trim()
    || (location.pathname.startsWith("/invoicing") ? "Ready to Invoice" : "New");

  useEffect(() => {
    orderLookupsApi.activeCustomers().then(setCustomers);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ordersApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
        customerId: customerId ? Number(customerId) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, search, customerId, dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, customerId, dateFrom, dateTo, statusFilter]);

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

  return (
    <div>
      <div className={styles.header}>
        <Title2>Orders</Title2>
        <Button
          appearance="primary"
          icon={<Add24Regular />}
          onClick={() => navigate("/orders/new")}
        >
          New Order
        </Button>
      </div>

      <div className={styles.filters}>
        <Input
          className={styles.searchBox}
          contentBefore={<Search24Regular />}
          placeholder="Search order no, customer, PO..."
          value={search}
          onChange={(_, d) => setSearch(d.value)}
        />
        <Dropdown
          className={styles.dropdown}
          placeholder="Customer"
          value={
            customers.find((c) => String(c.id) === customerId)?.name ?? "All Customers"
          }
          selectedOptions={customerId ? [customerId] : []}
          onOptionSelect={(_, d) => setCustomerId(d.optionValue ?? "")}
          clearable
        >
          {customers.map((customer) => (
            <Option key={customer.id} value={String(customer.id)}>
              {customer.name}
            </Option>
          ))}
        </Dropdown>
        <Input
          className={styles.dateInput}
          type="date"
          value={dateFrom}
          onChange={(_, d) => setDateFrom(d.value)}
          contentBefore={<span>From</span>}
        />
        <Input
          className={styles.dateInput}
          type="date"
          value={dateTo}
          onChange={(_, d) => setDateTo(d.value)}
          contentBefore={<span>To</span>}
        />
      </div>

      {loading ? (
        <div className={styles.center}>
          <Spinner size="large" label="Loading draft orders..." />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className={styles.center}>
          <Body1>No draft orders found.</Body1>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Order No</TableHeaderCell>
                <TableHeaderCell>Order Date</TableHeaderCell>
                <TableHeaderCell>Customer</TableHeaderCell>
                <TableHeaderCell>Site</TableHeaderCell>
                <TableHeaderCell>Customer PO</TableHeaderCell>
                <TableHeaderCell>Contact</TableHeaderCell>
                <TableHeaderCell>Lines</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((order) => (
                <TableRow
                  key={order.id}
                  className={styles.tableRow}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <TableCell>{order.salesOrderNo}</TableCell>
                  <TableCell>{order.orderDate}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.siteName}</TableCell>
                  <TableCell>{order.customerPoNo}</TableCell>
                  <TableCell>{order.contact}</TableCell>
                  <TableCell>{order.lineCount}</TableCell>
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
