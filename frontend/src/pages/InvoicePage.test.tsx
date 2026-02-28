import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { InvoicePage } from "./InvoicePage";

const listMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../services/orders", () => ({
  ordersApi: {
    list: (...args: unknown[]) => listMock(...args),
  },
  getWorkspaceCurrentStatus: (status: string) => status,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("InvoicePage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    listMock.mockResolvedValue({
      items: [
        {
          id: 1,
          salesOrderNo: "SO-INV-1",
          orderDate: "2026-02-27",
          orderStatus: "Ready to Invoice",
          customerId: 2,
          customerName: "Acme Industrial",
          siteId: 10,
          siteName: "Houston",
          customerPoNo: null,
          contact: null,
          lineCount: 2,
          totalOrderedQuantity: 8,
          orderLifecycleStatus: "InvoiceReady",
        },
        {
          id: 2,
          salesOrderNo: "SO-DISPATCH-1",
          orderDate: "2026-02-28",
          orderStatus: "Ready to Ship",
          customerId: 3,
          customerName: "BlueLine Supply",
          siteId: 11,
          siteName: "Dallas",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 4,
          orderLifecycleStatus: "DispatchedOrPickupReleased",
        },
        {
          id: 3,
          salesOrderNo: "SO-OTHER-1",
          orderDate: "2026-02-28",
          orderStatus: "Draft",
          customerId: 4,
          customerName: "Skip Me",
          siteId: 11,
          siteName: "Dallas",
          customerPoNo: null,
          contact: null,
          lineCount: 1,
          totalOrderedQuantity: 4,
          orderLifecycleStatus: "Draft",
        },
      ],
      totalCount: 3,
      page: 1,
      pageSize: 200,
    });
  });

  it("shows only dispatched and invoice-ready orders", async () => {
    render(
      <MemoryRouter>
        <InvoicePage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Invoice Queue")).toBeInTheDocument();
    expect(screen.getByText("SO-INV-1")).toBeInTheDocument();
    expect(screen.getByText("SO-DISPATCH-1")).toBeInTheDocument();
    expect(screen.queryByText("SO-OTHER-1")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Action" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open Invoice Workspace" })).not.toBeInTheDocument();
  });

  it("opens invoice workspace when row is clicked", async () => {
    render(
      <MemoryRouter>
        <InvoicePage />
      </MemoryRouter>
    );

    await screen.findByText("SO-INV-1");
    fireEvent.click(screen.getByText("SO-INV-1"));
    expect(navigateMock).toHaveBeenCalledWith("/invoices/1");
  });
});
