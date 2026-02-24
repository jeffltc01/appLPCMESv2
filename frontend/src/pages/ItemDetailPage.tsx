import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Field,
  Dropdown,
  Option,
  Switch,
  Subtitle1,
  Subtitle2,
  MessageBar,
  MessageBarBody,
  Divider,
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
} from "@fluentui/react-components";
import {
  Save24Regular,
  ArrowLeft24Regular,
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
} from "@fluentui/react-icons";
import { itemsApi, itemLookupsApi } from "../services/items";
import { pricingsApi, crossRefsApi } from "../services/items";
import { ApiError } from "../services/api";
import type {
  ItemDetail,
  ItemUpdate,
  PricingRecord,
  CrossReference,
  ItemSizeLookup,
} from "../types/item";
import { PricingDialog } from "../components/items/PricingDialog";
import { CrossReferenceDialog } from "../components/items/CrossReferenceDialog";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    flexWrap: "wrap",
  },
  headerTitle: {
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
  switchRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  section: {
    marginTop: tokens.spacingVerticalL,
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
  priceCell: {
    textAlign: "right" as const,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
  },
});

type TabValue = "details" | "pricing" | "crossrefs";

const ITEM_TYPES = ["Regular Item", "Misc Item", "Comment Item", "Charge Item"];

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const styles = useStyles();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [tab, setTab] = useState<TabValue>("details");

  const [sizes, setSizes] = useState<ItemSizeLookup[]>([]);

  // Detail form fields
  const [itemNo, setItemNo] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("Regular Item");
  const [productLine, setProductLine] = useState("");
  const [itemSizeId, setItemSizeId] = useState<string>("");
  const [systemCode, setSystemCode] = useState("");
  const [requiresSerialNumbers, setRequiresSerialNumbers] = useState(false);
  const [requiresGaugeOption, setRequiresGaugeOption] = useState(false);
  const [requiresFillerOption, setRequiresFillerOption] = useState(false);
  const [requiresCollarOption, setRequiresCollarOption] = useState(false);
  const [requiresFootRingOption, setRequiresFootRingOption] = useState(false);
  const [requiresValveTypeOption, setRequiresValveTypeOption] = useState(false);

  // Pricing dialog
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<PricingRecord | null>(null);
  const [isCustomerPricing, setIsCustomerPricing] = useState(false);

  // Cross reference dialog
  const [crossRefDialogOpen, setCrossRefDialogOpen] = useState(false);
  const [editingCrossRef, setEditingCrossRef] = useState<CrossReference | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "pricing" | "crossref";
    id: number;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const populateForm = useCallback((i: ItemDetail) => {
    setItemNo(i.itemNo);
    setDescription(i.itemDescription ?? "");
    setItemType(i.itemType);
    setProductLine(i.productLine ?? "");
    setItemSizeId(i.itemSizeId?.toString() ?? "");
    setSystemCode(i.systemCode ?? "");
    setRequiresSerialNumbers(i.requiresSerialNumbers === 1);
    setRequiresGaugeOption(i.requiresGaugeOption === true);
    setRequiresFillerOption(i.requiresFillerOption === true);
    setRequiresCollarOption(i.requiresCollarOption === true);
    setRequiresFootRingOption(i.requiresFootRingOption === true);
    setRequiresValveTypeOption(i.requiresValveTypeOption === true);
  }, []);

  const loadItem = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const i = await itemsApi.get(Number(id));
      setItem(i);
      populateForm(i);
    } finally {
      setLoading(false);
    }
  }, [id, populateForm]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  useEffect(() => {
    itemLookupsApi.itemSizes().then(setSizes);
  }, []);

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const dto: ItemUpdate = {
        itemNo: itemNo.trim(),
        itemDescription: description.trim() || null,
        itemType,
        productLine: productLine.trim() || null,
        itemSizeId: itemSizeId ? Number(itemSizeId) : null,
        systemCode: systemCode.trim() || null,
        requiresSerialNumbers: requiresSerialNumbers ? 1 : 0,
        requiresGaugeOption: requiresGaugeOption || null,
        requiresFillerOption: requiresFillerOption || null,
        requiresCollarOption: requiresCollarOption || null,
        requiresFootRingOption: requiresFootRingOption || null,
        requiresValveTypeOption: requiresValveTypeOption || null,
      };
      const updated = await itemsApi.update(item.id, dto);
      setItem(updated);
      populateForm(updated);
      setSaveMsg({ type: "success", text: "Item saved." });
    } catch (err) {
      const body = (err as ApiError).body as { message?: string } | undefined;
      setSaveMsg({
        type: "error",
        text: body?.message ?? "Failed to save item.",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || !item) return;
    try {
      if (deleteConfirm.type === "pricing") {
        await pricingsApi.delete(item.id, deleteConfirm.id);
      } else {
        await crossRefsApi.delete(deleteConfirm.id);
      }
      setDeleteConfirm(null);
      loadItem();
    } catch (err) {
      if (err instanceof ApiError && err.body) {
        const body = err.body as { message?: string };
        setDeleteError(body.message ?? "Cannot delete.");
      } else {
        setDeleteError("Failed to delete.");
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="large" label="Loading item..." />
      </div>
    );
  }

  if (!item) {
    return (
      <div className={styles.center}>
        <Body1>Item not found.</Body1>
      </div>
    );
  }

  const basePricings = item.pricings.filter((p) => p.customerId == null);
  const customerPricings = item.pricings.filter((p) => p.customerId != null);

  const formatCurrency = (v: number | null) =>
    v != null ? `$${v.toFixed(2)}` : "--";

  const sizeDropdownValue =
    sizes.find((s) => String(s.id) === itemSizeId)?.name ?? "";

  return (
    <div>
      <div className={styles.header}>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate("/items")}
        />
        <div className={styles.headerTitle}>
          <Title2>
            {item.itemNo} — {item.itemDescription || "Untitled"}
          </Title2>
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
        <Tab value="pricing">Pricing ({item.pricings.length})</Tab>
        <Tab value="crossrefs">
          Cross References ({item.crossReferences.length})
        </Tab>
      </TabList>

      <div className={styles.tabContent}>
        {/* ---- DETAILS TAB ---- */}
        {tab === "details" && (
          <div className={styles.form}>
            <div className={styles.row}>
              <Field label="Item No" required>
                <Input value={itemNo} onChange={(_, d) => setItemNo(d.value)} />
              </Field>
              <Field label="Item Type">
                <Dropdown
                  value={itemType}
                  selectedOptions={[itemType]}
                  onOptionSelect={(_, d) =>
                    setItemType(d.optionValue ?? "Regular Item")
                  }
                >
                  {ITEM_TYPES.map((t) => (
                    <Option key={t} value={t}>
                      {t}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>
            <Field label="Description">
              <Input
                value={description}
                onChange={(_, d) => setDescription(d.value)}
              />
            </Field>
            <div className={styles.row}>
              <Field label="Product Line">
                <Input
                  value={productLine}
                  onChange={(_, d) => setProductLine(d.value)}
                />
              </Field>
              <Field label="Size">
                <Dropdown
                  value={sizeDropdownValue}
                  selectedOptions={itemSizeId ? [itemSizeId] : []}
                  onOptionSelect={(_, d) =>
                    setItemSizeId(d.optionValue ?? "")
                  }
                  clearable
                >
                  {sizes.map((s) => (
                    <Option key={s.id} value={String(s.id)}>
                      {s.name}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>
            <Field label="System Code">
              <Input
                value={systemCode}
                onChange={(_, d) => setSystemCode(d.value)}
              />
            </Field>

            <Divider />
            <Subtitle2>Option Flags</Subtitle2>
            <div className={styles.switchRow}>
              <Switch
                label="Requires Gauge"
                checked={requiresGaugeOption}
                onChange={(_, d) => setRequiresGaugeOption(d.checked)}
              />
              <Switch
                label="Requires Filler"
                checked={requiresFillerOption}
                onChange={(_, d) => setRequiresFillerOption(d.checked)}
              />
              <Switch
                label="Requires Collar"
                checked={requiresCollarOption}
                onChange={(_, d) => setRequiresCollarOption(d.checked)}
              />
            </div>
            <div className={styles.switchRow}>
              <Switch
                label="Requires Foot Ring"
                checked={requiresFootRingOption}
                onChange={(_, d) => setRequiresFootRingOption(d.checked)}
              />
              <Switch
                label="Requires Valve Type"
                checked={requiresValveTypeOption}
                onChange={(_, d) => setRequiresValveTypeOption(d.checked)}
              />
              <Switch
                label="Requires Serial Numbers"
                checked={requiresSerialNumbers}
                onChange={(_, d) => setRequiresSerialNumbers(d.checked)}
              />
            </div>
          </div>
        )}

        {/* ---- PRICING TAB ---- */}
        {tab === "pricing" && (
          <div>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Subtitle1>Base Pricing</Subtitle1>
                <Button
                  appearance="subtle"
                  icon={<Add24Regular />}
                  onClick={() => {
                    setEditingPricing(null);
                    setIsCustomerPricing(false);
                    setPricingDialogOpen(true);
                  }}
                >
                  Add Base Price
                </Button>
              </div>
              {basePricings.length === 0 ? (
                <Body1>No base pricing set.</Body1>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Effective Date</TableHeaderCell>
                      <TableHeaderCell>Unit Price</TableHeaderCell>
                      <TableHeaderCell>Notes</TableHeaderCell>
                      <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {basePricings.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.effectiveDate}</TableCell>
                        <TableCell className={styles.priceCell}>
                          {formatCurrency(p.unitPrice)}
                        </TableCell>
                        <TableCell>{p.notes}</TableCell>
                        <TableCell>
                          <div className={styles.actions}>
                            <Button
                              appearance="subtle"
                              icon={<Edit24Regular />}
                              size="small"
                              onClick={() => {
                                setEditingPricing(p);
                                setIsCustomerPricing(false);
                                setPricingDialogOpen(true);
                              }}
                            />
                            <Button
                              appearance="subtle"
                              icon={<Delete24Regular />}
                              size="small"
                              onClick={() => {
                                setDeleteConfirm({ type: "pricing", id: p.id });
                                setDeleteError(null);
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <Divider style={{ marginTop: tokens.spacingVerticalL }} />

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Subtitle1>Customer Pricing</Subtitle1>
                <Button
                  appearance="subtle"
                  icon={<Add24Regular />}
                  onClick={() => {
                    setEditingPricing(null);
                    setIsCustomerPricing(true);
                    setPricingDialogOpen(true);
                  }}
                >
                  Add Customer Price
                </Button>
              </div>
              {customerPricings.length === 0 ? (
                <Body1>No customer-specific pricing.</Body1>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Customer</TableHeaderCell>
                      <TableHeaderCell>Effective Date</TableHeaderCell>
                      <TableHeaderCell>Unit Price</TableHeaderCell>
                      <TableHeaderCell>Notes</TableHeaderCell>
                      <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerPricings.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.customerName}</TableCell>
                        <TableCell>{p.effectiveDate}</TableCell>
                        <TableCell className={styles.priceCell}>
                          {formatCurrency(p.unitPrice)}
                        </TableCell>
                        <TableCell>{p.notes}</TableCell>
                        <TableCell>
                          <div className={styles.actions}>
                            <Button
                              appearance="subtle"
                              icon={<Edit24Regular />}
                              size="small"
                              onClick={() => {
                                setEditingPricing(p);
                                setIsCustomerPricing(true);
                                setPricingDialogOpen(true);
                              }}
                            />
                            <Button
                              appearance="subtle"
                              icon={<Delete24Regular />}
                              size="small"
                              onClick={() => {
                                setDeleteConfirm({ type: "pricing", id: p.id });
                                setDeleteError(null);
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <PricingDialog
              open={pricingDialogOpen}
              itemId={item.id}
              pricing={editingPricing}
              isCustomerPricing={isCustomerPricing}
              onClose={() => setPricingDialogOpen(false)}
              onSaved={() => {
                setPricingDialogOpen(false);
                loadItem();
              }}
            />
          </div>
        )}

        {/* ---- CROSS REFERENCES TAB ---- */}
        {tab === "crossrefs" && (
          <div>
            <div className={styles.sectionHeader}>
              <Subtitle1>Part Cross References</Subtitle1>
              <Button
                appearance="subtle"
                icon={<Add24Regular />}
                onClick={() => {
                  setEditingCrossRef(null);
                  setCrossRefDialogOpen(true);
                }}
              >
                Add Cross Reference
              </Button>
            </div>
            {item.crossReferences.length === 0 ? (
              <Body1>No cross references.</Body1>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Alternate Part Number</TableHeaderCell>
                    <TableHeaderCell>Internal Item Number</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.crossReferences.map((cr) => (
                    <TableRow key={cr.id}>
                      <TableCell>{cr.lpcItemNumber}</TableCell>
                      <TableCell>{cr.erpItemNumber}</TableCell>
                      <TableCell>
                        <div className={styles.actions}>
                          <Button
                            appearance="subtle"
                            icon={<Edit24Regular />}
                            size="small"
                            onClick={() => {
                              setEditingCrossRef(cr);
                              setCrossRefDialogOpen(true);
                            }}
                          />
                          <Button
                            appearance="subtle"
                            icon={<Delete24Regular />}
                            size="small"
                            onClick={() => {
                              setDeleteConfirm({ type: "crossref", id: cr.id });
                              setDeleteError(null);
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <CrossReferenceDialog
              open={crossRefDialogOpen}
              crossRef={editingCrossRef}
              defaultErpItemNumber={item.itemNo}
              onClose={() => setCrossRefDialogOpen(false)}
              onSaved={() => {
                setCrossRefDialogOpen(false);
                loadItem();
              }}
            />
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
                  {deleteConfirm?.type === "pricing"
                    ? "pricing record"
                    : "cross reference"}
                  ?
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
