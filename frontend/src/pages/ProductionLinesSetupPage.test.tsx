import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProductionLinesSetupPage } from "./ProductionLinesSetupPage";

const listProductionLinesMock = vi.fn();

vi.mock("../services/setup", () => ({
  setupApi: {
    listProductionLines: (...args: unknown[]) => listProductionLinesMock(...args),
    createProductionLine: vi.fn(),
    updateProductionLine: vi.fn(),
    deleteProductionLine: vi.fn(),
  },
}));

describe("ProductionLinesSetupPage", () => {
  beforeEach(() => {
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

    expect(screen.getByText("Setup - Production Lines")).toBeInTheDocument();
    expect(screen.getByText("PL-REF")).toBeInTheDocument();
    expect(screen.getByText("Refurb")).toBeInTheDocument();
  });
});
