import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OrderListPage } from "./OrderListPage";

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

  it("loads orders and opens selected order detail", async () => {
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
          <Route path="/orders/:id" element={<div>Order Detail Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.list).toHaveBeenCalled());
    expect(screen.getByText("SO-0099")).toBeInTheDocument();

    fireEvent.click(screen.getByText("SO-0099"));
    expect(screen.getByText("Order Detail Screen")).toBeInTheDocument();
  });
});

