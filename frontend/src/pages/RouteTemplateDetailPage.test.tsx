import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RouteTemplateDetailPage } from "./RouteTemplateDetailPage";

const listWorkCentersMock = vi.fn();
const getRouteTemplateMock = vi.fn();
const createRouteTemplateMock = vi.fn();
const updateRouteTemplateMock = vi.fn();

vi.mock("../services/setup", () => ({
  setupApi: {
    listWorkCenters: (...args: unknown[]) => listWorkCentersMock(...args),
    getRouteTemplate: (...args: unknown[]) => getRouteTemplateMock(...args),
    createRouteTemplate: (...args: unknown[]) => createRouteTemplateMock(...args),
    updateRouteTemplate: (...args: unknown[]) => updateRouteTemplateMock(...args),
  },
}));

describe("RouteTemplateDetailPage", () => {
  beforeEach(() => {
    listWorkCentersMock.mockResolvedValue([
      {
        id: 10,
        workCenterCode: "WC-BLAST",
        workCenterName: "Blast Prep",
      },
    ]);
    getRouteTemplateMock.mockResolvedValue({
      id: 1,
      routeTemplateCode: "RT-FILL-STD",
      routeTemplateName: "Standard Fill Route",
      description: null,
      isActive: true,
      versionNo: 1,
      createdUtc: "2026-02-28T00:00:00Z",
      updatedUtc: "2026-02-28T00:00:00Z",
      steps: [
        {
          id: 100,
          stepSequence: 1,
          stepCode: "BLAST",
          stepName: "Blast Prep",
          workCenterId: 10,
          isRequired: true,
          dataCaptureMode: "ElectronicRequired",
          timeCaptureMode: "Automated",
          requiresScan: true,
          requiresUsageEntry: false,
          requiresScrapEntry: false,
          requiresSerialCapture: false,
          requiresChecklistCompletion: false,
          checklistTemplateId: null,
          checklistFailurePolicy: "BlockCompletion",
          requireScrapReasonWhenBad: false,
          requiresTrailerCapture: false,
          requiresSerialLoadVerification: false,
          generatePackingSlipOnComplete: false,
          generateBolOnComplete: false,
          requiresAttachment: false,
          requiresSupervisorApproval: false,
          autoQueueNextStep: true,
          slaMinutes: null,
        },
      ],
    });
    createRouteTemplateMock.mockResolvedValue({});
    updateRouteTemplateMock.mockResolvedValue({});
  });

  it("loads existing route template on detail page", async () => {
    render(
      <MemoryRouter initialEntries={["/setup/route-templates/1"]}>
        <Routes>
          <Route path="/setup/route-templates/:templateId" element={<RouteTemplateDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue("RT-FILL-STD")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Standard Fill Route")).toBeInTheDocument();
    expect(screen.getByText("BLAST")).toBeInTheDocument();
  });

  it("saves existing route template through update api", async () => {
    render(
      <MemoryRouter initialEntries={["/setup/route-templates/1"]}>
        <Routes>
          <Route path="/setup/route-templates/:templateId" element={<RouteTemplateDetailPage />} />
          <Route path="/setup/route-templates" element={<div>Route Template List</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue("RT-FILL-STD")).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("Standard Fill Route"), {
      target: { value: "Updated Fill Route" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Route Template" }));

    await waitFor(() => {
      expect(updateRouteTemplateMock).toHaveBeenCalled();
    });
  });
});
