import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { InvoicingPage } from "./InvoicingPage";

const ordersApiMock = vi.hoisted(() => ({
  list: vi.fn(),
  attachments: vi.fn(),
  submitInvoice: vi.fn(),
}));

vi.mock("../services/orders", () => ({
  ordersApi: ordersApiMock,
}));

describe("InvoicingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads invoice-ready queue and submits invoice via wizard", async () => {
    ordersApiMock.list.mockResolvedValue({
      items: [
        {
          id: 1,
          salesOrderNo: "SO-1",
          orderDate: "2026-02-26",
          orderStatus: "Ready to Invoice",
          orderLifecycleStatus: "InvoiceReady",
          customerId: 10,
          customerName: "Acme",
          siteId: 1,
          siteName: "Main",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 2,
        },
      ],
      page: 1,
      pageSize: 200,
      totalCount: 1,
    });
    ordersApiMock.attachments.mockResolvedValue([
      {
        id: 11,
        orderId: 1,
        fileName: "PackingSlip.pdf",
        contentType: "application/pdf",
        sizeBytes: 32,
        uploadedUtc: "2026-02-27T12:00:00Z",
        uploadedByEmpNo: "EMP001",
        category: "PackingSlip",
        isInvoiceRelevant: true,
      },
    ]);
    ordersApiMock.submitInvoice.mockResolvedValue({});

    render(
      <MemoryRouter>
        <InvoicingPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(ordersApiMock.list).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText("Required paperwork is present"));
    fireEvent.click(screen.getByLabelText("Quantity and pricing reviewed"));
    fireEvent.click(screen.getByLabelText("Customer and billing details reviewed"));
    fireEvent.click(screen.getByRole("button", { name: "Continue to Attachments" }));

    await waitFor(() => expect(screen.getByText("Attachments available: 1")).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText("Send attachment email"));
    fireEvent.change(screen.getByRole("textbox", { name: "Skip reason" }), {
      target: { value: "No attachments required by customer" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to Submit" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit Invoice" }));

    await waitFor(() => expect(ordersApiMock.submitInvoice).toHaveBeenCalled());
  });
});
