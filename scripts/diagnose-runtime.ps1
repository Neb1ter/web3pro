$ErrorActionPreference = "Continue"

$ProjectDir = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $ProjectDir

$LogsDir = Join-Path $ProjectDir "logs"
$PidFile = Join-Path $LogsDir "web3pro.pid"
$StdOut = Join-Path $LogsDir "web3pro.out.log"
$StdErr = Join-Path $LogsDir "web3pro.err.log"
$TaskName = "web3pro-runtime"

Write-Host "--- PID file ---"
if (Test-Path $PidFile) {
  Get-Content $PidFile
} else {
  Write-Host "pid file missing"
}

Write-Host "--- Node processes ---"
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime

Write-Host "--- Scheduled task ---"
schtasks /Query /TN $TaskName /FO LIST /V 2>$null

Write-Host "--- Listening ports (3000/3100) ---"
netstat -ano | findstr :3000
netstat -ano | findstr :3100

Write-Host "--- web3pro stdout tail ---"
if (Test-Path $StdOut) {
  Get-Content $StdOut -Tail 80
} else {
  Write-Host "stdout log missing"
}

Write-Host "--- web3pro stderr tail ---"
if (Test-Path $StdErr) {
  Get-Content $StdErr -Tail 120
} else {
  Write-Host "stderr log missing"
}

Write-Host "--- Localhost root probe ---"
try {
  $root = Invoke-WebRequest "http://127.0.0.1:3000/" -UseBasicParsing -TimeoutSec 15
  Write-Host ("root_status=" + $root.StatusCode)
} catch {
  Write-Host ("root_error=" + $_.Exception.Message)
}

Write-Host "--- Localhost codex app probe ---"
try {
  $codexApp = Invoke-WebRequest "http://127.0.0.1:3000/codex-business/app/" -UseBasicParsing -TimeoutSec 15
  Write-Host ("codex_app_status=" + $codexApp.StatusCode)
} catch {
  Write-Host ("codex_app_error=" + $_.Exception.Message)
}

Write-Host "--- Localhost codex health probe ---"
try {
  $codex = Invoke-WebRequest "http://127.0.0.1:3000/codex-business/app/api/health" -UseBasicParsing -TimeoutSec 15
  Write-Host ("codex_status=" + $codex.StatusCode)
  Write-Host $codex.Content
} catch {
  Write-Host ("codex_error=" + $_.Exception.Message)
}
