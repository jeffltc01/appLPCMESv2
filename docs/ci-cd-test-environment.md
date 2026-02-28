# GitHub CI and Azure Test Deployment

This repository uses two GitHub Actions workflows:

- `CI` (`.github/workflows/ci.yml`) for validation on pull requests and pushes to `main`.
- `Deploy Test` (`.github/workflows/deploy-test.yml`) for Azure Test deployment after successful CI on `main` (and manual dispatch).

## 1) Configure GitHub Environment `test`

In GitHub, create environment `test` and configure the following **environment variables**:

- `AZURE_CLIENT_ID` - App registration (service principal) client ID used by OIDC.
- `AZURE_TENANT_ID` - Azure tenant ID.
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID for the test environment.
- `TEST_BACKEND_APP_NAME` - App Service name (example: `app-lpcmesv2-api-test`).
- `TEST_STATIC_WEB_APP_NAME` - Static Web App name (example: `swa-lpcmesv2-test`).
- `TEST_RESOURCE_GROUP` - Resource group containing test web resources (example: `rg-lpcmesv2-test`).
- `TEST_API_BASE_URL` - Backend base URL (example: `https://app-lpcmesv2-api-test.azurewebsites.net`).
- `TEST_VITE_MSAL_AUTHORITY` - Frontend MSAL authority URL for test.
- `TEST_VITE_MSAL_CLIENT_ID` - Frontend MSAL client ID for test.
- `TEST_VITE_MSAL_SCOPES` - Frontend MSAL scopes list (example: `openid,profile,email`).

No long-lived deploy secrets are required when OIDC is configured correctly.

## 2) Configure Azure OIDC for GitHub

1. Create or reuse an Azure app registration / service principal for GitHub deploys.
2. Add a federated credential for this repository.
3. Use a subject that matches your deployment trust model:
   - Recommended for this repo: environment-based subject for `test`.
4. Grant least-privilege RBAC access needed for deployment:
   - App Service deployment rights for backend web app.
   - Static Web App management rights (to read deploy token and deploy content).

Use the app registration values for:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

## 3) Local Preflight Before Push

Run this locally before opening PRs or pushing to `main`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/preflight.ps1
```

Preflight now mirrors CI checks:
- backend tests (`dotnet test`)
- backend publish validation (`dotnet publish`)
- frontend dependency install (`npm ci`)
- frontend tests (`npm test`)
- frontend typecheck (`npm run typecheck`)
- frontend build validation (`npm run build`)

## 4) Optional Local Pre-Push Hook

This repo includes `.githooks/pre-push`, which runs `scripts/preflight.ps1`.

To enable it locally:

```bash
git config core.hooksPath .githooks
```

If preflight fails, push is blocked locally.

## 5) Branch Protection Recommendation

Protect `main` with:
- Required status check: `CI / Validate Backend and Frontend`
- Require pull request before merge
- Optional: require environment reviewer approval for `test` deploys

## 6) Deployment Verification

After deployment, workflow smoke test verifies:
- `GET ${TEST_API_BASE_URL}/api/sites` returns successfully.
