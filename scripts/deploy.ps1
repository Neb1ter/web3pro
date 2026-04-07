$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

Write-Host "[deploy] Installing dependencies"
corepack enable
pnpm install --frozen-lockfile

Write-Host "[deploy] Building application"
pnpm run build

Write-Host "[deploy] Starting web3pro"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "start-web3pro.ps1")

Write-Host "[deploy] Running diagnostics"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "diagnose-runtime.ps1")
