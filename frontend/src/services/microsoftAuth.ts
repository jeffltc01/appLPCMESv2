import { PublicClientApplication } from "@azure/msal-browser";

let pca: PublicClientApplication | null = null;
let authOperationQueue: Promise<void> = Promise.resolve();

function getClient() {
  if (pca) {
    return pca;
  }

  const clientId = import.meta.env.VITE_MSAL_CLIENT_ID as string | undefined;
  const authority =
    (import.meta.env.VITE_MSAL_AUTHORITY as string | undefined) ??
    "https://login.microsoftonline.com/common";

  if (!clientId) {
    throw new Error("Microsoft SSO is not configured. Missing VITE_MSAL_CLIENT_ID.");
  }

  pca = new PublicClientApplication({
    auth: {
      clientId,
      authority,
      redirectUri: `${window.location.origin}/login`,
      // Recommended by MSAL when login is initiated on the same route as redirectUri.
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: "sessionStorage",
    },
  });

  return pca;
}

function getScopes(): string[] {
  const scopesRaw = (import.meta.env.VITE_MSAL_SCOPES as string | undefined) ?? "openid,profile,email";
  return scopesRaw
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function serializeMsalOperation<T>(operation: () => Promise<T>): Promise<T> {
  const run = authOperationQueue.then(operation, operation);
  authOperationQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export async function completeMicrosoftRedirectIfPresent(): Promise<string | null> {
  return serializeMsalOperation(async () => {
    const client = getClient();
    await client.initialize();

    const result = await client.handleRedirectPromise();
    if (!result) {
      return null;
    }
    if (!result.idToken) {
      throw new Error("Microsoft redirect sign-in did not return an ID token.");
    }

    return result.idToken;
  });
}

export async function startMicrosoftLoginRedirect(): Promise<void> {
  return serializeMsalOperation(async () => {
    const client = getClient();
    await client.initialize();
    await client.loginRedirect({
      scopes: getScopes(),
      prompt: "select_account",
    });
  });
}
