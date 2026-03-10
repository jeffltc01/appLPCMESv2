import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Body1,
  Button,
  Card,
  Dropdown,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Textarea,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Add20Regular,
  ArrowLeft24Regular,
  Delete20Regular,
  Edit20Regular,
} from "@fluentui/react-icons";
import { HelpEntryPoint } from "../components/help/HelpEntryPoint";
import { PageHeader } from "../components/layout/PageHeader";
import { AddressCard } from "../components/customers/AddressCard";
import { AddressDialog } from "../components/customers/AddressDialog";
import { ContactDialog } from "../components/customers/ContactDialog";
import { CustomerStatusBadge } from "../components/customers/CustomerStatusBadge";
import {
  addressesApi,
  contactsApi,
  customersApi,
  lookupsApi,
} from "../services/customers";
import type {
  Address,
  Contact,
  CustomerDetail,
  CustomerUpdate,
  Lookup,
  SalesPersonLookup,
} from "../types/customer";
import { extractApiMessage } from "../utils/apiError";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  main: {
    display: "grid",
    gridTemplateRows: "56px minmax(0, 1fr)",
    minWidth: 0,
    height: "100vh",
  },
  content: {
    padding: "16px 20px",
    overflow: "auto",
  },
  shell: {
    maxWidth: "1280px",
    margin: "0 auto",
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  errorBanner: {
    border: "1px solid #e8b3b3",
    borderRadius: "4px",
    backgroundColor: "#fff5f5",
    padding: "10px 12px",
  },
  formCard: {
    border: "1px solid #e8e8e8",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    padding: "12px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#123046",
    marginBottom: "10px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "8px 12px",
  },
  fullRow: {
    gridColumn: "1 / -1",
  },
  sectionDivider: {
    gridColumn: "1 / -1",
    marginTop: "6px",
    paddingTop: "8px",
    borderTop: "1px solid #e8e8e8",
    fontSize: "12px",
    fontWeight: 700,
    color: "#123046",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  boolSwitch: {
    paddingTop: "6px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  addressGroups: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  addressColumn: {
    display: "grid",
    gap: tokens.spacingVerticalS,
  },
  subTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#123046",
  },
  tableWrap: {
    border: "1px solid #e8e8e8",
    borderRadius: "6px",
    overflow: "auto",
    backgroundColor: "#fff",
  },
  tableHeaderCell: {
    backgroundColor: "#123046",
    color: "#ffffff",
    fontWeight: 700,
  },
  actions: {
    display: "flex",
    gap: "6px",
  },
  clickableAddress: {
    cursor: "pointer",
  },
  subtleMuted: {
    color: tokens.colorNeutralForeground2,
    fontSize: "12px",
  },
  listPlaceholder: {
    color: tokens.colorNeutralForeground2,
  },
});

const STATUS_OPTIONS = ["Active", "Inactive"] as const;

interface CustomerFormState extends CustomerUpdate {}

function mapCustomerToForm(customer: CustomerDetail): CustomerFormState {
  return {
    name: customer.name,
    customerCode: customer.customerCode,
    status: customer.status,
    email: customer.email,
    notes: customer.notes,
    customerParentId: customer.customerParentId,
    defaultSalesEmployeeId: customer.defaultSalesEmployeeId,
    tankColorId: customer.tankColorId,
    lidColorId: customer.lidColorId,
    defaultPaymentTermId: customer.defaultPaymentTermId,
    defaultShipViaId: customer.defaultShipViaId,
    defaultOrderContactId: customer.defaultOrderContactId,
    defaultBillToId: customer.defaultBillToId,
    defaultPickUpId: customer.defaultPickUpId,
    defaultShipToId: customer.defaultShipToId,
    defaultNeedCollars: customer.defaultNeedCollars,
    defaultNeedFillers: customer.defaultNeedFillers,
    defaultNeedFootRings: customer.defaultNeedFootRings,
    defaultReturnScrap: customer.defaultReturnScrap,
    defaultReturnBrass: customer.defaultReturnBrass,
    defaultValveType: customer.defaultValveType,
    defaultGauges: customer.defaultGauges,
  };
}

function toNumberOrNull(value: string): number | null {
  return value.trim() ? Number(value) : null;
}

