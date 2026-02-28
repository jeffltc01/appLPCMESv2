import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OperatorWorkCenterConsolePage } from "./OperatorWorkCenterConsolePage";
import { ApiError } from "../services/api";

const ordersApiMock = vi.hoisted(() => ({
  workCenterQueue: vi.fn(),
  lineRouteExecution: vi.fn(),
  orderWorkCenterActivityLog: vi.fn(),
  scanIn: vi.fn(),
  addStepUsage: vi.fn(),
  addStepScrap: vi.fn(),
  addStepSerial: vi.fn(),
  addStepChecklist: vi.fn(),
  captureTrailer: vi.fn(),
  verifySerialLoad: vi.fn(),
  generatePackingSlip: vi.fn(),
  generateBol: vi.fn(),
  correctStepDuration: vi.fn(),
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

  const setupBaseMocks = (
    overrides: Partial<{
      state: "Pending" | "InProgress";
      timeCaptureMode: "Automated" | "Manual" | "Hybrid";
      requiresUsageEntry: boolean;
      requiresScrapEntry: boolean;
      requiresSerialCapture: boolean;
      requiresChecklistCompletion: boolean;
      requiresTrailerCapture: boolean;
      requiresSerialLoadVerification: boolean;
      generatePackingSlipOnComplete: boolean;
      generateBolOnComplete: boolean;
    }> = {}
  ) => {
    ordersApiMock.workCenterQueue.mockResolvedValue([
      {
        stepInstanceId: 501,
        orderId: 100,
        lineId: 200,
        salesOrderNo: "SO-100",
        stepCode: "PREP",
        stepName: "Prep",
        stepSequence: 1,
        stepState: overrides.state ?? "InProgress",
        scanInUtc: null,
        customerName: "Acme",
        itemNo: "ITEM-1",
        itemDescription: "Cylinder",
        promisedDateUtc: "2026-02-20T00:00:00Z",
        priority: 1,
        lineNotes: "Handle carefully",
        orderComments: "Rush order",
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
              workCenterId: 10,
              workCenterName: "Prep",
              state: overrides.state ?? "InProgress",
              isRequired: true,
              requiresScan: true,
              dataCaptureMode: "ElectronicRequired",
              timeCaptureMode: overrides.timeCaptureMode ?? "Automated",
              scanInUtc: null,
              scanOutUtc: null,
              completedUtc: null,
              durationMinutes: null,
              manualDurationMinutes: null,
              manualDurationReason: null,
              timeCaptureSource: "SystemScan",
              requiresUsageEntry: overrides.requiresUsageEntry ?? false,
              requiresScrapEntry: overrides.requiresScrapEntry ?? false,
              requiresSerialCapture: overrides.requiresSerialCapture ?? false,
              requiresChecklistCompletion: overrides.requiresChecklistCompletion ?? false,
              checklistTemplateId: null,
              checklistFailurePolicy: "BlockCompletion",
              requireScrapReasonWhenBad: true,
              requiresTrailerCapture: overrides.requiresTrailerCapture ?? false,
              requiresSerialLoadVerification: overrides.requiresSerialLoadVerification ?? false,
              generatePackingSlipOnComplete: overrides.generatePackingSlipOnComplete ?? false,
              generateBolOnComplete: overrides.generateBolOnComplete ?? false,
              requiresAttachment: false,
              requiresSupervisorApproval: false,
              blockedReason: null,
            },
          ],
          quantityOrdered: 5,
          quantityReceived: 4,
          quantityCompleted: 2,
          quantityScrapped: 1,
        },
      ],
    });
    ordersApiMock.orderWorkCenterActivityLog.mockResolvedValue([]);
    ordersApiMock.scanIn.mockResolvedValue({});
    ordersApiMock.addStepUsage.mockResolvedValue({});
    ordersApiMock.scanOut.mockResolvedValue({});
    ordersApiMock.completeStep.mockResolvedValue({});
  };

  it("loads queue and executes scan in action", async () => {
    setupBaseMocks();

    render(<OperatorWorkCenterConsolePage />);
    await waitFor(() => expect(ordersApiMock.workCenterQueue).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Scan In" }));
    await waitFor(() => expect(ordersApiMock.scanIn).toHaveBeenCalled());
    expect(screen.getByText(/Order Context/i)).toBeInTheDocument();
  });

  it("blocks completion until required usage is saved", async () => {
    setupBaseMocks({ requiresUsageEntry: true });
    render(<OperatorWorkCenterConsolePage />);
    await waitFor(() => expect(ordersApiMock.workCenterQueue).toHaveBeenCalled());
    const completeButton = await screen.findByRole("button", { name: /Scan Out & Complete/i });
    expect(completeButton).toBeDisabled();

    await screen.findByRole("button", { name: "Save Usage" });
    fireEvent.change(screen.getByLabelText("Part item ID"), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("Quantity used"), { target: { value: "1.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Usage" }));

    await waitFor(() => expect(ordersApiMock.addStepUsage).toHaveBeenCalled());
    await waitFor(() => expect(completeButton).toBeEnabled());
  });

  it("shows conflict recovery message and keeps unsaved values", async () => {
    setupBaseMocks();
    ordersApiMock.completeStep.mockRejectedValue(
      new ApiError(409, "Conflict", { message: "Sequence violation: previous step incomplete." })
    );
    render(<OperatorWorkCenterConsolePage />);
    await waitFor(() => expect(ordersApiMock.workCenterQueue).toHaveBeenCalled());
    const completeButton = await screen.findByRole("button", { name: /Scan Out & Complete/i });
    await waitFor(() => expect(completeButton).toBeEnabled());

    fireEvent.change(screen.getByLabelText("Trailer number"), { target: { value: "TRL-77" } });
    fireEvent.click(completeButton);

    await waitFor(() => expect(screen.getByText(/Sequence or concurrency conflict/i)).toBeInTheDocument());
    expect(screen.getByLabelText("Trailer number")).toHaveValue("TRL-77");
  });

  it("completes pending manual-time step without scan-out", async () => {
    setupBaseMocks({ state: "Pending", timeCaptureMode: "Manual" });
    render(<OperatorWorkCenterConsolePage />);
    await waitFor(() => expect(ordersApiMock.workCenterQueue).toHaveBeenCalled());

    const completeButton = await screen.findByRole("button", { name: /Scan Out & Complete/i });
    expect(completeButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Manual duration minutes"), { target: { value: "15" } });
    await waitFor(() => expect(completeButton).toBeEnabled());
    fireEvent.click(completeButton);

    await waitFor(() => expect(ordersApiMock.completeStep).toHaveBeenCalled());
    expect(ordersApiMock.scanOut).not.toHaveBeenCalled();
    expect(ordersApiMock.completeStep).toHaveBeenCalledWith(
      100,
      200,
      501,
      expect.objectContaining({
        manualDurationMinutes: 15,
      })
    );
  });
});
