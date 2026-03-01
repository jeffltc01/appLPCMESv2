import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { RouteTemplatesSetupPage } from "./RouteTemplatesSetupPage";

const listRouteTemplatesMock = vi.fn();

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

vi.mock("../services/setup", () => ({
  setupApi: {
    listRouteTemplates: (...args: unknown[]) => listRouteTemplatesMock(...args),
  },
}));

describe("RouteTemplatesSetupPage", () => {
  beforeEach(() => {
    listRouteTemplatesMock.mockResolvedValue([
      {
        id: 1,
        routeTemplateCode: "RT-FILL-STD",
        routeTemplateName: "Standard Fill Route",
        description: null,
        isActive: true,
        versionNo: 1,
        createdUtc: "2026-02-28T00:00:00Z",
        updatedUtc: "2026-02-28T00:00:00Z",
        stepCount: 3,
      },
      {
        id: 2,
        routeTemplateCode: "RT-REFURB-LEGACY",
        routeTemplateName: "Legacy Refurb Route",
        description: null,
        isActive: false,
        versionNo: 2,
        createdUtc: "2026-02-28T00:00:00Z",
        updatedUtc: "2026-02-28T00:00:00Z",
        stepCount: 5,
      },
    ]);
  });

  it("loads and renders route template rows", async () => {
    render(
      <MemoryRouter>
        <RouteTemplatesSetupPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listRouteTemplatesMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Route Template Maintenance")).toBeInTheDocument();
    expect(screen.getByText("RT-FILL-STD")).toBeInTheDocument();
    expect(screen.getByText("Legacy Refurb Route")).toBeInTheDocument();
  });

  it("filters list by search and status", async () => {
    render(
      <MemoryRouter>
        <RouteTemplatesSetupPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("RT-FILL-STD")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "legacy" } });

    await waitFor(() => {
      expect(screen.queryByText("RT-FILL-STD")).not.toBeInTheDocument();
      expect(screen.getByText("RT-REFURB-LEGACY")).toBeInTheDocument();
    });
  });

  it("navigates to new route template detail page", async () => {
    render(
      <MemoryRouter initialEntries={["/setup/route-templates"]}>
        <RouteTemplatesSetupPage />
        <LocationProbe />
      </MemoryRouter>
    );

    expect(await screen.findByText("RT-FILL-STD")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add Route Template" }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/setup/route-templates/new");
  });

  it("navigates to route template detail page from edit action", async () => {
    render(
      <MemoryRouter initialEntries={["/setup/route-templates"]}>
        <RouteTemplatesSetupPage />
        <LocationProbe />
      </MemoryRouter>
    );

    expect(await screen.findByText("RT-FILL-STD")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);

    expect(screen.getByTestId("current-path")).toHaveTextContent("/setup/route-templates/1");
  });
});
