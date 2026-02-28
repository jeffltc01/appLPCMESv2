import {
  Body1,
  Body1Strong,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import type { HelpTopic } from "../../types/help";
import { HelpTopicList } from "./HelpTopicList";
import { HelpTopicView } from "./HelpTopicView";

const useStyles = makeStyles({
  surface: {
    width: "min(1100px, 92vw)",
    maxWidth: "1100px",
    borderRadius: "8px",
    border: "1px solid #d8d8d8",
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  body: {
    padding: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
  },
  title: {
    margin: 0,
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 700,
    flex: 1,
  },
  content: {
    padding: "12px",
  },
  titleBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#123046",
    justifySelf: "stretch",
    width: "100%",
    minWidth: "100%",
    boxSizing: "border-box",
    padding: "12px 16px",
  },
  closeButton: {
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.35)",
    ":hover": {
      backgroundColor: "rgba(255,255,255,0.15)",
      color: "#ffffff",
    },
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "280px minmax(0, 1fr)",
    gap: "12px",
    minHeight: "460px",
  },
  listPanel: {
    border: "1px solid #d8d8d8",
    borderRadius: "4px",
    backgroundColor: "#ffffff",
    padding: "10px",
    overflowY: "auto",
  },
  contentPanel: {
    border: "1px solid #d8d8d8",
    borderRadius: "4px",
    backgroundColor: "#ffffff",
    padding: "12px",
    overflowY: "auto",
    maxHeight: "65vh",
    display: "grid",
    alignContent: "start",
    gap: tokens.spacingVerticalS,
  },
  fallback: {
    color: tokens.colorNeutralForeground2,
    border: "1px solid #d8d8d8",
    borderRadius: "4px",
    backgroundColor: "#ffffff",
    padding: "12px",
  },
});

interface HelpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: HelpTopic[];
  selectedTopic: HelpTopic | null;
  onSelectTopic: (topic: HelpTopic) => void;
  loading: boolean;
  error: string | null;
}

export function HelpDrawer({
  open,
  onOpenChange,
  topics,
  selectedTopic,
  onSelectTopic,
  loading,
  error,
}: HelpDrawerProps) {
  const styles = useStyles();

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.body}>
          <div className={styles.titleBar}>
            <DialogTitle className={styles.title}>Help Documentation</DialogTitle>
            <Button
              size="small"
              appearance="subtle"
              className={styles.closeButton}
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
          <DialogContent className={styles.content}>
            {!loading && !error && topics.length > 0 ? (
              <Body1Strong style={{ marginBottom: "8px", color: "#123046" }}>
                Screen-specific guidance
              </Body1Strong>
            ) : null}
            {loading ? <Body1>Loading help topics...</Body1> : null}
            {!loading && error ? <Body1 className={styles.fallback}>{error}</Body1> : null}
            {!loading && !error && topics.length === 0 ? (
              <Body1 className={styles.fallback}>
                No help topics are configured for this screen. Escalate through your site MES support lead.
              </Body1>
            ) : null}
            {!loading && !error && topics.length > 0 ? (
              <div className={styles.layout}>
                <div className={styles.listPanel}>
                  <HelpTopicList
                    topics={topics}
                    selectedTopicId={selectedTopic?.topicId}
                    onSelectTopic={onSelectTopic}
                  />
                </div>
                <div className={styles.contentPanel}>
                  {selectedTopic ? <HelpTopicView topic={selectedTopic} /> : null}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
