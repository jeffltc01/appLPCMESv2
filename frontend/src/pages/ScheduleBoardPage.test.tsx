import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScheduleBoardPage } from "./ScheduleBoardPage";

const getScheduleMock = vi.fn();
const sitesMock = vi.fn();
const bulkAssignScheduleMock = vi.fn();
const getScheduleSettingsMock = vi.fn();

vi.mock("../services/orders", () => ({
  ordersApi: {
    getSchedule: (...args: unknown[]) => getScheduleMock(...args),
    bulkAssignSchedule: (...args: unknown[]) => bulkAssignScheduleMock(...args),
    updateSchedule: vi.fn(),
  },
  orderLookupsApi: {
    sites: (...args: unknown[]) => sitesMock(...args),
  },
}));

vi.mock("../services/setup", () => ({
  setupApi: {
    getScheduleSettings: (...args: unknown[]) => getScheduleSettingsMock(...args),
    updateScheduleSettings: vi.fn(),
  },
}));

const mockScheduleBoard = {
  carryover: [
    {
      orderId: 101,
      orderNo: "SO-101",
      customerName: "Acme Corp",
      orderDate: "2026-03-01",
      requestedDateUtc: "2026-02-15T00:00:00Z",
      scheduleWeekOf: "2026-02-24",
      targetDateUtc: null,
      totalQty: 50,
      lifecycleStatus: "ReadyForProduction",
      productLineSummary: [
        { productLineCode: "PL-A", productLineName: "Product A", colorHex: "#B3D4FC", qty: 50 },
      ],
    },
  ],
  unscheduled: [
    {
      orderId: 102,
      orderNo: "SO-102",
      customerName: "Beta Inc",
      orderDate: "2026-03-05",
      requestedDateUtc: null,
      scheduleWeekOf: null,
      targetDateUtc: null,
      totalQty: 20,
      lifecycleStatus: "Draft",
      productLineSummary: [
        { productLineCode: "PL-B", productLineName: "Product B", colorHex: "#FFB3B3", qty: 20 },
      ],
    },
    {
      orderId: 103,
      orderNo: "SO-103",
      customerName: "Gamma LLC",
      orderDate: "2026-03-06",
      requestedDateUtc: "2026-03-20T00:00:00Z",
      scheduleWeekOf: null,
      targetDateUtc: null,
      totalQty: 100,
      lifecycleStatus: "Draft",
      productLineSummary: [
        { productLineCode: "PL-A", productLineName: "Product A", colorHex: "#B3D4FC", qty: 100 },
      ],
    },
  ],
  weekPool: [],
  dayAssigned: [],
  productLines: [
    {
      code: "PL-A",
      name: "Product A",
      colorHex: "#B3D4FC",
      weeklyCapacityTarget: 80,
      historicalAvgPerWeek: 65.5,
      historicalPeakPerWeek: 90,
    },
    {
      code: "PL-B",
      name: "Product B",
      colorHex: "#FFB3B3",
      weeklyCapacityTarget: null,
      historicalAvgPerWeek: 12,
      historicalPeakPerWeek: 25,
    },
  ],
  throughputLookbackDays: 90,
};

const mockSites = [
  { id: 1, name: "Site A" },
  { id: 2, name: "Site B" },
];

