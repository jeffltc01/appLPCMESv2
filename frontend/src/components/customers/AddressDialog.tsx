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
import { addressesApi } from "../../services/customers";
import type { Address, AddressCreate } from "../../types/customer";

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
  rowThree: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
});

const ADDRESS_TYPES = ["BILL_TO", "SHIP_TO"];

interface AddressDialogProps {
  open: boolean;
  customerId: number;
  address: Address | null;
  defaultType?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AddressDialog({
  open,
  customerId,
  address,
  defaultType,
  onClose,
  onSaved,
}: AddressDialogProps) {
  const styles = useStyles();
  const isEdit = address !== null;

  const [type, setType] = useState(address?.type ?? defaultType ?? "SHIP_TO");
  const [addressName, setAddressName] = useState(address?.addressName ?? "");
  const [address1, setAddress1] = useState(address?.address1 ?? "");
  const [address2, setAddress2] = useState(address?.address2 ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [state, setState] = useState(address?.state ?? "");
  const [postalCode, setPostalCode] = useState(address?.postalCode ?? "");
  const [country, setCountry] = useState(address?.country ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setType(address?.type ?? defaultType ?? "SHIP_TO");
      setAddressName(address?.addressName ?? "");
      setAddress1(address?.address1 ?? "");
      setAddress2(address?.address2 ?? "");
      setCity(address?.city ?? "");
      setState(address?.state ?? "");
      setPostalCode(address?.postalCode ?? "");
      setCountry(address?.country ?? "");
      setError(null);
    }
  }, [open, address, defaultType]);

  const handleSave = async () => {
    if (!address1.trim()) {
      setError("Address line 1 is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data: AddressCreate = {
        type,
        addressName: addressName.trim() || null,
        address1: address1.trim(),
        address2: address2.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        postalCode: postalCode.trim() || null,
        country: country.trim() || null,
      };
      if (isEdit) {
        await addressesApi.update(customerId, address.id, data);
      } else {
        await addressesApi.create(customerId, data);
      }
      onSaved();
    } catch {
      setError("Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{isEdit ? "Edit Address" : "New Address"}</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}
              <div className={styles.row}>
                <Field label="Type" required>
                  <Dropdown
                    value={type}
                    selectedOptions={[type]}
                    onOptionSelect={(_, d) =>
                      setType(d.optionValue ?? "SHIP_TO")
                    }
                  >
                    {ADDRESS_TYPES.map((t) => (
                      <Option key={t} value={t}>
                        {t === "BILL_TO" ? "Bill To" : "Ship To"}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
                <Field label="Address Name">
                  <Input
                    value={addressName}
                    onChange={(_, d) => setAddressName(d.value)}
                  />
                </Field>
              </div>
              <Field label="Address Line 1" required>
                <Input
                  value={address1}
                  onChange={(_, d) => setAddress1(d.value)}
                />
              </Field>
              <Field label="Address Line 2">
                <Input
                  value={address2}
                  onChange={(_, d) => setAddress2(d.value)}
                />
              </Field>
              <div className={styles.rowThree}>
                <Field label="City">
                  <Input
                    value={city}
                    onChange={(_, d) => setCity(d.value)}
                  />
                </Field>
                <Field label="State">
                  <Input
                    value={state}
                    onChange={(_, d) => setState(d.value)}
                  />
                </Field>
                <Field label="Postal Code">
                  <Input
                    value={postalCode}
                    onChange={(_, d) => setPostalCode(d.value)}
                  />
                </Field>
              </div>
              <Field label="Country">
                <Input
                  value={country}
                  onChange={(_, d) => setCountry(d.value)}
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
