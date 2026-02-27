import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OrderBoardPage } from "./OrderBoardPage";

const ordersApiMock = vi.hoisted(() => ({
  list: vi.fn(),
  kpiSummary: vi.fn(),
  kpiWorkCenterSummary: vi.fn(),
  migrateLifecycleStatuses: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
  getWorkspaceCurrentStatus: (status: string) => status,
}));

describe("OrderBoardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders KPI summary values", async () => {
    ordersApiMock.list.mockResolvedValue({
      items: [
        {
          id: 1,
          salesOrderNo: "SO-1",
          orderDate: "2026-02-20",
          orderStatus: "Draft",
          orderLifecycleStatus: "Draft",
          customerId: 1,
          customerName: "Acme",
          siteId: 1,
          siteName: "Main",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 2,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 300,
    });
    ordersApiMock.kpiSummary.mockResolvedValue({
      generatedUtc: "2026-02-27T12:00:00Z",
      totalOrdersEvaluated: 1,
      leadTimeMetrics: [
        {
          metricKey: "release_to_invoice_ready",
          label: "Release/dispatch -> invoice ready lead time",
          pairCount: 1,
          avgHours: 6,
          p50Hours: 6,
          p90Hours: 6,
        },
      ],
      holdDuration: {
        closedCount: 1,
        activeCount: 0,
        averageClosedHours: 2,
        averageActiveAgeHours: null,
      },
      promiseReliability: {
        eligibleCount: 1,
        onTimeCount: 1,
        onTimeRatePercent: 100,
        averageSlipDaysForLateOrders: null,
        lateOrderCount: 0,
        slippedWithNotificationPercent: null,
        revisionFrequencyBySite: [],
        revisionFrequencyByCustomer: [],
        revisionFrequencyByReason: [],
      },
      dataQuality: {
        missingTimestampCount: 0,
        missingReasonCodeCount: 0,
        missingOwnershipCount: 0,
        invalidOrderingCount: 0,
        sampleOrderIds: [],
      },
    });
    ordersApiMock.kpiWorkCenterSummary.mockResolvedValue({
      generatedUtc: "2026-02-27T12:00:00Z",
      totalWorkCentersEvaluated: 1,
      stepCycleTimeByWorkCenter: [
        {
          workCenterId: 1,
          workCenterCode: "BLAST",
          workCenterName: "Blast Booth",
          stepCount: 3,
          avgMinutes: 22,
          p50Minutes: 20,
          p90Minutes: 30,
        },
      ],
      queueAgingByWorkCenter: [
        {
          workCenterId: 1,
          workCenterCode: "BLAST",
          workCenterName: "Blast Booth",
          pendingCount: 1,
          inProgressCount: 1,
          averageAgeMinutes: 18,
          oldestAgeMinutes: 25,
        },
      ],
      scrapByReasonWorkCenterItem: [
        {
          workCenterId: 1,
          workCenterCode: "BLAST",
          workCenterName: "Blast Booth",
          scrapReasonId: 9,
          scrapReason: "Damaged Surface",
          itemId: 7,
          itemNo: "CYL-30",
          itemDescription: "Cylinder",
          quantityScrapped: 0.5,
          entryCount: 1,
        },
      ],
      supervisorHoldTime: {
        closedCount: 1,
        activeCount: 0,
        averageClosedHours: 2,
        averageActiveAgeHours: null,
        oldestActiveAgeHours: null,
      },
      traceabilityCompleteness: {
        requiredUsageStepCount: 5,
        stepsWithUsageRecordedCount: 4,
        completenessPercent: 80,
        measurementBasis: "Proxy",
      },
    });

    render(
      <MemoryRouter>
        <OrderBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.kpiSummary).toHaveBeenCalled());
    expect(screen.getByText(/KPI coverage/)).toBeInTheDocument();
    expect(screen.getByText(/Phase 9 Work-Center KPIs/)).toBeInTheDocument();
    expect(screen.getByText(/Release\/dispatch -> invoice ready lead time/)).toBeInTheDocument();
    expect(screen.getByText(/Data quality:/)).toBeInTheDocument();
  });
});
