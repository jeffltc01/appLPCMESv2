import { useEffect, useMemo, useState } from "react";
import {
  Body1,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title1,
  Title3,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../services/api";
import { orderLookupsApi } from "../services/orders";
import { setupApi } from "../services/setup";
import type {
  AppRole,
  AppRoleUpsert,
  AppUser,
  AppUserRoleAssignmentUpsert,
  AppUserUpsert,
} from "../types/setup";
import type { Lookup } from "../types/customer";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  main: {
    display: "grid",
    gridTemplateRows: "44px 56px minmax(0, 1fr)",
    minWidth: 0,
  },
  utilityBar: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: "0 24px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e8e8e8",
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
  },
  headerBar: {
    backgroundColor: "#123046",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  headerActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  content: {
    padding: "16px 20px",
    overflow: "auto",
  },
  contentStack: {
    display: "grid",
    gap: tokens.spacingVerticalL,
  },
  section: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  form: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
  roleAssignmentGrid: {
    display: "grid",
    gap: tokens.spacingVerticalS,
  },
  roleAssignmentRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: tokens.spacingHorizontalS,
    alignItems: "end",
  },
  rolesTableContainer: {
    overflow: "auto",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  rolesGridHeaderRow: {
    display: "grid",
    gridTemplateColumns: "28% 42% 10% 20%",
    width: "100%",
    position: "sticky",
    top: 0,
    zIndex: 1,
    alignItems: "center",
    borderBottom: "1px solid #123046",
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#123046",
    minWidth: "900px",
  },
  rolesGridBody: {
    minWidth: "900px",
  },
  rolesGridBodyRow: {
    display: "grid",
    gridTemplateColumns: "28% 42% 10% 20%",
    width: "100%",
    alignItems: "start",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  rolesGridCell: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    minWidth: 0,
  },
  roleNameColumn: {
    width: "100%",
  },
  roleDescriptionColumn: {
    width: "100%",
  },
  roleActiveColumn: {
    width: "100%",
  },
  roleActionsColumn: {
    width: "100%",
  },
  usersTableContainer: {
    overflow: "auto",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  usersGridHeaderRow: {
    display: "grid",
    gridTemplateColumns: "12% 18% 20% 12% 23% 15%",
    width: "100%",
    position: "sticky",
    top: 0,
    zIndex: 1,
    alignItems: "center",
    borderBottom: "1px solid #123046",
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#123046",
    minWidth: "1100px",
  },
  usersGridBody: {
    minWidth: "1100px",
  },
  usersGridBodyRow: {
    display: "grid",
    gridTemplateColumns: "12% 18% 20% 12% 23% 15%",
    width: "100%",
    alignItems: "start",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  usersGridCell: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    minWidth: 0,
  },
  empNoColumn: {
    width: "100%",
  },
  displayNameColumn: {
    width: "100%",
  },
  emailColumn: {
    width: "100%",
  },
  stateColumn: {
    width: "100%",
  },
  rolesColumn: {
    width: "100%",
  },
  userActionsColumn: {
    width: "100%",
  },
});

type UserState = "Active" | "Inactive" | "Locked";
type SetupPageMode = "both" | "users" | "roles";

interface RoleFormState {
  roleName: string;
  description: string;
  isActive: boolean;
}

interface UserRoleFormState {
  roleId: string;
}

interface UserFormState {
  empNo: string;
  displayName: string;
  email: string;
  operatorPassword: string;
  clearOperatorPassword: boolean;
  hasOperatorPassword: boolean;
  defaultSiteId: string;
  state: UserState;
  isActive: boolean;
  roles: UserRoleFormState[];
}

const EMPTY_ROLE_FORM: RoleFormState = {
  roleName: "",
  description: "",
  isActive: true,
};

const EMPTY_USER_FORM: UserFormState = {
  empNo: "",
  displayName: "",
  email: "",
  operatorPassword: "",
  clearOperatorPassword: false,
  hasOperatorPassword: false,
  defaultSiteId: "",
  state: "Active",
  isActive: true,
  roles: [],
};

