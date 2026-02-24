import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReceivingPage } from "./ReceivingPage";

const ordersApiMock = vi.hoisted(() => ({
  receivingList: vi.fn(),
  receivingDetail: vi.fn(),
  completeReceiving: vi.fn(),
}));

const orderLookupsApiMock = vi.hoisted(() => ({
  items: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
  orderLookupsApi: orderLookupsApiMock,
}));

describe("ReceivingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes receiving with line payload", async () => {
    ordersApiMock.receivingList
      .mockResolvedValueOnce([
        {
          id: 5,
          salesOrderNo: "SO-5",
          ipadOrderNo: null,
          customerName: "Acme",
          siteName: "Main",
          receivingMode: "Trailer Pickup",
          priority: 1,
          pickUpAddress: "Dock A",
          pickUpCity: "Houston",
          pickUpState: "TX",
          pickUpPostalCode: "77001",
          pickUpCountry: "US",
          itemsOrderedSummary: "TNK-1 (3)",
          trailerNo: "TR-8",
          pickupScheduledDate: "2026-02-24T00:00:00",
          lineCount: 1,
          totalOrderedQuantity: 3,
        },
      ])
      .mockResolvedValueOnce([]);

    ordersApiMock.receivingDetail.mockResolvedValue({
      id: 5,
      salesOrderNo: "SO-5",
      orderStatus: "Pickup Scheduled",
      customerName: "Acme",
      pickUpAddress: "Dock A",
      trailerNo: "TR-8",
      orderComments: "Fragile",
      receivedDate: null,
      lines: [
        {
          id: 501,
          lineNo: 1,
          itemId: 1,
          itemNo: "TNK-1",
          itemDescription: "Tank 1",
          quantityAsOrdered: 3,
          quantityAsReceived: 0,
          isReceived: false,
        },
      ],
    });

    ordersApiMock.completeReceiving.mockResolvedValue({});
    orderLookupsApiMock.items.mockResolvedValue([]);

    render(<ReceivingPage />);

    await waitFor(() => expect(ordersApiMock.receivingList).toHaveBeenCalled());
    await waitFor(() => expect(ordersApiMock.receivingDetail).toHaveBeenCalledWith(5));

    fireEvent.click(screen.getByText("SO-5"));
    await waitFor(() => expect(screen.getByRole("button", { name: /Mark Received/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Mark Received/i }));

    await waitFor(() => expect(ordersApiMock.completeReceiving).toHaveBeenCalled());
    const [, payload] = ordersApiMock.completeReceiving.mock.calls[0];
    expect(payload.lines).toEqual([
      {
        lineId: 501,
        isReceived: false,
        quantityAsReceived: 0,
      },
    ]);
  });
});

