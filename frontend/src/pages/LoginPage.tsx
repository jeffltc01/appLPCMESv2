import { useEffect, useMemo, useState } from "react";
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
import { completeMicrosoftRedirectIfPresent, startMicrosoftLoginRedirect } from "../services/microsoftAuth";
import { readTabletSetup } from "../features/tabletSetupStorage";
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
  const getErrorMessage = (err: unknown, fallback: string) => {
    const apiError = err as ApiError;
    const body = apiError.body as { detail?: string; message?: string } | undefined;
    if (body?.message || body?.detail) {
      return body.message ?? body.detail ?? fallback;
    }
    if (err instanceof Error && err.message.trim().length > 0) {
      return err.message;
    }
    return fallback;
  };

  useEffect(() => {
    let cancelled = false;
    const handleRedirectResult = async () => {
      if (!cancelled) {
        setIsLoading(true);
      }
      try {
        const idToken = await completeMicrosoftRedirectIfPresent();
        if (!idToken || cancelled) {
          return;
        }

        setIsLoading(true);
        setError(null);
        await microsoftLogin(idToken);
        if (!cancelled) {
          navigate("/", { replace: true });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Microsoft sign-in failed."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsMicrosoftReady(true);
        }
      }
    };

    void handleRedirectResult();
    return () => {
      cancelled = true;
    };
  }, [microsoftLogin, navigate]);

  const submitMicrosoftLogin = async () => {
    if (!isMicrosoftReady) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await startMicrosoftLoginRedirect();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Microsoft sign-in failed."));
      setIsLoading(false);
    }
  };

  const [empNo, setEmpNo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMicrosoftReady, setIsMicrosoftReady] = useState(false);
  const [isResolvingAssignments, setIsResolvingAssignments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<OperatorAssignment[]>([]);
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState("");
  const [canEditAssignment, setCanEditAssignment] = useState(false);

  const selectedAssignment = useMemo(
    () => assignments.find((a) => `${a.siteId}:${a.workCenterId}` === selectedAssignmentKey) ?? null,
    [assignments, selectedAssignmentKey]
  );

  useEffect(() => {
    const normalized = empNo.trim();
    if (!normalized) {
      setAssignments([]);
      setSelectedAssignmentKey("");
      setCanEditAssignment(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsResolvingAssignments(true);
      try {
        const response = await operatorPreLogin(normalized);
        if (cancelled) {
          return;
        }

        const hasRolesPayload = Array.isArray(response.roles);
        const roles = hasRolesPayload ? response.roles : [];
        const hasPrivilegedScopeOverrideRole = roles.some((role) =>
          ["Admin", "PlantManager", "Supervisor"].some(
            (allowedRole) => allowedRole.toLowerCase() === role.toLowerCase()
          )
        );
        // Backward compatibility: if backend has not rolled out roles yet, keep selector editable.
        setCanEditAssignment(hasRolesPayload ? hasPrivilegedScopeOverrideRole : true);
        setAssignments(response.assignments);
        if (response.assignments.length > 0) {
          const savedSetup = readTabletSetup();
          const savedMatch =
            savedSetup
              ? response.assignments.find(
                  (assignment) =>
                    assignment.siteId === savedSetup.siteId &&
                    assignment.workCenterId === savedSetup.workCenterId
                ) ?? null
              : null;
          const fallback = response.assignments[0];
          const selected = savedMatch ?? fallback;
          setSelectedAssignmentKey(`${selected.siteId}:${selected.workCenterId}`);
        } else {
          setSelectedAssignmentKey("");
        }
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }
        const apiError = err as ApiError;
        const body = apiError.body as { detail?: string; message?: string } | undefined;
        setAssignments([]);
        setSelectedAssignmentKey("");
        setCanEditAssignment(false);
        setError(body?.message ?? body?.detail ?? "Unable to find operator profile.");
      } finally {
        if (!cancelled) {
          setIsResolvingAssignments(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [empNo]);

  const submitLogin = async () => {
    if (!empNo.trim()) {
      setError("Employee number is required.");
      return;
    }

    if (isResolvingAssignments) {
      setError("Please wait for assignments to load.");
      return;
    }

    if (!selectedAssignment) {
      setError("Please select a site/work center assignment.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await operatorLogin({
        empNo,
        password: null,
        siteId: selectedAssignment?.siteId ?? null,
        workCenterId: selectedAssignment?.workCenterId ?? null,
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
          <Button
            appearance="secondary"
            onClick={() => void submitMicrosoftLogin()}
            disabled={isLoading || !isMicrosoftReady}
          >
            Sign in with Microsoft
          </Button>
        </Field>

        <Field label="Employee Number" required>
          <Input
            value={empNo}
            onChange={(_, data) => {
              setEmpNo(data.value);
              setError(null);
            }}
            maxLength={20}
          />
        </Field>

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
              disabled={isResolvingAssignments || assignments.length === 0 || !canEditAssignment}
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

        <Body1>
          {isResolvingAssignments
            ? "Loading site and work center assignments..."
            : "Enter employee number and select site/work center to sign in."}
        </Body1>

        <div className={styles.actions}>
          <Button appearance="primary" onClick={() => void submitLogin()} disabled={isLoading || isResolvingAssignments}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
