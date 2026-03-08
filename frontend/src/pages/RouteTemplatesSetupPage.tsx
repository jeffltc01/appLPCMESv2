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
  Title1,
  makeStyles,
  mergeClasses,
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
    height: "100vh",
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
    overflow: "hidden",
    minHeight: 0,
  },
  contentStack: {
    display: "grid",
    gridTemplateRows: "auto auto auto minmax(0, 1fr)",
    gap: tokens.spacingVerticalM,
    height: "100%",
    minHeight: 0,
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
  tableCard: {
    minHeight: 0,
    display: "grid",
  },
  tableContainer: {
    overflow: "auto",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: 0,
  },
  gridHeaderRow: {
    display: "grid",
    gridTemplateColumns: "20% 28% 10% 12% 10% 20%",
    width: "100%",
    position: "sticky",
    top: 0,
    zIndex: 1,
    alignItems: "center",
    borderBottom: "1px solid #123046",
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#123046",
    minWidth: "980px",
  },
  gridBody: {
    minWidth: "980px",
  },
  gridBodyRow: {
    display: "grid",
    gridTemplateColumns: "20% 28% 10% 12% 10% 20%",
    width: "100%",
    alignItems: "start",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  gridCell: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    minWidth: 0,
  },
  codeColumn: {
    width: "100%",
  },
  nameColumn: {
    width: "100%",
  },
  versionColumn: {
    width: "100%",
  },
  stepCountColumn: {
    width: "100%",
  },
  activeColumn: {
    width: "100%",
  },
  actionsColumn: {
    width: "100%",
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

            <Card className={mergeClasses(styles.card, styles.tableCard)}>
              {loading ? (
                <Body1>Loading...</Body1>
              ) : (
                <div className={styles.tableContainer}>
                  <div className={styles.gridHeaderRow}>
                    <div className={mergeClasses(styles.gridCell, styles.codeColumn)}>Code</div>
                    <div className={mergeClasses(styles.gridCell, styles.nameColumn)}>Name</div>
                    <div className={mergeClasses(styles.gridCell, styles.versionColumn)}>Version</div>
                    <div className={mergeClasses(styles.gridCell, styles.stepCountColumn)}>Step Count</div>
                    <div className={mergeClasses(styles.gridCell, styles.activeColumn)}>Active</div>
                    <div className={mergeClasses(styles.gridCell, styles.actionsColumn)}>Actions</div>
                  </div>
                  <div className={styles.gridBody}>
                    {filteredRows.map((row) => (
                      <div key={row.id} className={styles.gridBodyRow}>
                        <div className={mergeClasses(styles.gridCell, styles.codeColumn)}>{row.routeTemplateCode}</div>
                        <div className={mergeClasses(styles.gridCell, styles.nameColumn)}>{row.routeTemplateName}</div>
                        <div className={mergeClasses(styles.gridCell, styles.versionColumn)}>{row.versionNo}</div>
                        <div className={mergeClasses(styles.gridCell, styles.stepCountColumn)}>{row.stepCount}</div>
                        <div className={mergeClasses(styles.gridCell, styles.activeColumn)}>
                          {row.isActive ? "Yes" : "No"}
                        </div>
                        <div className={mergeClasses(styles.gridCell, styles.actionsColumn)}>
                          <div className={styles.actions}>
                            <Button
                              appearance="secondary"
                              onClick={() => navigate(`/setup/route-templates/${row.id}`)}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredRows.length === 0 ? (
                      <div className={styles.gridBodyRow}>
                        <div className={mergeClasses(styles.gridCell, styles.codeColumn)}>-</div>
                        <div className={mergeClasses(styles.gridCell, styles.nameColumn)}>
                          No matching route templates.
                        </div>
                        <div className={mergeClasses(styles.gridCell, styles.versionColumn)}>-</div>
                        <div className={mergeClasses(styles.gridCell, styles.stepCountColumn)}>-</div>
                        <div className={mergeClasses(styles.gridCell, styles.activeColumn)}>-</div>
                        <div className={mergeClasses(styles.gridCell, styles.actionsColumn)}>-</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
