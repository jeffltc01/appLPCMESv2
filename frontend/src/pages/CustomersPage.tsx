import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Body1,
  Button,
  Card,
  Dropdown,
  Field,
  Input,
  Option,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Add24Regular } from "@fluentui/react-icons";
import { customersApi } from "../services/customers";
import type { CustomerListItem } from "../types/customer";
import { extractApiMessage } from "../utils/apiError";
import { CustomerStatusBadge } from "../components/customers/CustomerStatusBadge";
import { NewCustomerDialog } from "../components/customers/NewCustomerDialog";
import { PageHeader } from "../components/layout/PageHeader";
import { HelpEntryPoint } from "../components/help/HelpEntryPoint";

const PAGE_SIZE = 25;

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  main: {
    display: "grid",
    gridTemplateRows: "56px minmax(0, 1fr)",
    height: "100vh",
    minWidth: 0,
  },
  content: {
    padding: "16px 20px",
    overflow: "hidden",
    minHeight: 0,
  },
  shell: {
    maxWidth: "1280px",
    height: "100%",
    minHeight: 0,
    margin: "0 auto",
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  controlsCard: {
    border: "1px solid #e8e8e8",
    padding: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  controls: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 1.6fr) minmax(160px, 1fr) auto",
    gap: tokens.spacingHorizontalS,
    alignItems: "end",
  },
  tableCard: {
    border: "1px solid #e8e8e8",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  tableWrap: {
    overflow: "auto",
    minHeight: 0,
    flex: 1,
    border: "1px solid #e8e8e8",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
  },
  tableHeaderCell: {
    backgroundColor: "#123046",
    color: "#ffffff",
    fontWeight: 700,
    borderBottom: "1px solid #123046",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  row: {
    cursor: "pointer",
    ":nth-child(even)": {
      backgroundColor: "#fcfcfc",
    },
    ":hover": {
      backgroundColor: "#e0eff8",
    },
  },
  cell: {
    borderBottom: "1px solid #e8e8e8",
    paddingTop: "10px",
    paddingBottom: "10px",
  },
  code: {
    color: "#123046",
    fontWeight: 700,
  },
  muted: {
    color: tokens.colorNeutralForeground2,
  },
  listMeta: {
    color: tokens.colorNeutralForeground2,
    fontSize: "12px",
    padding: "0 4px 8px",
  },
  errorBanner: {
    border: "1px solid #e8b3b3",
    borderRadius: "4px",
    backgroundColor: "#fff5f5",
    padding: "10px 12px",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  errorTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#8a2f2f",
  },
  errorMessage: {
    fontSize: "13px",
    color: "#8a2f2f",
  },
  pager: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
  },
  pagerButtons: {
    display: "flex",
    gap: "8px",
  },
});

export function CustomersPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  const loadCustomers = async (
    nextPage: number,
    nextSearch: string,
    nextStatus: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await customersApi.list({
        page: nextPage,
        pageSize: PAGE_SIZE,
        search: nextSearch.trim() || undefined,
        status: nextStatus,
      });
      setCustomers(result.items);
      setTotalCount(result.totalCount);
      setPage(result.page);
    } catch (loadError) {
      setCustomers([]);
      setTotalCount(0);
      setError(extractApiMessage(loadError, "Unable to load customers."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers(1, "", "All");
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <PageHeader
          title="Customers"
          actions={
            <>
              <Button appearance="secondary" onClick={() => navigate("/")}>
                Back to Dashboard
              </Button>
              <Button
                appearance="secondary"
                icon={<Add24Regular />}
                onClick={() => setNewDialogOpen(true)}
              >
                New Customer
              </Button>
              <HelpEntryPoint route="/customers" />
            </>
          }
        />
        <section className={styles.content}>
          <div className={styles.shell}>
            <Card className={styles.controlsCard}>
              <div className={styles.controls}>
                <Field label="Search">
                  <Input
                    value={searchInput}
                    onChange={(_, data) => setSearchInput(data.value)}
                    placeholder="Name, code, or email"
                  />
                </Field>
                <Field label="Status">
                  <Dropdown
                    value={status}
                    selectedOptions={[status]}
                    onOptionSelect={(_, data) => setStatus(data.optionValue ?? "All")}
                  >
                    <Option value="All">All</Option>
                    <Option value="Active">Active</Option>
                    <Option value="Inactive">Inactive</Option>
                  </Dropdown>
                </Field>
                <Button
                  appearance="secondary"
                  onClick={() => {
                    const nextSearch = searchInput.trim();
                    setSearchApplied(nextSearch);
                    void loadCustomers(1, nextSearch, status);
                  }}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Search"}
                </Button>
              </div>
            </Card>

            <Card className={styles.tableCard}>
              <Body1 className={styles.listMeta}>
                {loading
                  ? "Loading customers..."
                  : `${totalCount} customer(s) · Page ${page} of ${totalPages}`}
              </Body1>
              {error ? (
                <div className={styles.errorBanner}>
                  <span className={styles.errorTitle}>Error</span>
                  <span className={styles.errorMessage}>{error}</span>
                </div>
              ) : null}
              <div className={styles.tableWrap}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell className={styles.tableHeaderCell}>Name</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>
                        Customer Code
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Status</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Email</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>
                        Tank Color
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Lid Color</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>
                        Bill-To Address
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>
                        Ship-To Address
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className={styles.row}
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        <TableCell className={styles.cell}>{customer.name}</TableCell>
                        <TableCell className={styles.cell}>
                          <span className={styles.code}>{customer.customerCode ?? "-"}</span>
                        </TableCell>
                        <TableCell className={styles.cell}>
                          <CustomerStatusBadge status={customer.status} />
                        </TableCell>
                        <TableCell className={styles.cell}>{customer.email ?? "-"}</TableCell>
                        <TableCell className={styles.cell}>{customer.tankColor ?? "-"}</TableCell>
                        <TableCell className={styles.cell}>{customer.lidColor ?? "-"}</TableCell>
                        <TableCell className={styles.cell}>
                          {customer.billToAddress ?? "-"}
                        </TableCell>
                        <TableCell className={styles.cell}>
                          {customer.shipToAddress ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && customers.length === 0 ? (
                      <TableRow>
                        <TableCell className={styles.cell}>-</TableCell>
                        <TableCell className={styles.cell}>-</TableCell>
                        <TableCell className={styles.cell}>No customers found.</TableCell>
                        <TableCell className={styles.cell}>-</TableCell>
                        <TableCell className={styles.cell}>-</TableCell>
                        <TableCell className={styles.cell}>-</TableCell>
                        <TableCell className={styles.cell}>-</TableCell>
                        <TableCell className={styles.cell}>-</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
              <div className={styles.pager}>
                <Body1 className={styles.muted}>
                  Showing {(page - 1) * PAGE_SIZE + (customers.length > 0 ? 1 : 0)}-
                  {(page - 1) * PAGE_SIZE + customers.length} of {totalCount}
                </Body1>
                <div className={styles.pagerButtons}>
                  <Button
                    appearance="secondary"
                    disabled={page <= 1 || loading}
                    onClick={() =>
                      void loadCustomers(page - 1, searchApplied, status)
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    appearance="secondary"
                    disabled={page >= totalPages || loading}
                    onClick={() =>
                      void loadCustomers(page + 1, searchApplied, status)
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <NewCustomerDialog
        open={newDialogOpen}
        onClose={() => setNewDialogOpen(false)}
        onCreated={(created) => {
          setNewDialogOpen(false);
          navigate(`/customers/${created.id}`);
        }}
      />
    </div>
  );
}
