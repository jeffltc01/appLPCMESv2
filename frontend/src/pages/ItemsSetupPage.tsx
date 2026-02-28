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
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title2,
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
    padding: tokens.spacingHorizontalL,
    display: "grid",
    gap: tokens.spacingVerticalM,
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
      <div className={styles.header}>
        <Title2>Setup - Items</Title2>
        <div className={styles.nav}>
          <Button appearance="secondary" onClick={() => navigate("/setup/production-lines")}>
            Production Lines Setup
          </Button>
          <Button appearance="secondary" onClick={() => navigate("/setup/work-centers")}>
            Work Centers Setup
          </Button>
          <Button appearance="secondary" onClick={() => navigate("/setup/users-roles")}>
            Users & Roles Setup
          </Button>
          <Button appearance="secondary" onClick={() => navigate("/")}>
            Home
          </Button>
          <Button appearance="primary" onClick={() => setCreateOpen(true)}>
            Add Item
          </Button>
        </div>
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
            {rows.map((row) => (
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
