import { Button, makeStyles, mergeClasses } from "@fluentui/react-components";
import type { HelpTopic } from "../../types/help";

const useStyles = makeStyles({
  list: {
    display: "grid",
    gap: "6px",
  },
  item: {
    justifyContent: "flex-start",
    textAlign: "left",
    minHeight: "36px",
    borderRadius: "4px",
    border: "1px solid #d8d8d8",
    color: "#123046",
    ":hover": {
      backgroundColor: "#e0eff8",
      border: "1px solid #b3d4fc",
    },
  },
  selectedItem: {
    backgroundColor: "#123046",
    color: "#ffffff",
    border: "1px solid #123046",
    ":hover": {
      backgroundColor: "#2b3b84",
      border: "1px solid #2b3b84",
      color: "#ffffff",
    },
  },
});

interface HelpTopicListProps {
  topics: HelpTopic[];
  selectedTopicId?: string;
  onSelectTopic: (topic: HelpTopic) => void;
}

export function HelpTopicList({ topics, selectedTopicId, onSelectTopic }: HelpTopicListProps) {
  const styles = useStyles();

  return (
    <div className={styles.list}>
      {topics.map((topic) => (
        <Button
          key={topic.topicId}
          className={mergeClasses(styles.item, selectedTopicId === topic.topicId ? styles.selectedItem : undefined)}
          appearance="subtle"
          onClick={() => onSelectTopic(topic)}
        >
          {topic.title}
        </Button>
      ))}
    </div>
  );
}
