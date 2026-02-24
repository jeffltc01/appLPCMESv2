import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProductionOrderPage } from "./ProductionOrderPage";

const ordersApiMock = vi.hoisted(() => ({
  productionDetail: vi.fn(),
  get: vi.fn(),
  attachments: vi.fn(),
  completeProduction: vi.fn(),
  attachmentDownloadUrl: vi.fn(() => "/api/orders/1/attachments/1"),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
}));

const orderLookupsApiMock = vi.hoisted(() => ({
  colors: vi.fn(),
  scrapReasons: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
  orderLookupsApi: orderLookupsApiMock,
}));

describe("ProductionOrderPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderLookupsApiMock.scrapReasons.mockResolvedValue([
      { id: 1, name: "GOOD" },
      { id: 2, name: "BAD" },
    ]);
  });

  it("shows production-specific line columns and values", async () => {
    ordersApiMock.productionDetail.mockResolvedValue({
      id: 1,
      salesOrderNo: "SO-001",
      orderStatus: "Received",
      customerName: "Acme",
      pickUpAddress: "123 Main",
      trailerNo: "TR-5",
      orderComments: "Handle with care",
      receivedDate: "2026-02-22T00:00:00",
      lines: [
        {
          id: 101,
          lineNo: 1,
          itemId: 1001,
          itemNo: "TNK-01",
          itemDescription: "Tank 1",
          quantityAsOrdered: 5,
          quantityAsReceived: 3,
          quantityAsShipped: 2,
          quantityAsScrapped: 1,
          requiresSerialNumbers: false,
          serialNumbers: [],
        },
      ],
    });

    ordersApiMock.get.mockResolvedValue({
      id: 1,
      salesOrderNo: "SO-001",
      orderDate: "2026-02-20",
      orderStatus: "Received",
      orderCreatedDate: "2026-02-20",
      readyForPickupDate: "2026-02-21T08:00:00",
      pickupScheduledDate: "2026-02-21T10:00:00",
      receivedDate: "2026-02-22T00:00:00",
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 10,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: "Handle with care",
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: 1,
      returnBrass: 0,
      lines: [
        {
          id: 101,
          lineNo: 1,
          itemId: 1001,
          itemNo: "TNK-01",
          itemDescription: "Tank 1",
          quantityAsOrdered: 5,
          unitPrice: null,
          extension: null,
          notes: null,
          colorId: 1,
          colorName: "Blue",
          lidColorId: 2,
          lidColorName: "Black",
          needCollars: true,
          needFillers: false,
          needFootRings: true,
          needDecals: true,
          valveType: "V-200",
          gauges: "G-10",
        },
      ],
    });

    ordersApiMock.attachments.mockResolvedValue([]);
    orderLookupsApiMock.colors.mockResolvedValue([{ id: 1, name: "Black" }]);

    render(
      <MemoryRouter initialEntries={["/production/1"]}>
        <Routes>
          <Route path="/production/:id" element={<ProductionOrderPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.productionDetail).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("tab", { name: /Lines \(1\)/ })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("tab", { name: /Lines \(1\)/ }));

    expect(screen.queryByText("Qty Ordered")).not.toBeInTheDocument();
    expect(screen.getByText("Tank Color")).toBeInTheDocument();
    expect(screen.getByText("Lid Color")).toBeInTheDocument();
    expect(screen.getByText("Collar")).toBeInTheDocument();
    expect(screen.getByText("Decal")).toBeInTheDocument();
    expect(screen.getByText("Filler")).toBeInTheDocument();
    expect(screen.getByText("Footring")).toBeInTheDocument();
    expect(screen.getByText("Gauge")).toBeInTheDocument();
    expect(screen.getByText("Valve")).toBeInTheDocument();

    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(screen.getByText("Black")).toBeInTheDocument();
    expect(screen.getAllByText("Yes").length).toBeGreaterThan(0);
    expect(screen.getByText("No")).toBeInTheDocument();
    expect(screen.getByText("G-10")).toBeInTheDocument();
    expect(screen.getByText("V-200")).toBeInTheDocument();
    expect(screen.getByText("Qty Shipped")).toBeInTheDocument();
    expect(screen.getByText("Qty Scrapped")).toBeInTheDocument();
  });

  it("balances shipped and scrapped for non-serial lines and saves", async () => {
    const detailPayload = {
      id: 1,
      salesOrderNo: "SO-001",
      orderStatus: "Received",
      customerName: "Acme",
      pickUpAddress: "123 Main",
      trailerNo: "TR-5",
      orderComments: "Handle with care",
      receivedDate: "2026-02-22T00:00:00",
      lines: [
        {
          id: 101,
          lineNo: 1,
          itemId: 1001,
          itemNo: "TNK-01",
          itemDescription: "Tank 1",
          quantityAsOrdered: 5,
          quantityAsReceived: 3,
          quantityAsShipped: 3,
          quantityAsScrapped: 0,
          requiresSerialNumbers: false,
          serialNumbers: [],
        },
      ],
    };
    ordersApiMock.productionDetail.mockResolvedValue(detailPayload);
    ordersApiMock.completeProduction.mockResolvedValue(detailPayload);
    ordersApiMock.get.mockResolvedValue({
      id: 1,
      salesOrderNo: "SO-001",
      orderDate: "2026-02-20",
      orderStatus: "Received",
      orderCreatedDate: "2026-02-20",
      readyForPickupDate: "2026-02-21T08:00:00",
      pickupScheduledDate: "2026-02-21T10:00:00",
      receivedDate: "2026-02-22T00:00:00",
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 10,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: "Handle with care",
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: 1,
      returnBrass: 0,
      lines: [
        {
          id: 101,
          lineNo: 1,
          itemId: 1001,
          itemNo: "TNK-01",
          itemDescription: "Tank 1",
          quantityAsOrdered: 5,
          unitPrice: null,
          extension: null,
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
        },
      ],
    });
    ordersApiMock.attachments.mockResolvedValue([]);
    orderLookupsApiMock.colors.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/production/1"]}>
        <Routes>
          <Route path="/production/:id" element={<ProductionOrderPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.productionDetail).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("tab", { name: /Lines \(1\)/ }));

    const qtyInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(qtyInputs[0], { target: { value: "2" } });

    await waitFor(() => {
      expect(qtyInputs[1]).toHaveValue(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Lines" }));
    await waitFor(() => expect(ordersApiMock.completeProduction).toHaveBeenCalled());
    expect(ordersApiMock.completeProduction).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        lines: [
          expect.objectContaining({
            lineId: 101,
            quantityAsShipped: 2,
            quantityAsScrapped: 1,
          }),
        ],
      })
    );
  });

  it("does not render a divider between a line's top and detail rows", async () => {
    ordersApiMock.productionDetail.mockResolvedValue({
      id: 1,
      salesOrderNo: "SO-001",
      orderStatus: "Received",
      customerName: "Acme",
      pickUpAddress: "123 Main",
      trailerNo: "TR-5",
      orderComments: "Handle with care",
      receivedDate: "2026-02-22T00:00:00",
      lines: [
        {
          id: 101,
          lineNo: 1,
          itemId: 1001,
          itemNo: "TNK-01",
          itemDescription: "Tank 1",
          quantityAsOrdered: 5,
          quantityAsReceived: 3,
          quantityAsShipped: 2,
          quantityAsScrapped: 1,
          requiresSerialNumbers: false,
          serialNumbers: [],
        },
      ],
    });

    ordersApiMock.get.mockResolvedValue({
      id: 1,
      salesOrderNo: "SO-001",
      orderDate: "2026-02-20",
      orderStatus: "Received",
      orderCreatedDate: "2026-02-20",
      readyForPickupDate: "2026-02-21T08:00:00",
      pickupScheduledDate: "2026-02-21T10:00:00",
      receivedDate: "2026-02-22T00:00:00",
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 10,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: "Handle with care",
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: 1,
      returnBrass: 0,
      lines: [
        {
          id: 101,
          lineNo: 1,
          itemId: 1001,
          itemNo: "TNK-01",
          itemDescription: "Tank 1",
          quantityAsOrdered: 5,
          unitPrice: null,
          extension: null,
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
        },
      ],
    });
    ordersApiMock.attachments.mockResolvedValue([]);
    orderLookupsApiMock.colors.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/production/1"]}>
        <Routes>
          <Route path="/production/:id" element={<ProductionOrderPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.productionDetail).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("tab", { name: /Lines \(1\)/ }));

    const topRow = screen.getByTestId("line-top-row-101");
    const detailRow = screen.getByTestId("line-detail-row-101");
    const topRowCells = Array.from(topRow.querySelectorAll("td"));
    const detailRowCells = Array.from(detailRow.querySelectorAll("td"));

    expect(topRowCells.length).toBeGreaterThan(0);
    expect(detailRowCells.length).toBeGreaterThan(0);

    for (const cell of topRowCells) {
      expect(cell).toHaveStyle({ borderBottomStyle: "none" });
    }
    for (const cell of detailRowCells) {
      expect(cell).toHaveStyle({ borderTopStyle: "none" });
    }
  });

  it("renders compact qty/validation fields and a wider serials field", async () => {
    ordersApiMock.productionDetail.mockResolvedValue({
      id: 1,
      salesOrderNo: "SO-001",
      orderStatus: "Received",
      customerName: "Acme",
      pickUpAddress: "123 Main",
      trailerNo: "TR-5",
      orderComments: "Handle with care",
      receivedDate: "2026-02-22T00:00:00",
      lines: [
        {
          id: 101,
          lineNo: 1,
          itemId: 1001,
          itemNo: "TNK-01",
          itemDescription: "Tank 1",
          quantityAsOrdered: 5,
          quantityAsReceived: 3,
          quantityAsShipped: 2,
          quantityAsScrapped: 1,
          requiresSerialNumbers: false,
          serialNumbers: [],
        },
      ],
    });

    ordersApiMock.get.mockResolvedValue({
      id: 1,
      salesOrderNo: "SO-001",
      orderDate: "2026-02-20",
      orderStatus: "Received",
      orderCreatedDate: "2026-02-20",
      readyForPickupDate: "2026-02-21T08:00:00",
      pickupScheduledDate: "2026-02-21T10:00:00",
      receivedDate: "2026-02-22T00:00:00",
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 10,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: "Handle with care",
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: 1,
      returnBrass: 0,
      lines: [
        {
          id: 101,
          lineNo: 1,
          itemId: 1001,
          itemNo: "TNK-01",
          itemDescription: "Tank 1",
          quantityAsOrdered: 5,
          unitPrice: null,
          extension: null,
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
        },
      ],
    });
    ordersApiMock.attachments.mockResolvedValue([]);
    orderLookupsApiMock.colors.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/production/1"]}>
        <Routes>
          <Route path="/production/:id" element={<ProductionOrderPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.productionDetail).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("tab", { name: /Lines \(1\)/ }));

    expect(screen.getByTestId("line-qty-shipped-field-101")).toBeInTheDocument();
    expect(screen.getByTestId("line-qty-scrapped-field-101")).toBeInTheDocument();
    expect(screen.queryByTestId("line-serials-field-101")).not.toBeInTheDocument();
    expect(screen.getByTestId("line-validation-field-101")).toBeInTheDocument();
  });

  it("renders serial cards, opens edit on card click, and requires confirmation before delete", async () => {
    ordersApiMock.productionDetail.mockResolvedValue({
      id: 1,
      salesOrderNo: "SO-001",
      orderStatus: "Received",
      customerName: "Acme",
      pickUpAddress: "123 Main",
      trailerNo: "TR-5",
      orderComments: "Handle with care",
      receivedDate: "2026-02-22T00:00:00",
      lines: [
        {
          id: 101,
          lineNo: 1,
          itemId: 1001,
          itemNo: "TNK-01",
          itemDescription: "Tank 1",
          quantityAsOrdered: 5,
          quantityAsReceived: 2,
          quantityAsShipped: 1,
          quantityAsScrapped: 1,
          requiresSerialNumbers: true,
          serialNumbers: [
            {
              id: 9001,
              serialNo: "SN-001",
              manufacturer: "MFG",
              manufacturingDate: "2026-02-01",
              testDate: "2026-02-02",
              scrapReasonId: 1,
              testStatus: "GOOD",
              lidColor: "Black",
              lidSize: "15",
            },
            {
              id: 9002,
              serialNo: "SN-002",
              manufacturer: "MFG",
              manufacturingDate: "2026-02-01",
              testDate: "2026-02-02",
              scrapReasonId: 2,
              testStatus: "BAD",
              lidColor: "Black",
              lidSize: "15",
            },
          ],
        },
      ],
    });

    ordersApiMock.get.mockResolvedValue({
      id: 1,
      salesOrderNo: "SO-001",
      orderDate: "2026-02-20",
      orderStatus: "Received",
      orderCreatedDate: "2026-02-20",
      readyForPickupDate: "2026-02-21T08:00:00",
      pickupScheduledDate: "2026-02-21T10:00:00",
      receivedDate: "2026-02-22T00:00:00",
      readyToShipDate: null,
      readyToInvoiceDate: null,
      customerId: 10,
      customerName: "Acme",
      siteId: 1,
      siteName: "Main",
      customerPoNo: null,
      contact: null,
      phone: null,
      comments: "Handle with care",
      priority: null,
      salesPersonId: null,
      salesPersonName: null,
      billToAddressId: null,
      pickUpAddressId: null,
      shipToAddressId: null,
      pickUpViaId: null,
      shipToViaId: null,
      paymentTermId: null,
      returnScrap: 1,
      returnBrass: 0,
      lines: [
        {
          id: 101,
          lineNo: 1,
          itemId: 1001,
          itemNo: "TNK-01",
          itemDescription: "Tank 1",
          quantityAsOrdered: 5,
          unitPrice: null,
          extension: null,
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
        },
      ],
    });
    ordersApiMock.attachments.mockResolvedValue([]);
    orderLookupsApiMock.colors.mockResolvedValue([{ id: 1, name: "Black" }]);

    render(
      <MemoryRouter initialEntries={["/production/1"]}>
        <Routes>
          <Route path="/production/:id" element={<ProductionOrderPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(ordersApiMock.productionDetail).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("tab", { name: /Lines \(1\)/ }));

    expect(screen.getByText("SN-001")).toBeInTheDocument();
    expect(screen.getByText("GOOD")).toBeInTheDocument();
    expect(screen.getByText("SN-002")).toBeInTheDocument();
    expect(screen.getByText("BAD")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("serial-card-101-0"));
    expect(await screen.findByText("Edit Serial Number")).toBeInTheDocument();
    expect(screen.getByDisplayValue("SN-001")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.click(screen.getByTestId("serial-card-delete-101-1"));
    expect(await screen.findByText("Delete Serial Number")).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete serial "SN-002"?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(screen.queryByText("SN-002")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Edit Serial Number")).not.toBeInTheDocument();
  });
});
