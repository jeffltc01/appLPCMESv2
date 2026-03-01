import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WorkCentersSetupPage } from "./WorkCentersSetupPage";

const listWorkCentersMock = vi.fn();
const sitesMock = vi.fn();

vi.mock("../services/setup", () => ({
  setupApi: {
    listWorkCenters: (...args: unknown[]) => listWorkCentersMock(...args),
    createWorkCenter: vi.fn(),
    updateWorkCenter: vi.fn(),
    deleteWorkCenter: vi.fn(),
  },
}));

vi.mock("../services/orders", () => ({
  orderLookupsApi: {
    sites: (...args: unknown[]) => sitesMock(...args),
  },
}));

describe("WorkCentersSetupPage", () => {
  beforeEach(() => {
    listWorkCentersMock.mockResolvedValue([
      {
        id: 1,
        workCenterCode: "WC-BLAST",
        workCenterName: "Blast Prep",
        siteId: 10,
        description: null,
        isActive: true,
        defaultTimeCaptureMode: "Automated",
        defaultProcessingMode: "BatchQuantity",
        requiresScanByDefault: true,
        createdUtc: "2026-02-28T00:00:00Z",
        updatedUtc: "2026-02-28T00:00:00Z",
      },
    ]);
    sitesMock.mockResolvedValue([{ id: 10, name: "Houston" }]);
  });

  it("loads and renders work centers", async () => {
    render(
      <MemoryRouter>
        <WorkCentersSetupPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listWorkCentersMock).toHaveBeenCalled();
      expect(sitesMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Work Center Maintenance")).toBeInTheDocument();
    expect(screen.getByText("WC-BLAST")).toBeInTheDocument();
    expect(screen.getByText("Blast Prep")).toBeInTheDocument();
    expect(screen.getByText("Houston")).toBeInTheDocument();
  });
});
