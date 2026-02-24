import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("./pages/TransportationBoardPage", () => ({
  TransportationBoardPage: () => <div>Transportation Dispatch</div>,
}));

describe("App routing", () => {
  it("routes shipping to transportation dispatch screen", async () => {
    window.history.pushState({}, "", "/shipping");
    render(<App />);

    expect(await screen.findByText("Transportation Dispatch")).toBeInTheDocument();
  });
});

