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

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"

if (-not (Test-Path $backendDir)) {
    throw "Backend directory not found: $backendDir"
}

if (-not (Test-Path $frontendDir)) {
    throw "Frontend directory not found: $frontendDir"
}

Invoke-Step -Title "Run backend unit tests" -Action {
    Push-Location $backendDir
    try {
        Invoke-CommandChecked -FailureMessage "Backend unit tests failed" -Command {
            dotnet test "LPCylinderMES.sln" --nologo
        }
    }
    finally {
        Pop-Location
    }
}

Invoke-Step -Title "Install frontend dependencies (if needed)" -Action {
    Push-Location $frontendDir
    try {
        if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
            Invoke-CommandChecked -FailureMessage "Frontend dependency installation failed" -Command {
                npm ci
            }
        }
    }
    finally {
        Pop-Location
    }
}

Invoke-Step -Title "Run frontend unit tests" -Action {
    Push-Location $frontendDir
    try {
        Invoke-CommandChecked -FailureMessage "Frontend unit tests failed" -Command {
            npm test
        }
    }
    finally {
        Pop-Location
    }
}

Invoke-Step -Title "Validate frontend TypeScript" -Action {
    Push-Location $frontendDir
    try {
        Invoke-CommandChecked -FailureMessage "TypeScript validation failed" -Command {
            npm run typecheck
        }
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "Preflight complete: all checks passed." -ForegroundColor Green
