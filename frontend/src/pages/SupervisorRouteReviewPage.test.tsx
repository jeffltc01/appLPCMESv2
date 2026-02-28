import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SupervisorRouteReviewPage } from "./SupervisorRouteReviewPage";

const ordersApiMock = vi.hoisted(() => ({
  pendingRouteReview: vi.fn(),
  pendingSupervisorReview: vi.fn(),
  orderRouteExecution: vi.fn(),
  validateRoute: vi.fn(),
  adjustRoute: vi.fn(),
  reopenRoute: vi.fn(),
  supervisorApprove: vi.fn(),
  supervisorReject: vi.fn(),
}));
const setupApiMock = vi.hoisted(() => ({
  listWorkCenters: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
}));
vi.mock("../services/setup", () => ({
  setupApi: setupApiMock,
}));

describe("SupervisorRouteReviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ordersApiMock.pendingRouteReview.mockResolvedValue([
      {
        id: 100,
        salesOrderNo: "SO-100",
        customerName: "Acme",
        siteName: "Main",
        priority: 1,
        itemsOrderedSummary: "ITEM-1",
        receivedDate: "2026-02-01T00:00:00Z",
        lineCount: 1,
        totalOrderedQuantity: 5,
      },
    ]);
    ordersApiMock.pendingSupervisorReview.mockResolvedValue([]);
    ordersApiMock.orderRouteExecution.mockResolvedValue({
      orderId: 100,
      lifecycleStatus: "InProduction",
      hasOpenRework: false,
      routes: [
        {
          routeInstanceId: 77,
          lineId: 200,
          state: "Active",
          quantityOrdered: 5,
          quantityReceived: 5,
          quantityCompleted: 0,
          quantityScrapped: 0,
          steps: [
            {
              stepInstanceId: 501,
              stepSequence: 1,
              stepCode: "PREP",
              stepName: "Prep",
              workCenterId: 10,
              workCenterName: "Prep",
              state: "Pending",
              isRequired: true,
              requiresScan: true,
              dataCaptureMode: "ElectronicRequired",
              timeCaptureMode: "Automated",
              scanInUtc: null,
              scanOutUtc: null,
              completedUtc: null,
              durationMinutes: null,
              manualDurationMinutes: null,
              manualDurationReason: null,
              timeCaptureSource: "SystemScan",
              requiresUsageEntry: false,
              requiresScrapEntry: false,
              requiresSerialCapture: false,
              requiresChecklistCompletion: false,
              checklistTemplateId: null,
              checklistFailurePolicy: "BlockCompletion",
              requireScrapReasonWhenBad: true,
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
    ordersApiMock.validateRoute.mockResolvedValue({});
    ordersApiMock.adjustRoute.mockResolvedValue({});
    ordersApiMock.reopenRoute.mockResolvedValue({});
    ordersApiMock.supervisorApprove.mockResolvedValue({});
    ordersApiMock.supervisorReject.mockResolvedValue({});
    setupApiMock.listWorkCenters.mockResolvedValue([
      {
        id: 10,
        workCenterCode: "WC-10",
        workCenterName: "Prep",
        siteId: 1,
        description: null,
        isActive: true,
        defaultTimeCaptureMode: "Automated",
        requiresScanByDefault: true,
        createdUtc: "2026-01-01T00:00:00Z",
        updatedUtc: "2026-01-01T00:00:00Z",
      },
    ]);
  });

  it("loads queues and runs validate action", async () => {
    render(<SupervisorRouteReviewPage />);
    await waitFor(() => expect(ordersApiMock.pendingRouteReview).toHaveBeenCalled());
    await waitFor(() => expect(ordersApiMock.orderRouteExecution).toHaveBeenCalledWith(100));

    fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    await waitFor(() => expect(ordersApiMock.validateRoute).toHaveBeenCalledWith(100, expect.any(Object)));
  });

  it("shows diff preview after editing sequence", async () => {
    render(<SupervisorRouteReviewPage />);
    await waitFor(() => expect(ordersApiMock.orderRouteExecution).toHaveBeenCalled());

    const sequenceInputs = screen.getAllByRole("textbox");
    fireEvent.change(sequenceInputs.find((i) => (i as HTMLInputElement).value === "1")!, {
      target: { value: "2" },
    });

    expect(screen.getByText(/1 changed step\(s\)/i)).toBeInTheDocument();
  });
});
