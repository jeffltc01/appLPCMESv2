Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-CommandChecked {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command,
        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$FailureMessage (exit code $LASTEXITCODE)"
    }
}

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Title,
        [Parameter(Mandatory = $true)]
        [scriptblock]$Action
    )

    Write-Host ""
    Write-Host "==> $Title" -ForegroundColor Cyan
    & $Action
}

function Get-RequiredValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Missing required value: $Name"
    }

    return $Value
}

function Get-SqlPassword {
    if (-not [string]::IsNullOrWhiteSpace($env:LPCMES_SQL_PASSWORD)) {
        return $env:LPCMES_SQL_PASSWORD
    }

    $secure = Read-Host "Enter SQL password for the test DB user" -AsSecureString
    if ($null -eq $secure) {
        throw "SQL password input was cancelled."
    }

    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$parametersFilePath = Join-Path $scriptDir "test.parameters.json"
$bicepFilePath = Join-Path $scriptDir "main.bicep"
$envFilePath = Join-Path $scriptDir "test.env.ps1"

if (-not (Test-Path $parametersFilePath)) {
    throw "Missing parameters file: $parametersFilePath"
}

if (-not (Test-Path $bicepFilePath)) {
    throw "Missing Bicep file: $bicepFilePath"
}

if (-not (Test-Path $envFilePath)) {
    throw "Missing environment file: $envFilePath"
}

. $envFilePath

$subscriptionId = Get-RequiredValue -Name "SubscriptionId" -Value $SubscriptionId
$resourceGroupName = Get-RequiredValue -Name "ResourceGroupName" -Value $ResourceGroupName
$location = Get-RequiredValue -Name "Location" -Value $Location
$sqlServerFqdn = Get-RequiredValue -Name "SqlServerFqdn" -Value $SqlServerFqdn
$sqlDatabaseName = Get-RequiredValue -Name "SqlDatabaseName" -Value $SqlDatabaseName
$sqlUserName = Get-RequiredValue -Name "SqlUserName" -Value $SqlUserName
$sqlPassword = Get-SqlPassword

if ($sqlPassword.Contains("'")) {
    throw "SQL password contains a single quote. Rotate to one without single quote for safe connection-string automation."
}

Invoke-Step -Title "Check Azure CLI is installed" -Action {
    Invoke-CommandChecked -FailureMessage "Azure CLI not found" -Command {
        az version --output none
    }
}

Invoke-Step -Title "Set Azure subscription" -Action {
    Invoke-CommandChecked -FailureMessage "Failed to set Azure subscription" -Command {
        az account set --subscription $subscriptionId
    }
}

Invoke-Step -Title "Create or update test resource group" -Action {
    Invoke-CommandChecked -FailureMessage "Failed to create resource group" -Command {
        az group create --name $resourceGroupName --location $location --tags Environment=test App=lpcmesv2 --output none
    }
}

Invoke-Step -Title "Preview changes with what-if" -Action {
    Invoke-CommandChecked -FailureMessage "What-if deployment preview failed" -Command {
        az deployment group what-if `
            --resource-group $resourceGroupName `
            --name "test-whatif-$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))" `
            --template-file $bicepFilePath `
            --parameters "@$parametersFilePath"
    }
}

Invoke-Step -Title "Deploy test infrastructure" -Action {
    Invoke-CommandChecked -FailureMessage "Infrastructure deployment failed" -Command {
        az deployment group create `
            --resource-group $resourceGroupName `
            --name "test-deploy-$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))" `
            --template-file $bicepFilePath `
            --parameters "@$parametersFilePath" `
            --query "properties.outputs" `
            --output json > (Join-Path $scriptDir "deployment.outputs.json")
    }
}

$outputsPath = Join-Path $scriptDir "deployment.outputs.json"
if (-not (Test-Path $outputsPath)) {
    throw "Deployment outputs file was not created: $outputsPath"
}

$outputs = Get-Content $outputsPath -Raw | ConvertFrom-Json
$backendWebAppName = $outputs.backendWebAppName.value
$backendDefaultHostName = $outputs.backendDefaultHostName.value
$keyVaultName = $outputs.keyVaultName.value
$appInsightsConnectionString = $outputs.appInsightsConnectionString.value
$staticWebAppDefaultHostName = $outputs.staticWebAppDefaultHostName.value

$connectionString = "Server=tcp:$sqlServerFqdn;Database=$sqlDatabaseName;User Id=$sqlUserName;Password=$sqlPassword;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
$testApiBaseUrl = "https://$backendDefaultHostName"
$testFrontendUrl = "https://$staticWebAppDefaultHostName"

Invoke-Step -Title "Store SQL connection string in Key Vault" -Action {
    Invoke-CommandChecked -FailureMessage "Failed to set Key Vault secret" -Command {
        az keyvault secret set `
            --vault-name $keyVaultName `
            --name "lpcapps-connection-string" `
            --value $connectionString `
            --output none
    }
}

$secretUri = az keyvault secret show `
    --vault-name $keyVaultName `
    --name "lpcapps-connection-string" `
    --query "id" `
    --output tsv

$backendSettingsFilePath = Join-Path $scriptDir "backend.appsettings.json"
$backendSettings = @{
    ASPNETCORE_ENVIRONMENT                 = "Test"
    ConnectionStrings__LPCApps             = "@Microsoft.KeyVault(SecretUri=$secretUri)"
    APPLICATIONINSIGHTS_CONNECTION_STRING  = $appInsightsConnectionString
    Cors__AllowedOrigins__0                = $testFrontendUrl
    MicrosoftAuth__Authority               = $MicrosoftAuthority
    MicrosoftAuth__ClientId                = $MicrosoftClientId
}
$backendSettings | ConvertTo-Json -Compress | Set-Content -Path $backendSettingsFilePath -Encoding UTF8

Invoke-Step -Title "Configure backend application settings" -Action {
    Invoke-CommandChecked -FailureMessage "Failed to set backend app settings" -Command {
        az webapp config appsettings set `
            --name $backendWebAppName `
            --resource-group $resourceGroupName `
            --settings "@$backendSettingsFilePath" `
            --output none
    }
}

Invoke-Step -Title "Configure frontend application settings" -Action {
    Invoke-CommandChecked -FailureMessage "Failed to set frontend app settings" -Command {
        az staticwebapp appsettings set `
            --name $outputs.staticWebAppName.value `
            --setting-names `
            "VITE_API_BASE_URL=$testApiBaseUrl" `
            "VITE_MSAL_AUTHORITY=$MicrosoftAuthority" `
            "VITE_MSAL_CLIENT_ID=$MicrosoftClientId" `
            "VITE_MSAL_SCOPES=$MicrosoftScopes" `
            --output none
    }
}

Invoke-Step -Title "Smoke test backend endpoint" -Action {
    $smokeUrl = "$testApiBaseUrl/api/sites"
    $response = Invoke-RestMethod -Method Get -Uri $smokeUrl -TimeoutSec 60
    if ($null -eq $response) {
        throw "Smoke test failed. Endpoint returned no data: $smokeUrl"
    }

    Write-Host "Smoke test passed for: $smokeUrl" -ForegroundColor Green
}

Write-Host ""
Write-Host "Test environment deployment complete." -ForegroundColor Green
Write-Host "Backend URL: $testApiBaseUrl"
Write-Host "Frontend URL: $testFrontendUrl"
