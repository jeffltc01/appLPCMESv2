import type { ReactNode } from "react";
import { Body1, Title2, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    backgroundColor: "#123046",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    padding: "0 20px",
    minHeight: "56px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  titleWrap: {
    minWidth: 0,
  },
  title: {
    color: "#ffffff",
  },
  subtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: "12px",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
});

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  const styles = useStyles();

  return (
    <div className={mergeClasses(styles.root, className)}>
      <div className={styles.titleWrap}>
        <Title2 className={styles.title}>{title}</Title2>
        {subtitle ? <Body1 className={styles.subtitle}>{subtitle}</Body1> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
