import {
  Body1,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title1,
  Title3,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ClipboardTask24Regular,
  Filter24Regular,
  VehicleTruckProfile24Regular,
  Receipt24Regular,
  Board24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { key: "orderEntry", label: "Order Entry", icon: <ClipboardTask24Regular />, path: "/orders" },
  { key: "transportation", label: "Transportation", icon: <VehicleTruckProfile24Regular />, path: "/transportation" },
  { key: "receiving", label: "Receiving", icon: <VehicleTruckProfile24Regular />, path: "/receiving" },
  { key: "invoicing", label: "Invoicing", icon: <Receipt24Regular />, path: "/invoices" },
  { key: "plantManager", label: "Plant Manager", icon: <Board24Regular /> },
  { key: "admin", label: "Admin Maintenance", icon: <Settings24Regular /> },
];

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#FCFCFC",
  },
  content: {
    display: "grid",
    gridTemplateRows: "44px 52px auto",
    minWidth: 0,
  },
  topUtility: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalL,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2,
    fontSize: "12px",
  },
  topMenu: {
    backgroundColor: "#123046",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: tokens.spacingHorizontalL,
    paddingLeft: tokens.spacingHorizontalL,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  brand: {
    fontWeight: 700,
    fontSize: "16px",
    letterSpacing: "0.02em",
  },
  menuButtons: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    flexWrap: "wrap",
  },
  menuButton: {
    minHeight: "34px",
  },
  headerBar: {
    backgroundColor: "#123046",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: tokens.spacingHorizontalL,
    paddingLeft: tokens.spacingHorizontalL,
  },
  headerActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
  headerActionButton: {
    minHeight: "32px",
  },
  body: {
    display: "grid",
    gap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalL,
    paddingRight: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalL,
    backgroundColor: "#F5F5F5",
  },
  kpiStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  kpiCard: {
    display: "grid",
    gap: tokens.spacingVerticalXS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  kpiValue: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#123046",
  },
  card: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalM,
  },
  itemList: {
    display: "grid",
    gap: tokens.spacingVerticalS,
  },
  barRow: {
    display: "grid",
    gridTemplateColumns: "160px minmax(0, 1fr) 40px",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    fontSize: "13px",
    color: tokens.colorNeutralForeground2,
  },
  barTrack: {
    height: "10px",
    backgroundColor: "#E8E8E8",
    borderRadius: "999px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#2B3B84",
  },
  lowerGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  riskWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  donut: {
    width: "168px",
    height: "168px",
    borderRadius: "999px",
    backgroundImage:
      "conic-gradient(#2B3B84 0 50%, #017CC5 50% 78%, #0095EB 78% 100%)",
    display: "grid",
    placeItems: "center",
    margin: "0 auto",
  },
  donutInner: {
    width: "98px",
    height: "98px",
    borderRadius: "999px",
    backgroundColor: "#FFFFFF",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    color: "#123046",
    fontWeight: 700,
  },
  legend: {
    display: "grid",
    gap: tokens.spacingVerticalXS,
    alignContent: "center",
    fontSize: "13px",
    color: tokens.colorNeutralForeground2,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
  },
});

export function MenuPage() {
  const styles = useStyles();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <main className={styles.content}>
        <div className={styles.topUtility}>
          <span>Order Analyst</span>
          <span>Site: Houston</span>
        </div>

        <div className={styles.topMenu}>
          <div className={styles.brand}>LPC Order Ops</div>
          <div className={styles.menuButtons}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.key}
                icon={item.icon}
                appearance={item.key === "orderEntry" ? "primary" : "secondary"}
                className={styles.menuButton}
                onClick={item.path ? () => navigate(item.path) : undefined}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className={styles.headerBar}>
          <Title1>Order Entry Workspace</Title1>
          <div className={styles.headerActions}>
            <Button className={styles.headerActionButton} appearance="secondary" icon={<Filter24Regular />}>
              Filters
            </Button>
            <Button className={styles.headerActionButton} appearance="primary">
              New Sales Order
            </Button>
          </div>
        </div>

        <section className={styles.body}>
          <div className={styles.kpiStrip}>
            <Card className={styles.kpiCard}>
              <Body1>Open Orders</Body1>
              <div className={styles.kpiValue}>142</div>
            </Card>
            <Card className={styles.kpiCard}>
              <Body1>Needs Review</Body1>
              <div className={styles.kpiValue}>18</div>
            </Card>
            <Card className={styles.kpiCard}>
              <Body1>Late Risk</Body1>
              <div className={styles.kpiValue}>9</div>
            </Card>
            <Card className={styles.kpiCard}>
              <Body1>Ready to Release</Body1>
              <div className={styles.kpiValue}>37</div>
            </Card>
          </div>

          <Card className={styles.card}>
            <div className={styles.cardHeader}>
              <Title3>Order Intake by Lifecycle Stage</Title3>
              <Body1>Last 24 hours</Body1>
            </div>
            <div className={styles.itemList}>
              {[
                { name: "Draft", value: 42 },
                { name: "Pending Validation", value: 33 },
                { name: "Inbound Logistics Planned", value: 57 },
                { name: "Production Ready", value: 28 },
                { name: "Invoice Ready", value: 19 },
              ].map((row) => (
                <div key={row.name} className={styles.barRow}>
                  <span>{row.name}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${row.value}%` }} />
                  </div>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className={styles.lowerGrid}>
            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Title3>Open Order Queue</Title3>
                <Body1>Top Priority</Body1>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Order</TableHeaderCell>
                    <TableHeaderCell>Customer</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Priority</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>SO-40112</TableCell>
                    <TableCell>Acme Industrial</TableCell>
                    <TableCell>Draft</TableCell>
                    <TableCell>High</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>SO-40109</TableCell>
                    <TableCell>Northeast Gas</TableCell>
                    <TableCell>Pending Validation</TableCell>
                    <TableCell>Med</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>SO-40103</TableCell>
                    <TableCell>BlueLine Supply</TableCell>
                    <TableCell>Inbound Planned</TableCell>
                    <TableCell>Low</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>

            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <Title3>Order Risk Mix</Title3>
              </div>
              <div className={styles.riskWrap}>
                <div className={styles.donut}>
                  <div className={styles.donutInner}>
                    <div>548</div>
                    <div style={{ fontSize: "11px", fontWeight: 500 }}>Total</div>
                  </div>
                </div>
                <div className={styles.legend}>
                  <div className={styles.legendItem}>
                    <span className={styles.dot} style={{ backgroundColor: "#2B3B84" }} />
                    <span>Low risk</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.dot} style={{ backgroundColor: "#017CC5" }} />
                    <span>Medium risk</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.dot} style={{ backgroundColor: "#0095EB" }} />
                    <span>High risk</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
