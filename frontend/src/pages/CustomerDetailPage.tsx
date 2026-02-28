import { Button, Card, Title2, makeStyles } from "@fluentui/react-components";
import { ArrowLeft24Regular } from "@fluentui/react-icons";
import { useNavigate, useParams } from "react-router-dom";
import { HelpEntryPoint } from "../components/help/HelpEntryPoint";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: "20px",
    display: "grid",
    gap: "12px",
    alignContent: "start",
  },
  card: {
    maxWidth: "640px",
    padding: "16px",
  },
});

export function CustomerDetailPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { customerId } = useParams();

  return (
    <div className={styles.page}>
      <Button
        appearance="subtle"
        icon={<ArrowLeft24Regular />}
        onClick={() => navigate(-1)}
      >
        Back
      </Button>
      <HelpEntryPoint route="/customers/:customerId" />
      <Card className={styles.card}>
        <Title2>Customer Detail (Placeholder)</Title2>
        <p>Customer ID: {customerId ?? "unknown"}</p>
      </Card>
    </div>
  );
}
