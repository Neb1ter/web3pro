$ErrorActionPreference = "Stop"

$ProjectDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogsDir = Join-Path $ProjectDir "logs"
$PidFile = Join-Path $LogsDir "web3pro.pid"
$StdOut = Join-Path $LogsDir "web3pro.out.log"
$StdErr = Join-Path $LogsDir "web3pro.err.log"

New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null

function Stop-ExistingProcess {
  if (Test-Path $PidFile) {
    $existingPid = Get-Content $PidFile | Select-Object -First 1
    if ($existingPid -match '^\d+$') {
      Stop-Process -Id ([int]$existingPid) -Force -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 1
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
  }

  try {
    $listeners = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction Stop |
      Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $listeners) {
      Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
  } catch {
  }
}

function Start-Web3Pro {
  Set-Location $ProjectDir

  $env:NODE_ENV = "production"
  $env:PORT = "3000"

  $nodePath = (Get-Command node).Source
  $proc = Start-Process `
    -FilePath $nodePath `
    -ArgumentList "dist/index.js" `
    -WorkingDirectory $ProjectDir `
    -RedirectStandardOutput $StdOut `
    -RedirectStandardError $StdErr `
    -WindowStyle Hidden `
    -PassThru

  Set-Content -Path $PidFile -Value $proc.Id
  Start-Sleep -Seconds 6

  $listener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if (-not $listener) {
    Write-Host "--- web3pro stderr tail ---"
    if (Test-Path $StdErr) {
      Get-Content $StdErr -Tail 120
    }
    throw "web3pro failed to bind to port 3000"
  }

  Write-Host "web3pro started successfully on port 3000 (pid=$($proc.Id))"
}

Stop-ExistingProcess
Start-Web3Pro
