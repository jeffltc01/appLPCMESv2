import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Body1,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Select,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TabList,
  Textarea,
  Title2,
  Title3,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { setupApi } from "../services/setup";
import { orderLookupsApi } from "../services/orders";
import type { Lookup } from "../types/customer";
import type {
  FeatureFlagConfig,
  FeatureFlagConfigUpsert,
  SetupConfigAuditEntry,
  SetupConfigStatus,
  SitePolicyConfig,
  SitePolicyConfigUpsert,
} from "../types/setup";

const useStyles = makeStyles({
  page: {
    display: "grid",
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalL,
    backgroundColor: "#FCFCFC",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  nav: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  filtersCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "grid",
    gap: tokens.spacingVerticalM,
    alignContent: "start",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "260px minmax(560px, 1fr) minmax(320px, 360px)",
    gap: tokens.spacingHorizontalM,
    alignItems: "start",
  },
  dataPanel: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  toolbar: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
    flexWrap: "wrap",
  },
  tableWrap: {
    overflowX: "auto",
  },
  rowSelectable: {
    cursor: "pointer",
  },
  editorCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "grid",
    gap: tokens.spacingVerticalM,
    position: "sticky",
    top: tokens.spacingVerticalM,
  },
  editorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editorForm: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  callout: {
    border: `1px solid ${tokens.colorPaletteYellowBorderActive}`,
    backgroundColor: tokens.colorPaletteYellowBackground1,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground1,
    fontSize: "12px",
  },
  auditCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "grid",
    gap: tokens.spacingVerticalS,
  },
  timelineRow: {
    display: "grid",
    gridTemplateColumns: "180px 90px minmax(220px, 1fr) minmax(200px, 1fr)",
    gap: tokens.spacingHorizontalM,
    alignItems: "center",
    fontSize: "12px",
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  stickyFooter: {
    position: "sticky",
    bottom: 0,
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  muted: {
    color: tokens.colorNeutralForeground2,
  },
  dualRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
});

type ConfigTab = "featureFlags" | "sitePolicies" | "changeQueue";

type EditorState = {
  displayName: string;
  siteId: string;
  enabledValue: boolean;
  policyValue: string;
  effectiveFromUtc: string;
  rollbackPlan: string;
  reasonCode: string;
  changeNote: string;
  requiresDualApproval: boolean;
  approverEmpNo: string;
  hasUnsavedChanges: boolean;
};

const REASON_CODES = [
  "PolicyUpdate",
  "OperationalChange",
  "CustomerEscalation",
  "RiskMitigation",
  "ReleaseControl",
];

const EMPTY_EDITOR: EditorState = {
  displayName: "",
  siteId: "",
  enabledValue: false,
  policyValue: "",
  effectiveFromUtc: "",
  rollbackPlan: "",
  reasonCode: "",
  changeNote: "",
  requiresDualApproval: false,
  approverEmpNo: "",
  hasUnsavedChanges: false,
};

const MOCK_FEATURE_FLAGS: FeatureFlagConfig[] = [
  {
    id: 101,
    flagKey: "EnablePromiseDateGate",
    displayName: "Enable Promise Date Gate for Production",
    category: "Order Flow",
    siteId: 10,
    siteName: "Houston",
    currentValue: true,
    effectiveFromUtc: null,
    lastChangedUtc: "2026-02-20T18:00:00Z",
    lastChangedByEmpNo: "EMP045",
    status: "Active",
  },
  {
    id: 102,
    flagKey: "RequireInvoiceEvidence",
    displayName: "Require invoice support evidence",
    category: "Invoice",
    siteId: null,
    siteName: null,
    currentValue: false,
    effectiveFromUtc: "2026-03-01T00:00:00Z",
    lastChangedUtc: "2026-02-18T17:00:00Z",
    lastChangedByEmpNo: "EMP009",
    status: "Scheduled",
  },
];

