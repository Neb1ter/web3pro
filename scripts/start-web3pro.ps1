$ErrorActionPreference = "Stop"

$ProjectDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogsDir = Join-Path $ProjectDir "logs"
$PidFile = Join-Path $LogsDir "web3pro.pid"
$StdOut = Join-Path $LogsDir "web3pro.out.log"
$StdErr = Join-Path $LogsDir "web3pro.err.log"
$TaskName = "web3pro-runtime"

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

  $projectPath = $ProjectDir.Path
  $nodePath = (Get-Command node).Source
  $useScheduledTask = $projectPath -ieq "C:\web3pro"

  if ($useScheduledTask) {
    $cmdLine = "cmd.exe /c cd /d `"$projectPath`" && set NODE_ENV=production && set PORT=3000 && `"$nodePath`" dist/index.js 1>> `"$StdOut`" 2>> `"$StdErr`""
    schtasks /Delete /TN $TaskName /F *> $null
    schtasks /Create /TN $TaskName /SC ONCE /ST 00:00 /RL HIGHEST /RU SYSTEM /TR $cmdLine /F | Out-Null
    schtasks /Run /TN $TaskName | Out-Null
  } else {
    $proc = Start-Process `
      -FilePath $nodePath `
      -ArgumentList "dist/index.js" `
      -WorkingDirectory $ProjectDir `
      -RedirectStandardOutput $StdOut `
      -RedirectStandardError $StdErr `
      -WindowStyle Hidden `
      -PassThru

    Set-Content -Path $PidFile -Value $proc.Id
  }

  Start-Sleep -Seconds 8

  try {
    $listenerPid = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction Stop |
      Select-Object -ExpandProperty OwningProcess -First 1
    if ($listenerPid) {
      Set-Content -Path $PidFile -Value $listenerPid
    }
  } catch {
  }

  $listener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if (-not $listener) {
    Write-Host "--- web3pro stderr tail ---"
    if (Test-Path $StdErr) {
      Get-Content $StdErr -Tail 120
    }
    throw "web3pro failed to bind to port 3000"
  }

  $runtimePid = if (Test-Path $PidFile) { Get-Content $PidFile | Select-Object -First 1 } else { "unknown" }
  Write-Host "web3pro started successfully on port 3000 (pid=$runtimePid)"
}

Stop-ExistingProcess
Start-Web3Pro
