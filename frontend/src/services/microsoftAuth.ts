import { PublicClientApplication } from "@azure/msal-browser";

let pca: PublicClientApplication | null = null;

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
      redirectUri: `${window.location.origin}/auth/popup-complete`,
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

export async function loginWithMicrosoftPopup(): Promise<string> {
  const client = getClient();
  await client.initialize();

  const result = await client.loginPopup({
    scopes: getScopes(),
    prompt: "select_account",
  });

  if (!result.idToken) {
    throw new Error("Microsoft login did not return an ID token.");
  }

  return result.idToken;
}
