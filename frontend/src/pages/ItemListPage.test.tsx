import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ItemListPage } from "./ItemListPage";

const itemsApiMock = vi.hoisted(() => ({
  list: vi.fn(),
}));

const itemLookupsApiMock = vi.hoisted(() => ({
  productLines: vi.fn(),
  itemTypes: vi.fn(),
}));

vi.mock("../services/items", () => ({
  itemsApi: itemsApiMock,
  itemLookupsApi: itemLookupsApiMock,
}));

describe("ItemListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads items and navigates to item detail", async () => {
    itemLookupsApiMock.productLines.mockResolvedValue(["LP"]);
    itemLookupsApiMock.itemTypes.mockResolvedValue(["Tank"]);
    itemsApiMock.list.mockResolvedValue({
      items: [
        {
          id: 7,
          itemNo: "TNK-100",
          itemDescription: "100lb Cylinder",
          itemType: "Tank",
          productLine: "LP",
          sizeName: "100lb",
          basePrice: 55.5,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 25,
    });

    render(
      <MemoryRouter initialEntries={["/items"]}>
        <Routes>
          <Route path="/items" element={<ItemListPage />} />
          <Route path="/items/:id" element={<div>Item Detail Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(itemsApiMock.list).toHaveBeenCalled());
    expect(screen.getByText("TNK-100")).toBeInTheDocument();

    fireEvent.click(screen.getByText("TNK-100"));
    expect(screen.getByText("Item Detail Screen")).toBeInTheDocument();
  });
});

