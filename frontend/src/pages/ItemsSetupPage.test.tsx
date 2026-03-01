import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ItemsSetupPage } from "./ItemsSetupPage";

const itemsListMock = vi.fn();
const itemTypesMock = vi.fn();
const itemSizesMock = vi.fn();
const productLinesMock = vi.fn();

vi.mock("../services/items", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/items")>();
  return {
    ...actual,
    itemsApi: {
      ...actual.itemsApi,
      list: (...args: unknown[]) => itemsListMock(...args),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    itemLookupsApi: {
      ...actual.itemLookupsApi,
      itemTypes: (...args: unknown[]) => itemTypesMock(...args),
      itemSizes: (...args: unknown[]) => itemSizesMock(...args),
      productLines: (...args: unknown[]) => productLinesMock(...args),
    },
  };
});

vi.mock("../components/items/NewItemDialog", () => ({
  NewItemDialog: () => null,
}));

describe("ItemsSetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    itemsListMock.mockResolvedValue({
      items: [
        {
          id: 1,
          itemNo: "ITEM-BR-1",
          itemDescription: "BR item",
          itemType: "Regular Item",
          productLine: "BR",
          sizeName: "S",
          basePrice: null,
        },
        {
          id: 2,
          itemNo: "ITEM-CYL-1",
          itemDescription: "CYL item",
          itemType: "Regular Item",
          productLine: "CYL",
          sizeName: "M",
          basePrice: null,
        },
      ],
      page: 1,
      pageSize: 500,
      totalCount: 2,
      totalPages: 1,
    });
    itemTypesMock.mockResolvedValue(["Regular Item"]);
    itemSizesMock.mockResolvedValue([{ id: 1, name: "S", size: 1 }]);
    productLinesMock.mockResolvedValue(["BR", "CYL"]);
  });

  it("renders Item Maintenance title", async () => {
    render(
      <MemoryRouter>
        <ItemsSetupPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Item Maintenance")).toBeInTheDocument();
  });

  it("filters rows by selected product line", async () => {
    render(
      <MemoryRouter>
        <ItemsSetupPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("ITEM-BR-1")).toBeInTheDocument();
    expect(screen.getByText("ITEM-CYL-1")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Product Line Filter" }), {
      target: { value: "BR" },
    });

    await waitFor(() => {
      expect(screen.getByText("ITEM-BR-1")).toBeInTheDocument();
      expect(screen.queryByText("ITEM-CYL-1")).not.toBeInTheDocument();
    });
  });
});
