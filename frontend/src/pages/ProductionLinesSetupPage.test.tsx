import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProductionLinesSetupPage } from "./ProductionLinesSetupPage";

const listProductionLinesMock = vi.fn();
const updateProductionLineMock = vi.fn();

vi.mock("../services/setup", () => ({
  setupApi: {
    listProductionLines: (...args: unknown[]) => listProductionLinesMock(...args),
    createProductionLine: vi.fn(),
    updateProductionLine: (...args: unknown[]) => updateProductionLineMock(...args),
    deleteProductionLine: vi.fn(),
  },
}));

describe("ProductionLinesSetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listProductionLinesMock.mockResolvedValue([
      {
        id: 1,
        code: "PL-REF",
        name: "Refurb",
        showWhere: ["OrderProduct", "OrderReceiving"],
        createdUtc: "2026-02-28T00:00:00Z",
        updatedUtc: "2026-02-28T00:00:00Z",
      },
    ]);
    updateProductionLineMock.mockResolvedValue({
      id: 1,
      code: "PL-REF",
      name: "Refurb",
      showWhere: ["OrderProduct", "OrderReceiving", "OrderComments"],
      createdUtc: "2026-02-28T00:00:00Z",
      updatedUtc: "2026-02-28T00:00:00Z",
    });
  });

  it("loads and renders production lines", async () => {
    render(
      <MemoryRouter>
        <ProductionLinesSetupPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listProductionLinesMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Product Lines Maintenance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Product Line" })).toBeInTheDocument();
    expect(screen.getByText("PL-REF")).toBeInTheDocument();
    expect(screen.getByText("Refurb")).toBeInTheDocument();
  });

  it("updates show where options from the list", async () => {
    render(
      <MemoryRouter>
        <ProductionLinesSetupPage />
      </MemoryRouter>
    );

    const orderCommentsCheckbox = await screen.findByRole("checkbox", { name: "Order Comments" });
    fireEvent.click(orderCommentsCheckbox);

    await waitFor(() => {
      expect(updateProductionLineMock).toHaveBeenCalledWith(1, {
        code: "PL-REF",
        name: "Refurb",
        showWhere: ["OrderProduct", "OrderReceiving", "OrderComments"],
      });
    });
  });
});
