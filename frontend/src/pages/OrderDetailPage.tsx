import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  makeStyles,
  tokens,
  Title2,
  Body1,
  Spinner,
  TabList,
  Tab,
  Button,
  Field,
  Input,
  Dropdown,
  Combobox,
  Option,
  Textarea,
  MessageBar,
  MessageBarBody,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
} from "@fluentui/react-components";
import {
  ArrowLeft24Regular,
  Save24Regular,
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
} from "@fluentui/react-icons";
import { ApiError } from "../services/api";
import { ordersApi, orderLookupsApi, orderLinesApi } from "../services/orders";
import { customersApi } from "../services/customers";
import type {
  AddressLookup,
  OrderDraftCreate,
  OrderDraftDetail,
  OrderDraftUpdate,
  OrderLine,
} from "../types/order";
import type { Lookup, SalesPersonLookup } from "../types/customer";
import { OrderLineDialog } from "../components/orders/OrderLineDialog";
import { OrderWorkflowWidget } from "../components/orders/OrderWorkflowWidget";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    flexWrap: "wrap",
  },
  titleWrap: {
    flexGrow: 1,
  },
  tabContent: {
    marginTop: tokens.spacingVerticalL,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    maxWidth: "820px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  rowThree: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalS,
  },
  center: {
    display: "flex",
    justifyContent: "center",
    marginTop: tokens.spacingVerticalXXL,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
  },
  priceCell: {
    textAlign: "right" as const,
  },
  customerFieldWrap: {
    position: "relative",
  },
  customerOpenButton: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: "unset",
  },
});

type TabValue = "details" | "lines";

const formatCurrency = (value: number | null) =>
  value != null ? `$${value.toFixed(2)}` : "--";

