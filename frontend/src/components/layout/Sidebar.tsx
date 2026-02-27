import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  makeStyles,
  tokens,
  Tooltip,
  mergeClasses,
} from "@fluentui/react-components";
import {
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

const navItems: NavItem[] = [
  { key: "home", label: "Home", icon: <Home24Regular />, path: "/" },
  {
    key: "orders",
    label: "Orders",
    icon: <ClipboardTask24Regular />,
    path: "/orders",
    navigateTo: `/orders?status=${encodeURIComponent(ORDER_STATUS_KEYS.NEW)}`,
  },
  {
    key: "receiving",
    label: "Receiving",
    icon: <VehicleTruckProfile24Regular />,
    path: "/receiving",
  },
  {
    key: "production",
    label: "Production",
    icon: <Wrench24Regular />,
    path: "/production",
  },
  {
    key: "operatorConsole",
    label: "Operator Console",
    icon: <Wrench24Regular />,
    path: "/operator-console",
  },
  {
    key: "supervisorReview",
    label: "Supervisor Review",
    icon: <Board24Regular />,
    path: "/supervisor/review",
  },
  {
    key: "shipping",
    label: "Shipping",
    icon: <BoxCheckmark24Regular />,
    path: "/shipping",
  },
  {
    key: "invoicing",
    label: "Invoicing",
    icon: <Receipt24Regular />,
    path: "/invoicing",
    navigateTo: `/invoicing?status=${encodeURIComponent(ORDER_STATUS_KEYS.READY_TO_INVOICE)}`,
  },
  {
    key: "customers",
    label: "Customers",
    icon: <People24Regular />,
    path: "/customers",
  },
  {
    key: "orderboard",
    label: "Role Queue",
    icon: <Board24Regular />,
    path: "/orderboard",
  },
  {
    key: "kpiDiagnostics",
    label: "KPI Diagnostics",
    icon: <Board24Regular />,
    path: "/orderboard/kpi-diagnostics",
  },
];

const bottomItems: NavItem[] = [
  {
    key: "setup",
    label: "Setup",
    icon: <Settings24Regular />,
    path: "/setup",
    navigateTo: "/setup",
  },
];

const COLLAPSED_WIDTH = 56;
const EXPANDED_WIDTH = 220;

const useStyles = makeStyles({
  sidebar: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#123046",
    color: "#fff",
    overflowX: "hidden",
    transitionProperty: "width",
    transitionDuration: "200ms",
    transitionTimingFunction: "ease",
    flexShrink: 0,
    zIndex: 100,
  },
  collapsed: {
    width: `${COLLAPSED_WIDTH}px`,
  },
  expanded: {
    width: `${EXPANDED_WIDTH}px`,
  },
  navList: {
    listStyleType: "none",
    margin: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flexGrow: 1,
  },
  bottomList: {
    listStyleType: "none",
    margin: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: tokens.spacingVerticalS,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: "16px",
    paddingRight: "16px",
    cursor: "pointer",
    color: "rgba(255,255,255,0.7)",
    whiteSpace: "nowrap",
    borderLeft: "3px solid transparent",
    textDecorationLine: "none",
    ":hover": {
      backgroundColor: "rgba(255,255,255,0.1)",
      color: "#fff",
    },
  },
  navItemActive: {
    color: "#fff",
    borderLeftColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  label: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    overflow: "hidden",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "48px",
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase400,
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
});

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const styles = useStyles();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const renderItems = (items: NavItem[]) =>
    items.map((item) => {
      const active = isActive(item.path);
      const navElement = (
        <li
          key={item.key}
          className={mergeClasses(
            styles.navItem,
            active && styles.navItemActive
          )}
          onClick={() => navigate(item.navigateTo ?? item.path)}
        >
          {item.icon}
          {expanded && <span className={styles.label}>{item.label}</span>}
        </li>
      );
      return expanded ? (
        navElement
      ) : (
        <Tooltip
          key={item.key}
          content={item.label}
          relationship="label"
          positioning="after"
        >
          {navElement}
        </Tooltip>
      );
    });

  return (
    <nav
      className={mergeClasses(
        styles.sidebar,
        expanded ? styles.expanded : styles.collapsed
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className={styles.logo} onClick={() => navigate("/")}>
        {expanded ? "LP Cylinder MES" : "LP"}
      </div>
      <ul className={styles.navList}>{renderItems(navItems)}</ul>
      <ul className={styles.bottomList}>{renderItems(bottomItems)}</ul>
    </nav>
  );
}
