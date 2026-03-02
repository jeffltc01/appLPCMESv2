import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { WorkCenterOperatorPage } from "./WorkCenterOperatorPage";
import { TABLET_SETUP_STORAGE_KEY } from "../features/tabletSetupStorage";

const workCenterQueueMock = vi.fn();
const lineRouteExecutionMock = vi.fn();
const scanInMock = vi.fn();
const scanOutMock = vi.fn();
const addStepUsageMock = vi.fn();
const updateStepUsageMock = vi.fn();
const deleteStepUsageMock = vi.fn();
const getStepUsageMock = vi.fn();
const addStepScrapMock = vi.fn();
const addStepSerialMock = vi.fn();
const addStepChecklistMock = vi.fn();
const recordStepProgressMock = vi.fn();
const completeStepMock = vi.fn();
const scrapReasonsMock = vi.fn();
const itemsLookupMock = vi.fn();
const productLinesLookupMock = vi.fn();
const colorsLookupMock = vi.fn();
const itemSizesLookupMock = vi.fn();
const authSessionMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    isLoading: false,
    session: authSessionMock(),
    operatorPreLogin: vi.fn(),
    microsoftLogin: vi.fn(),
    operatorLogin: vi.fn(),
    logout: logoutMock,
  }),
}));

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
      updateStepUsage: (...args: unknown[]) => updateStepUsageMock(...args),
      deleteStepUsage: (...args: unknown[]) => deleteStepUsageMock(...args),
      getStepUsage: (...args: unknown[]) => getStepUsageMock(...args),
      addStepScrap: (...args: unknown[]) => addStepScrapMock(...args),
      addStepSerial: (...args: unknown[]) => addStepSerialMock(...args),
      addStepChecklist: (...args: unknown[]) => addStepChecklistMock(...args),
      recordStepProgress: (...args: unknown[]) => recordStepProgressMock(...args),
      completeStep: (...args: unknown[]) => completeStepMock(...args),
    },
    orderLookupsApi: {
      ...actual.orderLookupsApi,
      scrapReasons: (...args: unknown[]) => scrapReasonsMock(...args),
      items: (...args: unknown[]) => itemsLookupMock(...args),
      productLines: (...args: unknown[]) => productLinesLookupMock(...args),
      colors: (...args: unknown[]) => colorsLookupMock(...args),
    },
  };
});

vi.mock("../services/items", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/items")>();
  return {
    ...actual,
    itemLookupsApi: {
      ...actual.itemLookupsApi,
      itemSizes: (...args: unknown[]) => itemSizesLookupMock(...args),
    },
  };
});