const EMPTY_ROLE_ASSIGNMENT: UserRoleFormState = {
  roleId: "",
};

interface UsersRolesSetupPageProps {
  mode?: SetupPageMode;
}

export function UsersRolesSetupPage({ mode = "both" }: UsersRolesSetupPageProps) {
  const styles = useStyles();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [sites, setSites] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormState>(EMPTY_ROLE_FORM);
  const [roleSaving, setRoleSaving] = useState(false);

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(EMPTY_USER_FORM);
  const [userSaving, setUserSaving] = useState(false);

  const roleNameById = useMemo(
    () => new Map(roles.map((role) => [role.id, role.roleName])),
    [roles]
  );
  const siteNameById = useMemo(
    () => new Map(sites.map((site) => [site.id, site.name])),
    [sites]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const shouldLoadUsers = mode !== "roles";
      const shouldLoadSites = mode !== "roles";
      const [roleRows, userRows, siteLookups] = await Promise.all([
        setupApi.listRoles(),
        shouldLoadUsers ? setupApi.listUsers() : Promise.resolve([]),
        shouldLoadSites ? orderLookupsApi.sites() : Promise.resolve([]),
      ]);
      setRoles(roleRows);
      setUsers(userRows);
      setSites(siteLookups);
    } catch {
      setError("Failed to load users and roles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm(EMPTY_ROLE_FORM);
    setRoleDialogOpen(true);
  };

  const openEditRole = (role: AppRole) => {
    setEditingRole(role);
    setRoleForm({
      roleName: role.roleName,
      description: role.description ?? "",
      isActive: role.isActive,
    });
    setRoleDialogOpen(true);
  };

  const saveRole = async () => {
    if (!roleForm.roleName.trim()) {
      setError("Role Name is required.");
      return;
    }

    setRoleSaving(true);
    setError(null);
    try {
      const payload: AppRoleUpsert = {
        roleName: roleForm.roleName.trim(),
        description: roleForm.description.trim() || null,
        isActive: roleForm.isActive,
      };
      if (editingRole) {
        await setupApi.updateRole(editingRole.id, payload);
      } else {
        await setupApi.createRole(payload);
      }
      setRoleDialogOpen(false);
      await load();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to save role.");
    } finally {
      setRoleSaving(false);
    }
  };

  const removeRole = async (role: AppRole) => {
    if (!window.confirm(`Delete role '${role.roleName}'?`)) return;
    setError(null);
    try {
      await setupApi.deleteRole(role.id);
      await load();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to delete role.");
    }
  };

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm(EMPTY_USER_FORM);
    setUserDialogOpen(true);
  };

  const openEditUser = (user: AppUser) => {
    setEditingUser(user);
    setUserForm({
      empNo: user.empNo ?? "",
      displayName: user.displayName,
      email: user.email ?? "",
      operatorPassword: "",
      clearOperatorPassword: false,
      hasOperatorPassword: user.hasOperatorPassword,
      defaultSiteId: user.defaultSiteId ? String(user.defaultSiteId) : "",
      state: user.state,
      isActive: user.isActive,
      roles: user.roles.map((role) => ({
        roleId: String(role.roleId),
      })),
    });
    setUserDialogOpen(true);
  };

  const addRoleAssignment = () => {
    setUserForm((prev) => ({ ...prev, roles: [...prev.roles, { ...EMPTY_ROLE_ASSIGNMENT }] }));
  };

  const updateRoleAssignment = (index: number, patch: Partial<UserRoleFormState>) => {
    setUserForm((prev) => ({
      ...prev,
      roles: prev.roles.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry
      ),
    }));
  };

  const removeRoleAssignment = (index: number) => {
    setUserForm((prev) => ({
      ...prev,
      roles: prev.roles.filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const saveUser = async () => {
    if (!userForm.displayName.trim()) {
      setError("Display Name is required.");
      return;
    }

    const invalidRoleAssignment = userForm.roles.some((entry) => !entry.roleId);
    if (invalidRoleAssignment) {
      setError("Each role assignment must include a role.");
      return;
    }

    const roleAssignmentKeys = userForm.roles.map((entry) => entry.roleId);
    const hasDuplicates = new Set(roleAssignmentKeys).size !== roleAssignmentKeys.length;
    if (hasDuplicates) {
      setError("Role assignments must be unique.");
      return;
    }

    setUserSaving(true);
    setError(null);
    try {
      const roleAssignments: AppUserRoleAssignmentUpsert[] = userForm.roles.map((entry) => ({
        roleId: Number(entry.roleId),
      }));

      const payload: AppUserUpsert = {
        empNo: userForm.empNo.trim() || null,
        displayName: userForm.displayName.trim(),
        email: userForm.email.trim() || null,
        operatorPassword: userForm.operatorPassword.trim() || null,
        clearOperatorPassword: userForm.clearOperatorPassword,
        defaultSiteId: userForm.defaultSiteId ? Number(userForm.defaultSiteId) : null,
        state: userForm.state,
        isActive: userForm.isActive,
        roles: roleAssignments,
      };

      if (editingUser) {
        await setupApi.updateUser(editingUser.id, payload);
      } else {
        await setupApi.createUser(payload);
      }
      setUserDialogOpen(false);
      await load();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to save user.");
    } finally {
      setUserSaving(false);
    }
  };

  const removeUser = async (user: AppUser) => {
    if (!window.confirm(`Delete user '${user.displayName}'?`)) return;
    setError(null);
    try {
      await setupApi.deleteUser(user.id);
      await load();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to delete user.");
    }
  };

  const showRolesSection = mode !== "users";
  const showUsersSection = mode !== "roles";
  const pageTitle =
    mode === "users"
      ? "Setup - Users"
      : mode === "roles"
      ? "Setup - Roles"
      : "Setup - Users & Roles";

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.utilityBar}>
          <span>Order Analyst</span>
          <span>Site: Houston</span>
        </div>

        <header className={styles.headerBar}>
          <Title1 style={{ color: "#ffffff" }}>{pageTitle}</Title1>
          <div className={styles.headerActions}>
            <Button appearance="secondary" onClick={() => navigate("/")}>
              Home
            </Button>
            {mode === "roles" ? (
              <Button appearance="primary" onClick={openCreateRole}>
                Add Role
              </Button>
            ) : null}
            {mode === "users" ? (
              <Button appearance="primary" onClick={openCreateUser}>
                Add User
              </Button>
            ) : null}
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.contentStack}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}

            {showRolesSection ? (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Title3>Roles</Title3>
                  {mode !== "roles" ? (
                    <Button appearance="primary" onClick={openCreateRole}>
                      Add Role
                    </Button>
                  ) : null}
                </div>
                {loading ? (
                  <Body1>Loading...</Body1>
                ) : (
                  <div className={styles.rolesTableContainer}>
                    <div className={styles.rolesGridHeaderRow}>
                      <div className={`${styles.rolesGridCell} ${styles.roleNameColumn}`}>Role Name</div>
                      <div className={`${styles.rolesGridCell} ${styles.roleDescriptionColumn}`}>Description</div>
                      <div className={`${styles.rolesGridCell} ${styles.roleActiveColumn}`}>Active</div>
                      <div className={`${styles.rolesGridCell} ${styles.roleActionsColumn}`}>Actions</div>
                    </div>
                    <div className={styles.rolesGridBody}>
                      {roles.map((role) => (
                        <div key={role.id} className={styles.rolesGridBodyRow}>
                          <div className={`${styles.rolesGridCell} ${styles.roleNameColumn}`}>{role.roleName}</div>
                          <div className={`${styles.rolesGridCell} ${styles.roleDescriptionColumn}`}>
                            {role.description ?? "-"}
                          </div>
                          <div className={`${styles.rolesGridCell} ${styles.roleActiveColumn}`}>
                            {role.isActive ? "Yes" : "No"}
                          </div>
                          <div className={`${styles.rolesGridCell} ${styles.roleActionsColumn}`}>
                            <div className={styles.actions}>
                              <Button appearance="secondary" onClick={() => openEditRole(role)}>
                                Edit
                              </Button>
                              <Button appearance="secondary" onClick={() => void removeRole(role)}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {roles.length === 0 ? (
                        <div className={styles.rolesGridBodyRow}>
                          <div className={`${styles.rolesGridCell} ${styles.roleNameColumn}`}>-</div>
                          <div className={`${styles.rolesGridCell} ${styles.roleDescriptionColumn}`}>
                            No roles found.
                          </div>
                          <div className={`${styles.rolesGridCell} ${styles.roleActiveColumn}`}>-</div>
                          <div className={`${styles.rolesGridCell} ${styles.roleActionsColumn}`}>-</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </section>
            ) : null}

            {showUsersSection ? (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Title3>Users</Title3>
                </div>
                {loading ? (
                  <Body1>Loading...</Body1>
                ) : (
                  <div className={styles.usersTableContainer}>
                    <div className={styles.usersGridHeaderRow}>
                      <div className={`${styles.usersGridCell} ${styles.empNoColumn}`}>Emp No</div>
                      <div className={`${styles.usersGridCell} ${styles.displayNameColumn}`}>Display Name</div>
                      <div className={`${styles.usersGridCell} ${styles.emailColumn}`}>Email</div>
                      <div className={`${styles.usersGridCell} ${styles.stateColumn}`}>State</div>
                      <div className={`${styles.usersGridCell} ${styles.rolesColumn}`}>Roles</div>
                      <div className={`${styles.usersGridCell} ${styles.userActionsColumn}`}>Actions</div>
                    </div>
                    <div className={styles.usersGridBody}>
                      {users.map((user) => (
                        <div key={user.id} className={styles.usersGridBodyRow}>
                          <div className={`${styles.usersGridCell} ${styles.empNoColumn}`}>{user.empNo ?? "-"}</div>
                          <div className={`${styles.usersGridCell} ${styles.displayNameColumn}`}>
                            {user.displayName}
                          </div>
                          <div className={`${styles.usersGridCell} ${styles.emailColumn}`}>{user.email ?? "-"}</div>
                          <div className={`${styles.usersGridCell} ${styles.stateColumn}`}>{user.state}</div>
                          <div className={`${styles.usersGridCell} ${styles.rolesColumn}`}>
                            {user.roles.map((role) => role.roleName).join(", ") || "-"}
                          </div>
                          <div className={`${styles.usersGridCell} ${styles.userActionsColumn}`}>
                            <div className={styles.actions}>
                              <Button appearance="secondary" onClick={() => openEditUser(user)}>
                                Edit
                              </Button>
                              <Button appearance="secondary" onClick={() => void removeUser(user)}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {users.length === 0 ? (
                        <div className={styles.usersGridBodyRow}>
                          <div className={`${styles.usersGridCell} ${styles.empNoColumn}`}>-</div>
                          <div className={`${styles.usersGridCell} ${styles.displayNameColumn}`}>
                            No users found.
                          </div>
                          <div className={`${styles.usersGridCell} ${styles.emailColumn}`}>-</div>
                          <div className={`${styles.usersGridCell} ${styles.stateColumn}`}>-</div>
                          <div className={`${styles.usersGridCell} ${styles.rolesColumn}`}>-</div>
                          <div className={`${styles.usersGridCell} ${styles.userActionsColumn}`}>-</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </section>
            ) : null}
          </div>
        </section>
      </main>

      <Dialog open={roleDialogOpen} onOpenChange={(_, data) => setRoleDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <Field label="Role Name" required>
                  <Input
                    value={roleForm.roleName}
                    onChange={(_, d) => setRoleForm((prev) => ({ ...prev, roleName: d.value }))}
                  />
                </Field>
                <Field label="Description">
                  <Input
                    value={roleForm.description}
                    onChange={(_, d) => setRoleForm((prev) => ({ ...prev, description: d.value }))}
                  />
                </Field>
                <Checkbox
                  label="Active"
                  checked={roleForm.isActive}
                  onChange={(_, d) => setRoleForm((prev) => ({ ...prev, isActive: Boolean(d.checked) }))}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={() => void saveRole()} disabled={roleSaving}>
                {roleSaving ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={userDialogOpen} onOpenChange={(_, data) => setUserDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <div className={styles.formRow}>
                  <Field label="Emp No">
                    <Input
                      value={userForm.empNo}
                      onChange={(_, d) => setUserForm((prev) => ({ ...prev, empNo: d.value }))}
                    />
                  </Field>
                  <Field label="Display Name" required>
                    <Input
                      value={userForm.displayName}
                      onChange={(_, d) => setUserForm((prev) => ({ ...prev, displayName: d.value }))}
                    />
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="Email">
                    <Input
                      value={userForm.email}
                      onChange={(_, d) => setUserForm((prev) => ({ ...prev, email: d.value }))}
                    />
                  </Field>
                  <Field label="Operator Password (optional)">
                    <Input
                      type="password"
                      value={userForm.operatorPassword}
                      onChange={(_, d) =>
                        setUserForm((prev) => ({ ...prev, operatorPassword: d.value }))
                      }
                    />
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="Default Site">
                    <Dropdown
                      value={
                        userForm.defaultSiteId
                          ? (siteNameById.get(Number(userForm.defaultSiteId)) ?? "")
                          : "Global"
                      }
                      selectedOptions={userForm.defaultSiteId ? [userForm.defaultSiteId] : [""]}
                      onOptionSelect={(_, data) =>
                        setUserForm((prev) => ({ ...prev, defaultSiteId: data.optionValue ?? "" }))
                      }
                    >
                      <Option value="">Global</Option>
                      {sites.map((site) => (
                        <Option key={site.id} value={String(site.id)}>
                          {site.name}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Operator Password Status">
                    <Checkbox
                      label={`Password currently set: ${userForm.hasOperatorPassword ? "Yes" : "No"}`}
                      checked={userForm.clearOperatorPassword}
                      disabled={!userForm.hasOperatorPassword}
                      onChange={(_, d) =>
                        setUserForm((prev) => ({
                          ...prev,
                          clearOperatorPassword: Boolean(d.checked),
                        }))
                      }
                    />
                  </Field>
                </div>
                <div className={styles.formRow}>
                  <Field label="State" required>
                    <Dropdown
                      value={userForm.state}
                      selectedOptions={[userForm.state]}
                      onOptionSelect={(_, data) =>
                        setUserForm((prev) => ({
                          ...prev,
                          state: (data.optionValue as UserState) ?? "Active",
                        }))
                      }
                    >
                      <Option value="Active">Active</Option>
                      <Option value="Inactive">Inactive</Option>
                      <Option value="Locked">Locked</Option>
                    </Dropdown>
                  </Field>
                  <Field label="User Active Flag">
                    <Checkbox
                      label="Is Active"
                      checked={userForm.isActive}
                      onChange={(_, d) =>
                        setUserForm((prev) => ({ ...prev, isActive: Boolean(d.checked) }))
                      }
                    />
                  </Field>
                </div>

                <Field label="Role Assignments">
                  <div className={styles.roleAssignmentGrid}>
                    {userForm.roles.map((entry, index) => (
                      <div key={`role-entry-${index}`} className={styles.roleAssignmentRow}>
                        <Dropdown
                          value={entry.roleId ? (roleNameById.get(Number(entry.roleId)) ?? "") : ""}
                          selectedOptions={entry.roleId ? [entry.roleId] : []}
                          onOptionSelect={(_, data) =>
                            updateRoleAssignment(index, { roleId: data.optionValue ?? "" })
                          }
                        >
                          {roles.map((role) => (
                            <Option key={role.id} value={String(role.id)}>
                              {role.roleName}
                            </Option>
                          ))}
                        </Dropdown>
                        <Button appearance="secondary" onClick={() => removeRoleAssignment(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button appearance="secondary" onClick={addRoleAssignment}>
                      Add Role Assignment
                    </Button>
                  </div>
                </Field>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={() => void saveUser()} disabled={userSaving}>
                {userSaving ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
