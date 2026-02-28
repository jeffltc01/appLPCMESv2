import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ReceivingQueuePage } from "./ReceivingQueuePage";

const receivingListMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../services/orders", () => ({
  ordersApi: {
    receivingList: (...args: unknown[]) => receivingListMock(...args),
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("ReceivingQueuePage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    receivingListMock.mockResolvedValue([
      {
        id: 11,
        salesOrderNo: "SO-RCV-11",
        ipadOrderNo: null,
        customerName: "Acme Industrial",
        siteName: "Houston",
        receivingMode: "Trailer Pickup",
        priority: 1,
        pickUpAddress: "123 Main",
        pickUpCity: "Houston",
        pickUpState: "TX",
        pickUpPostalCode: "77001",
        pickUpCountry: "US",
        itemsOrderedSummary: "Cylinders",
        trailerNo: "TR-1",
        pickupScheduledDate: "2026-03-01",
        lineCount: 2,
        totalOrderedQuantity: 8,
      },
      {
        id: 12,
        salesOrderNo: "SO-RCV-12",
        ipadOrderNo: null,
        customerName: "BlueLine Supply",
        siteName: "Dallas",
        receivingMode: "Customer Drop Off",
        priority: 2,
        pickUpAddress: null,
        pickUpCity: null,
        pickUpState: null,
        pickUpPostalCode: null,
        pickUpCountry: null,
        itemsOrderedSummary: "Valves",
        trailerNo: null,
        pickupScheduledDate: null,
        lineCount: 1,
        totalOrderedQuantity: 4,
      },
    ]);
  });

  it("renders receiving queue rows", async () => {
    render(
      <MemoryRouter>
        <ReceivingQueuePage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Receiving Queue")).toBeInTheDocument();
    expect(screen.getByText("SO-RCV-11")).toBeInTheDocument();
    expect(screen.getByText("SO-RCV-12")).toBeInTheDocument();
  });

  it("opens receiving detail when row is clicked", async () => {
    render(
      <MemoryRouter>
        <ReceivingQueuePage />
      </MemoryRouter>
    );

    await screen.findByText("SO-RCV-11");
    fireEvent.click(screen.getByText("SO-RCV-11"));

    expect(navigateMock).toHaveBeenCalledWith("/receiving/11");
  });
});
