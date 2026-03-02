import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RouteTemplateDetailPage } from "./RouteTemplateDetailPage";

const listWorkCentersMock = vi.fn();
const getRouteTemplateMock = vi.fn();
const createRouteTemplateMock = vi.fn();
const updateRouteTemplateMock = vi.fn();
const listAssignmentsMock = vi.fn();
const createAssignmentMock = vi.fn();
const updateAssignmentMock = vi.fn();
const deleteAssignmentMock = vi.fn();
const activeCustomersMock = vi.fn();
const sitesMock = vi.fn();
const shipViasMock = vi.fn();
const orderItemsMock = vi.fn();
const itemTypesMock = vi.fn();

vi.mock("../services/setup", () => ({
  setupApi: {
    listWorkCenters: (...args: unknown[]) => listWorkCentersMock(...args),
    getRouteTemplate: (...args: unknown[]) => getRouteTemplateMock(...args),
    createRouteTemplate: (...args: unknown[]) => createRouteTemplateMock(...args),
    updateRouteTemplate: (...args: unknown[]) => updateRouteTemplateMock(...args),
    listAssignments: (...args: unknown[]) => listAssignmentsMock(...args),
    createAssignment: (...args: unknown[]) => createAssignmentMock(...args),
    updateAssignment: (...args: unknown[]) => updateAssignmentMock(...args),
    deleteAssignment: (...args: unknown[]) => deleteAssignmentMock(...args),
  },
}));

vi.mock("../services/orders", () => ({
  orderLookupsApi: {
    activeCustomers: (...args: unknown[]) => activeCustomersMock(...args),
    sites: (...args: unknown[]) => sitesMock(...args),
    shipVias: (...args: unknown[]) => shipViasMock(...args),
    items: (...args: unknown[]) => orderItemsMock(...args),
  },
}));

vi.mock("../services/items", () => ({
  itemLookupsApi: {
    itemTypes: (...args: unknown[]) => itemTypesMock(...args),
  },
}));

describe("RouteTemplateDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
          processingModeOverride: null,
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
    listAssignmentsMock.mockResolvedValue([
      {
        id: 10,
        assignmentName: "Houston default",
        priority: 1000,
        revisionNo: 1,
        isActive: true,
        customerId: null,
        siteId: 1,
        itemId: null,
        itemType: null,
        orderPriorityMin: null,
        orderPriorityMax: null,
        pickUpViaId: null,
        shipToViaId: null,
        routeTemplateId: 1,
        supervisorGateOverride: null,
        effectiveFromUtc: null,
        effectiveToUtc: null,
        createdUtc: "2026-02-28T00:00:00Z",
        updatedUtc: "2026-02-28T00:00:00Z",
      },
    ]);
    createAssignmentMock.mockResolvedValue({});
    updateAssignmentMock.mockResolvedValue({});
    deleteAssignmentMock.mockResolvedValue({});
    activeCustomersMock.mockResolvedValue([{ id: 1, name: "Acme" }]);
    sitesMock.mockResolvedValue([{ id: 1, name: "Houston" }]);
    shipViasMock.mockResolvedValue([{ id: 1, name: "LPC Fleet" }]);
    orderItemsMock.mockResolvedValue([{ id: 55, itemNo: "CYL-100", itemDescription: "Cylinder 100", productLine: null }]);
    itemTypesMock.mockResolvedValue(["Standard"]);
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

  it("loads assignment rules for existing route template", async () => {
    render(
      <MemoryRouter initialEntries={["/setup/route-templates/1"]}>
        <Routes>
          <Route path="/setup/route-templates/:templateId" element={<RouteTemplateDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue("RT-FILL-STD")).toBeInTheDocument();
    expect(screen.getByText("Applies To (Assignment Rules)")).toBeInTheDocument();
    expect(screen.getByText("Houston default")).toBeInTheDocument();
  });

  it("persists edited step time capture mode in update payload", async () => {
    render(
      <MemoryRouter initialEntries={["/setup/route-templates/1"]}>
        <Routes>
          <Route path="/setup/route-templates/:templateId" element={<RouteTemplateDetailPage />} />
          <Route path="/setup/route-templates" element={<div>Route Template List</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue("RT-FILL-STD")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);

    fireEvent.change(screen.getByRole("combobox", { name: "Time Capture Mode" }), {
      target: { value: "Manual" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Step" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Route Template" }));

    await waitFor(() => {
      expect(updateRouteTemplateMock).toHaveBeenCalled();
    });

    const payload = updateRouteTemplateMock.mock.calls.at(-1)?.[1] as {
      steps: Array<{ timeCaptureMode: string }>;
    };
    expect(payload.steps[0].timeCaptureMode).toBe("Manual");
  });
});
