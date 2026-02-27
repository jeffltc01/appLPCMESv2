import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OrderWorkspacePage } from "./OrderWorkspacePage";
import { ordersApi } from "../services/orders";

describe("OrderWorkspacePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requires override reason and note before protected action execution", async () => {
    vi.spyOn(ordersApi, "get").mockResolvedValue({
      id: 1,
      salesOrderNo: "SO-1001",
      orderDate: "2026-02-27",
      orderStatus: "Draft",
      orderCreatedDate: "2026-02-27",
      readyForPickupDate: null,
      pickupScheduledDate: null,
      receivedDate: null,
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 10,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: null,
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: 0,
      returnBrass: 0,
      lines: [],
      orderLifecycleStatus: "Draft",
    });
    vi.spyOn(ordersApi, "attachments").mockResolvedValue([]);
    const advanceStatusSpy = vi.spyOn(ordersApi, "advanceStatus").mockResolvedValue({
      id: 1,
      salesOrderNo: "SO-1001",
      orderDate: "2026-02-27",
      orderStatus: "InboundLogisticsPlanned",
      orderCreatedDate: "2026-02-27",
      readyForPickupDate: null,
      pickupScheduledDate: null,
      receivedDate: null,
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 10,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: null,
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: 0,
      returnBrass: 0,
      lines: [],
      orderLifecycleStatus: "InboundLogisticsPlanned",
    });

    render(
      <MemoryRouter initialEntries={["/orders/1/workspace"]}>
        <Routes>
          <Route path="/orders/:id/workspace" element={<OrderWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Order Workspace")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Enable" }));
    fireEvent.click(screen.getByRole("button", { name: "Plan Inbound" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Override" }));

    expect(
      await screen.findByText("Override mode requires reason code and note before proceeding.")
    ).toBeInTheDocument();
    expect(advanceStatusSpy).not.toHaveBeenCalled();
  });
});
