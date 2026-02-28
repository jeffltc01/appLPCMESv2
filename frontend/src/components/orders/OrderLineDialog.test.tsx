import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "../../services/api";
import { orderLinesApi } from "../../services/orders";
import { OrderLineDialog } from "./OrderLineDialog";

vi.mock("../../services/orders", () => ({
  orderLinesApi: {
    create: vi.fn(),
    update: vi.fn(),
  },
  orderLookupsApi: {
    items: vi.fn().mockResolvedValue([
      { id: 11, itemNo: "ITM-11", itemDescription: "Cylinder" },
    ]),
    colors: vi.fn().mockResolvedValue([]),
    defaultItemPrice: vi.fn().mockResolvedValue(12.5),
  },
}));

describe("OrderLineDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows backend error message when save fails", async () => {
    vi.mocked(orderLinesApi.update).mockRejectedValueOnce(
      new ApiError(409, "Conflict", {
        message: "Only orders in status 'New' can be edited in this sprint.",
      })
    );

    render(
      <OrderLineDialog
        open
        orderId={101}
        line={{
          id: 7,
          lineNo: 1,
          itemId: 11,
          itemNo: "ITM-11",
          itemDescription: "Cylinder",
          quantityAsOrdered: 2,
          unitPrice: 12.5,
          extension: 25,
          notes: null,
          colorId: null,
          colorName: null,
          lidColorId: null,
          lidColorName: null,
          needCollars: null,
          needFillers: null,
          needFootRings: null,
          needDecals: null,
          valveType: null,
          gauges: null,
        }}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(await screen.findByText("Edit Line")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(orderLinesApi.update).toHaveBeenCalled();
      expect(
        screen.getByText("Only orders in status 'New' can be edited in this sprint.")
      ).toBeInTheDocument();
    });
  });

});