export function OrderDetailPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const orderId = id ? Number(id) : null;
  const isNew = orderId === null || Number.isNaN(orderId);

  const [tab, setTab] = useState<TabValue>("details");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [advancingStatus, setAdvancingStatus] = useState(false);
  const [pendingAdvanceStatus, setPendingAdvanceStatus] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDraftDetail | null>(null);

  const [customers, setCustomers] = useState<Lookup[]>([]);
  const [sites, setSites] = useState<Lookup[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<Lookup[]>([]);
  const [shipVias, setShipVias] = useState<Lookup[]>([]);
  const [salesPeople, setSalesPeople] = useState<SalesPersonLookup[]>([]);
  const [billToAddresses, setBillToAddresses] = useState<AddressLookup[]>([]);
  const [shipToAddresses, setShipToAddresses] = useState<AddressLookup[]>([]);

  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<OrderLine | null>(null);
  const [deleteLineId, setDeleteLineId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Header form
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerPoNo, setCustomerPoNo] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [comments, setComments] = useState("");
  const [priority, setPriority] = useState("");
  const [salesPersonQuery, setSalesPersonQuery] = useState("");
  const [salesPersonId, setSalesPersonId] = useState("");
  const [billToAddressId, setBillToAddressId] = useState("");
  const [pickUpAddressId, setPickUpAddressId] = useState("");
  const [shipToAddressId, setShipToAddressId] = useState("");
  const [pickUpViaId, setPickUpViaId] = useState("");
  const [shipToViaId, setShipToViaId] = useState("");
  const [paymentTermId, setPaymentTermId] = useState("");
  const [returnScrap, setReturnScrap] = useState(false);
  const [returnBrass, setReturnBrass] = useState(false);

  const populateForm = useCallback((draft: OrderDraftDetail) => {
    setCustomerId(String(draft.customerId));
    setSiteId(String(draft.siteId));
    setOrderDate(draft.orderDate);
    setCustomerPoNo(draft.customerPoNo ?? "");
    setContact(draft.contact ?? "");
    setPhone(draft.phone ?? "");
    setComments(draft.comments ?? "");
    setPriority(draft.priority != null ? String(draft.priority) : "");
    setSalesPersonId(draft.salesPersonId != null ? String(draft.salesPersonId) : "");
    setBillToAddressId(
      draft.billToAddressId != null ? String(draft.billToAddressId) : ""
    );
    setPickUpAddressId(
      draft.pickUpAddressId != null ? String(draft.pickUpAddressId) : ""
    );
    setShipToAddressId(
      draft.shipToAddressId != null ? String(draft.shipToAddressId) : ""
    );
    setPickUpViaId(draft.pickUpViaId != null ? String(draft.pickUpViaId) : "");
    setShipToViaId(draft.shipToViaId != null ? String(draft.shipToViaId) : "");
    setPaymentTermId(
      draft.paymentTermId != null ? String(draft.paymentTermId) : ""
    );
    setReturnScrap(draft.returnScrap === 1);
    setReturnBrass(draft.returnBrass === 1);
  }, []);

  const loadOrder = useCallback(async () => {
    if (!orderId || isNew) return;
    setLoading(true);
    try {
      const draft = await ordersApi.get(orderId);
      setOrder(draft);
      populateForm(draft);
    } finally {
      setLoading(false);
    }
  }, [orderId, isNew, populateForm]);

  useEffect(() => {
    Promise.all([
      orderLookupsApi.activeCustomers(),
      orderLookupsApi.sites(),
      orderLookupsApi.paymentTerms(),
      orderLookupsApi.shipVias(),
      orderLookupsApi.salesPeople(),
    ]).then(([c, s, pt, sv, sp]) => {
      setCustomers(c);
      setSites(s);
      setPaymentTerms(pt);
      setShipVias(sv);
      setSalesPeople(sp);
    });
  }, []);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!customerId) {
      setBillToAddresses([]);
      setShipToAddresses([]);
      return;
    }

    Promise.all([
      orderLookupsApi.customerAddresses(Number(customerId), "BILL_TO"),
      orderLookupsApi.customerAddresses(Number(customerId), "SHIP_TO"),
    ]).then(([billTo, shipTo]) => {
      setBillToAddresses(billTo);
      setShipToAddresses(shipTo);
    });

    if (isNew) {
      customersApi.get(Number(customerId)).then((customer) => {
        const resolvedShipTo =
          customer.defaultShipToId ?? customer.defaultPickUpId;
        const resolvedPickUp =
          customer.defaultPickUpId ?? customer.defaultShipToId;

        setBillToAddressId(
          customer.defaultBillToId != null ? String(customer.defaultBillToId) : ""
        );
        setShipToAddressId(
          resolvedShipTo != null ? String(resolvedShipTo) : ""
        );
        setPickUpAddressId(
          resolvedPickUp != null ? String(resolvedPickUp) : ""
        );
      });
    }
  }, [customerId, isNew]);

  useEffect(() => {
    setCustomerQuery(getLookupName(customers, customerId));
  }, [customerId, customers]);

  useEffect(() => {
    setSalesPersonQuery(getLookupName(salesPeople, salesPersonId));
  }, [salesPersonId, salesPeople]);

  const getLookupName = (
    options: { id: number; name: string }[],
    selectedId: string
  ) => {
    if (!selectedId) return "";
    return options.find((option) => String(option.id) === selectedId)?.name ?? "";
  };

  const saveOrder = async () => {
    if (!customerId || !siteId) {
      setSaveMsg({
        type: "error",
        text: "Customer and Site are required before saving.",
      });
      return;
    }

    setSaving(true);
    setSaveMsg(null);

    try {
      if (isNew) {
        const payload: OrderDraftCreate = {
          customerId: Number(customerId),
          siteId: Number(siteId),
          orderDate,
          customerPoNo: customerPoNo.trim() || null,
          contact: contact.trim() || null,
          phone: phone.trim() || null,
          comments: comments.trim() || null,
          priority: priority ? Number(priority) : null,
          salesPersonId: salesPersonId ? Number(salesPersonId) : null,
          billToAddressId: billToAddressId ? Number(billToAddressId) : null,
          pickUpAddressId: pickUpAddressId ? Number(pickUpAddressId) : null,
          shipToAddressId: shipToAddressId ? Number(shipToAddressId) : null,
          pickUpViaId: pickUpViaId ? Number(pickUpViaId) : null,
          shipToViaId: shipToViaId ? Number(shipToViaId) : null,
          paymentTermId: paymentTermId ? Number(paymentTermId) : null,
          returnScrap: returnScrap ? 1 : 0,
          returnBrass: returnBrass ? 1 : 0,
        };

        const created = await ordersApi.create(payload);
        setSaveMsg({ type: "success", text: "Draft order created." });
        navigate(`/orders/${created.id}`);
        return;
      }

      const payload: OrderDraftUpdate = {
        customerId: Number(customerId),
        siteId: Number(siteId),
        orderDate,
        customerPoNo: customerPoNo.trim() || null,
        contact: contact.trim() || null,
        phone: phone.trim() || null,
        comments: comments.trim() || null,
        priority: priority ? Number(priority) : null,
        salesPersonId: salesPersonId ? Number(salesPersonId) : null,
        billToAddressId: billToAddressId ? Number(billToAddressId) : null,
        pickUpAddressId: pickUpAddressId ? Number(pickUpAddressId) : null,
        shipToAddressId: shipToAddressId ? Number(shipToAddressId) : null,
        pickUpViaId: pickUpViaId ? Number(pickUpViaId) : null,
        shipToViaId: shipToViaId ? Number(shipToViaId) : null,
        paymentTermId: paymentTermId ? Number(paymentTermId) : null,
        returnScrap: returnScrap ? 1 : 0,
        returnBrass: returnBrass ? 1 : 0,
      };

      const updated = await ordersApi.update(orderId!, payload);
      setOrder(updated);
      populateForm(updated);
      setSaveMsg({ type: "success", text: "Draft order saved." });
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setSaveMsg({
        type: "error",
        text: body?.message ?? "Failed to save draft order.",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeLine = async () => {
    if (!order || deleteLineId == null) return;

    try {
      await orderLinesApi.delete(order.id, deleteLineId);
      setDeleteLineId(null);
      setDeleteError(null);
      await loadOrder();
    } catch {
      setDeleteError("Failed to delete line.");
    }
  };

  const totalLineAmount = useMemo(() => {
    const lines = order?.lines ?? [];
    return lines.reduce((sum, line) => sum + (line.extension ?? 0), 0);
  }, [order]);

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(query)
    );
  }, [customers, customerQuery]);

  const filteredSalesPeople = useMemo(() => {
    const query = salesPersonQuery.trim().toLowerCase();
    if (!query) return salesPeople;
    return salesPeople.filter((person) =>
      person.name.toLowerCase().includes(query)
    );
  }, [salesPeople, salesPersonQuery]);

  const openCustomerDetails = () => {
    if (!customerId) return;
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);
    navigate(`/customers/${customerId}?returnTo=${returnTo}`);
  };

  const advanceToStatus = async (targetStatus: string) => {
    if (!order || isNew) return;

    setAdvancingStatus(true);
    try {
      const updated = await ordersApi.advanceStatus(order.id, targetStatus);
      setOrder(updated);
      populateForm(updated);
      setSaveMsg({ type: "success", text: `Order moved to ${updated.orderStatus}.` });
    } catch (err) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string } | undefined;
      setSaveMsg({
        type: "error",
        text: body?.message ?? "Failed to advance order status.",
      });
    } finally {
      setAdvancingStatus(false);
    }
  };

  const requestAdvanceStatus = (targetStatus: string) => {
    setPendingAdvanceStatus(targetStatus);
  };

  const confirmAdvanceStatus = async () => {
    if (!pendingAdvanceStatus) return;
    const targetStatus = pendingAdvanceStatus;
    setPendingAdvanceStatus(null);
    await advanceToStatus(targetStatus);
  };

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="large" label="Loading order..." />
      </div>
    );
  }

  if (!isNew && !order) {
    return (
      <div className={styles.center}>
        <Body1>Order not found.</Body1>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate("/orders")}
        />
        <div className={styles.titleWrap}>
          <Title2>
            {isNew
              ? "New Draft Order"
              : `${order?.salesOrderNo ?? ""} (${order?.orderStatus ?? "New"})`}
          </Title2>
        </div>
        <Button
          appearance="primary"
          icon={<Save24Regular />}
          onClick={saveOrder}
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

      <OrderWorkflowWidget
        currentStatus={isNew ? "New" : order?.orderStatus}
        dates={{
          orderCreatedDate: isNew
            ? orderDate
            : order?.orderCreatedDate ?? orderDate,
          readyForPickupDate: isNew ? null : order?.readyForPickupDate ?? null,
          pickupScheduledDate: isNew ? null : order?.pickupScheduledDate ?? null,
          receivedDate: isNew ? null : order?.receivedDate ?? null,
          readyToShipDate: isNew ? null : order?.readyToShipDate ?? null,
          readyToInvoiceDate: isNew ? null : order?.readyToInvoiceDate ?? null,
        }}
        onAdvanceStatus={isNew ? undefined : requestAdvanceStatus}
        canAdvance={!isNew}
        isAdvancing={advancingStatus}
      />

      <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as TabValue)}>
        <Tab value="details">Details</Tab>
        <Tab value="lines">Lines ({order?.lines.length ?? 0})</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {tab === "details" && (
          <div className={styles.form}>
            <div className={styles.row}>
              <div className={styles.customerFieldWrap}>
                <Field required label="Customer">
                  <Combobox
                    value={customerQuery}
                    selectedOptions={customerId ? [customerId] : []}
                    onChange={(event) => {
                      const value = event.target.value;
                      setCustomerQuery(value);
                      if (!value) setCustomerId("");
                    }}
                    onOptionSelect={(_, data) =>
                      {
                        setCustomerId(data.optionValue ?? "");
                        setCustomerQuery(data.optionText ?? "");
                      }
                    }
                    placeholder="Type to search customer..."
                  >
                    {filteredCustomers.map((customer) => (
                      <Option key={customer.id} value={String(customer.id)}>
                        {customer.name}
                      </Option>
                    ))}
                  </Combobox>
                </Field>
                <Button
                  appearance="secondary"
                  size="small"
                  onClick={openCustomerDetails}
                  disabled={!customerId}
                  className={styles.customerOpenButton}
                >
                  Open
                </Button>
              </div>
              <Field label="Site" required>
                <Dropdown
                  value={getLookupName(sites, siteId)}
                  selectedOptions={siteId ? [siteId] : []}
                  onOptionSelect={(_, data) => setSiteId(data.optionValue ?? "")}
                >
                  {sites.map((site) => (
                    <Option key={site.id} value={String(site.id)}>
                      {site.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>

            <div className={styles.row}>
              <Field label="Order Date">
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(_, data) => setOrderDate(data.value)}
                />
              </Field>
              <Field label="Customer PO">
                <Input
                  value={customerPoNo}
                  onChange={(_, data) => setCustomerPoNo(data.value)}
                />
              </Field>
            </div>

            <div className={styles.row}>
              <Field label="Contact">
                <Input
                  value={contact}
                  onChange={(_, data) => setContact(data.value)}
                />
              </Field>
              <Field label="Phone">
                <Input value={phone} onChange={(_, data) => setPhone(data.value)} />
              </Field>
            </div>

            <div className={styles.rowThree}>
              <Field label="Priority">
                <Input
                  type="number"
                  value={priority}
                  onChange={(_, data) => setPriority(data.value)}
                />
              </Field>
              <Field label="Salesperson">
                <Combobox
                  value={salesPersonQuery}
                  selectedOptions={salesPersonId ? [salesPersonId] : []}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSalesPersonQuery(value);
                    if (!value) setSalesPersonId("");
                  }}
                  onOptionSelect={(_, data) =>
                    {
                      setSalesPersonId(data.optionValue ?? "");
                      setSalesPersonQuery(data.optionText ?? "");
                    }
                  }
                  placeholder="Type to search salesperson..."
                  clearable
                >
                  {filteredSalesPeople.map((person) => (
                    <Option key={person.id} value={String(person.id)}>
                      {person.name}
                    </Option>
                  ))}
                </Combobox>
              </Field>
              <Field label="Payment Terms">
                <Dropdown
                  value={getLookupName(paymentTerms, paymentTermId)}
                  selectedOptions={paymentTermId ? [paymentTermId] : []}
                  onOptionSelect={(_, data) =>
                    setPaymentTermId(data.optionValue ?? "")
                  }
                  clearable
                >
                  {paymentTerms.map((term) => (
                    <Option key={term.id} value={String(term.id)}>
                      {term.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>

            <div className={styles.row}>
              <Field label="Bill To Address">
                <Dropdown
                  value={getLookupName(billToAddresses, billToAddressId)}
                  selectedOptions={billToAddressId ? [billToAddressId] : []}
                  onOptionSelect={(_, data) =>
                    setBillToAddressId(data.optionValue ?? "")
                  }
                  clearable
                >
                  {billToAddresses.map((address) => (
                    <Option key={address.id} value={String(address.id)}>
                      {address.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Ship To Address">
                <Dropdown
                  value={getLookupName(shipToAddresses, shipToAddressId)}
                  selectedOptions={shipToAddressId ? [shipToAddressId] : []}
                  onOptionSelect={(_, data) =>
                    setShipToAddressId(data.optionValue ?? "")
                  }
                  clearable
                >
                  {shipToAddresses.map((address) => (
                    <Option key={address.id} value={String(address.id)}>
                      {address.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>

            <div className={styles.row}>
              <Field label="Pick Up Address">
                <Dropdown
                  value={getLookupName(shipToAddresses, pickUpAddressId)}
                  selectedOptions={pickUpAddressId ? [pickUpAddressId] : []}
                  onOptionSelect={(_, data) =>
                    setPickUpAddressId(data.optionValue ?? "")
                  }
                  clearable
                >
                  {shipToAddresses.map((address) => (
                    <Option key={address.id} value={String(address.id)}>
                      {address.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Pick Up Via">
                <Dropdown
                  value={getLookupName(shipVias, pickUpViaId)}
                  selectedOptions={pickUpViaId ? [pickUpViaId] : []}
                  onOptionSelect={(_, data) =>
                    setPickUpViaId(data.optionValue ?? "")
                  }
                  clearable
                >
                  {shipVias.map((via) => (
                    <Option key={via.id} value={String(via.id)}>
                      {via.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>

            <div className={styles.row}>
              <Field label="Ship To Via">
                <Dropdown
                  value={getLookupName(shipVias, shipToViaId)}
                  selectedOptions={shipToViaId ? [shipToViaId] : []}
                  onOptionSelect={(_, data) =>
                    setShipToViaId(data.optionValue ?? "")
                  }
                  clearable
                >
                  {shipVias.map((via) => (
                    <Option key={via.id} value={String(via.id)}>
                      {via.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>

            <div className={styles.row}>
              <Switch
                label="Return Scrap"
                checked={returnScrap}
                onChange={(_, data) => setReturnScrap(data.checked)}
              />
              <Switch
                label="Return Brass"
                checked={returnBrass}
                onChange={(_, data) => setReturnBrass(data.checked)}
              />
            </div>

            <Field label="Comments">
              <Textarea
                value={comments}
                onChange={(_, data) => setComments(data.value)}
                rows={4}
              />
            </Field>
          </div>
        )}

        {tab === "lines" && (
          <div>
            <div className={styles.sectionHeader}>
              <Body1 style={{ fontWeight: tokens.fontWeightSemibold }}>
                Order Lines
              </Body1>
              <Button
                appearance="primary"
                icon={<Add24Regular />}
                onClick={() => {
                  setEditingLine(null);
                  setLineDialogOpen(true);
                }}
                disabled={isNew || !order}
              >
                Add Line
              </Button>
            </div>

            {isNew ? (
              <Body1>Save the draft header first, then add lines.</Body1>
            ) : !order || order.lines.length === 0 ? (
              <Body1>No lines yet.</Body1>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Line</TableHeaderCell>
                      <TableHeaderCell>Item</TableHeaderCell>
                      <TableHeaderCell>Qty Ordered</TableHeaderCell>
                      <TableHeaderCell>Unit Price</TableHeaderCell>
                      <TableHeaderCell>Extension</TableHeaderCell>
                      <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.lineNo}</TableCell>
                        <TableCell>
                          {line.itemNo} - {line.itemDescription}
                        </TableCell>
                        <TableCell>{line.quantityAsOrdered}</TableCell>
                        <TableCell className={styles.priceCell}>
                          {formatCurrency(line.unitPrice)}
                        </TableCell>
                        <TableCell className={styles.priceCell}>
                          {formatCurrency(line.extension)}
                        </TableCell>
                        <TableCell>
                          <div className={styles.actions}>
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Edit24Regular />}
                              onClick={() => {
                                setEditingLine(line);
                                setLineDialogOpen(true);
                              }}
                            />
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Delete24Regular />}
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteLineId(line.id);
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Body1 style={{ marginTop: tokens.spacingVerticalM }}>
                  Total Extension: {formatCurrency(totalLineAmount)}
                </Body1>
              </>
            )}

            {!isNew && order && (
              <OrderLineDialog
                open={lineDialogOpen}
                orderId={order.id}
                line={editingLine}
                onClose={() => setLineDialogOpen(false)}
                onSaved={async () => {
                  setLineDialogOpen(false);
                  await loadOrder();
                }}
              />
            )}
          </div>
        )}
      </div>

      <Dialog
        open={deleteLineId !== null}
        onOpenChange={(_, data) => !data.open && setDeleteLineId(null)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete Line</DialogTitle>
            <DialogContent>
              {deleteError ? (
                <MessageBar intent="error">
                  <MessageBarBody>{deleteError}</MessageBarBody>
                </MessageBar>
              ) : (
                <Body1>Are you sure you want to delete this line?</Body1>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDeleteLineId(null)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={removeLine}>
                Delete
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={pendingAdvanceStatus !== null}
        onOpenChange={(_, data) => !data.open && setPendingAdvanceStatus(null)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Advance Workflow Status</DialogTitle>
            <DialogContent>
              <Body1>
                Move this order from <strong>{order?.orderStatus ?? "New"}</strong> to{" "}
                <strong>{pendingAdvanceStatus ?? ""}</strong>?
              </Body1>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setPendingAdvanceStatus(null)}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={confirmAdvanceStatus}
                disabled={advancingStatus}
              >
                {advancingStatus ? "Advancing..." : "Confirm"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
