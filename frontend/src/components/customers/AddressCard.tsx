import {
  Card,
  CardHeader,
  Body1,
  Caption1,
  makeStyles,
  tokens,
  Button,
} from "@fluentui/react-components";
import { Edit24Regular, Delete24Regular } from "@fluentui/react-icons";
import type { Address } from "../../types/customer";

const useStyles = makeStyles({
  card: {
    width: "100%",
  },
  body: {
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
  },
  line: {
    display: "block",
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
  },
});

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
}

export function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  const styles = useStyles();

  const parts = [
    address.address1,
    address.address2,
    [address.city, address.state, address.postalCode]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);

  return (
    <Card className={styles.card} size="small">
      <CardHeader
        header={<Body1>{address.addressName || address.address1}</Body1>}
        action={
          <div className={styles.actions}>
            <Button
              appearance="subtle"
              icon={<Edit24Regular />}
              size="small"
              onClick={() => onEdit(address)}
            />
            <Button
              appearance="subtle"
              icon={<Delete24Regular />}
              size="small"
              onClick={() => onDelete(address)}
              disabled={address.isUsedOnOrders}
              title={
                address.isUsedOnOrders
                  ? "Cannot delete — referenced by sales orders"
                  : "Delete address"
              }
            />
          </div>
        }
      />
      <div className={styles.body}>
        {parts.map((p, i) => (
          <Caption1 key={i} className={styles.line}>
            {p}
          </Caption1>
        ))}
      </div>
    </Card>
  );
}
