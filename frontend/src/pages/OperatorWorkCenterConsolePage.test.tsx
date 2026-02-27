import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OperatorWorkCenterConsolePage } from "./OperatorWorkCenterConsolePage";

const ordersApiMock = vi.hoisted(() => ({
  workCenterQueue: vi.fn(),
  lineRouteExecution: vi.fn(),
  orderWorkCenterActivityLog: vi.fn(),
  scanIn: vi.fn(),
  scanOut: vi.fn(),
  captureTrailer: vi.fn(),
  correctStepDuration: vi.fn(),
  completeStep: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
}));

describe("OperatorWorkCenterConsolePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupBaseMocks = (timeCaptureMode: "Automated" | "Manual" | "Hybrid") => {
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
              timeCaptureMode,
              scanInUtc: null,
              scanOutUtc: null,
              completedUtc: null,
              durationMinutes: null,
              manualDurationMinutes: null,
              manualDurationReason: null,
              timeCaptureSource: "SystemScan",
            },
          ],
        },
      ],
    });
    ordersApiMock.orderWorkCenterActivityLog.mockResolvedValue([]);
  };

  it("loads queue and executes scan in action", async () => {
    setupBaseMocks("Automated");
    ordersApiMock.scanIn.mockResolvedValue({});

    render(<OperatorWorkCenterConsolePage />);
    await waitFor(() => expect(ordersApiMock.workCenterQueue).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Scan In" }));
    await waitFor(() => expect(ordersApiMock.scanIn).toHaveBeenCalled());
  });

  it("submits manual duration correction", async () => {
    setupBaseMocks("Manual");
    ordersApiMock.correctStepDuration.mockResolvedValue({});

    render(<OperatorWorkCenterConsolePage />);
    await waitFor(() => expect(ordersApiMock.workCenterQueue).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/Time Capture Mode: Manual/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Manual duration minutes"), { target: { value: "14.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply Duration" }));
    await waitFor(() => expect(ordersApiMock.correctStepDuration).toHaveBeenCalled());
  });

  it("captures trailer number for loading step", async () => {
    setupBaseMocks("Manual");
    ordersApiMock.captureTrailer.mockResolvedValue({});

    render(<OperatorWorkCenterConsolePage />);
    await waitFor(() => expect(ordersApiMock.workCenterQueue).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("Trailer number"), { target: { value: "TRL-77" } });
    fireEvent.click(screen.getByRole("button", { name: "Capture Trailer" }));

    await waitFor(() => expect(ordersApiMock.captureTrailer).toHaveBeenCalled());
    expect(ordersApiMock.captureTrailer).toHaveBeenCalledWith(100, 200, 501, {
      empNo: "OP001",
      trailerNo: "TRL-77",
      notes: "Captured from operator console",
    });
  });

  it("blocks hybrid correction when reason is missing", async () => {
    setupBaseMocks("Hybrid");
    ordersApiMock.correctStepDuration.mockResolvedValue({});

    render(<OperatorWorkCenterConsolePage />);
    await waitFor(() => expect(ordersApiMock.workCenterQueue).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/Time Capture Mode: Hybrid/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Manual duration minutes"), { target: { value: "14.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply Duration" }));

    await waitFor(() => expect(ordersApiMock.correctStepDuration).not.toHaveBeenCalled());
  });
});
