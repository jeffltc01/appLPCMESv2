import { render } from "@testing-library/react";
import { OrderWorkflowWidget } from "./OrderWorkflowWidget";

describe("OrderWorkflowWidget", () => {
  it("renders workflow dates without time values", () => {
    const { container } = render(
      <OrderWorkflowWidget
        currentStatus="Received"
        dates={{
          orderCreatedDate: "2026-02-20",
          readyForPickupDate: "2026-02-21T09:45:00",
          pickupScheduledDate: "2026-02-22T15:30:00",
          receivedDate: "2026-02-23T18:00:00",
          readyToShipDate: null,
          readyToInvoiceDate: null,
        }}
      />
    );

    const text = container.textContent ?? "";
    expect(text).not.toContain("2026-02-21T09:45:00");
    expect(text).not.toContain("2026-02-22T15:30:00");
    expect(text).not.toContain("2026-02-23T18:00:00");
    expect(text).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it("allows clicking only adjacent workflow steps", () => {
    const onAdvanceStatus = vi.fn();
    const { getByText } = render(
      <OrderWorkflowWidget
        currentStatus="Received"
        onAdvanceStatus={onAdvanceStatus}
        dates={{
          orderCreatedDate: "2026-02-20",
          readyForPickupDate: "2026-02-21T09:45:00",
          pickupScheduledDate: "2026-02-22T15:30:00",
          receivedDate: "2026-02-23T18:00:00",
          readyToShipDate: null,
          readyToInvoiceDate: null,
        }}
      />
    );

    getByText("Pickup Scheduled / Awaiting Arrival").click();
    getByText("Awaiting Delivery Scheduling").click();
    getByText("Needs Order Info").click();

    expect(onAdvanceStatus).toHaveBeenCalledTimes(2);
    expect(onAdvanceStatus).toHaveBeenNthCalledWith(1, "Pickup Scheduled");
    expect(onAdvanceStatus).toHaveBeenNthCalledWith(2, "Ready to Ship");
  });

  it("shows unknown status warning when status is unsupported", () => {
    const { getByText } = render(
      <OrderWorkflowWidget
        currentStatus="Archived"
        dates={{
          orderCreatedDate: "2026-02-20",
          readyForPickupDate: null,
          pickupScheduledDate: null,
          receivedDate: null,
          readyToShipDate: null,
          readyToInvoiceDate: null,
        }}
      />
    );

    expect(getByText("Unknown status: Archived")).toBeInTheDocument();
  });
});
