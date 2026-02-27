import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  makeStyles,
  tokens,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  mergeClasses,
} from "@fluentui/react-components";
import {
  Navigation24Regular,
  Dismiss24Regular,
  Home24Regular,
  ClipboardTask24Regular,
  VehicleTruckProfile24Regular,
  Wrench24Regular,
  BoxCheckmark24Regular,
  Receipt24Regular,
  People24Regular,
  Board24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { ORDER_STATUS_KEYS } from "../../types/order";

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  navigateTo?: string;
}

const allNavItems: NavItem[] = [
  { key: "home", label: "Home", icon: <Home24Regular />, path: "/" },
  {
    key: "orders",
    label: "Orders",
    icon: <ClipboardTask24Regular />,
    path: "/orders",
    navigateTo: `/orders?status=${encodeURIComponent(ORDER_STATUS_KEYS.NEW)}`,
  },
  { key: "receiving", label: "Receiving", icon: <VehicleTruckProfile24Regular />, path: "/receiving" },
  { key: "production", label: "Production", icon: <Wrench24Regular />, path: "/production" },
  { key: "operatorConsole", label: "Operator Console", icon: <Wrench24Regular />, path: "/operator-console" },
  { key: "shipping", label: "Shipping", icon: <BoxCheckmark24Regular />, path: "/shipping" },
  {
    key: "invoicing",
    label: "Invoicing",
    icon: <Receipt24Regular />,
    path: "/invoicing",
    navigateTo: `/invoicing?status=${encodeURIComponent(ORDER_STATUS_KEYS.READY_TO_INVOICE)}`,
  },
  { key: "customers", label: "Customers", icon: <People24Regular />, path: "/customers" },
  { key: "orderboard", label: "Order Board", icon: <Board24Regular />, path: "/orderboard" },
  { key: "setup", label: "Setup", icon: <Settings24Regular />, path: "/setup" },
];

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    height: "48px",
    backgroundColor: "#123046",
    color: "#fff",
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    gap: tokens.spacingHorizontalM,
    flexShrink: 0,
  },
  hamburger: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "4px",
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    cursor: "pointer",
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase400,
    minHeight: "48px",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  navItemActive: {
    color: "#123046",
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: "#e0eff8",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "4px",
  },
});

function getPageTitle(pathname: string): string {
  const match = allNavItems.find((item) =>
    item.path === "/" ? pathname === "/" : pathname.startsWith(item.path)
  );
  return match?.label ?? "LP Cylinder MES";
}

export function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const styles = useStyles();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className={styles.header}>
        <button
          className={styles.hamburger}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
        >
          <Navigation24Regular />
        </button>
        <span className={styles.title}>{getPageTitle(location.pathname)}</span>
      </header>

      <Drawer
        open={drawerOpen}
        onOpenChange={(_, data) => setDrawerOpen(data.open)}
        type="overlay"
        position="start"
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <button
                className={styles.closeBtn}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
              >
                <Dismiss24Regular />
              </button>
            }
          >
            LP Cylinder MES
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <nav>
            {allNavItems.map((item) => (
              <div
                key={item.key}
                className={mergeClasses(
                  styles.navItem,
                  isActive(item.path) && styles.navItemActive
                )}
                onClick={() => {
                  navigate(item.navigateTo ?? item.path);
                  setDrawerOpen(false);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </DrawerBody>
      </Drawer>
    </>
  );
}
