import { Button, makeStyles } from "@fluentui/react-components";
import { QuestionCircle24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { helpApi } from "../../services/help";
import type { HelpTopic } from "../../types/help";
import { HelpDrawer } from "./HelpDrawer";

interface HelpEntryPointProps {
  route: string;
  context?: string;
  role?: string;
}

const useStyles = makeStyles({
  trigger: {
    border: "1px solid #123046",
    color: "#123046",
    fontWeight: 600,
    ":hover": {
      backgroundColor: "#e0eff8",
      border: "1px solid #123046",
      color: "#123046",
    },
  },
});

export function HelpEntryPoint({ route, context, role = "Office" }: HelpEntryPointProps) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<HelpTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openHelp = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const loaded = await helpApi.getTopics({ route, context, role });
      setTopics(loaded);
      setSelectedTopic(loaded[0] ?? null);
    } catch {
      setTopics([]);
      setSelectedTopic(null);
      setError("Help is currently unavailable. You can continue your workflow and retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        icon={<QuestionCircle24Regular />}
        appearance="outline"
        className={styles.trigger}
        onClick={() => void openHelp()}
      >
        Help
      </Button>
      <HelpDrawer
        open={open}
        onOpenChange={setOpen}
        topics={topics}
        selectedTopic={selectedTopic}
        onSelectTopic={setSelectedTopic}
        loading={loading}
        error={error}
      />
    </>
  );
}
