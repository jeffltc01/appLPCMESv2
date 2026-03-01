import { useEffect, useMemo, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { setupApi } from "../services/setup";
import type { RouteTemplateSummary } from "../types/setup";

interface StepFilterState {
  search: string;
  status: "all" | "active" | "inactive";
}

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  main: {
    display: "grid",
    gridTemplateRows: "44px 56px minmax(0, 1fr)",
    minWidth: 0,
  },
  utilityBar: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: "0 24px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e8e8e8",
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
  },
  headerBar: {
    backgroundColor: "#123046",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  headerActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  content: {
    padding: "16px 20px",
    overflow: "auto",
  },
  contentStack: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  card: {
    border: "1px solid #d8d8d8",
    borderRadius: "4px",
    padding: "12px",
    backgroundColor: "#ffffff",
  },
  nav: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "6fr 3fr 1fr",
    gap: tokens.spacingHorizontalS,
    alignItems: "end",
    backgroundColor: "#ffffff",
  },
  searchField: {
    minWidth: 0,
  },
  statusField: {
    minWidth: 0,
  },
  statusDropdown: {
    width: "100%",
  },
  filterActions: {
    display: "flex",
    alignItems: "end",
    minWidth: 0,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
});

export function RouteTemplatesSetupPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [rows, setRows] = useState<RouteTemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StepFilterState>({ search: "", status: "all" });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await setupApi.listRouteTemplates());
    } catch {
      setError("Failed to load route templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return rows.filter((row) => {
      const statusMatches =
        filters.status === "all" ||
        (filters.status === "active" ? row.isActive : !row.isActive);
      const searchMatches =
        !search ||
        row.routeTemplateCode.toLowerCase().includes(search) ||
        row.routeTemplateName.toLowerCase().includes(search);
      return statusMatches && searchMatches;
    });
  }, [rows, filters]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.utilityBar}>
          <span>Order Analyst</span>
          <span>Site: Houston</span>
        </div>

        <header className={styles.headerBar}>
          <Title1 style={{ color: "#ffffff" }}>Route Template Maintenance</Title1>
          <div className={styles.headerActions}>
            <Button appearance="secondary" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button appearance="primary" onClick={() => navigate("/setup/route-templates/new")}>
              Add Route Template
            </Button>
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.contentStack}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}

            <Card className={styles.card}>
              <div className={styles.filters}>
                <Field label="Search" className={styles.searchField}>
                  <Input
                    value={filters.search}
                    onChange={(_, data) => setFilters((current) => ({ ...current, search: data.value }))}
                    placeholder="Code or name"
                  />
                </Field>
                <Field label="Status" className={styles.statusField}>
                  <Dropdown
                    className={styles.statusDropdown}
                    value={
                      filters.status === "all"
                        ? "All"
                        : filters.status === "active"
                        ? "Active"
                        : "Inactive"
                    }
                    selectedOptions={[filters.status]}
                    onOptionSelect={(_, data) =>
                      setFilters((current) => ({
                        ...current,
                        status: (data.optionValue as StepFilterState["status"]) ?? "all",
                      }))
                    }
                  >
                    <Option value="all">All</Option>
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                  </Dropdown>
                </Field>
                <div className={styles.filterActions}>
                  <Button
                    appearance="secondary"
                    onClick={() => setFilters({ search: "", status: "all" })}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </Card>

            <Card className={styles.card}>
              {loading ? (
                <Body1>Loading...</Body1>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Code</TableHeaderCell>
                      <TableHeaderCell>Name</TableHeaderCell>
                      <TableHeaderCell>Version</TableHeaderCell>
                      <TableHeaderCell>Step Count</TableHeaderCell>
                      <TableHeaderCell>Active</TableHeaderCell>
                      <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.routeTemplateCode}</TableCell>
                        <TableCell>{row.routeTemplateName}</TableCell>
                        <TableCell>{row.versionNo}</TableCell>
                        <TableCell>{row.stepCount}</TableCell>
                        <TableCell>{row.isActive ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <div className={styles.actions}>
                            <Button
                              appearance="secondary"
                              onClick={() => navigate(`/setup/route-templates/${row.id}`)}
                            >
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell>-</TableCell>
                        <TableCell>No matching route templates.</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
