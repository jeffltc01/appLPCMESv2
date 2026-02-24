import { useState } from "react";
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
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { customersApi } from "../../services/customers";
import type { CustomerDetail } from "../../types/customer";

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
});

interface NewCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: CustomerDetail) => void;
}

export function NewCustomerDialog({
  open,
  onClose,
  onCreated,
}: NewCustomerDialogProps) {
  const styles = useStyles();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await customersApi.create({
        name: name.trim(),
        customerCode: code.trim() || null,
        status: "Active",
        email: email.trim() || null,
      });
      setName("");
      setCode("");
      setEmail("");
      onCreated(result);
    } catch {
      setError("Failed to create customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName("");
    setCode("");
    setEmail("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && handleClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>New Customer</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              <Field label="Name" required validationMessage={error ?? undefined}>
                <Input
                  value={name}
                  onChange={(_, d) => setName(d.value)}
                  autoFocus
                />
              </Field>
              <Field label="Customer Code">
                <Input value={code} onChange={(_, d) => setCode(d.value)} />
              </Field>
              <Field label="Email">
                <Input
                  value={email}
                  onChange={(_, d) => setEmail(d.value)}
                  type="email"
                />
              </Field>
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
