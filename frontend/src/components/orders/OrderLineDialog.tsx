import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Dropdown,
  Combobox,
  Option,
  Field,
  Switch,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
} from "@fluentui/react-components";
import { ApiError } from "../../services/api";
import { orderLinesApi, orderLookupsApi } from "../../services/orders";
import type { OrderLine, OrderLineCreate, OrderLineUpdate } from "../../types/order";
import type { Lookup } from "../../types/customer";

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    minWidth: "540px",
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
  itemListbox: {
    maxHeight: "360px",
    overflowY: "auto",
  },
});

interface ItemLookup {
  id: number;
  itemNo: string;
  itemDescription: string | null;
}

interface OrderLineDialogProps {
  open: boolean;
  orderId: number;
  line: OrderLine | null;
  onClose: () => void;
  onSaved: () => void;
}

function extractApiMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) {
    return null;
  }

  const body = error.body as { message?: string } | undefined;
  if (body?.message) {
    return body.message;
  }

  return `${error.status} ${error.statusText}`;
}

export function OrderLineDialog({
  open,
  orderId,
  line,
  onClose,
  onSaved,
}: OrderLineDialogProps) {
  const styles = useStyles();
  const isEdit = line !== null;

  const [items, setItems] = useState<ItemLookup[]>([]);
  const [colors, setColors] = useState<Lookup[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [itemId, setItemId] = useState<string>("");
  const [quantityAsOrdered, setQuantityAsOrdered] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [colorId, setColorId] = useState<string>("");
  const [lidColorId, setLidColorId] = useState<string>("");
  const [needCollars, setNeedCollars] = useState(false);
  const [needFillers, setNeedFillers] = useState(false);
  const [needFootRings, setNeedFootRings] = useState(false);
  const [needDecals, setNeedDecals] = useState(false);
  const [valveType, setValveType] = useState("");
  const [gauges, setGauges] = useState("");
  const [itemQuery, setItemQuery] = useState("");

  useEffect(() => {
    if (!open) return;

    Promise.all([orderLookupsApi.items(), orderLookupsApi.colors()]).then(
      ([orderItems, lookupColors]) => {
        setItems(orderItems);
        setColors(lookupColors);
      }
    );

    setItemId(line?.itemId ? String(line.itemId) : "");
    setItemQuery(
      line
        ? `${line.itemNo} - ${line.itemDescription}`
        : ""
    );
    setQuantityAsOrdered(
      line?.quantityAsOrdered != null ? String(line.quantityAsOrdered) : ""
    );
    setUnitPrice(line?.unitPrice != null ? String(line.unitPrice) : "");
    setNotes(line?.notes ?? "");
    setColorId(line?.colorId ? String(line.colorId) : "");
    setLidColorId(line?.lidColorId ? String(line.lidColorId) : "");
    setNeedCollars(line?.needCollars === true);
    setNeedFillers(line?.needFillers === true);
    setNeedFootRings(line?.needFootRings === true);
    setNeedDecals(line?.needDecals === true);
    setValveType(line?.valveType ?? "");
    setGauges(line?.gauges ?? "");
    setError(null);
  }, [open, line]);

  const filteredItems = useMemo(() => {
    const query = itemQuery.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      const label = item.itemDescription
        ? `${item.itemNo} - ${item.itemDescription}`
        : item.itemNo;
      return label.toLowerCase().includes(query);
    });
  }, [items, itemQuery]);

  const visibleItems = useMemo(() => filteredItems.slice(0, 15), [filteredItems]);

  const colorLabel = useMemo(() => {
    if (!colorId) return "";
    return colors.find((c) => String(c.id) === colorId)?.name ?? "";
  }, [colors, colorId]);

  const lidColorLabel = useMemo(() => {
    if (!lidColorId) return "";
    return colors.find((c) => String(c.id) === lidColorId)?.name ?? "";
  }, [colors, lidColorId]);

  const handleSave = async () => {
    if (!itemId) {
      setError("Item is required.");
      return;
    }

    const qty = Number(quantityAsOrdered);
    if (Number.isNaN(qty) || qty <= 0) {
      setError("Quantity as ordered must be greater than zero.");
      return;
    }

    const payload: OrderLineCreate | OrderLineUpdate = {
      itemId: Number(itemId),
      quantityAsOrdered: qty,
      unitPrice: unitPrice ? Number(unitPrice) : null,
      notes: notes.trim() || null,
      colorId: colorId ? Number(colorId) : null,
      lidColorId: lidColorId ? Number(lidColorId) : null,
      needCollars: needCollars || null,
      needFillers: needFillers || null,
      needFootRings: needFootRings || null,
      needDecals: needDecals || null,
      valveType: valveType.trim() || null,
      gauges: gauges.trim() || null,
    };

    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await orderLinesApi.update(orderId, line.id, payload);
      } else {
        await orderLinesApi.create(orderId, payload);
      }
      onSaved();
    } catch (error) {
      setError(extractApiMessage(error) ?? "Failed to save order line.");
    } finally {
      setSaving(false);
    }
  };

  const applyDefaultUnitPrice = async (selectedItemId: string) => {
    const parsedItemId = Number(selectedItemId);
    if (!selectedItemId || Number.isNaN(parsedItemId)) {
      setUnitPrice("");
      return;
    }

    try {
      const price = await orderLookupsApi.defaultItemPrice(orderId, parsedItemId);
      setUnitPrice(price != null ? String(price) : "");
    } catch {
      // Keep dialog usable even if pricing lookup fails.
      setUnitPrice("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{isEdit ? "Edit Line" : "Add Line"}</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}

              <Field label="Item" required>
                <Combobox
                  value={itemQuery}
                  selectedOptions={itemId ? [itemId] : []}
                  onChange={(event) => {
                    const value = event.target.value;
                    setItemQuery(value);
                    if (!value) setItemId("");
                  }}
                  placeholder="Type to search item..."
                  onOptionSelect={(_, data) => {
                    const selectedItemId = data.optionValue ?? "";
                    setItemId(selectedItemId);
                    setItemQuery(data.optionText ?? "");
                    void applyDefaultUnitPrice(selectedItemId);
                  }}
                  listbox={{ className: styles.itemListbox }}
                >
                  {visibleItems.map((item) => (
                    <Option key={item.id} value={String(item.id)}>
                      {item.itemDescription
                        ? `${item.itemNo} - ${item.itemDescription}`
                        : item.itemNo}
                    </Option>
                  ))}
                </Combobox>
              </Field>

              <div className={styles.row}>
                <Field label="Quantity As Ordered" required>
                  <Input
                    type="number"
                    value={quantityAsOrdered}
                    onChange={(_, data) => setQuantityAsOrdered(data.value)}
                  />
                </Field>
                <Field label="Unit Price">
                  <Input
                    type="number"
                    value={unitPrice}
                    onChange={(_, data) => setUnitPrice(data.value)}
                    contentBefore={<span>$</span>}
                  />
                </Field>
              </div>

              <div className={styles.row}>
                <Field label="Color">
                  <Dropdown
                    value={colorLabel}
                    selectedOptions={colorId ? [colorId] : []}
                    onOptionSelect={(_, data) => setColorId(data.optionValue ?? "")}
                    clearable
                  >
                    {colors.map((color) => (
                      <Option key={color.id} value={String(color.id)}>
                        {color.name}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
                <Field label="Lid Color">
                  <Dropdown
                    value={lidColorLabel}
                    selectedOptions={lidColorId ? [lidColorId] : []}
                    onOptionSelect={(_, data) =>
                      setLidColorId(data.optionValue ?? "")
                    }
                    clearable
                  >
                    {colors.map((color) => (
                      <Option key={color.id} value={String(color.id)}>
                        {color.name}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              </div>

              <Field label="Notes">
                <Input value={notes} onChange={(_, data) => setNotes(data.value)} />
              </Field>

              <div className={styles.row}>
                <Field label="Valve Type">
                  <Input
                    value={valveType}
                    onChange={(_, data) => setValveType(data.value)}
                  />
                </Field>
                <Field label="Gauges">
                  <Input
                    value={gauges}
                    onChange={(_, data) => setGauges(data.value)}
                  />
                </Field>
              </div>

              <div className={styles.rowThree}>
                <Switch
                  label="Need Collars"
                  checked={needCollars}
                  onChange={(_, data) => setNeedCollars(data.checked)}
                />
                <Switch
                  label="Need Fillers"
                  checked={needFillers}
                  onChange={(_, data) => setNeedFillers(data.checked)}
                />
                <Switch
                  label="Need Foot Rings"
                  checked={needFootRings}
                  onChange={(_, data) => setNeedFootRings(data.checked)}
                />
              </div>

              <Switch
                label="Need Decals"
                checked={needDecals}
                onChange={(_, data) => setNeedDecals(data.checked)}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
