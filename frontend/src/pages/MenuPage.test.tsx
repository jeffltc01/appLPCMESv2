import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter, MemoryRouter, useLocation } from "react-router-dom";
import { MenuPage } from "./MenuPage";

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

describe("MenuPage", () => {
  it("renders LPC-styled order entry dashboard shell", () => {
    render(
      <BrowserRouter>
        <MenuPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Order Entry Workspace")).toBeInTheDocument();
    expect(screen.getByText("Open Order Queue")).toBeInTheDocument();
    expect(screen.getByText("Order Risk Mix")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New Sales Order/i })).toBeInTheDocument();
  });

  it("navigates when top menu icon button is clicked", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Invoicing$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/invoices");
  });

  it("navigates to receiving queue from receiving button", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MenuPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Receiving$/i }));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/receiving");
  });
});
