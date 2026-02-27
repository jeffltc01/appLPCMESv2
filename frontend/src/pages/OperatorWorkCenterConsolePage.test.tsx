import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OperatorWorkCenterConsolePage } from "./OperatorWorkCenterConsolePage";

const ordersApiMock = vi.hoisted(() => ({
  workCenterQueue: vi.fn(),
  lineRouteExecution: vi.fn(),
  scanIn: vi.fn(),
  scanOut: vi.fn(),
  completeStep: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
}));

describe("OperatorWorkCenterConsolePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads queue and executes scan in action", async () => {
    ordersApiMock.workCenterQueue.mockResolvedValue([
      {
        stepInstanceId: 501,
        orderId: 100,
        lineId: 200,
        salesOrderNo: "SO-100",
        stepCode: "PREP",
        stepName: "Prep",
        stepSequence: 1,
        stepState: "Pending",
        scanInUtc: null,
      },
    ]);
    ordersApiMock.lineRouteExecution.mockResolvedValue({
      orderId: 100,
      lifecycleStatus: "InProduction",
      hasOpenRework: false,
      routes: [
        {
          routeInstanceId: 300,
          lineId: 200,
          state: "Active",
          steps: [
            {
              stepInstanceId: 501,
              stepSequence: 1,
              stepCode: "PREP",
              stepName: "Prep",
              state: "Pending",
              scanInUtc: null,
              scanOutUtc: null,
              completedUtc: null,
            },
          ],
        },
      ],
    });
    ordersApiMock.scanIn.mockResolvedValue({});

    render(<OperatorWorkCenterConsolePage />);
    await waitFor(() => expect(ordersApiMock.workCenterQueue).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Scan In" }));
    await waitFor(() => expect(ordersApiMock.scanIn).toHaveBeenCalled());
  });
});
