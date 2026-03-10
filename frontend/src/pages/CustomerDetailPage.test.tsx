import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CustomerDetailPage } from "./CustomerDetailPage";

const getMock = vi.fn();
const updateMock = vi.fn();
const deleteCustomerMock = vi.fn();
const listCustomersMock = vi.fn();
const listAddressesMock = vi.fn();
const deleteAddressMock = vi.fn();
const listContactsMock = vi.fn();
const deleteContactMock = vi.fn();
const colorsMock = vi.fn();
const paymentTermsMock = vi.fn();
const shipViasMock = vi.fn();
const salesPeopleMock = vi.fn();

vi.mock("../services/customers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/customers")>();
  return {
    ...actual,
    customersApi: {
      ...actual.customersApi,
      get: (...args: unknown[]) => getMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      delete: (...args: unknown[]) => deleteCustomerMock(...args),
      list: (...args: unknown[]) => listCustomersMock(...args),
    },
    addressesApi: {
      ...actual.addressesApi,
      list: (...args: unknown[]) => listAddressesMock(...args),
      delete: (...args: unknown[]) => deleteAddressMock(...args),
    },
    contactsApi: {
      ...actual.contactsApi,
      list: (...args: unknown[]) => listContactsMock(...args),
      delete: (...args: unknown[]) => deleteContactMock(...args),
    },
    lookupsApi: {
      ...actual.lookupsApi,
      colors: (...args: unknown[]) => colorsMock(...args),
      paymentTerms: (...args: unknown[]) => paymentTermsMock(...args),
      shipVias: (...args: unknown[]) => shipViasMock(...args),
      salesPeople: (...args: unknown[]) => salesPeopleMock(...args),
    },
  };
});

const detail = {
  id: 101,
  name: "Acme Industrial",
  customerCode: "ACME",
  status: "Active",
  email: "ops@acme.com",
  notes: "priority account",
  customerParentId: null,
  customerParentName: null,
  defaultSalesEmployeeId: null,
  defaultSalesEmployeeName: null,
  tankColorId: null,
  tankColorName: null,
  lidColorId: null,
  lidColorName: null,
  defaultPaymentTermId: null,
  defaultPaymentTermName: null,
  defaultShipViaId: null,
  defaultShipViaName: null,
  defaultOrderContactId: null,
  defaultOrderContactName: null,
  defaultBillToId: 201,
  defaultPickUpId: 202,
  defaultShipToId: 202,
  defaultNeedCollars: 1,
  defaultNeedFillers: 0,
  defaultNeedFootRings: 0,
  defaultReturnScrap: 1,
  defaultReturnBrass: 0,
  defaultValveType: "Standard",
  defaultGauges: "Dual",
  addresses: [],
  contacts: [],
};

describe("CustomerDetailPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    updateMock.mockReset();
    deleteCustomerMock.mockReset();
    listCustomersMock.mockReset();
    listAddressesMock.mockReset();
    deleteAddressMock.mockReset();
    listContactsMock.mockReset();
    deleteContactMock.mockReset();
    colorsMock.mockReset();
    paymentTermsMock.mockReset();
    shipViasMock.mockReset();
    salesPeopleMock.mockReset();

    getMock.mockResolvedValue(detail);
    updateMock.mockResolvedValue(detail);
    deleteCustomerMock.mockResolvedValue(undefined);
    listCustomersMock.mockResolvedValue({
      items: [{ id: 999, name: "Parent Co" }],
      totalCount: 1,
      page: 1,
      pageSize: 500,
    });
    listAddressesMock.mockImplementation((_: number, type?: string) => {
      if (type === "BILL_TO") {
        return Promise.resolve([
          {
            id: 201,
            type: "BILL_TO",
            addressName: "HQ Billing",
            address1: "100 Main",
            address2: null,
            city: "Houston",
            state: "TX",
            postalCode: "77001",
            country: "USA",
            customerId: 101,
            contactId: null,
            defaultSalesEmployeeId: null,
            isUsedOnOrders: false,
          },
        ]);
      }

      return Promise.resolve([
        {
          id: 202,
          type: "SHIP_TO",
          addressName: "Plant",
          address1: "200 Industrial",
          address2: null,
          city: "Houston",
          state: "TX",
          postalCode: "77002",
          country: "USA",
          customerId: 101,
          contactId: null,
          defaultSalesEmployeeId: null,
          isUsedOnOrders: false,
        },
      ]);
    });
    listContactsMock.mockResolvedValue([
      {
        id: 301,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@acme.com",
        officePhone: "555-1111",
        mobilePhone: "555-2222",
        notes: "Primary",
        customerId: 101,
      },
    ]);
    colorsMock.mockResolvedValue([{ id: 1, name: "Blue" }]);
    paymentTermsMock.mockResolvedValue([{ id: 1, name: "Net 30" }]);
    shipViasMock.mockResolvedValue([{ id: 1, name: "LPC Fleet" }]);
    salesPeopleMock.mockResolvedValue([{ id: 1, name: "Alex Sales", employeeNumber: "E100" }]);
  });

  it("loads customer detail and renders maintenance sections", async () => {
    render(
      <MemoryRouter initialEntries={["/customers/101"]}>
        <Routes>
          <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Customer Maintenance")).toBeInTheDocument();
    expect(screen.getByText("Addresses")).toBeInTheDocument();
    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getAllByText("HQ Billing").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jane Doe").length).toBeGreaterThan(0);
  });

  it("saves customer updates", async () => {
    render(
      <MemoryRouter initialEntries={["/customers/101"]}>
        <Routes>
          <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Customer Maintenance")).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("Acme Industrial"), {
      target: { value: "Acme Industrial Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalled();
    });
  });

  it("supports address and contact maintenance interactions", async () => {
    render(
      <MemoryRouter initialEntries={["/customers/101"]}>
        <Routes>
          <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Customer Maintenance")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Contact" }));
    const contactDialog = await screen.findByRole("dialog");
    expect(within(contactDialog).getByText("New Contact")).toBeInTheDocument();
    fireEvent.click(within(contactDialog).getByRole("button", { name: "Cancel" }));

    fireEvent.click(screen.getByRole("button", { name: /Delete contact Jane/i }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteContactMock).toHaveBeenCalledWith(101, 301);
    });
  });

  it("navigates back to the order page when opened from order entry", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/customers/101",
            state: { backTo: "/orders/555" },
          },
        ]}
      >
        <Routes>
          <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
          <Route path="/orders/:orderId" element={<div>Order Entry Mock</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Customer Maintenance")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to Order" }));

    expect(await screen.findByText("Order Entry Mock")).toBeInTheDocument();
  });
});
