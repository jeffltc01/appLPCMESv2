import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";

const operatorPreLoginMock = vi.fn();
const operatorLoginMock = vi.fn();
const microsoftLoginMock = vi.fn();

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    operatorPreLogin: (...args: unknown[]) => operatorPreLoginMock(...args),
    operatorLogin: (...args: unknown[]) => operatorLoginMock(...args),
    microsoftLogin: (...args: unknown[]) => microsoftLoginMock(...args),
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    operatorPreLoginMock.mockResolvedValue({
      empNo: "EMP001",
      displayName: "Operator One",
      passwordRequired: true,
      assignments: [
        {
          siteId: 1,
          siteName: "Main",
          workCenterId: 10,
          workCenterCode: "WC-10",
          workCenterName: "Blast",
        },
      ],
    });
    operatorLoginMock.mockResolvedValue({});
  });

  it("shows assignment and password after prelogin", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Operator Employee Number/i), {
      target: { value: "EMP001" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(operatorPreLoginMock).toHaveBeenCalledWith("EMP001");
    });

    expect(await screen.findByText("Welcome Operator One")).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByText("Main - WC-10")).toBeInTheDocument();
  });

  it("allows sign in without assignment when none are returned", async () => {
    operatorPreLoginMock.mockResolvedValueOnce({
      empNo: "EMP001",
      displayName: "Office User",
      passwordRequired: false,
      assignments: [],
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Operator Employee Number/i), {
      target: { value: "EMP001" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Welcome Office User")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(operatorLoginMock).toHaveBeenCalledWith({
        empNo: "EMP001",
        password: null,
        siteId: null,
        workCenterId: null,
      });
    });
  });
});
