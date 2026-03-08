import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { within } from "@testing-library/dom";
import { MemoryRouter } from "react-router-dom";
import { ValveTypesSetupPage } from "./ValveTypesSetupPage";

const listValveTypesMock = vi.fn();
const createValveTypeMock = vi.fn();
const updateValveTypeMock = vi.fn();
const deleteValveTypeMock = vi.fn();

vi.mock("../services/setup", () => ({
  setupApi: {
    listValveTypes: (...args: unknown[]) => listValveTypesMock(...args),
    createValveType: (...args: unknown[]) => createValveTypeMock(...args),
    updateValveType: (...args: unknown[]) => updateValveTypeMock(...args),
    deleteValveType: (...args: unknown[]) => deleteValveTypeMock(...args),
  },
}));

describe("ValveTypesSetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listValveTypesMock.mockResolvedValue([
      {
        id: 1,
        code: "STD",
        displayName: "Standard",
        isActive: true,
        sortOrder: 10,
        isInUse: true,
        createdUtc: "2026-03-01T00:00:00Z",
        updatedUtc: "2026-03-01T00:00:00Z",
      },
    ]);
  });

  it("renders lookup rows", async () => {
    render(
      <MemoryRouter>
        <ValveTypesSetupPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(listValveTypesMock).toHaveBeenCalled());
    expect(screen.getByText("Valve Type Maintenance")).toBeInTheDocument();
    expect(screen.getByText("Standard")).toBeInTheDocument();
  });

  it("opens create dialog and saves", async () => {
    render(
      <MemoryRouter>
        <ValveTypesSetupPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(listValveTypesMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Add Valve Type" }));
    const dialog = await screen.findByRole("dialog");
    const textboxes = within(dialog).getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "NEW_CODE" } });
    fireEvent.change(textboxes[1], { target: { value: "New Valve Type" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(createValveTypeMock).toHaveBeenCalledWith({
        code: "NEW_CODE",
        displayName: "New Valve Type",
        isActive: true,
        sortOrder: 100,
      })
    );
  });
});
