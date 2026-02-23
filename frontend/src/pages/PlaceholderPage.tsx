import { Title2, Body1, tokens, makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  subtitle: {
    marginTop: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground3,
  },
});

export function PlaceholderPage({ title }: { title: string }) {
  const styles = useStyles();
  return (
    <div>
      <Title2>{title}</Title2>
      <Body1 className={styles.subtitle}>
        This module is under development.
      </Body1>
    </div>
  );
}
