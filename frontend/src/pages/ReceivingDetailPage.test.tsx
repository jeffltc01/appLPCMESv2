import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ReceivingDetailPage } from "./ReceivingDetailPage";

const receivingDetailMock = vi.fn();
const completeReceivingMock = vi.fn();
const orderItemsMock = vi.fn();
const productLinesMock = vi.fn();

vi.mock("../services/orders", () => ({
  ordersApi: {
    receivingDetail: (...args: unknown[]) => receivingDetailMock(...args),
    completeReceiving: (...args: unknown[]) => completeReceivingMock(...args),
  },
  orderLookupsApi: {
    items: (...args: unknown[]) => orderItemsMock(...args),
    productLines: (...args: unknown[]) => productLinesMock(...args),
  },
}));

describe("ReceivingDetailPage", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  beforeEach(() => {
    productLinesMock.mockResolvedValue(["High Pressure", "Refurb"]);
    orderItemsMock.mockResolvedValue([
      { id: 2001, itemNo: "CYL-100", itemDescription: "Cylinder 100lb", productLine: "High Pressure" },
      { id: 2002, itemNo: "CYL-200", itemDescription: "Cylinder 200lb", productLine: "Refurb" },
      { id: 2003, itemNo: "CYL-300", itemDescription: "Cylinder 300lb", productLine: "Refurb" },
    ]);
    receivingDetailMock.mockResolvedValue({
      id: 22,
      salesOrderNo: "SO-RCV-22",
      orderStatus: "Pickup Scheduled",
      customerName: "Acme Industrial",
      pickUpAddress: "Acme Industrial Warehouse",
      pickUpAddressStreet: "123 Main",
      trailerNo: "TR-22",
      orderComments: "Handle with care. Confirm all valves are capped.",
      receivedDate: "2026-02-27",
      lines: [
        {
          id: 1001,
          lineNo: 1,
          itemId: 2001,
          itemNo: "CYL-100",
          itemDescription: "Cylinder 100lb",
          productLine: "High Pressure",
          quantityAsOrdered: 10,
          quantityAsReceived: 0,
          isReceived: false,
          receiptStatus: "Unknown",
        },
        {
          id: 1002,
          lineNo: 2,
          itemId: 2002,
          itemNo: "CYL-200",
          itemDescription: "Cylinder 200lb",
          productLine: "Refurb",
          quantityAsOrdered: 5,
          quantityAsReceived: 1,
          isReceived: true,
          receiptStatus: "Received",
        },
      ],
    });
    completeReceivingMock.mockResolvedValue({});
  });

  function renderPage() {
    render(
      <MemoryRouter initialEntries={["/receiving/22"]}>
        <Routes>
          <Route path="/receiving/:orderId" element={<ReceivingDetailPage />} />
          <Route path="/receiving" element={<div>Receiving Queue Route</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("shows line list and selected line details", async () => {
    renderPage();

    expect(await screen.findByText("Receiving Detail")).toBeInTheDocument();
    expect(productLinesMock).toHaveBeenCalledWith("OrderReceiving");
    expect(screen.getByText("Order Number")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByText("Order Notes")).toBeInTheDocument();
    expect(screen.getByLabelText("Received Date")).toBeInTheDocument();
    expect(screen.getAllByText("SO-RCV-22").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Acme Industrial").length).toBeGreaterThan(0);
    expect(screen.getByText("123 Main")).toBeInTheDocument();
    expect(screen.queryByText("Acme Industrial Warehouse")).not.toBeInTheDocument();
    expect(screen.getByText("Handle with care. Confirm all valves are capped.")).toBeInTheDocument();
    expect(screen.getAllByText("High Pressure - CYL-100 - Cylinder 100lb").length).toBe(2);
    expect(screen.getByText("Refurb - CYL-200 - Cylinder 200lb")).toBeInTheDocument();
    expect(screen.getByText("Qty Ordered: 10")).toBeInTheDocument();
    expect(screen.getByLabelText("Receipt status unknown")).toBeInTheDocument();
    expect(screen.getByLabelText("Line received")).toBeInTheDocument();
  });

  it("saves updates and returns to queue route", async () => {
    renderPage();

    await screen.findByText("Qty Ordered: 10");
    fireEvent.click(screen.getByText("Refurb - CYL-200 - Cylinder 200lb"));

    const qtyInput = screen.getByLabelText("Quantity As Received");
    fireEvent.change(qtyInput, { target: { value: "3" } });

    fireEvent.click(screen.getByRole("button", { name: "Complete Receiving" }));

    await waitFor(() => {
      expect(completeReceivingMock).toHaveBeenCalled();
    });

    expect(completeReceivingMock).toHaveBeenCalledWith(
      22,
      expect.objectContaining({
        receivedDate: "2026-02-27",
        lines: expect.arrayContaining([
          expect.objectContaining({
            lineId: 1002,
            receiptStatus: "Received",
          }),
        ]),
      })
    );

    await screen.findByText("Receiving Queue Route");
  });

  it("sets quantity received to ordered when toggling line to received from zero", async () => {
    renderPage();

    await screen.findByText("Qty Ordered: 10");
    fireEvent.click(screen.getByLabelText("Receipt status unknown"));

    expect(screen.getByText("Qty Received: 10")).toBeInTheDocument();
    const qtyInput = screen.getByLabelText("Quantity As Received") as HTMLInputElement;
    expect(qtyInput.value).toBe("10");
  });

  it("shows keypad on non-mobile widths and applies quantity on accept", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("min-width: 640px"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    renderPage();

    await screen.findByText("Qty Ordered: 10");
    fireEvent.click(screen.getByText("Refurb - CYL-200 - Cylinder 200lb"));
    const qtyInput = screen.getByLabelText("Quantity As Received") as HTMLInputElement;
    expect(qtyInput.value).toBe("1");
    expect(screen.queryByRole("group", { name: "Tablet quantity keypad" })).not.toBeInTheDocument();

    fireEvent.focus(qtyInput);
    expect(screen.getByRole("group", { name: "Tablet quantity keypad" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    fireEvent.click(screen.getByRole("button", { name: "3" }));

    expect(qtyInput.value).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(qtyInput.value).toBe("123");
    expect(screen.queryByRole("group", { name: "Tablet quantity keypad" })).not.toBeInTheDocument();
  });

  it("hides keypad on narrow mobile widths", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: !query.includes("min-width: 640px"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    renderPage();

    await screen.findByText("Qty Ordered: 10");
    expect(screen.queryByRole("group", { name: "Tablet quantity keypad" })).not.toBeInTheDocument();
  });

  it("clamps quantity as received to max 1000", async () => {
    renderPage();

    await screen.findByText("Qty Ordered: 10");
    const qtyInput = screen.getByLabelText("Quantity As Received") as HTMLInputElement;
    fireEvent.change(qtyInput, { target: { value: "1500" } });

    expect(qtyInput.value).toBe("1000");
  });

  it("adds a new receiving line and submits it in addedLines payload", async () => {
    renderPage();

    await screen.findByText("Qty Ordered: 10");
    fireEvent.click(screen.getByRole("button", { name: "New Line" }));

    fireEvent.click(screen.getByRole("button", { name: "Select Item" }));
    fireEvent.click(screen.getByRole("button", { name: "Refurb" }));
    fireEvent.change(screen.getByLabelText("Search items"), { target: { value: "CYL-300" } });
    fireEvent.click(screen.getByRole("button", { name: "CYL-300 - Cylinder 300lb Refurb" }));

    const newQtyInput = screen.getByLabelText("Quantity As Received");
    fireEvent.change(newQtyInput, { target: { value: "4" } });
    await waitFor(() => {
      expect(screen.getByText("Refurb - CYL-300 - Cylinder 300lb")).toBeInTheDocument();
    });
    expect(screen.getByText("Qty Received: 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Complete Receiving" }));

    await waitFor(() => {
      expect(completeReceivingMock).toHaveBeenCalled();
    });

    expect(completeReceivingMock).toHaveBeenCalledWith(
      22,
      expect.objectContaining({
        addedLines: [{ itemId: 2003, quantityAsReceived: 4 }],
      })
    );
  });

  it("auto adds line when item is selected after qty is already entered", async () => {
    renderPage();

    await screen.findByText("Qty Ordered: 10");
    fireEvent.click(screen.getByRole("button", { name: "New Line" }));

    const newQtyInput = screen.getByLabelText("Quantity As Received");
    fireEvent.change(newQtyInput, { target: { value: "6" } });

    fireEvent.click(screen.getByRole("button", { name: "Select Item" }));
    fireEvent.click(screen.getByRole("button", { name: "Refurb" }));
    fireEvent.change(screen.getByLabelText("Search items"), { target: { value: "CYL-200" } });
    fireEvent.click(screen.getByRole("button", { name: "CYL-200 - Cylinder 200lb Refurb" }));

    await waitFor(() => {
      expect(screen.getAllByText("Refurb - CYL-200 - Cylinder 200lb").length).toBeGreaterThan(1);
    });
    expect(screen.getByText("Qty Received: 6")).toBeInTheDocument();
  });

  it("filters item choices by selected product line", async () => {
    renderPage();

    await screen.findByText("Qty Ordered: 10");
    fireEvent.click(screen.getByRole("button", { name: "New Line" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Item" }));

    expect(screen.getByRole("button", { name: "CYL-100 - Cylinder 100lb High Pressure" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CYL-200 - Cylinder 200lb Refurb" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refurb" }));

    expect(screen.queryByRole("button", { name: "CYL-100 - Cylinder 100lb High Pressure" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CYL-200 - Cylinder 200lb Refurb" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CYL-300 - Cylinder 300lb Refurb" })).toBeInTheDocument();
  });
});
