import { Body1, Button, Card, Title2 } from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";

export function SetupHomePage() {
  const navigate = useNavigate();
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Title2>Setup Configuration</Title2>
      <Body1>Choose a setup area to manage routing configuration and simulation.</Body1>
      <Card style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button appearance="primary" onClick={() => navigate("/setup/workcenters")}>
          Work Centers
        </Button>
        <Button appearance="primary" onClick={() => navigate("/setup/route-templates")}>
          Route Templates
        </Button>
        <Button appearance="primary" onClick={() => navigate("/setup/assignments")}>
          Assignments + Simulation
        </Button>
        <Button onClick={() => navigate("/setup/policies")}>Policies</Button>
      </Card>
    </div>
  );
}
