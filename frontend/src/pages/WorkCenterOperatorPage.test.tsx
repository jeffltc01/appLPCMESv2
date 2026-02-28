import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { WorkCenterOperatorPage } from "./WorkCenterOperatorPage";
import { TABLET_SETUP_STORAGE_KEY } from "../features/tabletSetupStorage";

const workCenterQueueMock = vi.fn();
const lineRouteExecutionMock = vi.fn();
const scanInMock = vi.fn();
const scanOutMock = vi.fn();
const addStepUsageMock = vi.fn();
const addStepScrapMock = vi.fn();
const addStepSerialMock = vi.fn();
const addStepChecklistMock = vi.fn();
const completeStepMock = vi.fn();
const scrapReasonsMock = vi.fn();

vi.mock("../services/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/orders")>();
  return {
    ...actual,
    ordersApi: {
      ...actual.ordersApi,
      workCenterQueue: (...args: unknown[]) => workCenterQueueMock(...args),
      lineRouteExecution: (...args: unknown[]) => lineRouteExecutionMock(...args),
      scanIn: (...args: unknown[]) => scanInMock(...args),
      scanOut: (...args: unknown[]) => scanOutMock(...args),
      addStepUsage: (...args: unknown[]) => addStepUsageMock(...args),
      addStepScrap: (...args: unknown[]) => addStepScrapMock(...args),
      addStepSerial: (...args: unknown[]) => addStepSerialMock(...args),
      addStepChecklist: (...args: unknown[]) => addStepChecklistMock(...args),
      completeStep: (...args: unknown[]) => completeStepMock(...args),
    },
    orderLookupsApi: {
      ...actual.orderLookupsApi,
      scrapReasons: (...args: unknown[]) => scrapReasonsMock(...args),
    },
  };
});

describe("WorkCenterOperatorPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    workCenterQueueMock.mockResolvedValue([
      {
        stepInstanceId: 500,
        orderId: 2001,
        lineId: 3001,
        salesOrderNo: "SO-2001",
        stepCode: "FILL",
        stepName: "Fill",
        stepSequence: 2,
        stepState: "Pending",
        scanInUtc: null,
      },
    ]);
    lineRouteExecutionMock.mockResolvedValue({
      orderId: 2001,
      lifecycleStatus: "InProduction",
      hasOpenRework: false,
      routes: [
        {
          routeInstanceId: 9001,
          lineId: 3001,
          state: "Active",
          quantityOrdered: 10,
          quantityReceived: 10,
          quantityCompleted: 0,
          quantityScrapped: 0,
          steps: [
            {
              stepInstanceId: 500,
              stepSequence: 2,
              stepCode: "FILL",
              stepName: "Fill",
              workCenterId: 101,
              workCenterName: "Fill Station",
              state: "InProgress",
              isRequired: true,
              requiresScan: true,
              dataCaptureMode: "ElectronicRequired",
              timeCaptureMode: "Hybrid",
              scanInUtc: null,
              scanOutUtc: null,
              completedUtc: null,
              durationMinutes: null,
              manualDurationMinutes: null,
              manualDurationReason: null,
              timeCaptureSource: "Scan",
              requiresUsageEntry: true,
              requiresScrapEntry: true,
              requiresSerialCapture: true,
              requiresChecklistCompletion: true,
              checklistTemplateId: 1,
              checklistFailurePolicy: "BlockCompletion",
              requireScrapReasonWhenBad: false,
              requiresTrailerCapture: false,
              requiresSerialLoadVerification: false,
              generatePackingSlipOnComplete: false,
              generateBolOnComplete: false,
              requiresAttachment: false,
              requiresSupervisorApproval: false,
              blockedReason: null,
            },
          ],
        },
      ],
    });
    scanInMock.mockResolvedValue({});
    scanOutMock.mockResolvedValue({});
    addStepUsageMock.mockResolvedValue({});
    addStepScrapMock.mockResolvedValue({});
    addStepSerialMock.mockResolvedValue({});
    addStepChecklistMock.mockResolvedValue({});
    completeStepMock.mockResolvedValue({});
    scrapReasonsMock.mockResolvedValue([{ id: 1, name: "Leak" }]);
  });

  it("redirects to tablet setup if setup is missing", async () => {
    render(
      <MemoryRouter initialEntries={["/operator/work-center"]}>
        <Routes>
          <Route path="/operator/work-center" element={<WorkCenterOperatorPage />} />
          <Route path="/setup/tablet" element={<div>Tablet Setup Placeholder</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Tablet Setup Placeholder")).toBeInTheDocument();
  });

  it("enforces required captures before complete step", async () => {
    window.localStorage.setItem(
      TABLET_SETUP_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        siteId: 10,
        workCenterId: 101,
        workCenterCode: "WC-FILL",
        workCenterName: "Fill Station",
        operatorEmpNo: "EMP500",
        deviceId: "",
        updatedAt: "2026-01-01T00:00:00Z",
      })
    );

    render(
      <MemoryRouter>
        <WorkCenterOperatorPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("SO-2001")).toBeInTheDocument();
    expect(await screen.findByText(/FILL - Fill \(State:/)).toBeInTheDocument();
    const completeButton = screen.getByRole("button", { name: "Complete Step" });
    expect(completeButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Scan In" }));
    await waitFor(() => expect(scanInMock).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText("Part Item Id"), { target: { value: "9001" } });
    fireEvent.change(screen.getByLabelText("Quantity Used"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Usage" }));
    await waitFor(() => expect(addStepUsageMock).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText("Scrap Quantity"), { target: { value: "1" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Scrap Reason" }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Scrap" }));
    await waitFor(() => expect(addStepScrapMock).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText("Serial No"), { target: { value: "SER-100" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Serial" }));
    await waitFor(() => expect(addStepSerialMock).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText("Checklist Label"), { target: { value: "Leak test" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Checklist Result" }));
    await waitFor(() => expect(addStepChecklistMock).toHaveBeenCalled());

    await waitFor(() => expect(completeButton).toBeEnabled());
    fireEvent.click(completeButton);
    await waitFor(() => expect(completeStepMock).toHaveBeenCalled());
  });
});
