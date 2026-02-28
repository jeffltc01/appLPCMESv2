Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Subscription where test resources will be created.
$SubscriptionId = "faa5210a-d33c-41ce-8494-75e2a12237ac"

# Existing test resource group. Set to $null to let deploy script create it.
$ResourceGroupName = "rg-lpcmesv2-test"

# Deployment location for resource group and App Service resources.
$Location = "eastus"

# Existing Azure SQL endpoint and DB name for test.
$SqlServerFqdn = "lt-warehouse.public.244dc3b91bc8.database.windows.net,3342"
$SqlDatabaseName = "LPCMESv2Test"
$SqlUserName = "pbiread"

# Set this in your shell before running deploy-test.ps1:
#   $env:LPCMES_SQL_PASSWORD = "<rotated-password>"
# Keeping password out of source is required.

# Optional auth settings for frontend/backend SSO configuration.
$MicrosoftAuthority = ""
$MicrosoftClientId = ""
$MicrosoftScopes = "openid,profile,email"
