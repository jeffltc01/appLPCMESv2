import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { within } from "@testing-library/dom";
import { MemoryRouter } from "react-router-dom";
import { GaugesSetupPage } from "./GaugesSetupPage";

const listGaugesMock = vi.fn();
const createGaugeMock = vi.fn();
const updateGaugeMock = vi.fn();
const deleteGaugeMock = vi.fn();

vi.mock("../services/setup", () => ({
  setupApi: {
    listGauges: (...args: unknown[]) => listGaugesMock(...args),
    createGauge: (...args: unknown[]) => createGaugeMock(...args),
    updateGauge: (...args: unknown[]) => updateGaugeMock(...args),
    deleteGauge: (...args: unknown[]) => deleteGaugeMock(...args),
  },
}));

describe("GaugesSetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listGaugesMock.mockResolvedValue([
      {
        id: 1,
        code: "YES",
        displayName: "Yes",
        isActive: true,
        sortOrder: 10,
        isInUse: false,
        createdUtc: "2026-03-01T00:00:00Z",
        updatedUtc: "2026-03-01T00:00:00Z",
      },
    ]);
  });

  it("renders lookup rows", async () => {
    render(
      <MemoryRouter>
        <GaugesSetupPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(listGaugesMock).toHaveBeenCalled());
    expect(screen.getByText("Gauge Maintenance")).toBeInTheDocument();
    expect(screen.getAllByText("Yes").length).toBeGreaterThan(0);
  });

  it("opens create dialog and saves", async () => {
    render(
      <MemoryRouter>
        <GaugesSetupPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(listGaugesMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Add Gauge" }));
    const dialog = await screen.findByRole("dialog");
    const textboxes = within(dialog).getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "MAYBE" } });
    fireEvent.change(textboxes[1], { target: { value: "Maybe" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(createGaugeMock).toHaveBeenCalledWith({
        code: "MAYBE",
        displayName: "Maybe",
        isActive: true,
        sortOrder: 100,
      })
    );
  });
});
