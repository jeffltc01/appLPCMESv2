import { useMemo, useState } from "react";
import {
  Body1,
  Button,
  Card,
  CardHeader,
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Title2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../services/api";
import { loginWithMicrosoftPopup } from "../services/microsoftAuth";
import type { OperatorAssignment } from "../types/auth";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingHorizontalL,
  },
  card: {
    width: "100%",
    maxWidth: "560px",
    display: "grid",
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: "grid",
    gap: tokens.spacingHorizontalM,
    gridTemplateColumns: "1fr 1fr",
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
});

export function LoginPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { operatorPreLogin, operatorLogin, microsoftLogin } = useAuth();
  const submitMicrosoftLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const idToken = await loginWithMicrosoftPopup();
      await microsoftLogin(idToken);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      if (body?.message || body?.detail) {
        setError(body.message ?? body.detail ?? "Microsoft sign-in failed.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Microsoft sign-in failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };


  const [empNo, setEmpNo] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [assignments, setAssignments] = useState<OperatorAssignment[]>([]);
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState("");

  const selectedAssignment = useMemo(
    () => assignments.find((a) => `${a.siteId}:${a.workCenterId}` === selectedAssignmentKey) ?? null,
    [assignments, selectedAssignmentKey]
  );

  const submitPreLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await operatorPreLogin(empNo);
      setDisplayName(response.displayName);
      setPasswordRequired(response.passwordRequired);
      setAssignments(response.assignments);
      if (response.assignments.length > 0) {
        const first = response.assignments[0];
        setSelectedAssignmentKey(`${first.siteId}:${first.workCenterId}`);
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Unable to find operator profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitLogin = async () => {
    if (!selectedAssignment) {
      setError("Please select a site/work center assignment.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await operatorLogin({
        empNo,
        password: passwordRequired ? password : null,
        siteId: selectedAssignment.siteId,
        workCenterId: selectedAssignment.workCenterId,
      });
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const body = apiError.body as { detail?: string; message?: string } | undefined;
      setError(body?.message ?? body?.detail ?? "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <CardHeader header={<Title2>LPC MES Login</Title2>} />
        <Body1>Use Microsoft SSO when configured, or sign in as an operator using employee number.</Body1>

        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}

        <Field label="Microsoft SSO">
          <Button appearance="secondary" onClick={() => void submitMicrosoftLogin()} disabled={isLoading}>
            Sign in with Microsoft
          </Button>
        </Field>

        <Field label="Operator Employee Number" required>
          <Input value={empNo} onChange={(_, data) => setEmpNo(data.value)} maxLength={20} />
        </Field>

        {!displayName ? (
          <Button appearance="primary" onClick={() => void submitPreLogin()} disabled={isLoading}>
            {isLoading ? "Checking..." : "Continue"}
          </Button>
        ) : (
          <>
            <Body1>Welcome {displayName}</Body1>
            {passwordRequired && (
              <Field label="Password" required>
                <Input
                  type="password"
                  value={password}
                  onChange={(_, data) => setPassword(data.value)}
                />
              </Field>
            )}
            <div className={styles.row}>
              <Field label="Site / Work Center" required>
                <Dropdown
                  value={
                    selectedAssignment
                      ? `${selectedAssignment.siteName} - ${selectedAssignment.workCenterCode}`
                      : ""
                  }
                  selectedOptions={selectedAssignmentKey ? [selectedAssignmentKey] : []}
                  onOptionSelect={(_, data) => setSelectedAssignmentKey(data.optionValue ?? "")}
                >
                  {assignments.map((assignment) => {
                    const key = `${assignment.siteId}:${assignment.workCenterId}`;
                    const label = `${assignment.siteName} - ${assignment.workCenterCode} (${assignment.workCenterName})`;
                    return (
                      <Option key={key} value={key} text={label}>
                        {label}
                      </Option>
                    );
                  })}
                </Dropdown>
              </Field>
              <div />
            </div>
            <div className={styles.actions}>
              <Button appearance="secondary" onClick={() => window.location.reload()} disabled={isLoading}>
                Reset
              </Button>
              <Button appearance="primary" onClick={() => void submitLogin()} disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
