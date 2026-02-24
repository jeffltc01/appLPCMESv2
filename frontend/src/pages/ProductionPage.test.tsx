import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProductionPage } from "./ProductionPage";

const ordersApiMock = vi.hoisted(() => ({
  productionList: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
}));

describe("ProductionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads production queue and opens production order detail", async () => {
    ordersApiMock.productionList.mockResolvedValue([
      {
        id: 21,
        salesOrderNo: "SO-21",
        customerName: "Acme",
        siteName: "Main",
        priority: 2,
        itemsOrderedSummary: "TNK-1 (2)",
        receivedDate: "2026-02-23T00:00:00",
        lineCount: 1,
        totalOrderedQuantity: 2,
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/production"]}>
        <Routes>
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/production/:id" element={<div>Production Detail Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.productionList).toHaveBeenCalled());
    expect(screen.getByText("SO-21")).toBeInTheDocument();

    fireEvent.click(screen.getByText("SO-21"));
    expect(screen.getByText("Production Detail Screen")).toBeInTheDocument();
  });
});

