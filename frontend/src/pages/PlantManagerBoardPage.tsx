import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Body1,
  Button,
  Card,
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ArrowClockwise24Regular } from "@fluentui/react-icons";
import { ordersApi, getWorkspaceCurrentStatus } from "../services/orders";
import type { PlantManagerBoardItem } from "../types/order";
import { formatOrderDisplayNo } from "../utils/orderNumber";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: tokens.spacingVerticalL,
  },
  shell: {
    maxWidth: "1700px",
    margin: "0 auto",
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  muted: {
    color: tokens.colorNeutralForeground2,
  },
  boardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  card: {
    border: "1px solid #e8e8e8",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    cursor: "pointer",
    display: "grid",
    gap: tokens.spacingVerticalS,
    minHeight: "260px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "160px minmax(0, 1fr)",
    gap: tokens.spacingHorizontalS,
  },
  label: {
    color: tokens.colorNeutralForeground2,
    fontWeight: 600,
  },
  linesWrap: {
    display: "grid",
    gap: tokens.spacingVerticalXS,
    marginTop: tokens.spacingVerticalXS,
  },
  lineRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: tokens.spacingHorizontalS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalXS,
  },
  emptyState: {
    color: tokens.colorNeutralForeground2,
  },
  errorBanner: {
    border: "1px solid #e8b3b3",
    borderRadius: "4px",
    backgroundColor: "#fff5f5",
    padding: "10px 12px",
    color: "#8a2f2f",
  },
});

function formatCityState(city: string | null | undefined, state: string | null | undefined): string {
  if (city && state) {
    return `${city}, ${state}`;
  }
  return city ?? state ?? "-";
}

export function PlantManagerBoardPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PlantManagerBoardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await ordersApi.plantManagerBoard();
      setOrders(rows);
    } catch {
      setError("Unable to load plant manager board.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBoard();
  }, []);

  return (
    <div className={styles.page} data-testid="plant-manager-board-page">
      <div className={styles.shell}>
        <div className={styles.header}>
          <div>
            <Title2>Plant Manager Board</Title2>
            <Body1 className={styles.muted}>{orders.length} order(s)</Body1>
          </div>
          <div className={styles.headerActions}>
            <Button appearance="secondary" onClick={() => navigate("/")}>
              Back to Dashboard
            </Button>
            <Button
              appearance="secondary"
              icon={<ArrowClockwise24Regular />}
              onClick={() => void loadBoard()}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        <section className={styles.boardGrid}>
          {orders.map((order) => (
            <Card
              key={order.id}
              className={styles.card}
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <div className={styles.row}>
                <span className={styles.label}>Order</span>
                <span>{formatOrderDisplayNo(order.salesOrderNo, order.ipadOrderNo)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Current State</span>
                <span>{getWorkspaceCurrentStatus(order.orderLifecycleStatus ?? order.orderStatus)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Site</span>
                <span>{order.siteName}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Customer</span>
                <span>{order.customerName}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>City/State</span>
                <span>{formatCityState(order.customerCity, order.customerState)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Pickup</span>
                <span>{order.isPickup ? "Yes" : "No"}</span>
              </div>
              <div className={styles.linesWrap}>
                {order.lines.map((line) => (
                  <div key={line.lineId} className={styles.lineRow}>
                    <span>{line.itemDescription}</span>
                    <span>
                      {line.displayQuantityLabel}: {line.displayQuantity}
                    </span>
                  </div>
                ))}
                {order.lines.length === 0 ? (
                  <Body1 className={styles.emptyState}>No line details available.</Body1>
                ) : null}
              </div>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
