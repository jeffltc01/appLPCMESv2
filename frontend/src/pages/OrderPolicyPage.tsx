import { useEffect, useMemo, useState } from "react";
import {
  Body1,
  Button,
  Card,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title2,
} from "@fluentui/react-components";
import { orderPoliciesApi } from "../services/orderPolicies";
import type { DecisionPolicyEntry } from "../types/policy";

const DEFAULT_POLICY_VERSION = 1;
const REQUIRED_SIGNOFFS = ["Office", "Transportation", "Receiving", "Production", "Quality", "Accounting"];

export function OrderPolicyPage() {
  const [policyVersion, setPolicyVersion] = useState(DEFAULT_POLICY_VERSION);
  const [policies, setPolicies] = useState<DecisionPolicyEntry[]>([]);
  const [decisionKey, setDecisionKey] = useState("");
  const [policyValue, setPolicyValue] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");
  const [functionRole, setFunctionRole] = useState("Office");
  const [signoffBy, setSignoffBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedFunctions, setSignedFunctions] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [policyRows, signoffRows] = await Promise.all([
        orderPoliciesApi.list(policyVersion),
        orderPoliciesApi.signoffs(policyVersion),
      ]);
      setPolicies(policyRows);
      setSignedFunctions(signoffRows.filter((row) => row.isApproved).map((row) => row.functionRole));
    } catch {
      setError("Unable to load order policy data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [policyVersion]);

  const missingFunctions = useMemo(
    () => REQUIRED_SIGNOFFS.filter((role) => !signedFunctions.includes(role)),
    [signedFunctions]
  );

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Title2>Order Policy Governance</Title2>
      <Body1>
        Resolve and enforce all Section 12 decisions by policy version, then collect cross-functional sign-offs before activation.
      </Body1>
      {message ? (
        <MessageBar intent="success">
          <MessageBarBody>{message}</MessageBarBody>
        </MessageBar>
      ) : null}
      {error ? (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      ) : null}

      <Card>
        <Field label="Policy Version">
          <Input
            type="number"
            value={String(policyVersion)}
            onChange={(_, data) => setPolicyVersion(Number(data.value) || DEFAULT_POLICY_VERSION)}
          />
        </Field>
      </Card>

      <Card>
        <Body1>
          <strong>Upsert Decision Policy</strong>
        </Body1>
        <Field label="Decision Key">
          <Input value={decisionKey} onChange={(_, data) => setDecisionKey(data.value)} />
        </Field>
        <Field label="Policy Value">
          <Input value={policyValue} onChange={(_, data) => setPolicyValue(data.value)} />
        </Field>
        <Field label="Updated By Emp No">
          <Input value={updatedBy} onChange={(_, data) => setUpdatedBy(data.value)} />
        </Field>
        <Button
          appearance="primary"
          disabled={loading || !decisionKey.trim() || !policyValue.trim() || !updatedBy.trim()}
          onClick={async () => {
            try {
              await orderPoliciesApi.upsert(decisionKey.trim(), {
                policyVersion,
                scopeType: "Global",
                policyValue: policyValue.trim(),
                isActive: true,
                updatedByEmpNo: updatedBy.trim(),
              });
              setMessage(`Decision '${decisionKey.trim()}' updated.`);
              await loadData();
            } catch {
              setError("Failed to save decision policy.");
            }
          }}
        >
          Save Decision
        </Button>
      </Card>

      <Card>
        <Body1>
          <strong>Cross-Functional Sign-Off</strong>
        </Body1>
        <Body1>Required: {REQUIRED_SIGNOFFS.join(", ")}</Body1>
        <Body1>Missing: {missingFunctions.length > 0 ? missingFunctions.join(", ") : "None"}</Body1>
        <Field label="Function Role">
          <Input value={functionRole} onChange={(_, data) => setFunctionRole(data.value)} />
        </Field>
        <Field label="Approved By Emp No">
          <Input value={signoffBy} onChange={(_, data) => setSignoffBy(data.value)} />
        </Field>
        <Button
          appearance="secondary"
          disabled={loading || !functionRole.trim() || !signoffBy.trim()}
          onClick={async () => {
            try {
              await orderPoliciesApi.addSignoff({
                policyVersion,
                functionRole: functionRole.trim(),
                approvedByEmpNo: signoffBy.trim(),
              });
              setMessage(`${functionRole.trim()} sign-off recorded.`);
              await loadData();
            } catch {
              setError("Failed to record sign-off.");
            }
          }}
        >
          Add Sign-Off
        </Button>
        <Button
          appearance="primary"
          disabled={loading}
          onClick={async () => {
            try {
              const result = await orderPoliciesApi.activate(policyVersion);
              if (result.activated) {
                setMessage(`Policy version ${policyVersion} activated.`);
              } else {
                setError(`Cannot activate. Missing sign-offs: ${result.missingFunctions.join(", ")}`);
              }
              await loadData();
            } catch {
              setError("Activation blocked. Ensure all required functions signed off.");
            }
          }}
        >
          Activate Version
        </Button>
      </Card>

      <Card>
        <Body1>
          <strong>Decision Rules</strong>
        </Body1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Key</TableHeaderCell>
              <TableHeaderCell>Value</TableHeaderCell>
              <TableHeaderCell>Scope</TableHeaderCell>
              <TableHeaderCell>Updated</TableHeaderCell>
              <TableHeaderCell>By</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={`${policy.policyVersion}-${policy.decisionKey}-${policy.scopeType}`}>
                <TableCell>{policy.decisionKey}</TableCell>
                <TableCell>{policy.policyValue}</TableCell>
                <TableCell>{policy.scopeType}</TableCell>
                <TableCell>{new Date(policy.updatedUtc).toLocaleString()}</TableCell>
                <TableCell>{policy.updatedByEmpNo ?? "--"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
