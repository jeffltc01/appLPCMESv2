import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OrderEntryPage } from "./OrderEntryPage";
import { ordersApi } from "../services/orders";
import { orderPoliciesApi } from "../services/orderPolicies";

vi.mock("../services/orders", () => ({
  ordersApi: {
    get: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    productionDetail: vi.fn().mockResolvedValue({ lines: [] }),
    advanceStatus: vi.fn(),
    applyHold: vi.fn(),
    clearHold: vi.fn(),
    attachments: vi.fn().mockResolvedValue([]),
    uploadAttachment: vi.fn(),
    updateAttachmentCategory: vi.fn(),
    deleteAttachment: vi.fn(),
    attachmentDownloadUrl: vi.fn().mockReturnValue("#"),
  },
  orderLinesApi: {
    delete: vi.fn(),
  },
  orderLookupsApi: {
    activeCustomers: vi.fn().mockResolvedValue([]),
    sites: vi.fn().mockResolvedValue([]),
    salesPeople: vi.fn().mockResolvedValue([]),
    paymentTerms: vi.fn().mockResolvedValue([]),
    shipVias: vi.fn().mockResolvedValue([]),
    customerAddresses: vi.fn().mockResolvedValue([]),
  },
  getSuggestedWorkspaceActions: vi.fn().mockReturnValue(["advanceInboundPlan"]),
  getWorkspaceActionState: vi.fn().mockReturnValue({
    enabled: true,
    targetStatus: "InboundLogisticsPlanned",
  }),
  getWorkspaceCurrentStatus: (status: string) => status,
}));

vi.mock("../services/orderPolicies", () => ({
  orderPoliciesApi: {
    listStatusReasons: vi.fn().mockResolvedValue([]),
    createStatusReason: vi.fn(),
    updateStatusReason: vi.fn(),
    deleteStatusReason: vi.fn(),
  },
}));