const MOCK_SITE_POLICIES: SitePolicyConfig[] = [
  {
    id: 201,
    policyKey: "DirectReleasePath",
    displayName: "Direct release from ProductionComplete",
    category: "Order Flow",
    siteId: 11,
    siteName: "Dallas",
    policyValue: "Disabled",
    effectiveFromUtc: null,
    lastChangedUtc: "2026-02-10T15:00:00Z",
    lastChangedByEmpNo: "EMP031",
    status: "Active",
  },
  {
    id: 202,
    policyKey: "RequireOutboundAppointmentPlanning",
    displayName: "Require outbound appointment planning",
    category: "Scheduling",
    siteId: 12,
    siteName: "Phoenix",
    policyValue: "Enabled",
    effectiveFromUtc: null,
    lastChangedUtc: "2026-02-22T16:00:00Z",
    lastChangedByEmpNo: "EMP114",
    status: "Active",
  },
];

const MOCK_AUDIT: SetupConfigAuditEntry[] = [
  {
    id: 9001,
    configType: "FeatureFlag",
    configKey: "EnableTraceabilityStrictMode",
    action: "Updated",
    changedByEmpNo: "EMP114",
    changedUtc: "2026-02-22T18:15:00Z",
    previousValue: "OFF",
    newValue: "ON",
    correlationId: "CORR-98765",
  },
  {
    id: 9002,
    configType: "FeatureFlag",
    configKey: "RequireInvoiceEvidence",
    action: "Scheduled",
    changedByEmpNo: "EMP009",
    changedUtc: "2026-02-18T14:30:00Z",
    previousValue: "OFF",
    newValue: "OFF (effective 2026-03-01)",
    correlationId: "CORR-54321",
  },
];

function toDateTimeInputValue(utcValue: string | null): string {
  if (!utcValue) {
    return "";
  }
  const parsed = new Date(utcValue);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 16);
}

function toUtcOrNull(value: string): string | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toStatus(effectiveFromUtc: string | null): SetupConfigStatus {
  if (!effectiveFromUtc) {
    return "Active";
  }
  return new Date(effectiveFromUtc).getTime() > Date.now() ? "Scheduled" : "Active";
}

export function FeatureFlagsSitePoliciesSetupPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [sites, setSites] = useState<Lookup[]>([]);
  const [activeTab, setActiveTab] = useState<ConfigTab>("featureFlags");
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagConfig[]>([]);
  const [sitePolicies, setSitePolicies] = useState<SitePolicyConfig[]>([]);
  const [auditEntries, setAuditEntries] = useState<SetupConfigAuditEntry[]>([]);
  const [siteFilter, setSiteFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showModifiedOnly, setShowModifiedOnly] = useState(false);
  const [selectedFeatureFlagId, setSelectedFeatureFlagId] = useState<number | null>(null);
  const [selectedSitePolicyId, setSelectedSitePolicyId] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setInfo(null);
      const [sitesResult, featureResult, policyResult, auditResult] = await Promise.allSettled([
        orderLookupsApi.sites(),
        setupApi.listFeatureFlags(),
        setupApi.listSitePolicies(),
        setupApi.listConfigAudit(),
      ]);

      if (sitesResult.status === "fulfilled") {
        setSites(sitesResult.value);
      } else {
        setSites([]);
      }

      if (featureResult.status === "fulfilled") {
        setFeatureFlags(featureResult.value);
      } else {
        setFeatureFlags(MOCK_FEATURE_FLAGS);
        setInfo("Feature flags are in preview mode until setup API endpoints are enabled.");
      }

      if (policyResult.status === "fulfilled") {
        setSitePolicies(policyResult.value);
      } else {
        setSitePolicies(MOCK_SITE_POLICIES);
      }

      if (auditResult.status === "fulfilled") {
        setAuditEntries(auditResult.value);
      } else {
        setAuditEntries(MOCK_AUDIT);
      }

      setLoading(false);
    };

    void load();
  }, []);

  const selectedFeatureFlag = useMemo(
    () => featureFlags.find((item) => item.id === selectedFeatureFlagId) ?? null,
    [featureFlags, selectedFeatureFlagId]
  );
  const selectedSitePolicy = useMemo(
    () => sitePolicies.find((item) => item.id === selectedSitePolicyId) ?? null,
    [sitePolicies, selectedSitePolicyId]
  );

  useEffect(() => {
    if (!selectedFeatureFlag) {
      return;
    }
    setEditor({
      displayName: selectedFeatureFlag.displayName,
      siteId: selectedFeatureFlag.siteId ? String(selectedFeatureFlag.siteId) : "",
      enabledValue: selectedFeatureFlag.currentValue,
      policyValue: "",
      effectiveFromUtc: toDateTimeInputValue(selectedFeatureFlag.effectiveFromUtc),
      rollbackPlan: "",
      reasonCode: "",
      changeNote: "",
      requiresDualApproval: false,
      approverEmpNo: "",
      hasUnsavedChanges: false,
    });
  }, [selectedFeatureFlag]);

  useEffect(() => {
    if (!selectedSitePolicy) {
      return;
    }
    setEditor({
      displayName: selectedSitePolicy.displayName,
      siteId: selectedSitePolicy.siteId ? String(selectedSitePolicy.siteId) : "",
      enabledValue: false,
      policyValue: selectedSitePolicy.policyValue,
      effectiveFromUtc: toDateTimeInputValue(selectedSitePolicy.effectiveFromUtc),
      rollbackPlan: "",
      reasonCode: "",
      changeNote: "",
      requiresDualApproval: false,
      approverEmpNo: "",
      hasUnsavedChanges: false,
    });
  }, [selectedSitePolicy]);

  const visibleFeatureFlags = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return featureFlags.filter((item) => {
      const siteMatch = siteFilter === "all" || String(item.siteId ?? "") === siteFilter;
      const textMatch =
        !searchTerm ||
        item.flagKey.toLowerCase().includes(searchTerm) ||
        item.displayName.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm);
      const modifiedMatch = !showModifiedOnly || item.status === "Scheduled";
      return siteMatch && textMatch && modifiedMatch;
    });
  }, [featureFlags, search, showModifiedOnly, siteFilter]);

  const visibleSitePolicies = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return sitePolicies.filter((item) => {
      const siteMatch = siteFilter === "all" || String(item.siteId ?? "") === siteFilter;
      const textMatch =
        !searchTerm ||
        item.policyKey.toLowerCase().includes(searchTerm) ||
        item.displayName.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm);
      const modifiedMatch = !showModifiedOnly || item.status === "Scheduled";
      return siteMatch && textMatch && modifiedMatch;
    });
  }, [search, showModifiedOnly, siteFilter, sitePolicies]);

  const queuedChanges = useMemo(
    () => [...featureFlags, ...sitePolicies].filter((item) => item.status === "Scheduled"),
    [featureFlags, sitePolicies]
  );

  const markDirty = (patch: Partial<EditorState>) => {
    setEditor((current) => ({ ...current, ...patch, hasUnsavedChanges: true }));
  };

  const resetEditor = () => setEditor((current) => ({ ...current, hasUnsavedChanges: false }));

  const saveCurrentSelection = async () => {
    if (!editor.reasonCode.trim()) {
      setError("Reason code is required before saving configuration changes.");
      return;
    }

    setSaving(true);
    setError(null);
    const effectiveFromUtc = toUtcOrNull(editor.effectiveFromUtc);

    if (activeTab === "featureFlags" && selectedFeatureFlag) {
      const payload: FeatureFlagConfigUpsert = {
        displayName: editor.displayName.trim(),
        siteId: editor.siteId ? Number(editor.siteId) : null,
        currentValue: editor.enabledValue,
        effectiveFromUtc,
        rollbackPlan: editor.rollbackPlan.trim() || null,
        reasonCode: editor.reasonCode,
        changeNote: editor.changeNote.trim() || null,
      };

      try {
        await setupApi.updateFeatureFlag(selectedFeatureFlag.id, payload);
      } catch {
        setInfo("Saved locally for preview. Setup API update endpoint is not yet available.");
      }

      setFeatureFlags((items) =>
        items.map((item) =>
          item.id === selectedFeatureFlag.id
            ? {
                ...item,
                displayName: payload.displayName,
                siteId: payload.siteId ?? null,
                siteName: sites.find((site) => site.id === payload.siteId)?.name ?? null,
                currentValue: payload.currentValue,
                effectiveFromUtc: payload.effectiveFromUtc ?? null,
                status: toStatus(payload.effectiveFromUtc ?? null),
                lastChangedUtc: new Date().toISOString(),
                lastChangedByEmpNo: "CURRENT-USER",
              }
            : item
        )
      );
    }

    if (activeTab === "sitePolicies" && selectedSitePolicy) {
      const payload: SitePolicyConfigUpsert = {
        displayName: editor.displayName.trim(),
        siteId: editor.siteId ? Number(editor.siteId) : null,
        policyValue: editor.policyValue.trim(),
        effectiveFromUtc,
        rollbackPlan: editor.rollbackPlan.trim() || null,
        reasonCode: editor.reasonCode,
        changeNote: editor.changeNote.trim() || null,
      };

      try {
        await setupApi.updateSitePolicy(selectedSitePolicy.id, payload);
      } catch {
        setInfo("Saved locally for preview. Setup API update endpoint is not yet available.");
      }

      setSitePolicies((items) =>
        items.map((item) =>
          item.id === selectedSitePolicy.id
            ? {
                ...item,
                displayName: payload.displayName,
                siteId: payload.siteId ?? null,
                siteName: sites.find((site) => site.id === payload.siteId)?.name ?? null,
                policyValue: payload.policyValue,
                effectiveFromUtc: payload.effectiveFromUtc ?? null,
                status: toStatus(payload.effectiveFromUtc ?? null),
                lastChangedUtc: new Date().toISOString(),
                lastChangedByEmpNo: "CURRENT-USER",
              }
            : item
        )
      );
    }

    setAuditEntries((items) => [
      {
        id: Date.now(),
        configType: activeTab === "featureFlags" ? "FeatureFlag" : "SitePolicy",
        configKey:
          activeTab === "featureFlags"
            ? selectedFeatureFlag?.flagKey ?? "UnknownFlag"
            : selectedSitePolicy?.policyKey ?? "UnknownPolicy",
        action: editor.requiresDualApproval ? "Scheduled" : "Updated",
        changedByEmpNo: "CURRENT-USER",
        changedUtc: new Date().toISOString(),
        previousValue: "-",
        newValue:
          activeTab === "featureFlags" ? (editor.enabledValue ? "ON" : "OFF") : editor.policyValue || "-",
        correlationId: `CORR-${Date.now().toString().slice(-6)}`,
      },
      ...items,
    ]);

    setEditor((current) => ({ ...current, hasUnsavedChanges: false }));
    setSaving(false);
  };

  const statusBadge = (status: SetupConfigStatus) =>
    status === "Active" ? (
      <Badge color="success">Active</Badge>
    ) : (
      <Badge color="warning">Scheduled</Badge>
    );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Title2>Setup - Feature Flags &amp; Site Policies</Title2>
        <div className={styles.nav}>
          <Button appearance="secondary" onClick={() => navigate("/setup/users-roles")}>
            Users &amp; Roles Setup
          </Button>
          <Button appearance="secondary" onClick={() => navigate("/setup/route-templates")}>
            Route Templates Setup
          </Button>
          <Button appearance="secondary" onClick={() => navigate("/")}>
            Home
          </Button>
        </div>
      </div>

      {error ? (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      ) : null}
      {info ? (
        <MessageBar intent="warning">
          <MessageBarBody>{info}</MessageBarBody>
        </MessageBar>
      ) : null}

      <div className={styles.mainGrid}>
        <Card className={styles.filtersCard}>
          <Title3>Filters</Title3>
          <Field label="Site">
            <Select value={siteFilter} onChange={(event) => setSiteFilter(event.target.value)}>
              <option value="all">All Sites</option>
              {sites.map((site) => (
                <option key={site.id} value={String(site.id)}>
                  {site.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Search">
            <Input
              placeholder="Search flags or policies"
              value={search}
              onChange={(_, data) => setSearch(data.value)}
            />
          </Field>
          <Checkbox
            label="Show only modified"
            checked={showModifiedOnly}
            onChange={(_, data) => setShowModifiedOnly(Boolean(data.checked))}
          />
          <Body1 className={styles.muted}>Use Site + Search to compare policy drift across plants.</Body1>
        </Card>

        <Card className={styles.dataPanel}>
          <TabList
            selectedValue={activeTab}
            onTabSelect={(_, data) => setActiveTab(data.value as ConfigTab)}
          >
            <Tab value="featureFlags">Feature Flags</Tab>
            <Tab value="sitePolicies">Site Policies</Tab>
            <Tab value="changeQueue">Change Queue</Tab>
          </TabList>

          <div className={styles.toolbar}>
            <Button appearance="primary">New</Button>
            <Button appearance="secondary">Clone</Button>
            <Button appearance="secondary">Compare Sites</Button>
            <Button appearance="secondary">Export</Button>
          </div>

          {loading ? <Body1>Loading configuration data...</Body1> : null}

          <div className={styles.tableWrap}>
            {activeTab === "featureFlags" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Scope</TableHeaderCell>
                    <TableHeaderCell>Current Value</TableHeaderCell>
                    <TableHeaderCell>Effective From</TableHeaderCell>
                    <TableHeaderCell>Last Changed</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleFeatureFlags.map((item) => (
                    <TableRow
                      key={item.id}
                      className={styles.rowSelectable}
                      onClick={() => setSelectedFeatureFlagId(item.id)}
                      appearance={item.id === selectedFeatureFlagId ? "brand" : "none"}
                    >
                      <TableCell>{item.flagKey}</TableCell>
                      <TableCell>{item.siteName ?? "Global"}</TableCell>
                      <TableCell>{item.currentValue ? "ON" : "OFF"}</TableCell>
                      <TableCell>{item.effectiveFromUtc ? item.effectiveFromUtc : "Immediate"}</TableCell>
                      <TableCell>{`${item.lastChangedUtc} by ${item.lastChangedByEmpNo}`}</TableCell>
                      <TableCell>{statusBadge(item.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}

            {activeTab === "sitePolicies" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Scope</TableHeaderCell>
                    <TableHeaderCell>Value</TableHeaderCell>
                    <TableHeaderCell>Effective From</TableHeaderCell>
                    <TableHeaderCell>Last Changed</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSitePolicies.map((item) => (
                    <TableRow
                      key={item.id}
                      className={styles.rowSelectable}
                      onClick={() => setSelectedSitePolicyId(item.id)}
                      appearance={item.id === selectedSitePolicyId ? "brand" : "none"}
                    >
                      <TableCell>{item.policyKey}</TableCell>
                      <TableCell>{item.siteName ?? "Global"}</TableCell>
                      <TableCell>{item.policyValue}</TableCell>
                      <TableCell>{item.effectiveFromUtc ? item.effectiveFromUtc : "Immediate"}</TableCell>
                      <TableCell>{`${item.lastChangedUtc} by ${item.lastChangedByEmpNo}`}</TableCell>
                      <TableCell>{statusBadge(item.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}

            {activeTab === "changeQueue" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Scope</TableHeaderCell>
                    <TableHeaderCell>Effective</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queuedChanges.map((item) => (
                    <TableRow key={`${"flagKey" in item ? "F" : "P"}-${item.id}`}>
                      <TableCell>{"flagKey" in item ? "Feature Flag" : "Site Policy"}</TableCell>
                      <TableCell>{"flagKey" in item ? item.flagKey : item.policyKey}</TableCell>
                      <TableCell>{item.siteName ?? "Global"}</TableCell>
                      <TableCell>{item.effectiveFromUtc ?? "Immediate"}</TableCell>
                      <TableCell>{statusBadge(item.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </div>
        </Card>

        <Card className={styles.editorCard}>
          <div className={styles.editorHeader}>
            <Title3>
              {activeTab === "sitePolicies" ? "Edit Site Policy" : "Edit Feature Flag"}
            </Title3>
            {editor.hasUnsavedChanges ? <Badge color="danger">Unsaved Changes</Badge> : null}
          </div>
          <div className={styles.editorForm}>
            <Field label={activeTab === "sitePolicies" ? "Policy Key" : "Flag Key"}>
              <Input
                readOnly
                value={
                  activeTab === "sitePolicies"
                    ? selectedSitePolicy?.policyKey ?? ""
                    : selectedFeatureFlag?.flagKey ?? ""
                }
              />
            </Field>
            <Field label="Display Name">
              <Input value={editor.displayName} onChange={(_, data) => markDirty({ displayName: data.value })} />
            </Field>
            <Field label="Site Scope">
              <Select
                value={editor.siteId}
                onChange={(event) => markDirty({ siteId: event.target.value })}
              >
                <option value="">Global</option>
                {sites.map((site) => (
                  <option key={site.id} value={String(site.id)}>
                    {site.name}
                  </option>
                ))}
              </Select>
            </Field>

            {activeTab === "sitePolicies" ? (
              <Field label="Policy Value">
                <Input
                  value={editor.policyValue}
                  onChange={(_, data) => markDirty({ policyValue: data.value })}
                />
              </Field>
            ) : (
              <Field label="Value">
                <Switch
                  label={editor.enabledValue ? "ON" : "OFF"}
                  checked={editor.enabledValue}
                  onChange={(_, data) => markDirty({ enabledValue: Boolean(data.checked) })}
                />
              </Field>
            )}

            <Field label="Effective Datetime (UTC)">
              <Input
                type="datetime-local"
                value={editor.effectiveFromUtc}
                onChange={(_, data) => markDirty({ effectiveFromUtc: data.value })}
              />
            </Field>
            <Field label="Rollback Plan">
              <Textarea
                value={editor.rollbackPlan}
                onChange={(_, data) => markDirty({ rollbackPlan: data.value })}
              />
            </Field>
            <Field label="Reason Code" required>
              <Select value={editor.reasonCode} onChange={(event) => markDirty({ reasonCode: event.target.value })}>
                <option value="">Select reason</option>
                {REASON_CODES.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Change Note">
              <Textarea value={editor.changeNote} onChange={(_, data) => markDirty({ changeNote: data.value })} />
            </Field>
            <div className={styles.callout}>
              This configuration may affect order release and scheduling gates. Use a reason code and rollback note
              for all production changes.
            </div>
            <div className={styles.dualRow}>
              <Checkbox
                label="Requires dual approval"
                checked={editor.requiresDualApproval}
                onChange={(_, data) => markDirty({ requiresDualApproval: Boolean(data.checked) })}
              />
              <Field label="Approver Emp No">
                <Input
                  value={editor.approverEmpNo}
                  onChange={(_, data) => markDirty({ approverEmpNo: data.value })}
                  placeholder="EMP###"
                />
              </Field>
            </div>
            <div className={styles.actions}>
              <Button appearance="primary" onClick={() => void saveCurrentSelection()} disabled={saving}>
                {saving ? "Saving..." : "Save Change"}
              </Button>
              <Button appearance="secondary" onClick={resetEditor}>
                Cancel
              </Button>
              <Button appearance="secondary" disabled={!editor.requiresDualApproval}>
                Request Approval
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card className={styles.auditCard}>
        <Title3>Audit Timeline</Title3>
        {auditEntries.map((entry) => (
          <div key={entry.id} className={styles.timelineRow}>
            <span>{entry.changedUtc}</span>
            <span>{entry.changedByEmpNo}</span>
            <span>{`${entry.action} '${entry.configKey}' (${entry.previousValue} -> ${entry.newValue})`}</span>
            <span>{entry.correlationId}</span>
          </div>
        ))}
      </Card>

      <div className={styles.stickyFooter}>
        <Body1 className={styles.muted}>Submit policy changes after peer review.</Body1>
        <div className={styles.actions}>
          <Button appearance="secondary" onClick={resetEditor}>
            Discard Draft
          </Button>
          <Button appearance="primary" onClick={() => void saveCurrentSelection()} disabled={saving}>
            Submit Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
