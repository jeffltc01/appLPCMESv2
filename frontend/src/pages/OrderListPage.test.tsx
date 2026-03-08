import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OrderListPage } from "./OrderListPage";

const listMock = vi.fn();

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

describe("OrderListPage", () => {
  beforeEach(() => {
    listMock.mockReset();
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
          lineCount: 0,
          totalOrderedQuantity: 0,
          orderLifecycleStatus: "Draft",
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 100,
    });
  });

  it("renders list data and create action", async () => {
    render(
      <MemoryRouter>
        <OrderListPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Sales Orders")).toBeInTheDocument();
    expect(screen.getByText("SO-1001")).toBeInTheDocument();
    expect(screen.getByText("1 sales order(s)")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create New Order" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Transportation Dispatch" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Invoice Screen" })).not.toBeInTheDocument();
  });

  it("pre-filters list by aging bucket from query string", async () => {
    const toIsoDate = (daysAgo: number) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().slice(0, 10);
    };

    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 101,
          salesOrderNo: "SO-0101",
          orderDate: toIsoDate(12),
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
        },
        {
          id: 102,
          salesOrderNo: "SO-0102",
          orderDate: toIsoDate(20),
          orderStatus: "New",
          customerId: 3,
          customerName: "BlueLine Supply",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 1,
          orderLifecycleStatus: "Draft",
        },
        {
          id: 103,
          salesOrderNo: "SO-0103",
          orderDate: toIsoDate(70),
          orderStatus: "New",
          customerId: 4,
          customerName: "Northeast Gas",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 1,
          orderLifecycleStatus: "Draft",
        },
      ],
      totalCount: 3,
      page: 1,
      pageSize: 100,
    });

    render(
      <MemoryRouter initialEntries={["/orders?agingBucket=16-30"]}>
        <OrderListPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Sales Orders")).toBeInTheDocument();
    expect(screen.getByText("SO-0102")).toBeInTheDocument();
    expect(screen.queryByText("SO-0101")).not.toBeInTheDocument();
    expect(screen.queryByText("SO-0103")).not.toBeInTheDocument();
    expect(screen.getByText("1 sales order(s)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clear Aging Filter \(16-30 days\)/i })).toBeInTheDocument();
  });
});
