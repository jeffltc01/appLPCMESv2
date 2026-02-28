import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OrderListPage } from "./OrderListPage";

vi.mock("../services/orders", () => ({
  ordersApi: {
    list: vi.fn().mockResolvedValue({
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
    }),
  },
}));

describe("OrderListPage", () => {
  it("renders list data and create action", async () => {
    render(
      <MemoryRouter>
        <OrderListPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Sales Orders")).toBeInTheDocument();
    expect(screen.getByText("SO-1001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create New Order" })).toBeInTheDocument();
  });
});
