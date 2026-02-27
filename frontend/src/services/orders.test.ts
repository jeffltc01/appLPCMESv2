import { getWorkspaceActionState } from "./orders";

describe("getWorkspaceActionState", () => {
  it("blocks disallowed role actions when override is off", () => {
    const state = getWorkspaceActionState(
      "Receiving",
      "openInvoiceWizard",
      "InvoiceReady",
      false,
      false
    );

    expect(state.enabled).toBe(false);
    expect(state.reason).toContain("Role");
  });

  it("allows skipping guardrails when override is on", () => {
    const state = getWorkspaceActionState(
      "Receiving",
      "openInvoiceWizard",
      "InvoiceReady",
      true,
      true
    );

    expect(state.enabled).toBe(true);
  });

  it("blocks non-adjacent transitions in guided mode", () => {
    const state = getWorkspaceActionState(
      "Admin",
      "markDispatchedOrReleased",
      "Draft",
      false,
      false
    );

    expect(state.enabled).toBe(false);
    expect(state.reason).toContain("not valid");
  });

  it("blocks transportation attachment upload action", () => {
    const state = getWorkspaceActionState(
      "Transportation",
      "uploadAttachment",
      "InboundLogisticsPlanned",
      false,
      false
    );

    expect(state.enabled).toBe(false);
    expect(state.reason).toContain("Role");
  });
});
