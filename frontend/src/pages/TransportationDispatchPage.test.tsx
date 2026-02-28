import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TransportationDispatchPage } from "./TransportationDispatchPage";

const transportBoardMock = vi.fn();
const saveTransportBoardMock = vi.fn();

vi.mock("../services/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/orders")>();
  return {
    ...actual,
    ordersApi: {
      ...actual.ordersApi,
      transportBoard: (...args: unknown[]) => transportBoardMock(...args),
      saveTransportBoard: (...args: unknown[]) => saveTransportBoardMock(...args),
    },
  };
});

const transportBoardResponse = {
  items: [
    {
      id: 101,
      salesOrderNo: "SO-TD-101",
      orderStatus: "Ready to Ship",
      orderLifecycleStatus: "ProductionComplete",
      movementType: "Shipment",
      orderDate: "2026-02-28",
      customerId: 1,
      customerName: "Acme Welding",
      siteId: 10,
      siteName: "Route 434",
      pickUpAddress: "Acme Welding Supply Co.",
      shipToAddress: "Newburgh NY 12550",
      pickUpAddressStreet: "10 Commerce Street",
      shipToAddressStreet: "131 Waters Street",
      lineCount: 1,
      totalOrderedQuantity: 16,
      lineSummary: "60001 x 16",
      contact: "Jeff P",
      phone: "(234)641234",
      orderComments: "Rush delivery",
      trailerNo: "MN40C",
      carrier: "LPC",
      dispatchDate: "2026-02-27",
      scheduledDate: "2026-02-28",
      transportationStatus: "Ready",
      transportationNotes: "Bring ramp",
      lines: [
        {
          lineId: 9001,
          lineNo: 1,
          itemNo: "60001",
          itemDescription: "Cylinder 16in",
          productLine: "Refurb",
          quantityOrdered: 16,
        },
      ],
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 250,
};

describe("TransportationDispatchPage", () => {
  beforeEach(() => {
    transportBoardMock.mockReset();
    saveTransportBoardMock.mockReset();
    transportBoardMock.mockResolvedValue(transportBoardResponse);
    saveTransportBoardMock.mockResolvedValue(transportBoardResponse.items);
  });

  it("maps Delivery filter to Shipment query value", async () => {
    render(
      <MemoryRouter>
        <TransportationDispatchPage />
      </MemoryRouter>
    );

    await screen.findByText("SO-TD-101");
    fireEvent.change(screen.getByRole("combobox", { name: "Movement Type" }), {
      target: { value: "Delivery" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(transportBoardMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          movementType: "Shipment",
        })
      );
    });
  });

  it("expands selected row and renders line breakdown details", async () => {
    render(
      <MemoryRouter>
        <TransportationDispatchPage />
      </MemoryRouter>
    );

    const orderCell = await screen.findByText("SO-TD-101");
    fireEvent.click(orderCell);

    expect(screen.getByText("Pickup Details:")).toBeInTheDocument();
    expect(screen.getByText("Cylinder 16in")).toBeInTheDocument();
    expect(screen.getByText("Refurb")).toBeInTheDocument();
    expect(screen.getByText("60001")).toBeInTheDocument();
  });

  it("does not crash when line details are missing", async () => {
    transportBoardMock.mockResolvedValueOnce({
      ...transportBoardResponse,
      items: [
        {
          ...transportBoardResponse.items[0],
          lines: undefined,
        },
      ],
    });

    render(
      <MemoryRouter>
        <TransportationDispatchPage />
      </MemoryRouter>
    );

    const orderCell = await screen.findByText("SO-TD-101");
    fireEvent.click(orderCell);
    expect(screen.getByText("No line details available.")).toBeInTheDocument();
  });

  it("saves edited transportation fields only on Save All", async () => {
    render(
      <MemoryRouter>
        <TransportationDispatchPage />
      </MemoryRouter>
    );

    await screen.findByText("SO-TD-101");
    const trailerInput = screen.getByDisplayValue("MN40C");
    fireEvent.change(trailerInput, { target: { value: "TR-99" } });
    fireEvent.click(screen.getByRole("button", { name: "Save All" }));

    await waitFor(() => {
      expect(saveTransportBoardMock).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 101,
          trailerNo: "TR-99",
        }),
      ]);
    });
  });

  it("keeps page fixed and list region scrollable", async () => {
    render(
      <MemoryRouter>
        <TransportationDispatchPage />
      </MemoryRouter>
    );

    await screen.findByText("SO-TD-101");

    expect(screen.getByTestId("transport-dispatch-page")).toHaveStyle({
      height: "100vh",
      overflow: "hidden",
    });
    expect(screen.getByTestId("transport-dispatch-list-wrap")).toHaveStyle({
      overflowY: "auto",
    });
  });

  it("keeps header sticky while list scrolls", async () => {
    render(
      <MemoryRouter>
        <TransportationDispatchPage />
      </MemoryRouter>
    );

    await screen.findByText("SO-TD-101");

    const orderNoHeaderCell = screen.getByRole("columnheader", { name: "Order No" });
    expect(orderNoHeaderCell).toHaveStyle({
      position: "sticky",
      top: "0",
    });
  });
});
