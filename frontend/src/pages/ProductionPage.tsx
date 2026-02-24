import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Body1,
  Card,
  CardHeader,
  MessageBar,
  MessageBarBody,
  Spinner,
  Title1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import type { ProductionOrderListItem } from "../types/order";
import { ordersApi } from "../services/orders";

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  queuePanel: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: tokens.spacingVerticalM,
    "@media (max-width: 1200px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  queueCard: {
    cursor: "pointer",
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusLarge,
    minHeight: "112px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  queueOrderNo: {
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase500,
  },
  queueMeta: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
});

export function ProductionPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ProductionOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ordersApi.productionList();
        setOrders(data);
      } catch {
        setError("Unable to load production queue.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className={styles.page}>
      <Title1>Production</Title1>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {loading ? (
        <Spinner label="Loading production queue..." />
      ) : orders.length === 0 ? (
        <Body1>No received orders ready for production.</Body1>
      ) : (
        <div className={styles.queuePanel}>
          {orders.map((order) => (
            <Card
              key={order.id}
              className={styles.queueCard}
              onClick={() => navigate(`/production/${order.id}`)}
            >
              <CardHeader header={<span className={styles.queueOrderNo}>{order.salesOrderNo}</span>} />
              <Body1 className={styles.queueMeta}>Customer: {order.customerName}</Body1>
              <Body1 className={styles.queueMeta}>Site: {order.siteName}</Body1>
              <Body1 className={styles.queueMeta}>
                Received: {order.receivedDate?.slice(0, 10) ?? "--"}
              </Body1>
              <Body1 className={styles.queueMeta}>Priority: {order.priority ?? "--"}</Body1>
              <Body1 className={styles.queueMeta}>
                Items Ordered: {order.itemsOrderedSummary || "--"}
              </Body1>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
