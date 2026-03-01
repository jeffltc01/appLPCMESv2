import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { TabletSetupPage } from "./TabletSetupPage";
import { TABLET_SETUP_STORAGE_KEY } from "../features/tabletSetupStorage";

const sitesMock = vi.fn();
const listWorkCentersMock = vi.fn();

vi.mock("../services/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/orders")>();
  return {
    ...actual,
    orderLookupsApi: {
      ...actual.orderLookupsApi,
      sites: (...args: unknown[]) => sitesMock(...args),
    },
  };
});

vi.mock("../services/setup", () => ({
  setupApi: {
    listWorkCenters: (...args: unknown[]) => listWorkCentersMock(...args),
  },
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
}

describe("TabletSetupPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    sitesMock.mockResolvedValue([
      { id: 10, name: "Houston" },
      { id: 11, name: "Dallas" },
    ]);
    listWorkCentersMock.mockResolvedValue([
      {
        id: 101,
        workCenterCode: "WC-FILL",
        workCenterName: "Fill Station",
        siteId: 10,
        description: null,
        isActive: true,
        defaultTimeCaptureMode: "Automated",
        defaultProcessingMode: "BatchQuantity",
        requiresScanByDefault: true,
        createdUtc: "2026-01-01T00:00:00Z",
        updatedUtc: "2026-01-01T00:00:00Z",
      },
    ]);
  });

  it("saves tablet setup and navigates to operator screen", async () => {
    render(
      <MemoryRouter initialEntries={["/setup/tablet"]}>
        <Routes>
          <Route path="/setup/tablet" element={<TabletSetupPage />} />
          <Route path="/operator/work-center" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Tablet Setup")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: /Site/i }), { target: { value: "10" } });
    fireEvent.change(screen.getByRole("combobox", { name: /Work Center/i }), { target: { value: "101" } });
    fireEvent.change(screen.getByLabelText("Default Operator (fallback, optional)"), {
      target: { value: "EMP500" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save & Open Operator Screen" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-path")).toHaveTextContent("/operator/work-center");
    });

    const raw = window.localStorage.getItem(TABLET_SETUP_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).toContain('"workCenterId":101');
    expect(raw).toContain('"operatorEmpNo":"EMP500"');
    expect(raw).toContain('"lockOperatorToLoggedInUser":false');
  });

  it("clears saved setup", async () => {
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
        <TabletSetupPage />
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue("EMP500")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear Saved Setup" }));
    expect(window.localStorage.getItem(TABLET_SETUP_STORAGE_KEY)).toBeNull();
  });

  it("saves lock-operator preference", async () => {
    render(
      <MemoryRouter initialEntries={["/setup/tablet"]}>
        <Routes>
          <Route path="/setup/tablet" element={<TabletSetupPage />} />
          <Route path="/operator/work-center" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Tablet Setup")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: /Site/i }), { target: { value: "10" } });
    fireEvent.change(screen.getByRole("combobox", { name: /Work Center/i }), { target: { value: "101" } });
    fireEvent.click(screen.getByRole("switch", { name: /lock operator to logged-in user/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save & Open Operator Screen" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-path")).toHaveTextContent("/operator/work-center");
    });

    const raw = window.localStorage.getItem(TABLET_SETUP_STORAGE_KEY);
    expect(raw).toContain('"lockOperatorToLoggedInUser":true');
  });
});