function renderNewOrderPage() {
  return render(
    <MemoryRouter initialEntries={["/orders/new"]}>
      <Routes>
        <Route path="/orders/:orderId" element={<OrderEntryPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderExistingOrderPage(orderId = 101) {
  return render(
    <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
      <Routes>
        <Route path="/orders/:orderId" element={<OrderEntryPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderInvoiceModeOrderPage(orderId = 101) {
  return render(
    <MemoryRouter initialEntries={[`/invoices/${orderId}`]}>
      <Routes>
        <Route path="/invoices/:orderId" element={<OrderEntryPage invoiceMode />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("OrderEntryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(orderPoliciesApi.listStatusReasons).mockResolvedValue([]);
  });

  it("renders key order entry sections from LPC layout", async () => {
    renderNewOrderPage();

    expect(await screen.findByText("Create New Sales Order")).toBeInTheDocument();
    expect(screen.getByText("Order Header")).toBeInTheDocument();
    expect(screen.getByText("Order Lines")).toBeInTheDocument();
    expect(screen.getByText("Attachments")).toBeInTheDocument();
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
    expect(screen.getByText("Validation Checklist")).toBeInTheDocument();
    expect(screen.getByText("Lifecycle Navigator")).toBeInTheDocument();
    expect(screen.getByText("Select Pickup Via")).toBeInTheDocument();
    expect(screen.getByText("Select Ship Via")).toBeInTheDocument();
    expect(screen.getByText("Select Salesperson")).toBeInTheDocument();
    expect(screen.getByText("Select Bill To Address")).toBeInTheDocument();
    expect(screen.getByText("Select Pickup Address")).toBeInTheDocument();
    expect(screen.getByText("Select Ship To Address")).toBeInTheDocument();
    expect(screen.getByTestId("blocked-advance-indicator")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Advance to PendingOrderEntryValidation/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
  });

  it("shows only the header save action", async () => {
    renderNewOrderPage();

    expect(await screen.findByRole("button", { name: "Back to Orders" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Save Draft" })).toHaveLength(1);
  });

  it("navigates back to invoice queue from invoice mode", async () => {
    vi.mocked(ordersApi.get).mockResolvedValue({
      id: 101,
      salesOrderNo: "SO-101",
      orderDate: "2026-01-01",
      orderStatus: "Ready to Invoice",
      orderLifecycleStatus: "InvoiceReady",
      orderCreatedDate: "2026-01-01T00:00:00Z",
      readyForPickupDate: null,
      pickupScheduledDate: null,
      receivedDate: null,
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 1,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: null,
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: null,
      returnBrass: null,
      lines: [],
    });

    render(
      <MemoryRouter initialEntries={["/invoices/101"]}>
        <Routes>
          <Route path="/invoices/:orderId" element={<OrderEntryPage invoiceMode />} />
          <Route path="/invoices" element={<div>Invoice Queue Route</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: "Back to Orders" }));
    expect(await screen.findByText("Invoice Queue Route")).toBeInTheDocument();
  });

  it("defaults order date to today for new orders", async () => {
    renderNewOrderPage();

    const orderDateField = (await screen.findByLabelText("Order Date *")) as HTMLInputElement;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    expect(orderDateField.value).toBe(`${year}-${month}-${day}`);
  });

  it("hides Pickup Via when Dropoff toggle is enabled", async () => {
    renderNewOrderPage();

    expect(await screen.findByText("Pickup Via")).toBeInTheDocument();
    const pickupToggle = screen.getByRole("switch", { name: "Customer Dropoff" });
    fireEvent.click(pickupToggle);

    expect(screen.queryByText("Pickup Via")).not.toBeInTheDocument();
  });

  it("hides Ship Via when outbound Pickup toggle is enabled", async () => {
    renderNewOrderPage();

    expect(await screen.findByText("Ship Via")).toBeInTheDocument();
    const pickupToggle = screen.getByRole("switch", { name: "Customer Pickup" });
    fireEvent.click(pickupToggle);

    expect(screen.queryByText("Ship Via")).not.toBeInTheDocument();
  });

  it("disables line mutation actions when order is not editable", async () => {
    vi.mocked(ordersApi.get).mockResolvedValue({
      id: 101,
      salesOrderNo: "SO-101",
      orderDate: "2026-01-01",
      orderStatus: "Ready to Invoice",
      orderCreatedDate: "2026-01-01T00:00:00Z",
      readyForPickupDate: null,
      pickupScheduledDate: null,
      receivedDate: null,
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 1,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: null,
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: null,
      returnBrass: null,
      lines: [],
    });

    renderExistingOrderPage();

    const addLineButton = await screen.findByRole("button", { name: "Add Line" });
    expect(addLineButton).toBeDisabled();
  });

  it("shows invoice serial numbers checklist validation in invoice mode when ready to invoice", async () => {
    vi.mocked(ordersApi.get).mockResolvedValue({
      id: 101,
      salesOrderNo: "SO-101",
      orderDate: "2026-01-01",
      orderStatus: "Ready to Invoice",
      orderCreatedDate: "2026-01-01T00:00:00Z",
      readyForPickupDate: null,
      pickupScheduledDate: null,
      receivedDate: null,
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 1,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: null,
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: null,
      returnBrass: null,
      lines: [
        {
          id: 1,
          lineNo: 1,
          itemId: 100,
          itemNo: "ITEM-100",
          itemDescription: "Needs serial",
          quantityAsOrdered: 1,
          quantityAsReceived: 1,
          quantityAsShipped: 1,
          quantityAsScrapped: 0,
          unitPrice: 10,
          extension: 10,
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
          requiresSerialNumbers: true,
          serialNumbers: [],
        },
      ],
    });
    vi.mocked(ordersApi.productionDetail).mockResolvedValue({
      id: 101,
      salesOrderNo: "SO-101",
      orderStatus: "Ready to Invoice",
      customerName: "Acme",
      pickUpAddress: null,
      trailerNo: null,
      orderComments: null,
      receivedDate: null,
      lines: [
        {
          id: 1,
          lineNo: 1,
          itemId: 100,
          itemNo: "ITEM-100",
          itemDescription: "Needs serial",
          quantityAsOrdered: 1,
          quantityAsReceived: 1,
          quantityAsShipped: 1,
          quantityAsScrapped: 0,
          requiresSerialNumbers: true,
          serialNumbers: [],
        },
      ],
    });

    renderInvoiceModeOrderPage();

    expect(await screen.findByText("Serial Numbers: 1 line(s) missing")).toBeInTheDocument();
  });

  it("hides customer and line checklist items in invoice mode", async () => {
    vi.mocked(ordersApi.get).mockResolvedValue({
      id: 101,
      salesOrderNo: "SO-101",
      orderDate: "2026-01-01",
      orderStatus: "Ready to Invoice",
      orderLifecycleStatus: "InvoiceReady",
      orderCreatedDate: "2026-01-01T00:00:00Z",
      readyForPickupDate: null,
      pickupScheduledDate: null,
      receivedDate: null,
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 1,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: null,
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: null,
      returnBrass: null,
      lines: [],
    });

    renderInvoiceModeOrderPage();

    await screen.findByText("Validation Checklist");
    expect(screen.queryByText("Customer selected")).not.toBeInTheDocument();
    expect(screen.queryByText("At least one line")).not.toBeInTheDocument();
  });

  it("shows serial numbers not required when no lines require serials", async () => {
    vi.mocked(ordersApi.get).mockResolvedValue({
      id: 101,
      salesOrderNo: "SO-101",
      orderDate: "2026-01-01",
      orderStatus: "Ready to Invoice",
      orderLifecycleStatus: "InvoiceReady",
      orderCreatedDate: "2026-01-01T00:00:00Z",
      readyForPickupDate: null,
      pickupScheduledDate: null,
      receivedDate: null,
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 1,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: null,
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: null,
      returnBrass: null,
      lines: [
        {
          id: 1,
          lineNo: 1,
          itemId: 100,
          itemNo: "ITEM-100",
          itemDescription: "No serial needed",
          quantityAsOrdered: 1,
          quantityAsReceived: 1,
          quantityAsShipped: 1,
          quantityAsScrapped: 0,
          unitPrice: 10,
          extension: 10,
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
          requiresSerialNumbers: false,
          serialNumbers: [],
        },
      ],
    });

    renderInvoiceModeOrderPage();

    expect(await screen.findByText("Serial Numbers: not required")).toBeInTheDocument();
    expect(screen.queryByText("Serial Numbers: unavailable")).not.toBeInTheDocument();
  });

  it("renders listed commercial and logistics fields as read-only in invoice mode", async () => {
    vi.mocked(ordersApi.get).mockResolvedValue({
      id: 101,
      salesOrderNo: "SO-101",
      orderDate: "2026-01-01",
      orderStatus: "Ready to Invoice",
      orderLifecycleStatus: "InvoiceReady",
      orderCreatedDate: "2026-01-01T00:00:00Z",
      readyForPickupDate: null,
      pickupScheduledDate: null,
      receivedDate: null,
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 1,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: null,
      priority: 3,
      salesPersonId: 9,
      salesPersonName: "Pat Seller",
      billToAddressId: null,
      pickUpAddressId: 55,
      shipToAddressId: 66,
      pickUpViaId: 77,
      shipToViaId: 88,
      paymentTermId: null,
      returnScrap: 1,
      returnBrass: 1,
      lines: [],
    });

    renderInvoiceModeOrderPage();

    expect(await screen.findByLabelText("Site *")).toBeDisabled();
    expect(screen.getByLabelText("Order Date *")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Salesperson")).toBeDisabled();
    expect(screen.getByLabelText("Priority")).toHaveAttribute("readonly");
    expect(screen.getByRole("switch", { name: "Customer Dropoff" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Customer Pickup" })).toBeDisabled();
    expect(screen.getByLabelText("Pickup Via")).toBeDisabled();
    expect(screen.getByLabelText("Ship Via")).toBeDisabled();
    expect(screen.getByLabelText("Pickup Address")).toBeDisabled();
    expect(screen.getByLabelText("Ship To Address")).toBeDisabled();
    expect(screen.getByLabelText("Return Scrap")).toBeDisabled();
    expect(screen.getByLabelText("Return Brass")).toBeDisabled();
  });

  it("enables line mutation actions in invoice mode", async () => {
    vi.mocked(ordersApi.get).mockResolvedValue({
      id: 101,
      salesOrderNo: "SO-101",
      orderDate: "2026-01-01",
      orderStatus: "Ready to Invoice",
      orderLifecycleStatus: "InvoiceReady",
      orderCreatedDate: "2026-01-01T00:00:00Z",
      readyForPickupDate: null,
      pickupScheduledDate: null,
      receivedDate: null,
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 1,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: null,
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: null,
      returnBrass: null,
      lines: [
        {
          id: 555,
          lineNo: 1,
          itemId: 11,
          itemNo: "TNK-11",
          itemDescription: "Tank 11",
          quantityAsOrdered: 1,
          quantityAsReceived: 1,
          quantityAsShipped: 0,
          quantityAsScrapped: 0,
          unitPrice: 5,
          extension: 5,
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
          requiresSerialNumbers: false,
          serialNumbers: [],
        },
      ],
    });

    renderInvoiceModeOrderPage();

    expect(await screen.findByRole("button", { name: "Add Line" })).toBeEnabled();
    expect(screen.getByLabelText("Edit line 1")).toBeEnabled();
    expect(screen.getByLabelText("Delete line 1")).toBeEnabled();
  });
});
