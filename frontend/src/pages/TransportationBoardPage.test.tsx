import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TransportationBoardPage } from "./TransportationBoardPage";

const ordersApiMock = vi.hoisted(() => ({
  transportBoard: vi.fn(),
  saveTransportBoard: vi.fn(),
  advanceStatus: vi.fn(),
}));

const orderLookupsApiMock = vi.hoisted(() => ({
  sites: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
  orderLookupsApi: orderLookupsApiMock,
}));

describe("TransportationBoardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks dirty edits and saves transport board changes", async () => {
    orderLookupsApiMock.sites.mockResolvedValue([]);
    ordersApiMock.transportBoard.mockResolvedValue({
      items: [
        {
          id: 42,
          salesOrderNo: "SO-42",
          orderStatus: "Ready for Pickup",
          movementType: "Pickup",
          orderDate: "2026-02-24",
          customerId: 1,
          customerName: "Acme",
          siteId: 1,
          siteName: "Main",
          pickUpAddress: "Dock A",
          shipToAddress: null,
          pickUpAddressStreet: "123 Main",
          shipToAddressStreet: null,
          lineCount: 1,
          totalOrderedQuantity: 2,
          lineSummary: "TNK-1 (2)",
          contact: "John",
          phone: "555-0100",
          orderComments: "Call first",
          trailerNo: null,
          carrier: null,
          dispatchDate: null,
          scheduledDate: null,
          transportationStatus: null,
          transportationNotes: null,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 1000,
    });

    ordersApiMock.saveTransportBoard.mockResolvedValue([
      {
        id: 42,
        salesOrderNo: "SO-42",
        orderStatus: "Ready for Pickup",
        movementType: "Pickup",
        orderDate: "2026-02-24",
        customerId: 1,
        customerName: "Acme",
        siteId: 1,
        siteName: "Main",
        pickUpAddress: "Dock A",
        shipToAddress: null,
        pickUpAddressStreet: "123 Main",
        shipToAddressStreet: null,
        lineCount: 1,
        totalOrderedQuantity: 2,
        lineSummary: "TNK-1 (2)",
        contact: "John",
        phone: "555-0100",
        orderComments: "Call first",
        trailerNo: "TR-99",
        carrier: null,
        dispatchDate: null,
        scheduledDate: null,
        transportationStatus: null,
        transportationNotes: null,
      },
    ]);

    const { container } = render(
      <MemoryRouter>
        <TransportationBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.transportBoard).toHaveBeenCalled());
    expect(screen.getAllByText("SO-42").length).toBeGreaterThan(0);

    const textareas = container.querySelectorAll("textarea");
    expect(textareas.length).toBeGreaterThan(0);
    fireEvent.change(textareas[0], { target: { value: "TR-99" } });

    fireEvent.click(screen.getByRole("button", { name: "Save All" }));
    await waitFor(() => expect(ordersApiMock.saveTransportBoard).toHaveBeenCalled());
    expect(ordersApiMock.saveTransportBoard).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 42,
          trailerNo: "TR-99",
        }),
      ])
    );
  });
});