describe("ScheduleBoardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getScheduleMock.mockResolvedValue(mockScheduleBoard);
    sitesMock.mockResolvedValue(mockSites);
    bulkAssignScheduleMock.mockResolvedValue(undefined);
    getScheduleSettingsMock.mockResolvedValue({ throughputLookbackDays: 90 });
  });

  it("renders the page with board columns (This week, Mon–Fri)", async () => {
    render(
      <MemoryRouter>
        <ScheduleBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getScheduleMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Schedule board")).toBeInTheDocument();
    expect(screen.getByText(/This week/)).toBeInTheDocument();
    expect(screen.getByText(/Mon/)).toBeInTheDocument();
    expect(screen.getByText(/Tue/)).toBeInTheDocument();
    expect(screen.getByText(/Wed/)).toBeInTheDocument();
    expect(screen.getByText(/Thu/)).toBeInTheDocument();
    expect(screen.getByText(/Fri/)).toBeInTheDocument();
  });

  it("renders unscheduled and carryover sections in the sidebar", async () => {
    render(
      <MemoryRouter>
        <ScheduleBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getScheduleMock).toHaveBeenCalled();
    });

    expect(screen.getByText(/UNSCHEDULED \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/CARRIED OVER \(1\)/)).toBeInTheDocument();
  });

  it("renders order cards with correct content (order no, customer, qty, overdue badge)", async () => {
    render(
      <MemoryRouter>
        <ScheduleBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getScheduleMock).toHaveBeenCalled();
    });

    expect(screen.getByText("SO-102")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
    expect(screen.getByText("Qty: 20")).toBeInTheDocument();

    expect(screen.getByText("SO-101")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Qty: 50")).toBeInTheDocument();

    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("search filters unscheduled orders by order number and customer name", async () => {
    render(
      <MemoryRouter>
        <ScheduleBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getScheduleMock).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText("Search orders...");
    fireEvent.change(searchInput, { target: { value: "SO-102" } });

    expect(screen.getByText("SO-102")).toBeInTheDocument();
    expect(screen.queryByText("SO-103")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Gamma" } });
    expect(screen.getByText("SO-103")).toBeInTheDocument();
    expect(screen.queryByText("SO-102")).not.toBeInTheDocument();
  });

  it("week navigation (prev/next/today) updates the displayed week range", async () => {
    render(
      <MemoryRouter>
        <ScheduleBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getScheduleMock).toHaveBeenCalled();
    });

    const initialCall = getScheduleMock.mock.calls[0][0];
    const initialWeekOf = initialCall.weekOf;

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    });
    await waitFor(() => {
      expect(getScheduleMock).toHaveBeenCalledTimes(2);
    });
    expect(getScheduleMock.mock.calls[1][0].weekOf).not.toBe(initialWeekOf);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next week" }));
      fireEvent.click(screen.getByRole("button", { name: "Today" }));
    });
    expect(getScheduleMock).toHaveBeenCalled();
  });

  it("throughput pills render with current/reference and three-state status badge", async () => {
    render(
      <MemoryRouter>
        <ScheduleBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getScheduleMock).toHaveBeenCalled();
    });

    expect(screen.getByText("THIS WEEK")).toBeInTheDocument();
    expect(screen.getAllByText("PL-A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("PL-B").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/0\/80/)).toBeInTheDocument();
    expect(screen.getByText(/0\/12/)).toBeInTheDocument();
    expect(screen.getAllByText("OK").length).toBeGreaterThanOrEqual(1);
  });

  it("getSchedule is called without lookbackDays (uses saved setting)", async () => {
    render(
      <MemoryRouter>
        <ScheduleBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getScheduleMock).toHaveBeenCalled();
    });

    const call = getScheduleMock.mock.calls[0][0];
    expect(call.weekOf).toBeDefined();
    expect(call.lookbackDays).toBeUndefined();
  });

  it("Show/Hide detail toggles capacity detail cards visibility", async () => {
    render(
      <MemoryRouter>
        <ScheduleBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getScheduleMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Show detail")).toBeInTheDocument();
    expect(screen.queryByText(/Target: 80\/wk/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show detail" }));
    expect(screen.getByText("Hide detail")).toBeInTheDocument();
    expect(screen.getByText(/Target: 80\/wk/)).toBeInTheDocument();
    expect(screen.getByText(/Avg: 12\/wk/)).toBeInTheDocument();
    expect(screen.getByText(/Peak: 90\/wk/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide detail" }));
    expect(screen.getByText("Show detail")).toBeInTheDocument();
    expect(screen.queryByText(/Target: 80\/wk/)).not.toBeInTheDocument();
  });

  it("site filter dropdown includes All sites option", async () => {
    render(
      <MemoryRouter>
        <ScheduleBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(sitesMock).toHaveBeenCalled();
    });

    expect(screen.getByText("All sites")).toBeInTheDocument();
    expect(screen.getByText("Site A")).toBeInTheDocument();
    expect(screen.getByText("Site B")).toBeInTheDocument();
  });

  it("bulk selection: checking cards shows floating toolbar with correct count", async () => {
    render(
      <MemoryRouter>
        <ScheduleBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getScheduleMock).toHaveBeenCalled();
    });

    expect(screen.queryByRole("toolbar", { name: "Bulk schedule actions" })).not.toBeInTheDocument();

    const checkboxes = screen.getAllByRole("checkbox", { name: /Select order/ });
    fireEvent.click(checkboxes[0]);

    expect(screen.getByRole("toolbar", { name: "Bulk schedule actions" })).toBeInTheDocument();
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    fireEvent.click(checkboxes[1]);
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  it("bulk assign: clicking Assign to this week calls bulkAssignSchedule", async () => {
    render(
      <MemoryRouter>
        <ScheduleBoardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getScheduleMock).toHaveBeenCalled();
    });

    const checkboxes = screen.getAllByRole("checkbox", { name: /Select order/ });
    fireEvent.click(checkboxes[0]);

    const assignButton = screen.getByRole("button", { name: "Assign to this week" });
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(bulkAssignScheduleMock).toHaveBeenCalled();
    });

    const call = bulkAssignScheduleMock.mock.calls[0][0];
    expect(call.orderIds).toContain(102);
    expect(call.scheduleWeekOf).toBeDefined();
    expect(call.changedByEmpNo).toBe("EMP001");
  });
});
