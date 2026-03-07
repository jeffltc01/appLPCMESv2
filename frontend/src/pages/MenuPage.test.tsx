import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter, MemoryRouter, useLocation } from "react-router-dom";
import { MenuPage } from "./MenuPage";

const listMock = vi.fn();
const logoutMock = vi.fn();
const authSessionMock = {
  token: "test-token",
  expiresUtc: "2099-01-01T00:00:00Z",
  authMethod: "operator-id",
  userId: 1,
  empNo: "EMP001",
  displayName: "Test Operator",
  siteId: 10,
  siteName: "Houston",
  workCenterId: 1,
  workCenterCode: "WC-1",
  workCenterName: "Work Center 1",
  roles: ["Office"],
};

vi.mock("../services/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/orders")>();
  return {
    ...actual,
    ordersApi: {
      ...actual.ordersApi,
      list: (...args: unknown[]) => listMock(...args),
    },
  };
});

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    isLoading: false,
    session: authSessionMock,
    operatorPreLogin: vi.fn(),
    microsoftLogin: vi.fn(),
    operatorLogin: vi.fn(),
    logout: logoutMock,
  }),
}));

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

describe("MenuPage", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    authSessionMock.displayName = "Test Operator";
    authSessionMock.empNo = "EMP001";
    listMock.mockResolvedValue({
      items: [
        {
          id: 1,
          salesOrderNo: "SO-1001",
          orderDate: "2026-02-27",
          orderStatus: "New",
          customerId: 2,
          customerName: "Acme Industrial",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 2,
          totalOrderedQuantity: 8,
          orderLifecycleStatus: "Draft",
          holdOverlay: null,
        },
        {
          id: 2,
          salesOrderNo: "SO-1002",
          orderDate: "2026-02-27",
          orderStatus: "Ready to Ship",
          customerId: 3,
          customerName: "BlueLine Supply",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 4,
          orderLifecycleStatus: "ProductionComplete",
          holdOverlay: null,
        },
        {
          id: 3,
          salesOrderNo: "SO-1003",
          orderDate: "2026-02-27",
          orderStatus: "Ready to Invoice",
          customerId: 4,
          customerName: "Northeast Gas",
          siteId: 11,
          siteName: "Dallas",
          customerPoNo: null,
          contact: null,
          lineCount: 3,
          totalOrderedQuantity: 12,
          orderLifecycleStatus: "InvoiceReady",
          holdOverlay: "OnHoldQuality",
        },
      ],
      totalCount: 3,
      page: 1,
      pageSize: 200,
    });
  });

  it("renders LPC-styled order entry dashboard shell", async () => {
    render(
      <BrowserRouter>
        <MenuPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    expect(screen.getByText("LP Cylinder")).toBeInTheDocument();
    expect(screen.queryByText("LPC Order Ops")).not.toBeInTheDocument();
    expect(screen.queryByText("Order Entry Workspace")).not.toBeInTheDocument();
    expect(screen.getByText("Test Operator")).toBeInTheDocument();
    expect(screen.getByText("Site: Houston")).toBeInTheDocument();
    expect(screen.queryByText("Order Intake by Lifecycle Stage")).not.toBeInTheDocument();
    expect(screen.queryByText("Open Order Queue")).not.toBeInTheDocument();
    expect(screen.queryByText("Order Risk Mix")).not.toBeInTheDocument();
    expect(screen.getByText("Open Order Aging Buckets")).toBeInTheDocument();
    expect(screen.getByText("Avg Days to Pickup (Monthly)")).toBeInTheDocument();
    expect(screen.getByText("Avg Total Days Order to Invoice (Monthly)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /New Sales Order/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Filters/i })).not.toBeInTheDocument();
  });

  it("renders only person name when session displayName includes employee number", async () => {
    authSessionMock.displayName = "EMP001 - Test Operator";
    authSessionMock.empNo = "EMP001";

    render(
      <BrowserRouter>
        <MenuPage />
      </BrowserRouter>,
    );

    expect(await screen.findByText("Test Operator")).toBeInTheDocument();
    expect(screen.queryByText("EMP001 - Test Operator")).not.toBeInTheDocument();
  });

  it("renders only person name when employee number is suffixed", async () => {
    authSessionMock.displayName = "Test Operator - EMP001";
    authSessionMock.empNo = "EMP001";

    render(
      <BrowserRouter>
        <MenuPage />
      </BrowserRouter>,
    );

    expect(await screen.findByText("Test Operator")).toBeInTheDocument();
    expect(screen.queryByText("Test Operator - EMP001")).not.toBeInTheDocument();
  });

  it("navigates when top menu icon button is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Invoicing$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/invoices");
  });

  it("navigates to receiving queue from receiving button", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Receiving$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/receiving");
  });

  it("navigates to operator work center page from top menu", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Work Center$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/operator/work-center");
  });

  it("navigates to plant manager board from top menu", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Plant Manager$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/plant-manager");
  });

  it("opens admin maintenance menu and navigates to product lines setup", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Admin$/i }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /^Product Lines$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/setup/production-lines");
  });

  it("opens admin maintenance menu and navigates to items setup", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Admin$/i }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /^Items$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/setup/items");
  });

  it("opens admin maintenance menu and navigates to work centers setup", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Admin$/i }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /^Work Centers$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/setup/work-centers");
  });

  it("opens admin maintenance menu and navigates to route templates setup", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Admin$/i }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /^Route Templates$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/setup/route-templates");
  });

  it("opens admin maintenance menu and navigates to tablet setup", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Admin$/i }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /^Tablet Setup$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/setup/tablet");
  });

  it("opens admin maintenance menu and navigates to users setup", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Admin$/i }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /^Users$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/setup/users");
  });

  it("opens admin maintenance menu and navigates to roles setup", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Admin$/i }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /^Roles$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/setup/roles");
  });

  it("opens admin maintenance menu and navigates to order audit log", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Admin$/i }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /^Order Audit Log$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/setup/order-audit-log");
  });

  it("opens admin maintenance menu and navigates to feature flags and site policies setup", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: /^Admin$/i }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /^Feature Flags & Site Policies$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/setup/feature-flags-policies");
  });

  it("calculates and renders metrics from loaded orders", async () => {
    render(
      <MemoryRouter>
        <MenuPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    expect(screen.getByText("Total Open Orders").parentElement?.parentElement).toHaveTextContent("3");
    expect(screen.getByText("Total Awaiting Receipt").parentElement?.parentElement).toHaveTextContent("1");
    expect(screen.getByText("Total In Production").parentElement?.parentElement).toHaveTextContent("1");
    expect(screen.getByText("Total Awaiting Invoicing").parentElement?.parentElement).toHaveTextContent("1");
  });

  it("renders a dashed average line on each monthly line chart", async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 501,
          salesOrderNo: "SO-501",
          orderDate: "2026-01-02",
          receivedDate: "2026-01-05",
          readyToInvoiceDate: "2026-01-12",
          invoiceDate: "2026-01-20",
          orderStatus: "Invoiced",
          customerId: 2,
          customerName: "Acme Industrial",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 1,
          orderLifecycleStatus: "Invoiced",
          holdOverlay: null,
        },
        {
          id: 502,
          salesOrderNo: "SO-502",
          orderDate: "2026-02-03",
          receivedDate: "2026-02-06",
          readyToInvoiceDate: "2026-02-14",
          invoiceDate: "2026-02-21",
          orderStatus: "Invoiced",
          customerId: 2,
          customerName: "BlueLine Supply",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 1,
          orderLifecycleStatus: "Invoiced",
          holdOverlay: null,
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 200,
    });

    render(
      <MemoryRouter>
        <MenuPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });

    const charts = screen.getAllByRole("img", { name: /monthly average days chart/i });
    expect(charts).toHaveLength(4);

    charts.forEach((chart) => {
      const avgLine = chart.querySelector('line[stroke-dasharray="6 4"]');
      expect(avgLine).not.toBeNull();
    });
  });

  it("renders a 14-day goal line on total order-to-invoice chart", async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 601,
          salesOrderNo: "SO-601",
          orderDate: "2026-01-02",
          receivedDate: "2026-01-05",
          readyToInvoiceDate: "2026-01-12",
          invoiceDate: "2026-01-20",
          orderStatus: "Invoiced",
          customerId: 2,
          customerName: "Acme Industrial",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 1,
          orderLifecycleStatus: "Invoiced",
          holdOverlay: null,
        },
        {
          id: 602,
          salesOrderNo: "SO-602",
          orderDate: "2026-02-03",
          receivedDate: "2026-02-06",
          readyToInvoiceDate: "2026-02-14",
          invoiceDate: "2026-02-21",
          orderStatus: "Invoiced",
          customerId: 2,
          customerName: "BlueLine Supply",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 1,
          orderLifecycleStatus: "Invoiced",
          holdOverlay: null,
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 200,
    });

    render(
      <MemoryRouter>
        <MenuPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Goal 14d")).toBeInTheDocument();
    const goalLines = document.querySelectorAll('line[stroke="#107C10"][stroke-dasharray="4 4"]');
    expect(goalLines).toHaveLength(1);
  });

  it("renders multiple y-axis ticks on each monthly line chart", async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 701,
          salesOrderNo: "SO-701",
          orderDate: "2026-01-02",
          receivedDate: "2026-01-05",
          readyToInvoiceDate: "2026-01-12",
          invoiceDate: "2026-01-20",
          orderStatus: "Invoiced",
          customerId: 2,
          customerName: "Acme Industrial",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 1,
          orderLifecycleStatus: "Invoiced",
          holdOverlay: null,
        },
        {
          id: 702,
          salesOrderNo: "SO-702",
          orderDate: "2026-02-03",
          receivedDate: "2026-02-06",
          readyToInvoiceDate: "2026-02-14",
          invoiceDate: "2026-02-21",
          orderStatus: "Invoiced",
          customerId: 2,
          customerName: "BlueLine Supply",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 1,
          orderLifecycleStatus: "Invoiced",
          holdOverlay: null,
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 200,
    });

    render(
      <MemoryRouter>
        <MenuPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });

    const charts = screen.getAllByRole("img", { name: /monthly average days chart/i });
    expect(charts).toHaveLength(4);
    charts.forEach((chart) => {
      const yTicks = chart.querySelectorAll('text[data-line-chart-y-tick="true"]');
      expect(yTicks.length).toBeGreaterThan(2);
    });
  });

  it("maps legacy workflow statuses into lifecycle metrics when lifecycle is missing", async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 11,
          salesOrderNo: "SO-2001",
          orderDate: "2026-02-28",
          orderStatus: "New",
          customerId: 2,
          customerName: "Acme Industrial",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 3,
          holdOverlay: null,
        },
        {
          id: 12,
          salesOrderNo: "SO-2002",
          orderDate: "2026-02-28",
          orderStatus: "Ready to Ship",
          customerId: 3,
          customerName: "BlueLine Supply",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 2,
          holdOverlay: null,
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 200,
    });

    render(
      <MemoryRouter>
        <MenuPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    expect(screen.getByText("Total Awaiting Receipt").parentElement?.parentElement).toHaveTextContent("1");
    expect(screen.getByText("Total In Production").parentElement?.parentElement).toHaveTextContent("1");
  });

  it("keeps aging bucket bars centered with their x-axis labels", async () => {
    const toIsoDate = (daysAgo: number) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().slice(0, 10);
    };

    const createOrder = (id: number, orderDate: string) => ({
      id,
      salesOrderNo: `SO-${id}`,
      orderDate,
      orderStatus: "New",
      customerId: 2,
      customerName: "Acme Industrial",
      siteId: 10,
      siteName: "Houston",
      customerPoNo: null,
      contact: null,
      lineCount: 1,
      totalOrderedQuantity: 1,
      orderLifecycleStatus: "Draft",
      holdOverlay: null,
    });

    const items = [
      ...Array.from({ length: 2 }, (_, i) => createOrder(300 + i, toIsoDate(5))),
      ...Array.from({ length: 4 }, (_, i) => createOrder(320 + i, toIsoDate(20))),
      ...Array.from({ length: 6 }, (_, i) => createOrder(340 + i, toIsoDate(40))),
      ...Array.from({ length: 8 }, (_, i) => createOrder(360 + i, toIsoDate(90))),
    ];

    listMock.mockResolvedValueOnce({
      items,
      totalCount: items.length,
      page: 1,
      pageSize: 200,
    });

    render(
      <MemoryRouter>
        <MenuPage />
      </MemoryRouter>,
    );

    const chart = await screen.findByRole("img", { name: /open order aging buckets chart/i });
    const bars = Array.from(chart.querySelectorAll("rect"));
    const labels = Array.from(chart.querySelectorAll("text")).filter((node) =>
      node.textContent?.endsWith(" days")
    );

    expect(bars).toHaveLength(4);
    expect(labels).toHaveLength(4);

    bars.forEach((bar, index) => {
      const barX = Number(bar.getAttribute("x"));
      const barWidth = Number(bar.getAttribute("width"));
      const barCenterX = barX + barWidth / 2;
      const labelX = Number(labels[index].getAttribute("x"));
      expect(barCenterX).toBeCloseTo(labelX, 3);
    });
  });

  it("logs out and redirects to login", async () => {
    logoutMock.mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByTestId("current-path")).toHaveTextContent("/login");
    });
  });
});
