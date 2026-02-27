import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("loads invoice-ready queue and submits invoice", async () => {
    ordersApiMock.list.mockResolvedValue({
      items: [
        {
          id: 1,
          salesOrderNo: "SO-1",
          orderDate: "2026-02-26",
          orderStatus: "Ready to Invoice",
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
    ordersApiMock.attachments.mockResolvedValue([{ id: 11, orderId: 1 }]);
    ordersApiMock.submitInvoice.mockResolvedValue({});

    render(<InvoicingPage />);
    await waitFor(() => expect(ordersApiMock.list).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText("Final office review completed"));
    fireEvent.change(screen.getByRole("textbox", { name: "Skip reason" }), {
      target: { value: "No attachments required by customer" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Invoice" }));

    await waitFor(() => expect(ordersApiMock.submitInvoice).toHaveBeenCalled());
  });
});
