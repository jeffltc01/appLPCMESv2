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
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
} from "@fluentui/react-components";
import { crossRefsApi } from "../../services/items";
import type { CrossReference, CrossReferenceCreate } from "../../types/item";

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
});

interface CrossReferenceDialogProps {
  open: boolean;
  crossRef: CrossReference | null;
  defaultErpItemNumber: string;
  onClose: () => void;
  onSaved: () => void;
}

export function CrossReferenceDialog({
  open,
  crossRef,
  defaultErpItemNumber,
  onClose,
  onSaved,
}: CrossReferenceDialogProps) {
  const styles = useStyles();
  const isEdit = crossRef !== null;

  const [lpcItemNumber, setLpcItemNumber] = useState("");
  const [erpItemNumber, setErpItemNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLpcItemNumber(crossRef?.lpcItemNumber ?? "");
      setErpItemNumber(crossRef?.erpItemNumber ?? defaultErpItemNumber);
      setError(null);
    }
  }, [open, crossRef, defaultErpItemNumber]);

  const handleSave = async () => {
    if (!lpcItemNumber.trim()) {
      setError("Alternate part number is required.");
      return;
    }
    if (!erpItemNumber.trim()) {
      setError("Internal item number is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data: CrossReferenceCreate = {
        lpcItemNumber: lpcItemNumber.trim(),
        erpItemNumber: erpItemNumber.trim(),
      };
      if (isEdit) {
        await crossRefsApi.update(crossRef.id, data);
      } else {
        await crossRefsApi.create(data);
      }
      onSaved();
    } catch {
      setError("Failed to save cross reference.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {isEdit ? "Edit Cross Reference" : "New Cross Reference"}
          </DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}
              <Field label="Alternate Part Number" required>
                <Input
                  value={lpcItemNumber}
                  onChange={(_, d) => setLpcItemNumber(d.value)}
                  autoFocus
                />
              </Field>
              <Field label="Internal Item Number (ERP)">
                <Input
                  value={erpItemNumber}
                  onChange={(_, d) => setErpItemNumber(d.value)}
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
