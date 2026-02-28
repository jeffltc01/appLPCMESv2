import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter, MemoryRouter, useLocation } from "react-router-dom";
import { MenuPage } from "./MenuPage";

const listMock = vi.fn();

vi.mock("../services/orders", () => ({
  ordersApi: {
    list: (...args: unknown[]) => listMock(...args),
  },
}));

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

describe("MenuPage", () => {
  beforeEach(() => {
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

    expect(await screen.findByText("SO-1001")).toBeInTheDocument();
    expect(screen.getByText("Order Entry Workspace")).toBeInTheDocument();
    expect(screen.getByText("Open Order Queue")).toBeInTheDocument();
    expect(screen.getByText("Order Risk Mix")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New Sales Order/i })).toBeInTheDocument();
  });

  it("navigates when top menu icon button is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await screen.findByText("SO-1001");
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

    await screen.findByText("SO-1001");
    fireEvent.click(screen.getByRole("button", { name: /^Receiving$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/receiving");
  });

  it("calculates and renders metrics from loaded orders", async () => {
    render(
      <MemoryRouter>
        <MenuPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("SO-1001")).toBeInTheDocument();
    expect(screen.getByText("Open Orders").parentElement).toHaveTextContent("3");
    expect(screen.getByText("Needs Review").parentElement).toHaveTextContent("1");
    expect(screen.getByText("Late Risk").parentElement).toHaveTextContent("1");
    expect(screen.getByText("Ready to Release").parentElement).toHaveTextContent("1");
    expect(screen.getByText("Low risk (1)")).toBeInTheDocument();
    expect(screen.getByText("Medium risk (1)")).toBeInTheDocument();
    expect(screen.getByText("High risk (1)")).toBeInTheDocument();
  });

  it("applies filters to queue and metrics", async () => {
    render(
      <MemoryRouter>
        <MenuPage />
      </MemoryRouter>,
    );

    await screen.findByText("SO-1001");
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "SO-1003" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(screen.getByText("SO-1003")).toBeInTheDocument();
    expect(screen.queryByText("SO-1001")).not.toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getByText("High risk (1)")).toBeInTheDocument();
  });

  it("navigates to new sales order screen", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await screen.findByText("SO-1001");
    fireEvent.click(screen.getByRole("button", { name: "New Sales Order" }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/orders/new");
  });
});
