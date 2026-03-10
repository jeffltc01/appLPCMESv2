import { render, screen } from "@testing-library/react";
import App from "./App";

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

vi.mock("./services/customers", () => ({
  customersApi: {
    list: vi.fn().mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
    }),
    get: vi.fn().mockResolvedValue({
      id: 123,
      name: "Acme Industrial",
      customerCode: "ACME",
      status: "Active",
      email: "ops@acme.com",
      notes: null,
      customerParentId: null,
      customerParentName: null,
      defaultSalesEmployeeId: null,
      defaultSalesEmployeeName: null,
      tankColorId: null,
      tankColorName: null,
      lidColorId: null,
      lidColorName: null,
      defaultPaymentTermId: null,
      defaultPaymentTermName: null,
      defaultShipViaId: null,
      defaultShipViaName: null,
      defaultOrderContactId: null,
      defaultOrderContactName: null,
      defaultBillToId: null,
      defaultPickUpId: null,
      defaultShipToId: null,
      defaultNeedCollars: null,
      defaultNeedFillers: null,
      defaultNeedFootRings: null,
      defaultReturnScrap: null,
      defaultReturnBrass: null,
      defaultValveType: null,
      defaultGauges: null,
      addresses: [],
      contacts: [],
    }),
    update: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
  },
  addressesApi: {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  contactsApi: {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  lookupsApi: {
    colors: vi.fn().mockResolvedValue([]),
    paymentTerms: vi.fn().mockResolvedValue([]),
    shipVias: vi.fn().mockResolvedValue([]),
    salesPeople: vi.fn().mockResolvedValue([]),
    sites: vi.fn().mockResolvedValue([]),
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
    expect(await screen.findByText("LP Cylinder")).toBeInTheDocument();
  });

  it("opens new-order workspace route", async () => {
    window.history.pushState({}, "", "/orders/new");
    render(<App />);
    expect(await screen.findByText("Create New Sales Order")).toBeInTheDocument();
  });

  it("opens customers list route", async () => {
    window.history.pushState({}, "", "/customers");
    render(<App />);
    expect(await screen.findByText("Customers")).toBeInTheDocument();
  });

  it("opens customer detail maintenance route", async () => {
    window.history.pushState({}, "", "/customers/123");
    render(<App />);
    expect(await screen.findByText("Customer Maintenance")).toBeInTheDocument();
  });

  it("opens invoice queue route", async () => {
    window.history.pushState({}, "", "/invoices");
    render(<App />);
    expect(await screen.findByText("Invoice Queue")).toBeInTheDocument();
  });

  it("opens microsoft popup callback route", async () => {
    window.history.pushState({}, "", "/auth/popup-callback");
    render(<App />);
    expect(await screen.findByText("Completing Microsoft sign-in...")).toBeInTheDocument();
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

  it("opens operator work center route", async () => {
    window.history.pushState({}, "", "/operator/work-center");
    render(<App />);
    expect(await screen.findByText("LPC Operator")).toBeInTheDocument();
  });
});
