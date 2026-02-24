import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProductionOrderPage } from "./ProductionOrderPage";

const ordersApiMock = vi.hoisted(() => ({
  productionDetail: vi.fn(),
  get: vi.fn(),
  attachments: vi.fn(),
  attachmentDownloadUrl: vi.fn(() => "/api/orders/1/attachments/1"),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
}));

describe("ProductionOrderPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
          isReceived: true,
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
  });
});
