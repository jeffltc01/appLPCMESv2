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
  Textarea,
  Field,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
} from "@fluentui/react-components";
import { contactsApi } from "../../services/customers";
import type { Contact, ContactCreate } from "../../types/customer";

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

interface ContactDialogProps {
  open: boolean;
  customerId: number;
  contact: Contact | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ContactDialog({
  open,
  customerId,
  contact,
  onClose,
  onSaved,
}: ContactDialogProps) {
  const styles = useStyles();
  const isEdit = contact !== null;

  const [firstName, setFirstName] = useState(contact?.firstName ?? "");
  const [lastName, setLastName] = useState(contact?.lastName ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [officePhone, setOfficePhone] = useState(contact?.officePhone ?? "");
  const [mobilePhone, setMobilePhone] = useState(contact?.mobilePhone ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFirstName(contact?.firstName ?? "");
      setLastName(contact?.lastName ?? "");
      setEmail(contact?.email ?? "");
      setOfficePhone(contact?.officePhone ?? "");
      setMobilePhone(contact?.mobilePhone ?? "");
      setNotes(contact?.notes ?? "");
      setError(null);
    }
  }, [open, contact]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data: ContactCreate = {
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        email: email.trim() || null,
        officePhone: officePhone.trim() || null,
        mobilePhone: mobilePhone.trim() || null,
        notes: notes.trim() || null,
      };
      if (isEdit) {
        await contactsApi.update(customerId, contact.id, data);
      } else {
        await contactsApi.create(customerId, data);
      }
      onSaved();
    } catch {
      setError("Failed to save contact.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{isEdit ? "Edit Contact" : "New Contact"}</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}
              <div className={styles.row}>
                <Field label="First Name" required>
                  <Input
                    value={firstName}
                    onChange={(_, d) => setFirstName(d.value)}
                    autoFocus
                  />
                </Field>
                <Field label="Last Name">
                  <Input
                    value={lastName}
                    onChange={(_, d) => setLastName(d.value)}
                  />
                </Field>
              </div>
              <Field label="Email">
                <Input
                  value={email}
                  onChange={(_, d) => setEmail(d.value)}
                  type="email"
                />
              </Field>
              <div className={styles.row}>
                <Field label="Office Phone">
                  <Input
                    value={officePhone}
                    onChange={(_, d) => setOfficePhone(d.value)}
                  />
                </Field>
                <Field label="Mobile Phone">
                  <Input
                    value={mobilePhone}
                    onChange={(_, d) => setMobilePhone(d.value)}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea
                  value={notes}
                  onChange={(_, d) => setNotes(d.value)}
                  rows={3}
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
