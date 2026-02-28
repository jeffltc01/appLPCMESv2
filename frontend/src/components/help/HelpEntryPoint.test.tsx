import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelpEntryPoint } from "./HelpEntryPoint";
import { helpApi } from "../../services/help";

vi.mock("../../services/help", () => ({
  helpApi: {
    getTopics: vi.fn(),
  },
}));

describe("HelpEntryPoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the help dialog and renders returned topic", async () => {
    vi.mocked(helpApi.getTopics).mockResolvedValue([
      {
        topicId: "order-list-overview",
        title: "Find and open sales orders",
        appliesToRoles: ["Office"],
        appliesToPages: ["/orders"],
        purpose: "Use this page to find orders.",
        whenToUse: ["Locate orders quickly"],
        prerequisites: ["Signed in"],
        stepByStepActions: ["Search", "Open row"],
        expectedResult: "Order opens",
        commonErrorsAndRecovery: [
          {
            error: "Unable to load orders.",
            cause: "Network issue",
            recovery: ["Retry"],
          },
        ],
        relatedTopics: [],
        lastValidatedOnUtc: "2026-02-28T00:00:00Z",
        validatedBy: "QA",
      },
    ]);

    render(<HelpEntryPoint route="/orders" />);

    fireEvent.click(screen.getByRole("button", { name: "Help" }));

    expect(await screen.findByText("Use this page to find orders.")).toBeInTheDocument();
  });

  it("shows empty fallback when no topics exist", async () => {
    vi.mocked(helpApi.getTopics).mockResolvedValue([]);

    render(<HelpEntryPoint route="/orders" />);

    fireEvent.click(screen.getByRole("button", { name: "Help" }));

    expect(
      await screen.findByText(
        "No help topics are configured for this screen. Escalate through your site MES support lead."
      )
    ).toBeInTheDocument();
  });

  it("shows non-blocking fallback when API fails", async () => {
    vi.mocked(helpApi.getTopics).mockRejectedValue(new Error("boom"));

    render(<HelpEntryPoint route="/orders" />);

    fireEvent.click(screen.getByRole("button", { name: "Help" }));

    expect(
      await screen.findByText("Help is currently unavailable. You can continue your workflow and retry.")
    ).toBeInTheDocument();
  });

  it("passes selected role and context to help API", async () => {
    vi.mocked(helpApi.getTopics).mockResolvedValue([]);

    render(<HelpEntryPoint route="/orders/:orderId" context="InProduction" role="Production" />);

    fireEvent.click(screen.getByRole("button", { name: "Help" }));

    await waitFor(() =>
      expect(helpApi.getTopics).toHaveBeenCalledWith({
        route: "/orders/:orderId",
        context: "InProduction",
        role: "Production",
      })
    );
  });
});
