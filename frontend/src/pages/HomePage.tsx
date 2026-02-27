import {
  makeStyles,
  Title1,
  Body1,
  Card,
  CardHeader,
  tokens,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import {
  ClipboardTask24Regular,
  VehicleTruckProfile24Regular,
  Wrench24Regular,
  BoxCheckmark24Regular,
  Receipt24Regular,
  People24Regular,
  Board24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";

const modules = [
  { label: "Orders", path: "/orders", icon: <ClipboardTask24Regular /> },
  { label: "Receiving", path: "/receiving", icon: <VehicleTruckProfile24Regular /> },
  { label: "Production", path: "/production", icon: <Wrench24Regular /> },
  { label: "Operator Console", path: "/operator-console", icon: <Wrench24Regular /> },
  { label: "Supervisor Review", path: "/supervisor/review", icon: <Board24Regular /> },
  { label: "Shipping", path: "/shipping", icon: <BoxCheckmark24Regular /> },
  { label: "Invoicing", path: "/invoicing", icon: <Receipt24Regular /> },
  { label: "Customers", path: "/customers", icon: <People24Regular /> },
  { label: "Order Board", path: "/orderboard", icon: <Board24Regular /> },
  { label: "KPI Diagnostics", path: "/orderboard/kpi-diagnostics", icon: <Board24Regular /> },
  { label: "Setup", path: "/setup", icon: <Settings24Regular /> },
];

const useStyles = makeStyles({
  container: {
    maxWidth: "960px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalXL,
  },
  card: {
    cursor: "pointer",
    ":hover": {
      boxShadow: tokens.shadow8,
    },
  },
  subtitle: {
    marginTop: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground3,
  },
});

export function HomePage() {
  const navigate = useNavigate();
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Title1>LP Cylinder MES</Title1>
      <Body1 className={styles.subtitle}>
        Manufacturing Execution System — Propane Cylinder Refurbishment &amp;
        Recertification
      </Body1>
      <div className={styles.grid}>
        {modules.map((mod) => (
          <Card
            key={mod.path}
            className={styles.card}
            onClick={() => navigate(mod.path)}
          >
            <CardHeader image={mod.icon} header={mod.label} />
          </Card>
        ))}
      </div>
    </div>
  );
}
