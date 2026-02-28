import { useMemo, useRef, useState, type DragEventHandler } from "react";
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  mergeClasses,
  Select,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowDownload20Regular,
  ArrowLeft20Regular,
  Delete20Regular,
  ArrowUpload20Regular,
} from "@fluentui/react-icons";
import type { OrderAttachment } from "../../types/order";

const useStyles = makeStyles({
  cardTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#123046",
    marginBottom: "10px",
  },
  flipShell: {
    perspective: "1000px",
  },
  flipCard: {
    position: "relative",
    transformStyle: "preserve-3d",
    transformOrigin: "center center",
    transform: "rotateY(0deg)",
    transitionDuration: "340ms",
    transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    transitionProperty: "transform",
  },
  flipCardActive: {
    transform: "rotateY(180deg)",
  },
  flipFace: {
    position: "absolute",
    inset: 0,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
    backfaceVisibility: "hidden",
    overflowY: "auto",
    overflowX: "hidden",
    scrollbarGutter: "stable",
  },
  flipFaceFront: {
    transform: "rotateY(0deg)",
  },
  flipFaceBack: {
    transform: "rotateY(180deg)",
  },
  flipHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacingVerticalS,
    gap: tokens.spacingHorizontalS,
  },
  headerLabel: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    color: "#123046",
    fontWeight: 600,
  },
  uploadPrimary: {
    width: "100%",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalS,
  },
  list: {
    display: "grid",
    gap: tokens.spacingVerticalS,
    maxHeight: "95px",
    overflowY: "auto",
  },
  listItem: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "8px",
    padding: tokens.spacingVerticalS,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  fileMeta: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    minWidth: 0,
  },
  fileName: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "150px",
  },
  listItemActions: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    alignItems: "center",
  },
  emptyState: {
    textAlign: "center",
    justifySelf: "center",
    alignSelf: "center",
    paddingTop: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground2,
  },
  uploadPanel: {
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  dropZone: {
    border: "1px dashed #8AA9BF",
    borderRadius: "10px",
    backgroundColor: "#f8fbff",
    minHeight: "76px",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    padding: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground2,
    cursor: "pointer",
  },
  uploadActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
  selectedFileWrap: {
    display: "grid",
    gap: tokens.spacingVerticalXXS,
    justifyItems: "center",
  },
  hiddenFileInput: {
    display: "none",
  },
  dropHintLine: {
    display: "block",
    textAlign: "center",
  },
});

interface AttachmentManagerProps {
  attachments: OrderAttachment[];
  categories: string[];
  canMutate: boolean;
  selectedCategory: string;
  selectedFile: File | null;
  isUploading: boolean;
  onSelectedCategoryChange: (value: string) => void;
  onSelectedFileChange: (file: File | null) => void;
  onUpload: () => Promise<boolean> | boolean;
  onUpdateCategory: (attachmentId: number, category: string) => void;
  onDelete: (attachmentId: number) => Promise<void> | void;
  getDownloadUrl: (attachmentId: number) => string;
}

