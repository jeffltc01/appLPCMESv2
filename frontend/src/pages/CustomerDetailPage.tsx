import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  makeStyles,
  tokens,
  Title2,
  Body1,
  Spinner,
  TabList,
  Tab,
  Button,
  Input,
  Textarea,
  Field,
  Dropdown,
  Option,
  Switch,
  Subtitle1,
  Subtitle2,
  MessageBar,
  MessageBarBody,
  Divider,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import {
  Save24Regular,
  ArrowLeft24Regular,
  Add24Regular,
} from "@fluentui/react-icons";
import {
  customersApi,
  lookupsApi,
} from "../services/customers";
import { ApiError } from "../services/api";
import type {
  CustomerDetail,
  CustomerUpdate,
  Address,
  Contact,
  Lookup,
  SalesPersonLookup,
} from "../types/customer";
import { CustomerStatusBadge } from "../components/customers/CustomerStatusBadge";
import { AddressCard } from "../components/customers/AddressCard";
import { AddressDialog } from "../components/customers/AddressDialog";
import { ContactDialog } from "../components/customers/ContactDialog";
import { addressesApi, contactsApi } from "../services/customers";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    flexWrap: "wrap",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    flexGrow: 1,
  },
  tabContent: {
    marginTop: tokens.spacingVerticalL,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    maxWidth: "640px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  section: {
    marginTop: tokens.spacingVerticalL,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalM,
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  contactCard: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  contactActions: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalS,
  },
  center: {
    display: "flex",
    justifyContent: "center",
    marginTop: tokens.spacingVerticalXXL,
  },
  switchRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
});

