import { render, screen } from "@testing-library/react";
import App from "./App";
import { TABLET_SETUP_STORAGE_KEY } from "./features/tabletSetupStorage";

const getSessionMock = vi.fn();

vi.mock("./services/orders", () => ({
  ordersApi: {
    list: vi.fn().mockResolvedValue({ items: [], totalCount: 0, page: 1, pageSize: 100 }),
    get: vi.fn(),
    submitInvoice: vi.fn(),
    globalAuditTrail: vi.fn().mockResolvedValue({ items: [], totalCount: 0, page: 1, pageSize: 50 }),
    orderAuditTrail: vi.fn().mockResolvedValue({ items: [], totalCount: 0, page: 1, pageSize: 25 }),
    attachments: vi.fn().mockResolvedValue([]),
    attachmentDownloadUrl: vi.fn().mockReturnValue("#"),
  },
  orderLookupsApi: {
    activeCustomers: vi.fn().mockResolvedValue([]),
    sites: vi.fn().mockResolvedValue([]),
    scrapReasons: vi.fn().mockResolvedValue([]),
    salesPeople: vi.fn().mockResolvedValue([]),
    paymentTerms: vi.fn().mockResolvedValue([]),
    shipVias: vi.fn().mockResolvedValue([]),
  },
  orderLinesApi: {},
  getSuggestedWorkspaceActions: vi.fn().mockReturnValue(["advanceInboundPlan"]),
  getWorkspaceActionState: vi.fn().mockReturnValue({
    enabled: true,
    targetStatus: "InboundLogisticsPlanned",
  }),
}));

vi.mock("./services/setup", () => ({
  setupApi: {
    listWorkCenters: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("./services/auth", () => ({
  authApi: {
    operatorPreLogin: vi.fn(),
    operatorLogin: vi.fn(),
    logout: vi.fn(),
    getSession: (...args: unknown[]) => getSessionMock(...args),
  },
}));

describe("App routing", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("lpcmes.authToken", "test-token");
    getSessionMock.mockResolvedValue({
      token: "test-token",
      expiresUtc: "2099-01-01T00:00:00Z",
      authMethod: "operator-id",
      userId: 1,
      empNo: "EMP001",
      displayName: "Test Operator",
      siteId: 1,
      siteName: "Main",
      workCenterId: 1,
      workCenterCode: "WC-1",
      workCenterName: "Work Center 1",
      roles: ["Production"],
    });
  });

  it("opens menu at root", async () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(await screen.findByText("LPC Order Ops")).toBeInTheDocument();
  });

  it("opens new-order workspace route", async () => {
    window.history.pushState({}, "", "/orders/new");
    render(<App />);
    expect(await screen.findByText("Create New Sales Order")).toBeInTheDocument();
  });

  it("opens customer detail placeholder route", async () => {
    window.history.pushState({}, "", "/customers/123");
    render(<App />);
    expect(await screen.findByText("Customer Detail (Placeholder)")).toBeInTheDocument();
    expect(screen.getByText("Customer ID: 123")).toBeInTheDocument();
  });

  it("opens invoice queue route", async () => {
    window.history.pushState({}, "", "/invoices");
    render(<App />);
    expect(await screen.findByText("Invoice Queue")).toBeInTheDocument();
  });

  it("opens invoice workspace route", async () => {
    window.history.pushState({}, "", "/invoices/123");
    render(<App />);
    expect(await screen.findByRole("button", { name: "Start Invoice Submission" })).toBeInTheDocument();
  });

  it("opens tablet setup route", async () => {
    window.history.pushState({}, "", "/setup/tablet");
    render(<App />);
    expect(await screen.findByText("Tablet Setup")).toBeInTheDocument();
  });

  it("opens order audit log route", async () => {
    window.history.pushState({}, "", "/setup/order-audit-log");
    render(<App />);
    expect(await screen.findByText("Order Audit Log")).toBeInTheDocument();
  });

  it("redirects operator route to tablet setup when no setup cache exists", async () => {
    window.history.pushState({}, "", "/operator/work-center");
    window.localStorage.removeItem(TABLET_SETUP_STORAGE_KEY);
    render(<App />);
    expect(await screen.findByText("Tablet Setup")).toBeInTheDocument();
  });
});