export function AttachmentManager({
  attachments,
  categories,
  canMutate,
  selectedCategory,
  selectedFile,
  isUploading,
  onSelectedCategoryChange,
  onSelectedFileChange,
  onUpload,
  onUpdateCategory,
  onDelete,
  getDownloadUrl,
}: AttachmentManagerProps) {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadWizardOpen, setIsUploadWizardOpen] = useState(false);
  const [pendingDeleteAttachment, setPendingDeleteAttachment] = useState<OrderAttachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const visibleAttachments = useMemo(() => attachments, [attachments]);

  const flipHeight = isUploadWizardOpen ? 235 : 220;

  const handleDrop: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    if (!canMutate) {
      return;
    }
    const file = event.dataTransfer.files?.[0];
    onSelectedFileChange(file ?? null);
  };

  const handleUploadNow = async () => {
    const didUpload = await onUpload();
    if (didUpload) {
      setIsUploadWizardOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteAttachment) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(pendingDeleteAttachment.id);
      setPendingDeleteAttachment(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className={styles.cardTitle}>Attachments</div>
      <div className={styles.flipShell}>
        <div
          className={mergeClasses(styles.flipCard, isUploadWizardOpen && styles.flipCardActive)}
          style={{ height: `${flipHeight}px` }}
          data-testid="attachment-flip-editor"
        >
          <div className={mergeClasses(styles.flipFace, styles.flipFaceFront)}>
            <div className={styles.flipHeader}>
              <Body1 />
              <Button
                appearance="primary"
                icon={<ArrowUpload20Regular />}
                className={styles.uploadPrimary}
                onClick={() => setIsUploadWizardOpen(true)}
                disabled={!canMutate}
              >
                Upload
              </Button>
            </div>

            <div className={styles.listHeader} />

            <div className={styles.list}>
              {visibleAttachments.map((attachment) => (
                <div key={attachment.id} className={styles.listItem}>
                  <div className={styles.fileMeta}>
                    <span className={styles.fileName} title={attachment.fileName}>
                      {attachment.fileName}
                    </span>
                    <Badge appearance="outline">{attachment.category}</Badge>
                  </div>
                  <div className={styles.listItemActions}>
                    <Button
                      appearance="subtle"
                      icon={<ArrowDownload20Regular />}
                      as="a"
                      href={getDownloadUrl(attachment.id)}
                      aria-label={`Download ${attachment.fileName}`}
                    />
                    <Button
                      appearance="subtle"
                      icon={<Delete20Regular />}
                      onClick={() => setPendingDeleteAttachment(attachment)}
                      disabled={!canMutate}
                      aria-label={`Delete ${attachment.fileName}`}
                    />
                  </div>
                </div>
              ))}
              {visibleAttachments.length === 0 ? (
                <Caption1 className={styles.emptyState}>No attachments</Caption1>
              ) : null}
            </div>
          </div>

          <div className={mergeClasses(styles.flipFace, styles.flipFaceBack)}>
            <div className={styles.flipHeader}>
              <div className={styles.headerLabel}>
                {selectedFile ? (
                  <Button
                    appearance="primary"
                    icon={<ArrowUpload20Regular />}
                    onClick={handleUploadNow}
                    disabled={!canMutate || isUploading}
                  >
                    {isUploading ? "Uploading..." : "Upload Attachment"}
                  </Button>
                ) : (
                  <Body1>Upload Attachment</Body1>
                )}
              </div>
              <Button
                appearance="subtle"
                icon={<ArrowLeft20Regular />}
                onClick={() => setIsUploadWizardOpen(false)}
              >
                Back
              </Button>
            </div>

            <div className={styles.uploadPanel}>
              <div
                className={styles.dropZone}
                onClick={() => {
                  if (canMutate) {
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className={styles.selectedFileWrap}>
                    <Body1>{selectedFile.name}</Body1>
                    <Caption1 className={styles.dropHintLine}>Click area to replace file</Caption1>
                  </div>
                ) : (
                  <div>
                    <Body1>Drag and drop file here</Body1>
                    <Caption1 className={styles.dropHintLine}>or click this area</Caption1>
                    <Caption1 className={styles.dropHintLine}>to browse</Caption1>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                className={styles.hiddenFileInput}
                type="file"
                onChange={(event) => onSelectedFileChange(event.target.files?.[0] ?? null)}
              />

              {!canMutate ? (
                <Caption1>Save draft first to enable attachment uploads.</Caption1>
              ) : null}

              <Field label="Category">
                <Select
                  value={selectedCategory}
                  onChange={(event) => onSelectedCategoryChange(event.target.value)}
                  disabled={!canMutate}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>

            </div>
          </div>
        </div>
      </div>
      <Dialog
        open={Boolean(pendingDeleteAttachment)}
        onOpenChange={(_, data) => {
          if (!data.open && !isDeleting) {
            setPendingDeleteAttachment(null);
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete Attachment</DialogTitle>
            <DialogContent>
              {pendingDeleteAttachment ? (
                <>
                  <Body1>Are you sure you want to delete this attachment?</Body1>
                  <Caption1>{pendingDeleteAttachment.fileName}</Caption1>
                </>
              ) : null}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setPendingDeleteAttachment(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
