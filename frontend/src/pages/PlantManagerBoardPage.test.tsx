import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { PlantManagerBoardPage } from "./PlantManagerBoardPage";

const plantManagerBoardMock = vi.fn();

vi.mock("../services/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/orders")>();
  return {
    ...actual,
    ordersApi: {
      ...actual.ordersApi,
      plantManagerBoard: (...args: unknown[]) => plantManagerBoardMock(...args),
    },
  };
});

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

describe("PlantManagerBoardPage", () => {
  beforeEach(() => {
    plantManagerBoardMock.mockReset();
    plantManagerBoardMock.mockResolvedValue([
      {
        id: 2101,
        salesOrderNo: "SO-2101",
        orderStatus: "Ready to Ship",
        orderLifecycleStatus: "ProductionComplete",
        siteName: "Houston",
        customerName: "Acme Industrial",
        customerCity: "Houston",
        customerState: "TX",
        isPickup: true,
        lines: [
          {
            lineId: 21011,
            lineNo: 1,
            itemDescription: "Acetylene Cylinder",
            displayQuantity: 8,
            displayQuantityLabel: "Received",
          },
        ],
      },
    ]);
  });

  it("renders card content from plant manager board data", async () => {
    render(
      <MemoryRouter>
        <PlantManagerBoardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("SO-2101")).toBeInTheDocument();
    expect(screen.getByText("ProductionComplete")).toBeInTheDocument();
    expect(screen.getByText("Houston, TX")).toBeInTheDocument();
    expect(screen.getByText("Pickup")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("Received: 8")).toBeInTheDocument();
  });

  it("navigates to order details when card is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/plant-manager"]}>
        <PlantManagerBoardPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    const orderNo = await screen.findByText("SO-2101");
    fireEvent.click(orderNo);

    expect(screen.getByTestId("current-path")).toHaveTextContent("/orders/2101");
  });
});
