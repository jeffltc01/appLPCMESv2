import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FeatureFlagsSitePoliciesSetupPage } from "./FeatureFlagsSitePoliciesSetupPage";

const sitesMock = vi.fn();
const listFeatureFlagsMock = vi.fn();
const listSitePoliciesMock = vi.fn();
const listConfigAuditMock = vi.fn();

vi.mock("../services/orders", () => ({
  orderLookupsApi: {
    sites: (...args: unknown[]) => sitesMock(...args),
  },
}));

vi.mock("../services/setup", () => ({
  setupApi: {
    listFeatureFlags: (...args: unknown[]) => listFeatureFlagsMock(...args),
    listSitePolicies: (...args: unknown[]) => listSitePoliciesMock(...args),
    listConfigAudit: (...args: unknown[]) => listConfigAuditMock(...args),
    updateFeatureFlag: vi.fn(),
    updateSitePolicy: vi.fn(),
  },
}));

describe("FeatureFlagsSitePoliciesSetupPage", () => {
  beforeEach(() => {
    sitesMock.mockResolvedValue([
      { id: 10, name: "Houston" },
      { id: 11, name: "Dallas" },
    ]);
    listFeatureFlagsMock.mockResolvedValue([
      {
        id: 1,
        flagKey: "EnablePromiseDateGate",
        displayName: "Enable Promise Date Gate",
        category: "Order Flow",
        siteId: 10,
        siteName: "Houston",
        currentValue: true,
        effectiveFromUtc: null,
        lastChangedUtc: "2026-02-20T18:00:00Z",
        lastChangedByEmpNo: "EMP045",
        status: "Active",
      },
    ]);
    listSitePoliciesMock.mockResolvedValue([
      {
        id: 2,
        policyKey: "DirectReleasePath",
        displayName: "Direct release from production complete",
        category: "Order Flow",
        siteId: 11,
        siteName: "Dallas",
        policyValue: "Disabled",
        effectiveFromUtc: null,
        lastChangedUtc: "2026-02-10T15:00:00Z",
        lastChangedByEmpNo: "EMP031",
        status: "Active",
      },
    ]);
    listConfigAuditMock.mockResolvedValue([
      {
        id: 100,
        configType: "FeatureFlag",
        configKey: "EnablePromiseDateGate",
        action: "Updated",
        changedByEmpNo: "EMP045",
        changedUtc: "2026-02-20T18:00:00Z",
        previousValue: "OFF",
        newValue: "ON",
        correlationId: "CORR-12345",
      },
    ]);
  });

  it("renders feature flag and policy maintenance view", async () => {
    render(
      <MemoryRouter>
        <FeatureFlagsSitePoliciesSetupPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listFeatureFlagsMock).toHaveBeenCalled();
      expect(listSitePoliciesMock).toHaveBeenCalled();
      expect(listConfigAuditMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Setup - Feature Flags & Site Policies")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Feature Flags" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Site Policies" })).toBeInTheDocument();
    expect(screen.getByText("EnablePromiseDateGate")).toBeInTheDocument();
    expect(screen.getByText("Audit Timeline")).toBeInTheDocument();
  });
});
