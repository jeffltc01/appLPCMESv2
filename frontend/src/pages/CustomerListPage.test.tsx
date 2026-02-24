import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CustomerListPage } from "./CustomerListPage";

const customersApiMock = vi.hoisted(() => ({
  list: vi.fn(),
}));

vi.mock("../services/customers", () => ({
  customersApi: customersApiMock,
}));

describe("CustomerListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads customers and navigates to selected customer", async () => {
    customersApiMock.list.mockResolvedValue({
      items: [
        {
          id: 10,
          name: "Acme Propane",
          customerCode: "ACM",
          status: "Active",
          email: "acme@example.com",
          tankColorName: null,
          lidColorName: null,
          billToAddress: "Acme HQ",
          shipToAddress: "Acme Yard",
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 25,
    });

    render(
      <MemoryRouter initialEntries={["/customers"]}>
        <Routes>
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/:id" element={<div>Customer Detail Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(customersApiMock.list).toHaveBeenCalled());
    expect(screen.getByText("Acme Propane")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Acme Propane"));
    expect(screen.getByText("Customer Detail Screen")).toBeInTheDocument();
  });
});

