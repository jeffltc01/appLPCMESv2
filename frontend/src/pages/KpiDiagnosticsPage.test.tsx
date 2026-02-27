import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { KpiDiagnosticsPage } from "./KpiDiagnosticsPage";

const ordersApiMock = vi.hoisted(() => ({
  kpiDiagnostics: vi.fn(),
}));

const orderLookupsApiMock = vi.hoisted(() => ({
  sites: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
  orderLookupsApi: orderLookupsApiMock,
}));

describe("KpiDiagnosticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads diagnostics and opens workspace link", async () => {
    orderLookupsApiMock.sites.mockResolvedValue([{ id: 1, name: "Main" }]);
    ordersApiMock.kpiDiagnostics.mockResolvedValue({
      generatedUtc: "2026-02-27T12:00:00Z",
      totalAffectedOrders: 1,
      items: [
        {
          orderId: 77,
          salesOrderNo: "SO-0077",
          siteId: 1,
          customerId: 10,
          lifecycleStatus: "InvoiceReady",
          missingTimestampCount: 2,
          missingReasonCodeCount: 0,
          missingOwnershipCount: 1,
          invalidOrderingCount: 0,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/orderboard/kpi-diagnostics"]}>
        <Routes>
          <Route path="/orderboard/kpi-diagnostics" element={<KpiDiagnosticsPage />} />
          <Route path="/orders/:id/workspace" element={<div>Workspace Target</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.kpiDiagnostics).toHaveBeenCalled());
    expect(screen.getByText("SO-0077")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open Workspace" }));
    expect(screen.getByText("Workspace Target")).toBeInTheDocument();
  });
});
