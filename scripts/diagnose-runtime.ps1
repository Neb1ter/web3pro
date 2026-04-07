$ErrorActionPreference = "Continue"

Set-Location "C:\web3pro"

Write-Host "--- PM2 show gatetoweb3 ---"
npx pm2 show gatetoweb3

Write-Host "--- PM2 recent logs ---"
npx pm2 logs gatetoweb3 --lines 120 --nostream

Write-Host "--- Listening ports (3000/3100) ---"
netstat -ano | findstr :3000
netstat -ano | findstr :3100

Write-Host "--- Localhost root probe ---"
try {
  $root = Invoke-WebRequest "http://127.0.0.1:3000/" -UseBasicParsing -TimeoutSec 15
  Write-Host ("root_status=" + $root.StatusCode)
} catch {
  Write-Host ("root_error=" + $_.Exception.Message)
}

Write-Host "--- Localhost codex health probe ---"
try {
  $codex = Invoke-WebRequest "http://127.0.0.1:3000/codex-business/app/api/health" -UseBasicParsing -TimeoutSec 15
  Write-Host ("codex_status=" + $codex.StatusCode)
  Write-Host $codex.Content
} catch {
  Write-Host ("codex_error=" + $_.Exception.Message)
}
