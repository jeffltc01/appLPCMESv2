import { useEffect, useMemo, useState } from "react";
import {
  Body1,
  Button,
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
  Select,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../services/api";
import { itemLookupsApi, itemsApi } from "../services/items";
import type { ItemDetail, ItemListItem, ItemSizeLookup } from "../types/item";
import { NewItemDialog } from "../components/items/NewItemDialog";

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
    gap: tokens.spacingVerticalM,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
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
  itemsScrollRegion: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  filterBar: {
    display: "flex",
    alignItems: "end",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  filterField: {
    minWidth: "220px",
  },
});

const DEFAULT_ITEM_TYPES = ["Regular Item", "Misc Item", "Comment Item", "Charge Item"];

interface EditFormState {
  itemNo: string;
  itemDescription: string;
  itemType: string;
  productLine: string;
  itemSizeId: string;
}

export function ItemsSetupPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ItemListItem[]>([]);
  const [itemTypes, setItemTypes] = useState<string[]>(DEFAULT_ITEM_TYPES);
  const [itemSizes, setItemSizes] = useState<ItemSizeLookup[]>([]);
  const [productLines, setProductLines] = useState<string[]>([]);
  const [productLineFilter, setProductLineFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ItemDetail | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    itemNo: "",
    itemDescription: "",
    itemType: DEFAULT_ITEM_TYPES[0],
    productLine: "",
    itemSizeId: "",
  });

  const selectedSizeName = useMemo(
    () => itemSizes.find((size) => String(size.id) === editForm.itemSizeId)?.name ?? "",
    [editForm.itemSizeId, itemSizes]
  );
  const productLineFilterOptions = useMemo(() => {
    const valuesFromLookup = productLines.map((line) => line.trim()).filter((line) => line.length > 0);
    if (valuesFromLookup.length > 0) {
      return ["All", ...valuesFromLookup];
    }
    const valuesFromRows = Array.from(
      new Set(rows.map((row) => row.productLine?.trim()).filter((value): value is string => Boolean(value)))
    );
    return ["All", ...valuesFromRows];
  }, [productLines, rows]);
  const filteredRows = useMemo(() => {
    if (productLineFilter === "All") {
      return rows;
    }
    return rows.filter((row) => (row.productLine ?? "").trim() === productLineFilter);
  }, [productLineFilter, rows]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listResponse, typeValues, sizes, productLineValues] = await Promise.all([
        itemsApi.list({ page: 1, pageSize: 500 }),
        itemLookupsApi.itemTypes(),
        itemLookupsApi.itemSizes(),
        itemLookupsApi.productLines("OrderProduct"),
      ]);
      setRows(listResponse.items);
      setItemTypes(typeValues.length > 0 ? typeValues : DEFAULT_ITEM_TYPES);
      setItemSizes(sizes);
      setProductLines(productLineValues);
    } catch {
      setError("Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const startEdit = async (itemId: number) => {
    setError(null);
    try {
      const detail = await itemsApi.get(itemId);
      setEditing(detail);
      setEditForm({
        itemNo: detail.itemNo,
        itemDescription: detail.itemDescription ?? "",
        itemType: detail.itemType,
        productLine: detail.productLine ?? "",
        itemSizeId: detail.itemSizeId ? String(detail.itemSizeId) : "",
      });
      setEditOpen(true);
    } catch {
      setError("Failed to load item details.");
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editForm.itemNo.trim()) {
      setError("Item No is required.");
      return;
    }

    setEditSaving(true);
    setError(null);
    try {
      await itemsApi.update(editing.id, {
        itemNo: editForm.itemNo.trim(),
        itemDescription: editForm.itemDescription.trim() || null,
        itemType: editForm.itemType,
        productLine: editForm.productLine || null,
        itemSizeId: editForm.itemSizeId ? Number(editForm.itemSizeId) : null,
        systemCode: editing.systemCode,
        requiresSerialNumbers: editing.requiresSerialNumbers,
        requiresGaugeOption: editing.requiresGaugeOption,
        requiresFillerOption: editing.requiresFillerOption,
        requiresCollarOption: editing.requiresCollarOption,
        requiresFootRingOption: editing.requiresFootRingOption,
        requiresValveTypeOption: editing.requiresValveTypeOption,
      });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string; detail?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to update item.");
    } finally {
      setEditSaving(false);
    }
  };

  const remove = async (item: ItemListItem) => {
    if (!window.confirm(`Delete item '${item.itemNo}'?`)) return;
    setError(null);
    try {
      await itemsApi.delete(item.id);
      await load();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { message?: string; detail?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Failed to delete item.");
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.utilityBar}>
          <span>Order Analyst</span>
          <span>Site: Houston</span>
        </div>

        <header className={styles.headerBar}>
          <Title1 style={{ color: "#ffffff" }}>Item Maintenance</Title1>
          <div className={styles.headerActions}>
            <Button appearance="secondary" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button appearance="primary" onClick={() => setCreateOpen(true)}>
              Add Item
            </Button>
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.contentStack}>
            <div className={styles.itemsScrollRegion}>
              <div className={styles.filterBar}>
                <Field className={styles.filterField} label="Product Line Filter">
                  <Select
                    value={productLineFilter}
                    onChange={(event) => setProductLineFilter(event.target.value)}
                    aria-label="Product Line Filter"
                  >
                    {productLineFilterOptions.map((line) => (
                      <option key={line} value={line}>
                        {line}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}

              {loading ? (
                <Body1>Loading...</Body1>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Item No</TableHeaderCell>
                      <TableHeaderCell>Description</TableHeaderCell>
                      <TableHeaderCell>Item Type</TableHeaderCell>
                      <TableHeaderCell>Product Line</TableHeaderCell>
                      <TableHeaderCell>Size</TableHeaderCell>
                      <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.itemNo}</TableCell>
                        <TableCell>{row.itemDescription ?? "-"}</TableCell>
                        <TableCell>{row.itemType}</TableCell>
                        <TableCell>{row.productLine ?? "-"}</TableCell>
                        <TableCell>{row.sizeName ?? "-"}</TableCell>
                        <TableCell>
                          <div className={styles.actions}>
                            <Button appearance="secondary" onClick={() => void startEdit(row.id)}>
                              Edit
                            </Button>
                            <Button appearance="secondary" onClick={() => void remove(row)}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </section>
      </main>

      <NewItemDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={async () => {
          setCreateOpen(false);
          await load();
        }}
      />

      <Dialog open={editOpen} onOpenChange={(_, data) => setEditOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <div className={styles.formRow}>
                  <Field label="Item No" required>
                    <Input
                      value={editForm.itemNo}
                      onChange={(_, data) => setEditForm((prev) => ({ ...prev, itemNo: data.value }))}
                    />
                  </Field>
                  <Field label="Item Type">
                    <Dropdown
                      value={editForm.itemType}
                      selectedOptions={[editForm.itemType]}
                      onOptionSelect={(_, data) =>
                        setEditForm((prev) => ({ ...prev, itemType: data.optionValue ?? DEFAULT_ITEM_TYPES[0] }))
                      }
                    >
                      {itemTypes.map((itemType) => (
                        <Option key={itemType} value={itemType}>
                          {itemType}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                </div>

                <Field label="Description">
                  <Input
                    value={editForm.itemDescription}
                    onChange={(_, data) => setEditForm((prev) => ({ ...prev, itemDescription: data.value }))}
                  />
                </Field>

                <div className={styles.formRow}>
                  <Field label="Product Line">
                    <Dropdown
                      value={editForm.productLine}
                      selectedOptions={editForm.productLine ? [editForm.productLine] : []}
                      onOptionSelect={(_, data) =>
                        setEditForm((prev) => ({ ...prev, productLine: data.optionValue ?? "" }))
                      }
                      clearable
                    >
                      {productLines.map((line) => (
                        <Option key={line} value={line}>
                          {line}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Size">
                    <Dropdown
                      value={selectedSizeName}
                      selectedOptions={editForm.itemSizeId ? [editForm.itemSizeId] : []}
                      onOptionSelect={(_, data) =>
                        setEditForm((prev) => ({ ...prev, itemSizeId: data.optionValue ?? "" }))
                      }
                      clearable
                    >
                      {itemSizes.map((size) => (
                        <Option key={size.id} value={String(size.id)}>
                          {size.name}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={() => void saveEdit()} disabled={editSaving}>
                {editSaving ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
