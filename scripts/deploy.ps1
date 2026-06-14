param(
  [switch]$UsePrebuiltBuild
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

Write-Host "[deploy] Installing dependencies"
corepack enable
$installArgs = @("install", "--frozen-lockfile")
if ($UsePrebuiltBuild) {
  $installArgs += "--prod"
}
pnpm @installArgs
if ($LASTEXITCODE -ne 0) { throw "pnpm install failed with code $LASTEXITCODE" }

if ($UsePrebuiltBuild) {
  Write-Host "[deploy] Using prebuilt application"
  if (-not (Test-Path (Join-Path $projectRoot "dist/index.js"))) {
    throw "prebuilt dist/index.js is missing"
  }
} else {
  Write-Host "[deploy] Building application"
  pnpm run build
  if ($LASTEXITCODE -ne 0) { throw "pnpm run build failed with code $LASTEXITCODE" }
}

Write-Host "[deploy] Starting web3pro"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "start-web3pro.ps1")
if ($LASTEXITCODE -ne 0) { throw "start-web3pro.ps1 failed with code $LASTEXITCODE" }

Write-Host "[deploy] Ensuring nginx reverse proxy"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "ensure-nginx.ps1")
if ($LASTEXITCODE -ne 0) { throw "ensure-nginx.ps1 failed with code $LASTEXITCODE" }

Write-Host "[deploy] Running diagnostics"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "diagnose-runtime.ps1")
