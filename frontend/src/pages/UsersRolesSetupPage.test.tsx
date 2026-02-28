import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UsersRolesSetupPage } from "./UsersRolesSetupPage";

const listRolesMock = vi.fn();
const listUsersMock = vi.fn();
const sitesMock = vi.fn();

vi.mock("../services/setup", () => ({
  setupApi: {
    listRoles: (...args: unknown[]) => listRolesMock(...args),
    listUsers: (...args: unknown[]) => listUsersMock(...args),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

vi.mock("../services/orders", () => ({
  orderLookupsApi: {
    sites: (...args: unknown[]) => sitesMock(...args),
  },
}));

describe("UsersRolesSetupPage", () => {
  beforeEach(() => {
    listRolesMock.mockResolvedValue([
      {
        id: 1,
        roleName: "Admin",
        description: "System administration",
        isActive: true,
        createdUtc: "2026-02-28T00:00:00Z",
        updatedUtc: "2026-02-28T00:00:00Z",
      },
    ]);
    listUsersMock.mockResolvedValue([
      {
        id: 2,
        empNo: "EMP001",
        displayName: "Alice Operator",
        email: "alice@example.com",
        defaultSiteId: 10,
        state: "Active",
        isActive: true,
        createdUtc: "2026-02-28T00:00:00Z",
        updatedUtc: "2026-02-28T00:00:00Z",
        roles: [{ roleId: 1, roleName: "Admin", siteId: null }],
      },
    ]);
    sitesMock.mockResolvedValue([{ id: 10, name: "Houston" }]);
  });

  it("loads and renders users and roles sections", async () => {
    render(
      <MemoryRouter>
        <UsersRolesSetupPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listRolesMock).toHaveBeenCalled();
      expect(listUsersMock).toHaveBeenCalled();
      expect(sitesMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Setup - Users & Roles")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Role" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add User" })).toBeInTheDocument();
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
    expect(screen.getByText("Alice Operator")).toBeInTheDocument();
  });
});
