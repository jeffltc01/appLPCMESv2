import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { TABLET_SETUP_STORAGE_KEY } from "../features/tabletSetupStorage";

const operatorPreLoginMock = vi.fn();
const operatorLoginMock = vi.fn();
const microsoftLoginMock = vi.fn();
const startMicrosoftLoginRedirectMock = vi.fn();
const completeMicrosoftRedirectIfPresentMock = vi.fn();

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    operatorPreLogin: (...args: unknown[]) => operatorPreLoginMock(...args),
    operatorLogin: (...args: unknown[]) => operatorLoginMock(...args),
    microsoftLogin: (...args: unknown[]) => microsoftLoginMock(...args),
  }),
}));

vi.mock("../services/microsoftAuth", () => ({
  startMicrosoftLoginRedirect: (...args: unknown[]) => startMicrosoftLoginRedirectMock(...args),
  completeMicrosoftRedirectIfPresent: (...args: unknown[]) => completeMicrosoftRedirectIfPresentMock(...args),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    operatorPreLoginMock.mockReset();
    operatorLoginMock.mockReset();
    microsoftLoginMock.mockReset();
    startMicrosoftLoginRedirectMock.mockReset();
    completeMicrosoftRedirectIfPresentMock.mockReset();
    window.localStorage.clear();

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
      roles: ["Production"],
    });
    operatorLoginMock.mockResolvedValue({});
    microsoftLoginMock.mockResolvedValue({});
    startMicrosoftLoginRedirectMock.mockResolvedValue(undefined);
    completeMicrosoftRedirectIfPresentMock.mockResolvedValue(null);
  });

  it("loads assignments after entering employee number and signs in", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Employee Number/i), {
      target: { value: "EMP001" },
    });

    await waitFor(() => {
      expect(operatorPreLoginMock).toHaveBeenCalledWith("EMP001");
    });

    expect(screen.getByText("Main - WC-10")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(operatorLoginMock).toHaveBeenCalledWith({
        empNo: "EMP001",
        password: null,
        siteId: 1,
        workCenterId: 10,
      });
    });
  });

  it("defaults assignment from saved tablet setup", async () => {
    operatorPreLoginMock.mockResolvedValueOnce({
      empNo: "EMP001",
      displayName: "Operator One",
      passwordRequired: false,
      assignments: [
        {
          siteId: 1,
          siteName: "Main",
          workCenterId: 10,
          workCenterCode: "WC-10",
          workCenterName: "Blast",
        },
        {
          siteId: 1,
          siteName: "Main",
          workCenterId: 11,
          workCenterCode: "WC-11",
          workCenterName: "Paint",
        },
      ],
      roles: ["Production"],
    });
    window.localStorage.setItem(
      TABLET_SETUP_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        siteId: 1,
        workCenterId: 11,
        workCenterCode: "WC-11",
        workCenterName: "Paint",
        operatorEmpNo: "EMP001",
        deviceId: "",
        lockOperatorToLoggedInUser: false,
        updatedAt: "2026-01-01T00:00:00Z",
      })
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Employee Number/i), {
      target: { value: "EMP001" },
    });
    await waitFor(() => {
      expect(operatorPreLoginMock).toHaveBeenCalledWith("EMP001");
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => {
      expect(operatorLoginMock).toHaveBeenCalledWith({
        empNo: "EMP001",
        password: null,
        siteId: 1,
        workCenterId: 11,
      });
    });
  });

  it("allows privileged users to change site/work center before login", async () => {
    operatorPreLoginMock.mockResolvedValueOnce({
      empNo: "EMP010",
      displayName: "Supervisor User",
      passwordRequired: false,
      assignments: [
        {
          siteId: 1,
          siteName: "Main",
          workCenterId: 10,
          workCenterCode: "WC-10",
          workCenterName: "Blast",
        },
      ],
      roles: ["Supervisor"],
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Employee Number/i), {
      target: { value: "EMP010" },
    });
    await waitFor(() => {
      expect(operatorPreLoginMock).toHaveBeenCalledWith("EMP010");
    });

    expect(screen.getByRole("combobox", { name: /Site \/ Work Center/i })).toBeEnabled();
  });

  it("keeps assignment editable when backend prelogin does not return roles", async () => {
    operatorPreLoginMock.mockResolvedValueOnce({
      empNo: "EMP001",
      displayName: "Legacy Payload User",
      passwordRequired: false,
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

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Employee Number/i), {
      target: { value: "EMP001" },
    });
    await waitFor(() => {
      expect(operatorPreLoginMock).toHaveBeenCalledWith("EMP001");
    });

    expect(screen.getByRole("combobox", { name: /Site \/ Work Center/i })).toBeEnabled();
  });

  it("requires a site/work center assignment", async () => {
    operatorPreLoginMock.mockResolvedValueOnce({
      empNo: "EMP001",
      displayName: "Office User",
      passwordRequired: false,
      assignments: [],
      roles: ["Office"],
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Employee Number/i), {
      target: { value: "EMP001" },
    });
    await waitFor(() => {
      expect(operatorPreLoginMock).toHaveBeenCalledWith("EMP001");
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Please select a site/work center assignment.")).toBeInTheDocument();
    expect(operatorLoginMock).not.toHaveBeenCalled();
  });

  it("starts microsoft redirect sign-in flow", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const microsoftButton = await screen.findByRole("button", { name: "Sign in with Microsoft" });
    await waitFor(() => {
      expect(microsoftButton).toBeEnabled();
    });

    fireEvent.click(microsoftButton);
    await waitFor(() => {
      expect(startMicrosoftLoginRedirectMock).toHaveBeenCalledTimes(1);
    });
  });
});