type TabValue = "details" | "addresses" | "contacts" | "defaults";

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const styles = useStyles();
  const returnTo = searchParams.get("returnTo");
  const safeReturnTo =
    returnTo && returnTo.startsWith("/") ? returnTo : "/customers";

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [tab, setTab] = useState<TabValue>("details");

  // Lookups
  const [colors, setColors] = useState<Lookup[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<Lookup[]>([]);
  const [shipVias, setShipVias] = useState<Lookup[]>([]);
  const [salesPeople, setSalesPeople] = useState<SalesPersonLookup[]>([]);
  const [parentCustomers, setParentCustomers] = useState<
    { id: number; name: string }[]
  >([]);

  // Editable fields (details tab)
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Active");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [customerParentId, setCustomerParentId] = useState<string>("");
  const [defaultSalesEmployeeId, setDefaultSalesEmployeeId] =
    useState<string>("");

  // Order defaults tab
  const [tankColorId, setTankColorId] = useState<string>("");
  const [lidColorId, setLidColorId] = useState<string>("");
  const [defaultPaymentTermId, setDefaultPaymentTermId] = useState<string>("");
  const [defaultShipViaId, setDefaultShipViaId] = useState<string>("");
  const [defaultOrderContactId, setDefaultOrderContactId] = useState<string>("");
  const [defaultBillToId, setDefaultBillToId] = useState<string>("");
  const [defaultPickUpId, setDefaultPickUpId] = useState<string>("");
  const [defaultShipToId, setDefaultShipToId] = useState<string>("");
  const [defaultNeedCollars, setDefaultNeedCollars] = useState(false);
  const [defaultNeedFillers, setDefaultNeedFillers] = useState(false);
  const [defaultNeedFootRings, setDefaultNeedFootRings] = useState(false);
  const [defaultReturnScrap, setDefaultReturnScrap] = useState(false);
  const [defaultReturnBrass, setDefaultReturnBrass] = useState(false);
  const [defaultValveType, setDefaultValveType] = useState("");
  const [defaultGauges, setDefaultGauges] = useState("");

  // Dialog states
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressDefaultType, setAddressDefaultType] = useState<string>();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "address" | "contact";
    item: Address | Contact;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const populateForm = useCallback((c: CustomerDetail) => {
    setName(c.name);
    setCode(c.customerCode ?? "");
    setStatus(c.status ?? "Active");
    setEmail(c.email ?? "");
    setNotes(c.notes ?? "");
    setCustomerParentId(c.customerParentId?.toString() ?? "");
    setDefaultSalesEmployeeId(c.defaultSalesEmployeeId?.toString() ?? "");
    setTankColorId(c.tankColorId?.toString() ?? "");
    setLidColorId(c.lidColorId?.toString() ?? "");
    setDefaultPaymentTermId(c.defaultPaymentTermId?.toString() ?? "");
    setDefaultShipViaId(c.defaultShipViaId?.toString() ?? "");
    setDefaultOrderContactId(c.defaultOrderContactId?.toString() ?? "");
    setDefaultBillToId(c.defaultBillToId?.toString() ?? "");
    setDefaultPickUpId(c.defaultPickUpId?.toString() ?? "");
    setDefaultShipToId(c.defaultShipToId?.toString() ?? "");
    setDefaultNeedCollars(c.defaultNeedCollars === 1);
    setDefaultNeedFillers(c.defaultNeedFillers === 1);
    setDefaultNeedFootRings(c.defaultNeedFootRings === 1);
    setDefaultReturnScrap(c.defaultReturnScrap === 1);
    setDefaultReturnBrass(c.defaultReturnBrass === 1);
    setDefaultValveType(c.defaultValveType ?? "");
    setDefaultGauges(c.defaultGauges ?? "");
  }, []);

  const loadCustomer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const c = await customersApi.get(Number(id));
      setCustomer(c);
      populateForm(c);
    } finally {
      setLoading(false);
    }
  }, [id, populateForm]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  useEffect(() => {
    Promise.all([
      lookupsApi.colors(),
      lookupsApi.paymentTerms(),
      lookupsApi.shipVias(),
      lookupsApi.salesPeople(),
      customersApi.list({ pageSize: 500, status: "All" }),
    ]).then(([c, pt, sv, sp, custs]) => {
      setColors(c);
      setPaymentTerms(pt);
      setShipVias(sv);
      setSalesPeople(sp);
      setParentCustomers(
        custs.items
          .filter((cu) => cu.id !== Number(id))
          .map((cu) => ({ id: cu.id, name: cu.name }))
      );
    });
  }, [id]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const dto: CustomerUpdate = {
        name: name.trim(),
        customerCode: code.trim() || null,
        status,
        email: email.trim() || null,
        notes: notes.trim() || null,
        customerParentId: customerParentId ? Number(customerParentId) : null,
        defaultSalesEmployeeId: defaultSalesEmployeeId
          ? Number(defaultSalesEmployeeId)
          : null,
        tankColorId: tankColorId ? Number(tankColorId) : null,
        lidColorId: lidColorId ? Number(lidColorId) : null,
        defaultPaymentTermId: defaultPaymentTermId
          ? Number(defaultPaymentTermId)
          : null,
        defaultShipViaId: defaultShipViaId ? Number(defaultShipViaId) : null,
        defaultOrderContactId: defaultOrderContactId
          ? Number(defaultOrderContactId)
          : null,
        defaultBillToId: defaultBillToId ? Number(defaultBillToId) : null,
        defaultPickUpId: defaultPickUpId ? Number(defaultPickUpId) : null,
        defaultShipToId: defaultShipToId ? Number(defaultShipToId) : null,
        defaultNeedCollars: defaultNeedCollars ? 1 : 0,
        defaultNeedFillers: defaultNeedFillers ? 1 : 0,
        defaultNeedFootRings: defaultNeedFootRings ? 1 : 0,
        defaultReturnScrap: defaultReturnScrap ? 1 : 0,
        defaultReturnBrass: defaultReturnBrass ? 1 : 0,
        defaultValveType: defaultValveType.trim() || null,
        defaultGauges: defaultGauges.trim() || null,
      };
      const updated = await customersApi.update(customer.id, dto);
      setCustomer(updated);
      populateForm(updated);
      setSaveMsg({ type: "success", text: "Customer saved." });
    } catch {
      setSaveMsg({ type: "error", text: "Failed to save customer." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addr: Address) => {
    setDeleteConfirm({ type: "address", item: addr });
    setDeleteError(null);
  };

  const handleDeleteContact = async (ct: Contact) => {
    setDeleteConfirm({ type: "contact", item: ct });
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || !customer) return;
    try {
      if (deleteConfirm.type === "address") {
        await addressesApi.delete(customer.id, deleteConfirm.item.id);
      } else {
        await contactsApi.delete(customer.id, deleteConfirm.item.id);
      }
      setDeleteConfirm(null);
      loadCustomer();
    } catch (err) {
      if (err instanceof ApiError && err.body) {
        const body = err.body as { message?: string };
        setDeleteError(body.message ?? "Cannot delete this item.");
      } else {
        setDeleteError("Failed to delete.");
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="large" label="Loading customer..." />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className={styles.center}>
        <Body1>Customer not found.</Body1>
      </div>
    );
  }

  const billToAddresses = customer.addresses.filter(
    (a) => a.type === "BILL_TO"
  );
  const shipToAddresses = customer.addresses.filter(
    (a) => a.type === "SHIP_TO"
  );
  const contactOptions = customer.contacts.map((ct) => ({
    id: ct.id,
    name: `${ct.firstName} ${ct.lastName ?? ""}`.trim(),
  }));

  const dropdownValue = (
    items: { id: number; name: string }[],
    selectedId: string
  ) => {
    if (!selectedId) return "";
    const found = items.find((i) => String(i.id) === selectedId);
    return found?.name ?? "";
  };

  const formatAddressLabel = (address: Address) => {
    const line1 = (address.addressName || address.address1 || "").trim();
    const cityStateZip = [address.city, address.state, address.postalCode]
      .filter((part) => part && part.trim().length > 0)
      .map((part) => part!.trim())
      .join(" ");

    if (!line1) return cityStateZip || "(no address)";
    return cityStateZip ? `${line1}, ${cityStateZip}` : line1;
  };

  return (
    <div>
      <div className={styles.header}>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate(safeReturnTo)}
        />
        <div className={styles.headerTitle}>
          <Title2>{customer.name}</Title2>
          <CustomerStatusBadge status={customer.status} />
        </div>
        <Button
          appearance="primary"
          icon={<Save24Regular />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {saveMsg && (
        <MessageBar
          intent={saveMsg.type}
          style={{ marginBottom: tokens.spacingVerticalM }}
        >
          <MessageBarBody>{saveMsg.text}</MessageBarBody>
        </MessageBar>
      )}

      <TabList
        selectedValue={tab}
        onTabSelect={(_, d) => setTab(d.value as TabValue)}
      >
        <Tab value="details">Details</Tab>
        <Tab value="addresses">
          Addresses ({customer.addresses.length})
        </Tab>
        <Tab value="contacts">Contacts ({customer.contacts.length})</Tab>
        <Tab value="defaults">Order Defaults</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {tab === "details" && (
          <div className={styles.form}>
            <div className={styles.row}>
              <Field label="Name" required>
                <Input
                  value={name}
                  onChange={(_, d) => setName(d.value)}
                />
              </Field>
              <Field label="Customer Code">
                <Input
                  value={code}
                  onChange={(_, d) => setCode(d.value)}
                />
              </Field>
            </div>
            <div className={styles.row}>
              <Field label="Status">
                <Dropdown
                  value={status}
                  selectedOptions={[status]}
                  onOptionSelect={(_, d) =>
                    setStatus(d.optionValue ?? "Active")
                  }
                >
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                </Dropdown>
              </Field>
              <Field label="Email">
                <Input
                  value={email}
                  onChange={(_, d) => setEmail(d.value)}
                  type="email"
                />
              </Field>
            </div>
            <Field label="Parent Company">
              <Dropdown
                value={dropdownValue(parentCustomers, customerParentId)}
                selectedOptions={customerParentId ? [customerParentId] : []}
                onOptionSelect={(_, d) =>
                  setCustomerParentId(d.optionValue ?? "")
                }
                clearable
              >
                {parentCustomers.map((pc) => (
                  <Option key={pc.id} value={String(pc.id)}>
                    {pc.name}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Default Salesperson">
              <Dropdown
                value={dropdownValue(salesPeople, defaultSalesEmployeeId)}
                selectedOptions={
                  defaultSalesEmployeeId ? [defaultSalesEmployeeId] : []
                }
                onOptionSelect={(_, d) =>
                  setDefaultSalesEmployeeId(d.optionValue ?? "")
                }
                clearable
              >
                {salesPeople.map((sp) => (
                  <Option key={sp.id} value={String(sp.id)}>
                    {sp.name}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Notes">
              <Textarea
                value={notes}
                onChange={(_, d) => setNotes(d.value)}
                rows={4}
              />
            </Field>
          </div>
        )}

        {tab === "addresses" && (
          <div>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Subtitle1>Bill To Addresses</Subtitle1>
                <Button
                  appearance="subtle"
                  icon={<Add24Regular />}
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressDefaultType("BILL_TO");
                    setAddressDialogOpen(true);
                  }}
                >
                  Add Bill To
                </Button>
              </div>
              {billToAddresses.length === 0 ? (
                <Body1>No bill-to addresses.</Body1>
              ) : (
                <div className={styles.cardGrid}>
                  {billToAddresses.map((a) => (
                    <AddressCard
                      key={a.id}
                      address={a}
                      onEdit={(addr) => {
                        setEditingAddress(addr);
                        setAddressDefaultType(undefined);
                        setAddressDialogOpen(true);
                      }}
                      onDelete={handleDeleteAddress}
                    />
                  ))}
                </div>
              )}
            </div>

            <Divider style={{ marginTop: tokens.spacingVerticalL }} />

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Subtitle1>Ship To Addresses</Subtitle1>
                <Button
                  appearance="subtle"
                  icon={<Add24Regular />}
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressDefaultType("SHIP_TO");
                    setAddressDialogOpen(true);
                  }}
                >
                  Add Ship To
                </Button>
              </div>
              {shipToAddresses.length === 0 ? (
                <Body1>No ship-to addresses.</Body1>
              ) : (
                <div className={styles.cardGrid}>
                  {shipToAddresses.map((a) => (
                    <AddressCard
                      key={a.id}
                      address={a}
                      onEdit={(addr) => {
                        setEditingAddress(addr);
                        setAddressDefaultType(undefined);
                        setAddressDialogOpen(true);
                      }}
                      onDelete={handleDeleteAddress}
                    />
                  ))}
                </div>
              )}
            </div>

            <AddressDialog
              open={addressDialogOpen}
              customerId={customer.id}
              address={editingAddress}
              defaultType={addressDefaultType}
              onClose={() => setAddressDialogOpen(false)}
              onSaved={() => {
                setAddressDialogOpen(false);
                loadCustomer();
              }}
            />
          </div>
        )}

        {tab === "contacts" && (
          <div>
            <div className={styles.sectionHeader}>
              <Subtitle1>Contacts</Subtitle1>
              <Button
                appearance="subtle"
                icon={<Add24Regular />}
                onClick={() => {
                  setEditingContact(null);
                  setContactDialogOpen(true);
                }}
              >
                Add Contact
              </Button>
            </div>
            {customer.contacts.length === 0 ? (
              <Body1>No contacts yet.</Body1>
            ) : (
              <div className={styles.cardGrid}>
                {customer.contacts.map((ct) => (
                  <div key={ct.id} className={styles.contactCard}>
                    <Subtitle2>
                      {ct.firstName} {ct.lastName}
                    </Subtitle2>
                    {ct.email && <Body1>{ct.email}</Body1>}
                    {ct.officePhone && (
                      <Body1>Office: {ct.officePhone}</Body1>
                    )}
                    {ct.mobilePhone && (
                      <Body1>Mobile: {ct.mobilePhone}</Body1>
                    )}
                    {ct.notes && (
                      <Body1
                        style={{ color: tokens.colorNeutralForeground3 }}
                      >
                        {ct.notes}
                      </Body1>
                    )}
                    <div className={styles.contactActions}>
                      <Button
                        size="small"
                        appearance="subtle"
                        onClick={() => {
                          setEditingContact(ct);
                          setContactDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        appearance="subtle"
                        onClick={() => handleDeleteContact(ct)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <ContactDialog
              open={contactDialogOpen}
              customerId={customer.id}
              contact={editingContact}
              onClose={() => setContactDialogOpen(false)}
              onSaved={() => {
                setContactDialogOpen(false);
                loadCustomer();
              }}
            />
          </div>
        )}

        {tab === "defaults" && (
          <div className={styles.form}>
            <div className={styles.row}>
              <Field label="Default Tank Color">
                <Dropdown
                  value={dropdownValue(colors, tankColorId)}
                  selectedOptions={tankColorId ? [tankColorId] : []}
                  onOptionSelect={(_, d) =>
                    setTankColorId(d.optionValue ?? "")
                  }
                  clearable
                >
                  {colors.map((c) => (
                    <Option key={c.id} value={String(c.id)}>
                      {c.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Default Lid Color">
                <Dropdown
                  value={dropdownValue(colors, lidColorId)}
                  selectedOptions={lidColorId ? [lidColorId] : []}
                  onOptionSelect={(_, d) =>
                    setLidColorId(d.optionValue ?? "")
                  }
                  clearable
                >
                  {colors.map((c) => (
                    <Option key={c.id} value={String(c.id)}>
                      {c.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>

            <div className={styles.row}>
              <Field label="Default Payment Terms">
                <Dropdown
                  value={dropdownValue(paymentTerms, defaultPaymentTermId)}
                  selectedOptions={
                    defaultPaymentTermId ? [defaultPaymentTermId] : []
                  }
                  onOptionSelect={(_, d) =>
                    setDefaultPaymentTermId(d.optionValue ?? "")
                  }
                  clearable
                >
                  {paymentTerms.map((pt) => (
                    <Option key={pt.id} value={String(pt.id)}>
                      {pt.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Default Ship Via">
                <Dropdown
                  value={dropdownValue(shipVias, defaultShipViaId)}
                  selectedOptions={
                    defaultShipViaId ? [defaultShipViaId] : []
                  }
                  onOptionSelect={(_, d) =>
                    setDefaultShipViaId(d.optionValue ?? "")
                  }
                  clearable
                >
                  {shipVias.map((sv) => (
                    <Option key={sv.id} value={String(sv.id)}>
                      {sv.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>
            <Field label="Default Order Contact">
              <Dropdown
                value={dropdownValue(contactOptions, defaultOrderContactId)}
                selectedOptions={
                  defaultOrderContactId ? [defaultOrderContactId] : []
                }
                onOptionSelect={(_, d) =>
                  setDefaultOrderContactId(d.optionValue ?? "")
                }
                clearable
              >
                {contactOptions.map((ct) => (
                  <Option key={ct.id} value={String(ct.id)}>
                    {ct.name}
                  </Option>
                ))}
              </Dropdown>
            </Field>

            <Divider />

            <Subtitle2>Default Addresses</Subtitle2>
            <div className={styles.row}>
              <Field label="Default Bill To">
                <Dropdown
                  value={dropdownValue(
                    billToAddresses.map((a) => ({
                      id: a.id,
                      name: formatAddressLabel(a),
                    })),
                    defaultBillToId
                  )}
                  selectedOptions={defaultBillToId ? [defaultBillToId] : []}
                  onOptionSelect={(_, d) =>
                    setDefaultBillToId(d.optionValue ?? "")
                  }
                  clearable
                >
                  {billToAddresses.map((a) => (
                    <Option key={a.id} value={String(a.id)}>
                      {formatAddressLabel(a)}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Default Ship To">
                <Dropdown
                  value={dropdownValue(
                    shipToAddresses.map((a) => ({
                      id: a.id,
                      name: formatAddressLabel(a),
                    })),
                    defaultShipToId
                  )}
                  selectedOptions={defaultShipToId ? [defaultShipToId] : []}
                  onOptionSelect={(_, d) => {
                    const nextValue = d.optionValue ?? "";
                    setDefaultShipToId(nextValue);
                    if (!defaultPickUpId && nextValue) {
                      setDefaultPickUpId(nextValue);
                    }
                  }}
                  clearable
                >
                  {shipToAddresses.map((a) => (
                    <Option key={a.id} value={String(a.id)}>
                      {formatAddressLabel(a)}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>
            <Field label="Default Pick Up (Ship To address for pickup)">
              <Dropdown
                value={dropdownValue(
                  shipToAddresses.map((a) => ({
                    id: a.id,
                    name: formatAddressLabel(a),
                  })),
                  defaultPickUpId
                )}
                selectedOptions={defaultPickUpId ? [defaultPickUpId] : []}
                onOptionSelect={(_, d) => {
                  const nextValue = d.optionValue ?? "";
                  setDefaultPickUpId(nextValue);
                  if (!defaultShipToId && nextValue) {
                    setDefaultShipToId(nextValue);
                  }
                }}
                clearable
              >
                {shipToAddresses.map((a) => (
                  <Option key={a.id} value={String(a.id)}>
                    {formatAddressLabel(a)}
                  </Option>
                ))}
              </Dropdown>
            </Field>

            <Divider />

            <Subtitle2>Accessories &amp; Options</Subtitle2>
            <div className={styles.switchRow}>
              <Switch
                label="Need Collars"
                checked={defaultNeedCollars}
                onChange={(_, d) => setDefaultNeedCollars(d.checked)}
              />
              <Switch
                label="Need Fillers"
                checked={defaultNeedFillers}
                onChange={(_, d) => setDefaultNeedFillers(d.checked)}
              />
              <Switch
                label="Need Foot Rings"
                checked={defaultNeedFootRings}
                onChange={(_, d) => setDefaultNeedFootRings(d.checked)}
              />
            </div>
            <div className={styles.switchRow}>
              <Switch
                label="Return Scrap"
                checked={defaultReturnScrap}
                onChange={(_, d) => setDefaultReturnScrap(d.checked)}
              />
              <Switch
                label="Return Brass"
                checked={defaultReturnBrass}
                onChange={(_, d) => setDefaultReturnBrass(d.checked)}
              />
            </div>

            <div className={styles.row}>
              <Field label="Default Valve Type">
                <Input
                  value={defaultValveType}
                  onChange={(_, d) => setDefaultValveType(d.value)}
                />
              </Field>
              <Field label="Default Gauges">
                <Input
                  value={defaultGauges}
                  onChange={(_, d) => setDefaultGauges(d.value)}
                />
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(_, d) => !d.open && setDeleteConfirm(null)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              {deleteError ? (
                <MessageBar intent="error">
                  <MessageBarBody>{deleteError}</MessageBarBody>
                </MessageBar>
              ) : (
                <Body1>
                  Are you sure you want to delete this{" "}
                  {deleteConfirm?.type}?
                </Body1>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button appearance="primary" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
