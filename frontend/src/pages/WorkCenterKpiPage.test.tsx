import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { WorkCenterKpiPage } from "./WorkCenterKpiPage";

const ordersApiMock = vi.hoisted(() => ({
  kpiWorkCenterSummary: vi.fn(),
}));

const orderLookupsApiMock = vi.hoisted(() => ({
  sites: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
  orderLookupsApi: orderLookupsApiMock,
}));

describe("WorkCenterKpiPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders work center KPI dashboard sections", async () => {
    orderLookupsApiMock.sites.mockResolvedValue([{ id: 1, name: "Main" }]);
    ordersApiMock.kpiWorkCenterSummary.mockResolvedValue({
      generatedUtc: "2026-02-27T12:00:00Z",
      totalWorkCentersEvaluated: 1,
      stepCycleTimeByWorkCenter: [
        {
          workCenterId: 1,
          workCenterCode: "BLAST",
          workCenterName: "Blast Booth",
          stepCount: 3,
          avgMinutes: 20,
          p50Minutes: 18,
          p90Minutes: 27,
        },
      ],
      queueAgingByWorkCenter: [
        {
          workCenterId: 1,
          workCenterCode: "BLAST",
          workCenterName: "Blast Booth",
          pendingCount: 1,
          inProgressCount: 1,
          averageAgeMinutes: 14,
          oldestAgeMinutes: 25,
        },
      ],
      scrapByReasonWorkCenterItem: [
        {
          workCenterId: 1,
          workCenterCode: "BLAST",
          workCenterName: "Blast Booth",
          scrapReasonId: 10,
          scrapReason: "Damaged Surface",
          itemId: 55,
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
      <MemoryRouter initialEntries={["/kpi/workcenter"]}>
        <Routes>
          <Route path="/kpi/workcenter" element={<WorkCenterKpiPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.kpiWorkCenterSummary).toHaveBeenCalled());
    expect(screen.getByText("Work Center KPI Dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Step cycle time/)).toBeInTheDocument();
    expect(screen.getByText(/Queue aging/)).toBeInTheDocument();
    expect(screen.getByText(/Scrap by reason\/work center\/item/)).toBeInTheDocument();
  });
});
