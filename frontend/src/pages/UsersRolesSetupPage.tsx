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
  Title2,
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
    padding: tokens.spacingHorizontalL,
    display: "grid",
    gap: tokens.spacingVerticalL,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nav: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
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
    gridTemplateColumns: "1fr 1fr auto",
    gap: tokens.spacingHorizontalS,
    alignItems: "end",
  },
});

type UserState = "Active" | "Inactive" | "Locked";

interface RoleFormState {
  roleName: string;
  description: string;
  isActive: boolean;
}

interface UserRoleFormState {
  roleId: string;
  siteId: string;
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
  siteId: "",
};

export function UsersRolesSetupPage() {
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
      const [roleRows, userRows, siteLookups] = await Promise.all([
        setupApi.listRoles(),
        setupApi.listUsers(),
        orderLookupsApi.sites(),
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
        siteId: role.siteId ? String(role.siteId) : "",
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

    const roleAssignmentKeys = userForm.roles.map((entry) => `${entry.roleId}:${entry.siteId || "global"}`);
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
        siteId: entry.siteId ? Number(entry.siteId) : null,
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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Title2>Setup - Users & Roles</Title2>
        <div className={styles.nav}>
          <Button appearance="secondary" onClick={() => navigate("/setup/work-centers")}>
            Work Centers Setup
          </Button>
          <Button appearance="secondary" onClick={() => navigate("/setup/items")}>
            Items Setup
          </Button>
          <Button appearance="secondary" onClick={() => navigate("/")}>
            Home
          </Button>
        </div>
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Title3>Roles</Title3>
          <Button appearance="primary" onClick={openCreateRole}>
            Add Role
          </Button>
        </div>
        {loading ? (
          <Body1>Loading...</Body1>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Role Name</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Active</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.roleName}</TableCell>
                  <TableCell>{role.description ?? "-"}</TableCell>
                  <TableCell>{role.isActive ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <div className={styles.actions}>
                      <Button appearance="secondary" onClick={() => openEditRole(role)}>
                        Edit
                      </Button>
                      <Button appearance="secondary" onClick={() => void removeRole(role)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Title3>Users</Title3>
          <Button appearance="primary" onClick={openCreateUser}>
            Add User
          </Button>
        </div>
        {loading ? (
          <Body1>Loading...</Body1>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Emp No</TableHeaderCell>
                <TableHeaderCell>Display Name</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>State</TableHeaderCell>
                <TableHeaderCell>Roles</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.empNo ?? "-"}</TableCell>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>{user.email ?? "-"}</TableCell>
                  <TableCell>{user.state}</TableCell>
                  <TableCell>
                    {user.roles.map((role) =>
                      role.siteId
                        ? `${role.roleName} (${siteNameById.get(role.siteId) ?? `Site ${role.siteId}`})`
                        : role.roleName
                    ).join(", ") || "-"}
                  </TableCell>
                  <TableCell>
                    <div className={styles.actions}>
                      <Button appearance="secondary" onClick={() => openEditUser(user)}>
                        Edit
                      </Button>
                      <Button appearance="secondary" onClick={() => void removeUser(user)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

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
                        <Dropdown
                          value={entry.siteId ? (siteNameById.get(Number(entry.siteId)) ?? "") : "Global"}
                          selectedOptions={entry.siteId ? [entry.siteId] : [""]}
                          onOptionSelect={(_, data) =>
                            updateRoleAssignment(index, { siteId: data.optionValue ?? "" })
                          }
                        >
                          <Option value="">Global</Option>
                          {sites.map((site) => (
                            <Option key={site.id} value={String(site.id)}>
                              {site.name}
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
