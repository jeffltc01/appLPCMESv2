import { Outlet } from "react-router-dom";
import { makeStyles, tokens } from "@fluentui/react-components";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { useIsMobile } from "../../hooks/useIsMobile";

const useStyles = makeStyles({
  root: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#FCFCFC",
  },
  mobileRoot: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#FCFCFC",
  },
  content: {
    flexGrow: 1,
    overflowY: "auto",
    paddingTop: tokens.spacingVerticalXL,
    paddingRight: tokens.spacingHorizontalXXL,
    paddingBottom: tokens.spacingVerticalXL,
    paddingLeft: tokens.spacingHorizontalXXL,
  },
  mobileContent: {
    flexGrow: 1,
    overflowY: "auto",
    paddingTop: tokens.spacingVerticalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
  },
});

export function AppShell() {
  const isMobile = useIsMobile();
  const styles = useStyles();

  if (isMobile) {
    return (
      <div className={styles.mobileRoot}>
        <MobileHeader />
        <main className={styles.mobileContent}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Sidebar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