describe("WorkCenterOperatorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const savedUsageRows: Array<{
      id: number;
      partItemId: number;
      partItemNo: string;
      partItemDescription: string | null;
      lotBatch: string | null;
      quantityUsed: number;
      uom: string | null;
      recordedUtc: string;
      recordedByEmpNo: string;
    }> = [];
    let nextUsageId = 1;
    authSessionMock.mockReturnValue(null);
    window.localStorage.clear();
    workCenterQueueMock.mockResolvedValue([
      {
        stepInstanceId: 500,
        orderId: 2001,
        lineId: 3001,
        lineNo: 1,
        salesOrderNo: "SO-2001",
        stepCode: "FILL",
        stepName: "Fill",
        stepSequence: 2,
        stepState: "Pending",
        scanInUtc: null,
        itemNo: "ITM-100",
        itemDescription: "Steel Cylinder",
        quantityAsReceived: 10,
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
              processingMode: "BatchQuantity",
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
    addStepUsageMock.mockImplementation(
      async (
        _orderId: number,
        _lineId: number,
        _stepId: number,
        payload: {
          partItemId: number;
          quantityUsed: number;
          lotBatch?: string | null;
          uom?: string | null;
          recordedByEmpNo: string;
        }
      ) => {
        const existing = savedUsageRows.find(
          (row) =>
            row.partItemId === payload.partItemId &&
            (row.lotBatch ?? "").toLowerCase() === (payload.lotBatch ?? "").toLowerCase() &&
            (row.uom ?? "").toLowerCase() === (payload.uom ?? "").toLowerCase()
        );
        if (existing) {
          existing.quantityUsed += payload.quantityUsed;
          existing.recordedByEmpNo = payload.recordedByEmpNo;
          existing.recordedUtc = new Date().toISOString();
          return {};
        }

        const item = (await itemsLookupMock())?.find(
          (candidate: { id: number }) => candidate.id === payload.partItemId
        );
        savedUsageRows.unshift({
          id: nextUsageId++,
          partItemId: payload.partItemId,
          partItemNo: item?.itemNo ?? `ITEM-${payload.partItemId}`,
          partItemDescription: item?.itemDescription ?? null,
          lotBatch: payload.lotBatch ?? null,
          quantityUsed: payload.quantityUsed,
          uom: payload.uom ?? "KG",
          recordedUtc: new Date().toISOString(),
          recordedByEmpNo: payload.recordedByEmpNo,
        });
        return {};
      }
    );
    updateStepUsageMock.mockImplementation(
      async (
        _orderId: number,
        _lineId: number,
        _stepId: number,
        usageId: number,
        payload: {
          partItemId: number;
          quantityUsed: number;
          lotBatch?: string | null;
          uom?: string | null;
          recordedByEmpNo: string;
        }
      ) => {
        const usage = savedUsageRows.find((row) => row.id === usageId);
        if (usage) {
          const item = (await itemsLookupMock())?.find(
            (candidate: { id: number }) => candidate.id === payload.partItemId
          );
          usage.partItemId = payload.partItemId;
          usage.partItemNo = item?.itemNo ?? `ITEM-${payload.partItemId}`;
          usage.partItemDescription = item?.itemDescription ?? null;
          usage.quantityUsed = payload.quantityUsed;
          usage.lotBatch = payload.lotBatch ?? null;
          usage.uom = payload.uom ?? "KG";
          usage.recordedByEmpNo = payload.recordedByEmpNo;
          usage.recordedUtc = new Date().toISOString();
        }
        return {};
      }
    );
    deleteStepUsageMock.mockImplementation(
      async (_orderId: number, _lineId: number, _stepId: number, usageId: number) => {
        const index = savedUsageRows.findIndex((row) => row.id === usageId);
        if (index >= 0) {
          savedUsageRows.splice(index, 1);
        }
        return {};
      }
    );
    getStepUsageMock.mockImplementation(async () => savedUsageRows.map((row) => ({ ...row })));
    addStepScrapMock.mockResolvedValue({});
    addStepSerialMock.mockResolvedValue({});
    addStepChecklistMock.mockResolvedValue({});
    recordStepProgressMock.mockResolvedValue({});
    completeStepMock.mockResolvedValue({});
    scrapReasonsMock.mockResolvedValue([{ id: 1, name: "Leak" }]);
    itemsLookupMock.mockResolvedValue([
      {
        id: 9001,
        itemNo: "AL-6061",
        itemDescription: "Aluminum Bar Stock (AL-6061-T6)",
        productLine: "BR",
      },
      {
        id: 9010,
        itemNo: "COOLANT-A",
        itemDescription: "Cutting Fluid (Coolant A)",
        productLine: "MISC",
      },
    ]);
    productLinesLookupMock.mockResolvedValue(["BR", "MISC"]);
    colorsLookupMock.mockResolvedValue([{ id: 1, name: "Blue" }]);
    itemSizesLookupMock.mockResolvedValue([
      { id: 1, name: "14.25", size: 14.25 },
      { id: 2, name: "14.5", size: 14.5 },
    ]);
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
    expect(await screen.findByText(/Route Step:/)).toBeInTheDocument();
    expect(
      await screen.findByText(/Current Order #\s*SO-2001 - Line #\s*1/i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/Route Step:/)).toBeInTheDocument();
    await waitFor(() => expect(workCenterQueueMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(lineRouteExecutionMock).toHaveBeenCalledTimes(1));
    const completeButton = screen.getByRole("button", { name: "Complete Step" });
    expect(completeButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "START" }));
    await waitFor(() => expect(scanInMock).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /add material/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select Item" }));
    fireEvent.click(await screen.findByRole("button", { name: /AL-6061 - Aluminum Bar Stock/ }));
    fireEvent.change(screen.getByLabelText("Lot / Batch #"), { target: { value: "L-2345" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Material Entry" }));
    await waitFor(() => expect(addStepUsageMock).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText("Serial No"), { target: { value: "SER-100" } });
    expect(screen.getByLabelText("Manuf. Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Test Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Lid Color")).toBeInTheDocument();
    expect(screen.getByLabelText("LidSize")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add Serial" }));
    await waitFor(() => expect(addStepSerialMock).toHaveBeenCalled());

    await waitFor(() => expect(completeButton).toBeEnabled());
    fireEvent.click(completeButton);
    await waitFor(() => expect(completeStepMock).toHaveBeenCalled());
  });

  it("renders queue cards with received quantity", async () => {
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

    await screen.findByText("SO-2001");
    fireEvent.click(screen.getByRole("button", { name: "Open queue" }));

    expect(await screen.findByText("Order No.")).toBeInTheDocument();
    expect(screen.getByText("Line No.")).toBeInTheDocument();
    expect(screen.getByText("Item No.")).toBeInTheDocument();
    expect(screen.getByText("Item Desc.")).toBeInTheDocument();
    expect(screen.getAllByText("Quantity").length).toBeGreaterThan(0);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders time controls with quick-add duration buttons", async () => {
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
    expect(await screen.findByText(/Route Step:/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "START" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PAUSE" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "STOP" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add 5 minutes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add 15 minutes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add 30 minutes" })).toBeInTheDocument();
  });

  it("shows only Job Material product line items in select item dialog", async () => {
    productLinesLookupMock.mockResolvedValue(["BR"]);

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
    expect(await screen.findByText(/Route Step:/)).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: /add material/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select Item" }));

    expect(await screen.findByRole("button", { name: /AL-6061 - Aluminum Bar Stock/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /COOLANT-A - Cutting Fluid/ })).not.toBeInTheDocument();
  });

  it("hides quick-add duration section for automated time capture", async () => {
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
              timeCaptureMode: "Automated",
              processingMode: "BatchQuantity",
              scanInUtc: null,
              scanOutUtc: null,
              completedUtc: null,
              durationMinutes: null,
              manualDurationMinutes: null,
              manualDurationReason: null,
              timeCaptureSource: "Scan",
              requiresUsageEntry: false,
              requiresScrapEntry: false,
              requiresSerialCapture: false,
              requiresChecklistCompletion: false,
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
    expect(await screen.findByText(/Route Step:/)).toBeInTheDocument();
    expect(screen.queryByText("Quick-add duration")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add 5 minutes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add 15 minutes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add 30 minutes" })).not.toBeInTheDocument();
  });

  it("shows manual duration input and hides timer controls for manual time capture", async () => {
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
              timeCaptureMode: "Manual",
              processingMode: "BatchQuantity",
              scanInUtc: null,
              scanOutUtc: null,
              completedUtc: null,
              durationMinutes: null,
              manualDurationMinutes: null,
              manualDurationReason: null,
              timeCaptureSource: "ManualEntry",
              requiresUsageEntry: false,
              requiresScrapEntry: false,
              requiresSerialCapture: false,
              requiresChecklistCompletion: false,
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
    expect(await screen.findByText(/Route Step:/)).toBeInTheDocument();
    expect(screen.getByLabelText("# of Minutes")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "START" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "PAUSE" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "STOP" })).not.toBeInTheDocument();
  });

  it("flips material card for add and edit actions", async () => {
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

    await screen.findByText("SO-2001");
    await screen.findByText(/Route Step:/);
    fireEvent.click(screen.getByRole("button", { name: /add material/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select Item" }));
    fireEvent.click(await screen.findByRole("button", { name: /COOLANT-A - Cutting Fluid \(Coolant A\)/ }));
    fireEvent.change(screen.getByLabelText("Lot / Batch #"), { target: { value: "CF-987" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Material Entry" }));

    expect(await screen.findByText("COOLANT-A - Cutting Fluid (Coolant A)")).toBeInTheDocument();
    expect(screen.getByText("Lot:")).toBeInTheDocument();
    expect(screen.getByText("CF-987")).toBeInTheDocument();
    expect(screen.getByText("Qty:")).toBeInTheDocument();
    expect(screen.queryByText("5 KG")).not.toBeInTheDocument();
    expect(addStepUsageMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Material" }));
    await screen.findByText("Qty:");
    expect(screen.queryByText("7 KG")).not.toBeInTheDocument();
  });

  it("prompts before removing a material row", async () => {
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

    await screen.findByText("SO-2001");
    await screen.findByText(/Route Step:/);
    fireEvent.click(screen.getByRole("button", { name: /add material/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select Item" }));
    fireEvent.click(await screen.findByRole("button", { name: /COOLANT-A - Cutting Fluid \(Coolant A\)/ }));
    fireEvent.change(screen.getByLabelText("Lot / Batch #"), { target: { value: "CF-987" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Material Entry" }));

    expect(await screen.findByText("COOLANT-A - Cutting Fluid (Coolant A)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    const removeDialogTitle = await screen.findByText("Remove Material Entry");
    expect(screen.getByText(/Are you sure you want to remove/)).toBeInTheDocument();
    const removeDialog = removeDialogTitle.closest('[role="dialog"]');
    expect(removeDialog).not.toBeNull();
    if (!removeDialog) {
      throw new Error("Remove dialog not found.");
    }

    const cancelButton = removeDialog.querySelector('button');
    expect(cancelButton).not.toBeNull();
    if (!cancelButton) {
      throw new Error("Cancel button not found in remove dialog.");
    }
    fireEvent.click(cancelButton);
    expect(screen.getByText("COOLANT-A - Cutting Fluid (Coolant A)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    const confirmDialogTitle = await screen.findByText("Remove Material Entry");
    const confirmDialog = confirmDialogTitle.closest('[role="dialog"]');
    expect(confirmDialog).not.toBeNull();
    if (!confirmDialog) {
      throw new Error("Remove dialog not found.");
    }
    const confirmButtons = confirmDialog.querySelectorAll("button");
    expect(confirmButtons.length).toBeGreaterThan(1);
    fireEvent.click(confirmButtons[1]);

    await waitFor(() => {
      expect(screen.queryByText("COOLANT-A - Cutting Fluid (Coolant A)")).not.toBeInTheDocument();
    });
  });

  it("single unit mode auto-logs listed material on next unit even when usage is optional", async () => {
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
              processingMode: "SingleUnit",
              scanInUtc: null,
              scanOutUtc: null,
              completedUtc: null,
              durationMinutes: null,
              manualDurationMinutes: null,
              manualDurationReason: null,
              timeCaptureSource: "Scan",
              requiresUsageEntry: false,
              requiresScrapEntry: false,
              requiresSerialCapture: false,
              requiresChecklistCompletion: false,
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
    recordStepProgressMock.mockResolvedValue({
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
          quantityCompleted: 1,
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
              processingMode: "SingleUnit",
              scanInUtc: null,
              scanOutUtc: null,
              completedUtc: null,
              durationMinutes: null,
              manualDurationMinutes: null,
              manualDurationReason: null,
              timeCaptureSource: "Scan",
              requiresUsageEntry: false,
              requiresScrapEntry: false,
              requiresSerialCapture: true,
              requiresChecklistCompletion: false,
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
    expect(await screen.findByText(/Route Step:/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Complete Step" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Single Mode Material Part Item Id")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Single Mode Usage Per Unit")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Single Mode UOM")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use This Material" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add material/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select Item" }));
    fireEvent.click(await screen.findByRole("button", { name: /AL-6061 - Aluminum Bar Stock/ }));
    fireEvent.change(screen.getByLabelText("Lot / Batch #"), { target: { value: "LOT-100" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Material Entry" }));

    await waitFor(() => expect(addStepUsageMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "Complete Next Unit" }));

    await waitFor(() => expect(addStepUsageMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(recordStepProgressMock).toHaveBeenCalled());
    expect(addStepUsageMock).toHaveBeenNthCalledWith(
      2,
      2001,
      3001,
      500,
      expect.objectContaining({
        partItemId: 9001,
        quantityUsed: 1,
        uom: "KG",
      })
    );
  });

  it("single unit mode auto-scans in before completing next unit when step is pending", async () => {
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
              state: "Pending",
              isRequired: true,
              requiresScan: true,
              dataCaptureMode: "ElectronicRequired",
              timeCaptureMode: "Hybrid",
              processingMode: "SingleUnit",
              scanInUtc: null,
              scanOutUtc: null,
              completedUtc: null,
              durationMinutes: null,
              manualDurationMinutes: null,
              manualDurationReason: null,
              timeCaptureSource: "Scan",
              requiresUsageEntry: false,
              requiresScrapEntry: false,
              requiresSerialCapture: false,
              requiresChecklistCompletion: false,
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
    recordStepProgressMock.mockResolvedValue({
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
          quantityCompleted: 1,
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
              processingMode: "SingleUnit",
              scanInUtc: null,
              scanOutUtc: null,
              completedUtc: null,
              durationMinutes: null,
              manualDurationMinutes: null,
              manualDurationReason: null,
              timeCaptureSource: "Scan",
              requiresUsageEntry: false,
              requiresScrapEntry: false,
              requiresSerialCapture: true,
              requiresChecklistCompletion: false,
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
    expect(await screen.findByText(/Route Step:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add material/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select Item" }));
    fireEvent.click(await screen.findByRole("button", { name: /AL-6061 - Aluminum Bar Stock/ }));
    fireEvent.change(screen.getByLabelText("Lot / Batch #"), { target: { value: "LOT-200" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Material Entry" }));

    await waitFor(() => expect(addStepUsageMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "Complete Next Unit" }));

    await waitFor(() => expect(scanInMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(addStepUsageMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(recordStepProgressMock).toHaveBeenCalledTimes(1));
  });

  it("loads saved material usage from API for selected step", async () => {
    getStepUsageMock.mockResolvedValueOnce([
      {
        id: 501,
        partItemId: 1001,
        partItemNo: "COOLANT-A",
        partItemDescription: "Cutting Fluid (Coolant A)",
        lotBatch: "CF-DB-01",
        quantityUsed: 2,
        uom: "KG",
        recordedUtc: "2026-03-01T00:00:00Z",
        recordedByEmpNo: "EMP500",
      },
    ]);

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

    expect(await screen.findByText(/Current Order #\s*SO-2001 - Line #\s*1/i)).toBeInTheDocument();
    expect(await screen.findByText("COOLANT-A - Cutting Fluid (Coolant A)")).toBeInTheDocument();
    expect(screen.getByText("CF-DB-01")).toBeInTheDocument();
    expect(getStepUsageMock).toHaveBeenCalled();
  });

  it("retains material list when returning to the same queue line", async () => {
    workCenterQueueMock.mockResolvedValue([
      {
        stepInstanceId: 500,
        orderId: 2001,
        lineId: 3001,
        lineNo: 1,
        salesOrderNo: "SO-2001",
        stepCode: "FILL",
        stepName: "Fill",
        stepSequence: 2,
        stepState: "Pending",
        scanInUtc: null,
        itemNo: "ITM-100",
        itemDescription: "Steel Cylinder",
        quantityAsReceived: 10,
      },
      {
        stepInstanceId: 600,
        orderId: 2002,
        lineId: 3002,
        lineNo: 2,
        salesOrderNo: "SO-2002",
        stepCode: "FILL",
        stepName: "Fill",
        stepSequence: 2,
        stepState: "Pending",
        scanInUtc: null,
        itemNo: "ITM-200",
        itemDescription: "Composite Cylinder",
        quantityAsReceived: 8,
      },
    ]);
    lineRouteExecutionMock.mockImplementation(async (_orderId: number, lineId: number) => ({
      orderId: lineId === 3001 ? 2001 : 2002,
      lifecycleStatus: "InProduction",
      hasOpenRework: false,
      routes: [
        {
          routeInstanceId: lineId === 3001 ? 9001 : 9002,
          lineId,
          state: "Active",
          quantityOrdered: 10,
          quantityReceived: 10,
          quantityCompleted: 0,
          quantityScrapped: 0,
          steps: [
            {
              stepInstanceId: lineId === 3001 ? 500 : 600,
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
              processingMode: "BatchQuantity",
              scanInUtc: null,
              scanOutUtc: null,
              completedUtc: null,
              durationMinutes: null,
              manualDurationMinutes: null,
              manualDurationReason: null,
              timeCaptureSource: "Scan",
              requiresUsageEntry: true,
              requiresScrapEntry: false,
              requiresSerialCapture: false,
              requiresChecklistCompletion: false,
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
    }));

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
    expect(await screen.findByText(/Route Step:/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add material/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select Item" }));
    fireEvent.click(await screen.findByRole("button", { name: /COOLANT-A - Cutting Fluid \(Coolant A\)/ }));
    fireEvent.change(screen.getByLabelText("Lot / Batch #"), { target: { value: "CF-RET-01" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Material Entry" }));
    expect(await screen.findByText("COOLANT-A - Cutting Fluid (Coolant A)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open queue" }));
    fireEvent.click(screen.getByText("SO-2002"));
    await screen.findByText(/Current Order #\s*SO-2002 - Line #\s*2/i);

    fireEvent.click(screen.getByRole("button", { name: "Open queue" }));
    fireEvent.click(screen.getByText("SO-2001"));
    await screen.findByText(/Current Order #\s*SO-2001 - Line #\s*1/i);
    expect(screen.getByText("COOLANT-A - Cutting Fluid (Coolant A)")).toBeInTheDocument();
  });

  it("uses logged-in user as default operator", async () => {
    authSessionMock.mockReturnValue({
      token: "token",
      expiresUtc: "2026-01-01T12:00:00Z",
      authMethod: "Operator",
      userId: 10,
      empNo: "EMP001",
      displayName: "Operator One",
      siteId: 10,
      siteName: "Houston",
      workCenterId: 101,
      workCenterCode: "WC-FILL",
      workCenterName: "Fill Station",
      roles: ["Production"],
    });

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
        lockOperatorToLoggedInUser: false,
        updatedAt: "2026-01-01T00:00:00Z",
      })
    );

    render(
      <MemoryRouter>
        <WorkCenterOperatorPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Operator One")).toBeInTheDocument();
  });

  it("displays numeric-only displayName when provided", async () => {
    authSessionMock.mockReturnValue({
      token: "token",
      expiresUtc: "2026-01-01T12:00:00Z",
      authMethod: "Operator",
      userId: 10,
      empNo: "49240",
      displayName: "49240",
      siteId: 10,
      siteName: "Houston",
      workCenterId: 101,
      workCenterCode: "WC-FILL",
      workCenterName: "Fill Station",
      roles: ["Production"],
    });

    window.localStorage.setItem(
      TABLET_SETUP_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        siteId: 10,
        workCenterId: 101,
        workCenterCode: "WC-FILL",
        workCenterName: "Fill Station",
        operatorEmpNo: "49240",
        deviceId: "",
        lockOperatorToLoggedInUser: false,
        updatedAt: "2026-01-01T00:00:00Z",
      })
    );

    render(
      <MemoryRouter>
        <WorkCenterOperatorPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("49240")).toBeInTheDocument();
  });

  it("shows person name when displayName includes employee number prefix", async () => {
    authSessionMock.mockReturnValue({
      token: "token",
      expiresUtc: "2026-01-01T12:00:00Z",
      authMethod: "Operator",
      userId: 10,
      empNo: "49240",
      displayName: "49240 - John Doe",
      siteId: 10,
      siteName: "Houston",
      workCenterId: 101,
      workCenterCode: "WC-FILL",
      workCenterName: "Fill Station",
      roles: ["Production"],
    });

    window.localStorage.setItem(
      TABLET_SETUP_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        siteId: 10,
        workCenterId: 101,
        workCenterCode: "WC-FILL",
        workCenterName: "Fill Station",
        operatorEmpNo: "49240",
        deviceId: "",
        lockOperatorToLoggedInUser: false,
        updatedAt: "2026-01-01T00:00:00Z",
      })
    );

    render(
      <MemoryRouter>
        <WorkCenterOperatorPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Current User")).not.toBeInTheDocument();
  });

  it("logs out and redirects to login", async () => {
    authSessionMock.mockReturnValue({
      token: "token",
      expiresUtc: "2026-01-01T12:00:00Z",
      authMethod: "Operator",
      userId: 10,
      empNo: "EMP001",
      displayName: "Operator One",
      siteId: 10,
      siteName: "Houston",
      workCenterId: 101,
      workCenterCode: "WC-FILL",
      workCenterName: "Fill Station",
      roles: ["Production"],
    });
    logoutMock.mockResolvedValue(undefined);
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
        lockOperatorToLoggedInUser: false,
        updatedAt: "2026-01-01T00:00:00Z",
      })
    );

    render(
      <MemoryRouter initialEntries={["/operator/work-center"]}>
        <Routes>
          <Route path="/operator/work-center" element={<WorkCenterOperatorPage />} />
          <Route path="/login" element={<div>Login Placeholder</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("SO-2001")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await screen.findByText("Login Placeholder");
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
