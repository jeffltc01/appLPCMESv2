import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { CustomersPage } from "./CustomersPage";

const listMock = vi.fn();

vi.mock("../services/customers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/customers")>();
  return {
    ...actual,
    customersApi: {
      ...actual.customersApi,
      list: (...args: unknown[]) => listMock(...args),
    },
  };
});

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

describe("CustomersPage", () => {
  beforeEach(() => {
    listMock.mockReset();
    listMock.mockResolvedValue({
      items: [
        {
          id: 101,
          name: "Acme Industrial",
          customerCode: "ACME",
          status: "Active",
          email: "ops@acme.com",
          tankColor: "Blue",
          lidColor: "Gray",
          billToAddress: "Acme HQ, Houston TX",
          shipToAddress: "Acme Yard, Houston TX",
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 25,
    });
  });

  it("renders and loads customer list", async () => {
    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Customers")).toBeInTheDocument();
    await waitFor(() => {
      expect(listMock).toHaveBeenCalled();
    });
    expect(screen.getByText("Acme Industrial")).toBeInTheDocument();
    expect(screen.getByText("ACME")).toBeInTheDocument();
    expect(screen.getByText("ops@acme.com")).toBeInTheDocument();
  });

  it("navigates to customer detail on row click", async () => {
    render(
      <MemoryRouter initialEntries={["/customers"]}>
        <Routes>
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:customerId" element={<div>Customer Detail Route</div>} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    );

    expect(await screen.findByText("Acme Industrial")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Acme Industrial"));
    expect(screen.getByTestId("current-path")).toHaveTextContent("/customers/101");
  });
});
