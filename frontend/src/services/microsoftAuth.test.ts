import { beforeEach, describe, expect, it, vi } from "vitest";

const initializeMock = vi.fn();
const loginRedirectMock = vi.fn();
const handleRedirectPromiseMock = vi.fn();
const publicClientApplicationMock = vi.fn(function MockPublicClientApplication() {
  return {
    initialize: initializeMock,
    loginRedirect: loginRedirectMock,
    handleRedirectPromise: handleRedirectPromiseMock,
  };
});

vi.mock("@azure/msal-browser", () => ({
  PublicClientApplication: publicClientApplicationMock,
}));

describe("microsoftAuth", () => {
  beforeEach(() => {
    vi.resetModules();
    initializeMock.mockReset();
    loginRedirectMock.mockReset();
    handleRedirectPromiseMock.mockReset();
    publicClientApplicationMock.mockClear();

    const env = (import.meta as ImportMeta & { env: Record<string, unknown> }).env;
    env.VITE_MSAL_CLIENT_ID = "test-client-id";
    env.VITE_MSAL_AUTHORITY = "https://login.microsoftonline.com/test-tenant";
    env.VITE_MSAL_SCOPES = "openid,profile,email";
  });

  it("starts redirect login with /login redirect uri", async () => {
    initializeMock.mockResolvedValue(undefined);
    loginRedirectMock.mockResolvedValue(undefined);

    const { startMicrosoftLoginRedirect } = await import("./microsoftAuth");
    await startMicrosoftLoginRedirect();

    expect(loginRedirectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        scopes: ["openid", "profile", "email"],
        prompt: "select_account",
      })
    );
    expect(publicClientApplicationMock).toHaveBeenCalledTimes(1);
    expect(publicClientApplicationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: expect.objectContaining({
          redirectUri: "http://localhost:3000/login",
        }),
      })
    );
  });

  it("returns id token from redirect response", async () => {
    initializeMock.mockResolvedValue(undefined);
    handleRedirectPromiseMock.mockResolvedValue({ idToken: "redirect-id-token" });

    const { completeMicrosoftRedirectIfPresent } = await import("./microsoftAuth");
    const idToken = await completeMicrosoftRedirectIfPresent();

    expect(idToken).toBe("redirect-id-token");
  });
});
