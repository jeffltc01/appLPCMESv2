import { useState, useEffect } from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Field,
  Dropdown,
  Option,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
} from "@fluentui/react-components";
import { itemsApi, itemLookupsApi } from "../../services/items";
import type { ItemDetail, ItemSizeLookup } from "../../types/item";

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
});

const ITEM_TYPES = ["Regular Item", "Misc Item", "Comment Item", "Charge Item"];

interface NewItemDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (item: ItemDetail) => void;
}

export function NewItemDialog({ open, onClose, onCreated }: NewItemDialogProps) {
  const styles = useStyles();
  const [itemNo, setItemNo] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("Regular Item");
  const [productLine, setProductLine] = useState("");
  const [itemSizeId, setItemSizeId] = useState<string>("");
  const [sizes, setSizes] = useState<ItemSizeLookup[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      itemLookupsApi.itemSizes().then(setSizes);
    }
  }, [open]);

  const handleSave = async () => {
    if (!itemNo.trim()) {
      setError("Item No is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await itemsApi.create({
        itemNo: itemNo.trim(),
        itemDescription: description.trim() || null,
        itemType,
        productLine: productLine.trim() || null,
        itemSizeId: itemSizeId ? Number(itemSizeId) : null,
      });
      handleClose();
      onCreated(result);
    } catch (err: unknown) {
      const body = (err as { body?: { message?: string } }).body;
      setError(body?.message ?? "Failed to create item.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setItemNo("");
    setDescription("");
    setItemType("Regular Item");
    setProductLine("");
    setItemSizeId("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && handleClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>New Item</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}
              <div className={styles.row}>
                <Field label="Item No" required>
                  <Input
                    value={itemNo}
                    onChange={(_, d) => setItemNo(d.value)}
                    autoFocus
                  />
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
                    value={
                      sizes.find((s) => String(s.id) === itemSizeId)?.name ?? ""
                    }
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
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
