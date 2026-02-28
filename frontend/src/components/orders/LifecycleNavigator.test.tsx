import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LifecycleNavigator } from "./LifecycleNavigator";

describe("LifecycleNavigator", () => {
  it("renders overlay metadata and blocks progression when overlay is active", () => {
    render(
      <LifecycleNavigator
        currentStatus="InboundLogisticsPlanned"
        holdOverlay="OnHoldCustomer"
        statusReasonCode="CustomerNotReadyForPickup"
        statusOwnerRole="Transportation"
        statusNote="Customer asked for tomorrow callback."
        onClearOverlay={vi.fn()}
      />
    );

    expect(screen.getAllByText("On Hold: Customer").length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getByRole("button", {
        name: /Open overlay details for On Hold: Customer/i,
      })
    );
    expect(screen.getAllByText(/Owner: Transportation/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Reason: CustomerNotReadyForPickup/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Forward transitions are blocked/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Advance to/ })).not.toBeInTheDocument();
  });

  it("advances to the next status when not blocked", () => {
    const onAdvanceStatus = vi.fn();
    render(
      <LifecycleNavigator
        currentStatus="Draft"
        canAdvance
        onAdvanceStatus={onAdvanceStatus}
      />
    );

    expect(screen.queryByText(/through order lifecycle/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Advance to InboundLogisticsPlanned" }));
    expect(onAdvanceStatus).toHaveBeenCalledWith("InboundLogisticsPlanned");
  });

  it("submits apply overlay callback payload", async () => {
    const onApplyOverlay = vi.fn();
    render(
      <LifecycleNavigator
        currentStatus="InboundLogisticsPlanned"
        onApplyOverlay={onApplyOverlay}
        actingRole="Office"
        actingEmpNo="EMP001"
        overlayReasonOptions={[
          {
            id: 10,
            overlayType: "OnHoldQuality",
            codeName: "QualityInspectionOpen",
            updatedUtc: "2026-01-01T00:00:00Z",
            updatedByEmpNo: "SYSTEM",
          },
        ]}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Edit overlay on bottom current stage/i,
      })
    );
    fireEvent.change(screen.getByLabelText("Overlay type"), {
      target: { value: "OnHoldQuality" },
    });
    fireEvent.change(screen.getByLabelText("Reason code"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply Overlay" }));

    await waitFor(() => {
      expect(onApplyOverlay).toHaveBeenCalledTimes(1);
      expect(onApplyOverlay).toHaveBeenCalledWith(
        expect.objectContaining({
          holdOverlay: "OnHoldQuality",
          reasonCode: "QualityInspectionOpen",
          actingRole: "Office",
          appliedByEmpNo: "EMP001",
        })
      );
    });
  });

  it("submits clear overlay callback payload", async () => {
    const onClearOverlay = vi.fn();
    render(
      <LifecycleNavigator
        currentStatus="InboundLogisticsPlanned"
        holdOverlay="OnHoldQuality"
        statusReasonCode="QAHold"
        statusOwnerRole="Quality"
        onClearOverlay={onClearOverlay}
        actingRole="Supervisor"
        actingEmpNo="EMP777"
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Open overlay details for On Hold: Quality/i,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear Overlay" }));
    await waitFor(() => {
      expect(onClearOverlay).toHaveBeenCalledWith(
        expect.objectContaining({
          actingRole: "Supervisor",
          clearedByEmpNo: "EMP777",
        })
      );
    });
  });
});
