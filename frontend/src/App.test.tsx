import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App routing", () => {
  it("renders placeholder module route", async () => {
    window.history.pushState({}, "", "/shipping");
    render(<App />);

    expect(await screen.findByText("Shipping")).toBeInTheDocument();
    expect(screen.getByText("This module is under development.")).toBeInTheDocument();
  });
});

