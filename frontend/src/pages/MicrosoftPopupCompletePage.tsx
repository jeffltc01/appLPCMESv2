import { Body1, Card, makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingHorizontalL,
  },
  card: {
    width: "100%",
    maxWidth: "420px",
  },
});

export function MicrosoftPopupCompletePage() {
  const styles = useStyles();
  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <Body1>Completing Microsoft sign-in...</Body1>
      </Card>
    </div>
  );
}