function toNullableText(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

export function CustomerDetailPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId } = useParams();
  const parsedCustomerId = customerId ? Number(customerId) : NaN;
  const backTarget =
    typeof (location.state as { backTo?: unknown } | null)?.backTo === "string"
      ? (location.state as { backTo: string }).backTo
      : "/customers";
  const backLabel = backTarget.startsWith("/orders/") ? "Back to Order" : "Back to Customers";
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [form, setForm] = useState<CustomerFormState | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [colors, setColors] = useState<Lookup[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<Lookup[]>([]);
  const [shipVias, setShipVias] = useState<Lookup[]>([]);
  const [salesPeople, setSalesPeople] = useState<SalesPersonLookup[]>([]);
  const [customerParents, setCustomerParents] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [defaultAddressType, setDefaultAddressType] = useState("SHIP_TO");
  const [pendingAddressDelete, setPendingAddressDelete] = useState<Address | null>(null);
  const [pendingContactDelete, setPendingContactDelete] = useState<Contact | null>(null);
  const [confirmInactivateOpen, setConfirmInactivateOpen] = useState(false);

  const billToAddresses = useMemo(
    () => addresses.filter((address) => address.type === "BILL_TO"),
    [addresses]
  );
  const shipToAddresses = useMemo(
    () => addresses.filter((address) => address.type === "SHIP_TO"),
    [addresses]
  );

  const loadAddressesAndContacts = async (id: number) => {
    const [billTo, shipTo, loadedContacts] = await Promise.all([
      addressesApi.list(id, "BILL_TO"),
      addressesApi.list(id, "SHIP_TO"),
      contactsApi.list(id),
    ]);
    setAddresses([...billTo, ...shipTo]);
    setContacts(loadedContacts);
  };

  useEffect(() => {
    if (!Number.isFinite(parsedCustomerId)) {
      setLoading(false);
      setLoadError("Invalid customer id.");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setLoadError(null);

    void Promise.all([
      customersApi.get(parsedCustomerId),
      lookupsApi.colors(),
      lookupsApi.paymentTerms(),
      lookupsApi.shipVias(),
      lookupsApi.salesPeople(),
      customersApi.list({ page: 1, pageSize: 500, status: "All" }),
    ])
      .then(async ([detail, loadedColors, loadedPaymentTerms, loadedShipVias, loadedSalesPeople, parentList]) => {
        if (!isMounted) {
          return;
        }
        setCustomer(detail);
        setForm(mapCustomerToForm(detail));
        setColors(loadedColors);
        setPaymentTerms(loadedPaymentTerms);
        setShipVias(loadedShipVias);
        setSalesPeople(loadedSalesPeople);
        setCustomerParents(
          parentList.items
            .filter((item) => item.id !== detail.id)
            .map((item) => ({ id: item.id, name: item.name }))
        );
        await loadAddressesAndContacts(detail.id);
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(extractApiMessage(error, "Failed to load customer."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [parsedCustomerId]);

  const onSave = async () => {
    if (!customer || !form) {
      return;
    }
    if (!form.name.trim()) {
      setActionError("Customer name is required.");
      return;
    }

    setSaving(true);
    setActionError(null);
    try {
      const payload: CustomerUpdate = {
        ...form,
        name: form.name.trim(),
        customerCode: toNullableText(form.customerCode ?? ""),
        email: toNullableText(form.email ?? ""),
        notes: toNullableText(form.notes ?? ""),
        defaultValveType: toNullableText(form.defaultValveType ?? ""),
        defaultGauges: toNullableText(form.defaultGauges ?? ""),
      };
      const updated = await customersApi.update(customer.id, payload);
      setCustomer(updated);
      setForm(mapCustomerToForm(updated));
      await loadAddressesAndContacts(updated.id);
    } catch (error) {
      setActionError(extractApiMessage(error, "Failed to save customer."));
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    if (!customer) {
      return;
    }
    setActionError(null);
    setForm(mapCustomerToForm(customer));
  };

  const onInactivate = async () => {
    if (!customer) {
      return;
    }
    try {
      setActionError(null);
      await customersApi.delete(customer.id);
      const refreshed = await customersApi.get(customer.id);
      setCustomer(refreshed);
      setForm(mapCustomerToForm(refreshed));
      setConfirmInactivateOpen(false);
    } catch (error) {
      setActionError(extractApiMessage(error, "Failed to inactivate customer."));
      setConfirmInactivateOpen(false);
    }
  };

  const refreshAfterAddressSaved = async () => {
    if (!customer) {
      return;
    }
    try {
      setActionError(null);
      await loadAddressesAndContacts(customer.id);
    } catch (error) {
      setActionError(extractApiMessage(error, "Unable to refresh addresses."));
    } finally {
      setAddressDialogOpen(false);
      setEditingAddress(null);
    }
  };

  const refreshAfterContactSaved = async () => {
    if (!customer) {
      return;
    }
    try {
      setActionError(null);
      await loadAddressesAndContacts(customer.id);
    } catch (error) {
      setActionError(extractApiMessage(error, "Unable to refresh contacts."));
    } finally {
      setContactDialogOpen(false);
      setEditingContact(null);
    }
  };

  const deleteAddress = async () => {
    if (!customer || !pendingAddressDelete) {
      return;
    }
    try {
      setActionError(null);
      await addressesApi.delete(customer.id, pendingAddressDelete.id);
      await loadAddressesAndContacts(customer.id);
    } catch (error) {
      setActionError(
        extractApiMessage(
          error,
          "Cannot delete address because it is referenced by one or more orders."
        )
      );
    } finally {
      setPendingAddressDelete(null);
    }
  };

  const deleteContact = async () => {
    if (!customer || !pendingContactDelete) {
      return;
    }
    try {
      setActionError(null);
      await contactsApi.delete(customer.id, pendingContactDelete.id);
      await loadAddressesAndContacts(customer.id);
    } catch (error) {
      setActionError(extractApiMessage(error, "Unable to delete contact."));
    } finally {
      setPendingContactDelete(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Body1>Loading customer...</Body1>
      </div>
    );
  }

  if (!customer || !form) {
    return (
      <div className={styles.page}>
        <Body1>{loadError ?? "Customer not found."}</Body1>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <PageHeader
          title={`Customer: ${customer.name}`}
          actions={
            <>
              <Button
                appearance="secondary"
                icon={<ArrowLeft24Regular />}
                onClick={() => navigate(backTarget)}
              >
                {backLabel}
              </Button>
              <Button appearance="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button appearance="secondary" onClick={() => setConfirmInactivateOpen(true)}>
                Inactivate
              </Button>
              <Button appearance="primary" onClick={() => void onSave()} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <HelpEntryPoint route="/customers/:customerId" />
            </>
          }
        />
        <section className={styles.content}>
          <div className={styles.shell}>
            {loadError || actionError ? (
              <div className={styles.errorBanner}>
                <MessageBar intent="error">
                  <MessageBarBody>{loadError ?? actionError}</MessageBarBody>
                </MessageBar>
              </div>
            ) : null}
            <Card className={styles.formCard}>
              <div className={styles.sectionTitle}>Customer Maintenance</div>
              <div className={styles.formGrid}>
                <div className={styles.sectionDivider}>Identity and Status</div>
                <Field label="Name" required>
                  <Input
                    value={form.name}
                    onChange={(_, data) =>
                      setForm((prev) => (prev ? { ...prev, name: data.value } : prev))
                    }
                  />
                </Field>
                <Field label="Customer Code">
                  <Input
                    value={form.customerCode ?? ""}
                    onChange={(_, data) =>
                      setForm((prev) =>
                        prev ? { ...prev, customerCode: data.value || null } : prev
                      )
                    }
                  />
                </Field>
                <Field label="Status">
                  <Dropdown
                    value={form.status ?? "Active"}
                    selectedOptions={[form.status ?? "Active"]}
                    onOptionSelect={(_, data) =>
                      setForm((prev) =>
                        prev ? { ...prev, status: data.optionValue ?? "Active" } : prev
                      )
                    }
                  >
                    {STATUS_OPTIONS.map((statusOption) => (
                      <Option key={statusOption} value={statusOption}>
                        {statusOption}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
                <Field label="Current Status">
                  <div className={styles.statusRow}>
                    <CustomerStatusBadge status={form.status} />
                  </div>
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(_, data) =>
                      setForm((prev) => (prev ? { ...prev, email: data.value || null } : prev))
                    }
                  />
                </Field>
                <Field label="Customer Parent">
                  <Select
                    value={form.customerParentId != null ? String(form.customerParentId) : ""}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, customerParentId: toNumberOrNull(event.target.value) }
                          : prev
                      )
                    }
                  >
                    <option value="">None</option>
                    {customerParents.map((parent) => (
                      <option key={parent.id} value={String(parent.id)}>
                        {parent.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Default Sales Employee">
                  <Select
                    value={
                      form.defaultSalesEmployeeId != null
                        ? String(form.defaultSalesEmployeeId)
                        : ""
                    }
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              defaultSalesEmployeeId: toNumberOrNull(event.target.value),
                            }
                          : prev
                      )
                    }
                  >
                    <option value="">None</option>
                    {salesPeople.map((person) => (
                      <option key={person.id} value={String(person.id)}>
                        {person.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Tank Color">
                  <Select
                    value={form.tankColorId != null ? String(form.tankColorId) : ""}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, tankColorId: toNumberOrNull(event.target.value) } : prev
                      )
                    }
                  >
                    <option value="">None</option>
                    {colors.map((lookup) => (
                      <option key={lookup.id} value={String(lookup.id)}>
                        {lookup.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Lid Color">
                  <Select
                    value={form.lidColorId != null ? String(form.lidColorId) : ""}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, lidColorId: toNumberOrNull(event.target.value) } : prev
                      )
                    }
                  >
                    <option value="">None</option>
                    {colors.map((lookup) => (
                      <option key={lookup.id} value={String(lookup.id)}>
                        {lookup.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className={styles.sectionDivider}>Commercial Defaults</div>
                <Field label="Default Payment Term">
                  <Select
                    value={
                      form.defaultPaymentTermId != null
                        ? String(form.defaultPaymentTermId)
                        : ""
                    }
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              defaultPaymentTermId: toNumberOrNull(event.target.value),
                            }
                          : prev
                      )
                    }
                  >
                    <option value="">None</option>
                    {paymentTerms.map((lookup) => (
                      <option key={lookup.id} value={String(lookup.id)}>
                        {lookup.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Default Ship Via">
                  <Select
                    value={form.defaultShipViaId != null ? String(form.defaultShipViaId) : ""}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, defaultShipViaId: toNumberOrNull(event.target.value) }
                          : prev
                      )
                    }
                  >
                    <option value="">None</option>
                    {shipVias.map((lookup) => (
                      <option key={lookup.id} value={String(lookup.id)}>
                        {lookup.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Default Order Contact">
                  <Select
                    value={
                      form.defaultOrderContactId != null
                        ? String(form.defaultOrderContactId)
                        : ""
                    }
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              defaultOrderContactId: toNumberOrNull(event.target.value),
                            }
                          : prev
                      )
                    }
                  >
                    <option value="">None</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={String(contact.id)}>
                        {`${contact.firstName} ${contact.lastName ?? ""}`.trim()}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Default Bill-To Address">
                  <Select
                    value={form.defaultBillToId != null ? String(form.defaultBillToId) : ""}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, defaultBillToId: toNumberOrNull(event.target.value) } : prev
                      )
                    }
                  >
                    <option value="">None</option>
                    {billToAddresses.map((address) => (
                      <option key={address.id} value={String(address.id)}>
                        {address.addressName ?? address.address1}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Default Pickup Address">
                  <Select
                    value={form.defaultPickUpId != null ? String(form.defaultPickUpId) : ""}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, defaultPickUpId: toNumberOrNull(event.target.value) }
                          : prev
                      )
                    }
                  >
                    <option value="">None</option>
                    {shipToAddresses.map((address) => (
                      <option key={address.id} value={String(address.id)}>
                        {address.addressName ?? address.address1}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Default Ship-To Address">
                  <Select
                    value={form.defaultShipToId != null ? String(form.defaultShipToId) : ""}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, defaultShipToId: toNumberOrNull(event.target.value) }
                          : prev
                      )
                    }
                  >
                    <option value="">None</option>
                    {shipToAddresses.map((address) => (
                      <option key={address.id} value={String(address.id)}>
                        {address.addressName ?? address.address1}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className={styles.sectionDivider}>Default Product Options</div>
                <Field label="Need Collars" className={styles.boolSwitch}>
                  <Switch
                    checked={form.defaultNeedCollars === 1}
                    onChange={(_, data) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, defaultNeedCollars: data.checked ? 1 : 0 }
                          : prev
                      )
                    }
                    label={form.defaultNeedCollars === 1 ? "Yes" : "No"}
                  />
                </Field>
                <Field label="Need Fillers" className={styles.boolSwitch}>
                  <Switch
                    checked={form.defaultNeedFillers === 1}
                    onChange={(_, data) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, defaultNeedFillers: data.checked ? 1 : 0 }
                          : prev
                      )
                    }
                    label={form.defaultNeedFillers === 1 ? "Yes" : "No"}
                  />
                </Field>
                <Field label="Need Foot Rings" className={styles.boolSwitch}>
                  <Switch
                    checked={form.defaultNeedFootRings === 1}
                    onChange={(_, data) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, defaultNeedFootRings: data.checked ? 1 : 0 }
                          : prev
                      )
                    }
                    label={form.defaultNeedFootRings === 1 ? "Yes" : "No"}
                  />
                </Field>
                <Field label="Return Scrap" className={styles.boolSwitch}>
                  <Switch
                    checked={form.defaultReturnScrap === 1}
                    onChange={(_, data) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, defaultReturnScrap: data.checked ? 1 : 0 }
                          : prev
                      )
                    }
                    label={form.defaultReturnScrap === 1 ? "Yes" : "No"}
                  />
                </Field>
                <Field label="Return Brass" className={styles.boolSwitch}>
                  <Switch
                    checked={form.defaultReturnBrass === 1}
                    onChange={(_, data) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, defaultReturnBrass: data.checked ? 1 : 0 }
                          : prev
                      )
                    }
                    label={form.defaultReturnBrass === 1 ? "Yes" : "No"}
                  />
                </Field>
                <Field label="Default Valve Type">
                  <Input
                    value={form.defaultValveType ?? ""}
                    onChange={(_, data) =>
                      setForm((prev) =>
                        prev ? { ...prev, defaultValveType: data.value || null } : prev
                      )
                    }
                  />
                </Field>
                <Field label="Default Gauges">
                  <Input
                    value={form.defaultGauges ?? ""}
                    onChange={(_, data) =>
                      setForm((prev) =>
                        prev ? { ...prev, defaultGauges: data.value || null } : prev
                      )
                    }
                  />
                </Field>
                <Field className={styles.fullRow} label="Notes">
                  <Textarea
                    value={form.notes ?? ""}
                    resize="vertical"
                    onChange={(_, data) =>
                      setForm((prev) => (prev ? { ...prev, notes: data.value || null } : prev))
                    }
                  />
                </Field>
              </div>
            </Card>

            <Card className={styles.formCard}>
              <div className={styles.cardHeader}>
                <div className={styles.sectionTitle}>Addresses</div>
                <div className={styles.actions}>
                  <Button
                    appearance="secondary"
                    icon={<Add20Regular />}
                    onClick={() => {
                      setEditingAddress(null);
                      setDefaultAddressType("BILL_TO");
                      setAddressDialogOpen(true);
                    }}
                  >
                    Add Bill-To
                  </Button>
                  <Button
                    appearance="secondary"
                    icon={<Add20Regular />}
                    onClick={() => {
                      setEditingAddress(null);
                      setDefaultAddressType("SHIP_TO");
                      setAddressDialogOpen(true);
                    }}
                  >
                    Add Ship-To
                  </Button>
                </div>
              </div>
              <div className={styles.addressGroups}>
                <div className={styles.addressColumn}>
                  <div className={styles.subTitle}>Bill-To</div>
                  {billToAddresses.map((address) => (
                    <div key={address.id} className={styles.clickableAddress}>
                      <AddressCard
                        address={address}
                        onEdit={(target) => {
                          setEditingAddress(target);
                          setAddressDialogOpen(true);
                        }}
                        onDelete={(target) => setPendingAddressDelete(target)}
                      />
                    </div>
                  ))}
                  {billToAddresses.length === 0 ? (
                    <Body1 className={styles.listPlaceholder}>No bill-to addresses.</Body1>
                  ) : null}
                </div>
                <div className={styles.addressColumn}>
                  <div className={styles.subTitle}>Ship-To / Pickup</div>
                  {shipToAddresses.map((address) => (
                    <div key={address.id} className={styles.clickableAddress}>
                      <AddressCard
                        address={address}
                        onEdit={(target) => {
                          setEditingAddress(target);
                          setAddressDialogOpen(true);
                        }}
                        onDelete={(target) => setPendingAddressDelete(target)}
                      />
                    </div>
                  ))}
                  {shipToAddresses.length === 0 ? (
                    <Body1 className={styles.listPlaceholder}>No ship-to addresses.</Body1>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card className={styles.formCard}>
              <div className={styles.cardHeader}>
                <div className={styles.sectionTitle}>Contacts</div>
                <Button
                  appearance="secondary"
                  icon={<Add20Regular />}
                  onClick={() => {
                    setEditingContact(null);
                    setContactDialogOpen(true);
                  }}
                >
                  Add Contact
                </Button>
              </div>
              <Body1 className={styles.subtleMuted}>
                {contacts.length} contact(s) for this customer
              </Body1>
              <div className={styles.tableWrap}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell className={styles.tableHeaderCell}>Name</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Email</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>
                        Office Phone
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>
                        Mobile Phone
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Notes</TableHeaderCell>
                      <TableHeaderCell className={styles.tableHeaderCell}>Actions</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>{`${contact.firstName} ${contact.lastName ?? ""}`.trim()}</TableCell>
                        <TableCell>{contact.email ?? "-"}</TableCell>
                        <TableCell>{contact.officePhone ?? "-"}</TableCell>
                        <TableCell>{contact.mobilePhone ?? "-"}</TableCell>
                        <TableCell>{contact.notes ?? "-"}</TableCell>
                        <TableCell>
                          <div className={styles.actions}>
                            <Button
                              icon={<Edit20Regular />}
                              appearance="subtle"
                              aria-label={`Edit contact ${contact.firstName}`}
                              onClick={() => {
                                setEditingContact(contact);
                                setContactDialogOpen(true);
                              }}
                            />
                            <Button
                              icon={<Delete20Regular />}
                              appearance="subtle"
                              aria-label={`Delete contact ${contact.firstName}`}
                              onClick={() => setPendingContactDelete(contact)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {contacts.length === 0 ? (
                      <TableRow>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>No contacts yet.</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <AddressDialog
        open={addressDialogOpen}
        customerId={customer.id}
        address={editingAddress}
        defaultType={defaultAddressType}
        contacts={contacts}
        salesPeople={salesPeople}
        onClose={() => {
          setAddressDialogOpen(false);
          setEditingAddress(null);
        }}
        onSaved={() => void refreshAfterAddressSaved()}
      />

      <ContactDialog
        open={contactDialogOpen}
        customerId={customer.id}
        contact={editingContact}
        onClose={() => {
          setContactDialogOpen(false);
          setEditingContact(null);
        }}
        onSaved={() => void refreshAfterContactSaved()}
      />

      <Dialog open={pendingAddressDelete !== null}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm Address Delete</DialogTitle>
            <DialogContent>
              <Body1>
                Delete address{" "}
                <strong>
                  {pendingAddressDelete?.addressName ?? pendingAddressDelete?.address1}
                </strong>
                ?
              </Body1>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setPendingAddressDelete(null)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={() => void deleteAddress()}>
                Delete
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={pendingContactDelete !== null}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm Contact Delete</DialogTitle>
            <DialogContent>
              <Body1>
                Delete contact{" "}
                <strong>
                  {pendingContactDelete
                    ? `${pendingContactDelete.firstName} ${pendingContactDelete.lastName ?? ""}`.trim()
                    : ""}
                </strong>
                ?
              </Body1>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setPendingContactDelete(null)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={() => void deleteContact()}>
                Delete
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={confirmInactivateOpen}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm Inactivate Customer</DialogTitle>
            <DialogContent>
              <Body1>
                Inactivate customer <strong>{customer.name}</strong>? This keeps history and marks it
                inactive.
              </Body1>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setConfirmInactivateOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={() => void onInactivate()}>
                Inactivate
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
