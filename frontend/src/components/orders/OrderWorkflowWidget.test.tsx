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
});
