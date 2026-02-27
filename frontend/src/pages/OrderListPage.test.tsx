import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OrderListPage } from "./OrderListPage";
import { ORDER_STATUS_KEYS } from "../types/order";

const ordersApiMock = vi.hoisted(() => ({
  list: vi.fn(),
}));

const orderLookupsApiMock = vi.hoisted(() => ({
  activeCustomers: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
  orderLookupsApi: orderLookupsApiMock,
}));

describe("OrderListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads orders and opens selected order workspace", async () => {
    orderLookupsApiMock.activeCustomers.mockResolvedValue([
      { id: 12, name: "Acme" },
    ]);
    ordersApiMock.list.mockResolvedValue({
      items: [
        {
          id: 99,
          salesOrderNo: "SO-0099",
          orderDate: "2026-02-24",
          orderStatus: "New",
          customerId: 12,
          customerName: "Acme",
          siteId: 1,
          siteName: "Main",
          customerPoNo: "PO-77",
          contact: "John",
          lineCount: 1,
          totalOrderedQuantity: 5,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 25,
    });

    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/:id/workspace" element={<div>Order Workspace Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.list).toHaveBeenCalled());
    expect(ordersApiMock.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS_KEYS.NEW })
    );
    expect(screen.getByText("SO-0099")).toBeInTheDocument();

    fireEvent.click(screen.getByText("SO-0099"));
    expect(screen.getByText("Order Workspace Screen")).toBeInTheDocument();
  });

  it("applies Ready to Invoice filter on invoicing route", async () => {
    orderLookupsApiMock.activeCustomers.mockResolvedValue([]);
    ordersApiMock.list.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
    });

    render(
      <MemoryRouter initialEntries={["/invoicing"]}>
        <Routes>
          <Route path="/invoicing" element={<OrderListPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.list).toHaveBeenCalled());
    expect(ordersApiMock.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS_KEYS.READY_TO_INVOICE })
    );
  });
});

