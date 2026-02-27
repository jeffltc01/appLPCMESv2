import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SetupAssignmentsPage } from "./SetupAssignmentsPage";

const setupApiMock = vi.hoisted(() => ({
  listAssignments: vi.fn(),
  listRouteTemplates: vi.fn(),
  getAssignment: vi.fn(),
  createAssignment: vi.fn(),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  simulateRoute: vi.fn(),
}));

vi.mock("../services/setup", () => ({
  setupApi: setupApiMock,
}));

describe("SetupAssignmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupApiMock.listAssignments.mockResolvedValue([]);
    setupApiMock.listRouteTemplates.mockResolvedValue([
      {
        id: 11,
        routeTemplateCode: "RT-BASE",
        routeTemplateName: "Base",
        description: null,
        isActive: true,
        versionNo: 1,
        createdUtc: "2026-02-01T00:00:00Z",
        updatedUtc: "2026-02-01T00:00:00Z",
        stepCount: 2,
      },
    ]);
    setupApiMock.createAssignment.mockResolvedValue({});
    setupApiMock.simulateRoute.mockResolvedValue({
      matched: true,
      matchTier: 1,
      matchTierLabel: "customer+item+site",
      assignment: {
        id: 5,
        assignmentName: "Exact",
      },
      routeTemplate: {
        id: 11,
        routeTemplateCode: "RT-BASE",
        routeTemplateName: "Base",
        description: null,
        isActive: true,
        versionNo: 1,
        createdUtc: "2026-02-01T00:00:00Z",
        updatedUtc: "2026-02-01T00:00:00Z",
        steps: [{ id: 1 }, { id: 2 }],
      },
    });
  });

  it("creates assignment and runs simulation", async () => {
    render(<SetupAssignmentsPage />);
    await waitFor(() => expect(setupApiMock.listAssignments).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText("Assignment Name"), { target: { value: "High Priority" } });
    fireEvent.change(screen.getByLabelText("Route Template ID"), { target: { value: "11" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Assignment" }));

    await waitFor(() => expect(setupApiMock.createAssignment).toHaveBeenCalled());

    const customerIdInputs = screen.getAllByLabelText("Customer ID");
    const siteIdInputs = screen.getAllByLabelText("Site ID");
    const itemIdInputs = screen.getAllByLabelText("Item ID");
    fireEvent.change(customerIdInputs[customerIdInputs.length - 1], { target: { value: "1" } });
    fireEvent.change(siteIdInputs[siteIdInputs.length - 1], { target: { value: "1" } });
    fireEvent.change(itemIdInputs[itemIdInputs.length - 1], { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Run Simulation" }));

    await waitFor(() => expect(setupApiMock.simulateRoute).toHaveBeenCalled());
    expect(screen.getByText(/Simulation match found/i)).toBeInTheDocument();
  });
});
