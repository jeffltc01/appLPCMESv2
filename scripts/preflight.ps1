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

Invoke-Step -Title "Verify git pre-push hook configuration" -Action {
    Push-Location $repoRoot
    try {
        $hooksPath = (& git config --get core.hooksPath 2>$null)
        if ([string]::IsNullOrWhiteSpace($hooksPath)) {
            throw "Git hooks are not configured. Run: git config core.hooksPath .githooks"
        }

        if ($hooksPath -ne ".githooks") {
            throw "Unexpected core.hooksPath '$hooksPath'. Expected '.githooks'. Run: git config core.hooksPath .githooks"
        }
    }
    finally {
        Pop-Location
    }
}

if (-not (Test-Path $backendDir)) {
    throw "Backend directory not found: $backendDir"
}

if (-not (Test-Path $frontendDir)) {
    throw "Frontend directory not found: $frontendDir"
}

Invoke-Step -Title "Run backend unit tests" -Action {
    Push-Location $backendDir
    try {
        $priorUseInMemory = $env:Testing__UseInMemoryDatabase
        try {
            $env:Testing__UseInMemoryDatabase = "true"
            Invoke-CommandChecked -FailureMessage "Backend unit tests failed" -Command {
                dotnet test "LPCylinderMES.sln" --configuration Release --nologo
            }
        }
        finally {
            if ($null -eq $priorUseInMemory) {
                Remove-Item Env:Testing__UseInMemoryDatabase -ErrorAction SilentlyContinue
            } else {
                $env:Testing__UseInMemoryDatabase = $priorUseInMemory
            }
        }
    }
    finally {
        Pop-Location
    }
}

Invoke-Step -Title "Validate backend publish output" -Action {
    Push-Location $backendDir
    try {
        Invoke-CommandChecked -FailureMessage "Backend publish validation failed" -Command {
            dotnet publish "LPCylinderMES.Api/LPCylinderMES.Api.csproj" --configuration Release --output (Join-Path $env:TEMP "lpcmesv2-backend-publish")
        }
    }
    finally {
        Pop-Location
    }
}

Invoke-Step -Title "Install frontend dependencies (clean install)" -Action {
    Push-Location $frontendDir
    try {
        Invoke-CommandChecked -FailureMessage "Frontend dependency installation failed" -Command {
            npm ci
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

Invoke-Step -Title "Validate frontend production build" -Action {
    Push-Location $frontendDir
    try {
        Invoke-CommandChecked -FailureMessage "Frontend build validation failed" -Command {
            npm run build
        }
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "Preflight complete: all checks passed." -ForegroundColor Green
