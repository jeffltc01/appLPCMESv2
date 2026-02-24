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
import { pricingsApi } from "../../services/items";
import { customersApi } from "../../services/customers";
import type { PricingRecord, PricingCreate } from "../../types/item";
import type { CustomerListItem } from "../../types/customer";

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

interface PricingDialogProps {
  open: boolean;
  itemId: number;
  pricing: PricingRecord | null;
  isCustomerPricing: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PricingDialog({
  open,
  itemId,
  pricing,
  isCustomerPricing,
  onClose,
  onSaved,
}: PricingDialogProps) {
  const styles = useStyles();
  const isEdit = pricing !== null;

  const [effectiveDate, setEffectiveDate] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEffectiveDate(pricing?.effectiveDate ?? new Date().toISOString().slice(0, 10));
      setUnitPrice(pricing?.unitPrice != null ? String(pricing.unitPrice) : "");
      setNotes(pricing?.notes ?? "");
      setCustomerId(pricing?.customerId != null ? String(pricing.customerId) : "");
      setError(null);

      if (isCustomerPricing) {
        customersApi.list({ pageSize: 500, status: "Active" }).then((r) =>
          setCustomers(r.items)
        );
      }
    }
  }, [open, pricing, isCustomerPricing]);

  const handleSave = async () => {
    if (!effectiveDate) {
      setError("Effective date is required.");
      return;
    }
    if (isCustomerPricing && !customerId) {
      setError("Customer is required for customer-specific pricing.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data: PricingCreate = {
        effectiveDate,
        unitPrice: unitPrice ? Number(unitPrice) : null,
        notes: notes.trim() || null,
        customerId: isCustomerPricing && customerId ? Number(customerId) : null,
      };
      if (isEdit) {
        await pricingsApi.update(itemId, pricing.id, data);
      } else {
        await pricingsApi.create(itemId, data);
      }
      onSaved();
    } catch {
      setError("Failed to save pricing.");
    } finally {
      setSaving(false);
    }
  };

  const title = isEdit
    ? "Edit Pricing"
    : isCustomerPricing
      ? "New Customer Price"
      : "New Base Price";

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}
              {isCustomerPricing && (
                <Field label="Customer" required>
                  <Dropdown
                    value={
                      customers.find((c) => String(c.id) === customerId)
                        ?.name ?? ""
                    }
                    selectedOptions={customerId ? [customerId] : []}
                    onOptionSelect={(_, d) =>
                      setCustomerId(d.optionValue ?? "")
                    }
                  >
                    {customers.map((c) => (
                      <Option key={c.id} value={String(c.id)}>
                        {c.name}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              )}
              <div className={styles.row}>
                <Field label="Effective Date" required>
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(_, d) => setEffectiveDate(d.value)}
                  />
                </Field>
                <Field label="Unit Price">
                  <Input
                    type="number"
                    value={unitPrice}
                    onChange={(_, d) => setUnitPrice(d.value)}
                    contentBefore={<span>$</span>}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <Input
                  value={notes}
                  onChange={(_, d) => setNotes(d.value)}
                />
              </Field>
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
