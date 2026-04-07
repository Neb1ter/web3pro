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

  try {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue | Out-Null
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
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

  if (Test-Path $StdOut) { Clear-Content $StdOut -ErrorAction SilentlyContinue }
  if (Test-Path $StdErr) { Clear-Content $StdErr -ErrorAction SilentlyContinue }

  if ($useScheduledTask) {
    $actionArgs = "/c cd /d `"$projectPath`" && set NODE_ENV=production && set PORT=3000 && `"$nodePath`" dist/index.js 1>> `"$StdOut`" 2>> `"$StdErr`""
    $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument $actionArgs
    $trigger = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddMinutes(1))
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest -LogonType ServiceAccount
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
    $task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings
    Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
    Start-ScheduledTask -TaskName $TaskName
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

  Start-Sleep -Seconds 10

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

  try {
    $rootResponse = Invoke-WebRequest "http://127.0.0.1:3000/" -UseBasicParsing -TimeoutSec 15
    $codexHealth = Invoke-WebRequest "http://127.0.0.1:3000/codex-business/app/api/health" -UseBasicParsing -TimeoutSec 15
    if ($rootResponse.StatusCode -ne 200 -or $codexHealth.StatusCode -ne 200) {
      throw "unexpected localhost status root=$($rootResponse.StatusCode) codex=$($codexHealth.StatusCode)"
    }
  } catch {
    Write-Host "--- scheduled task detail ---"
    try {
      Get-ScheduledTask -TaskName $TaskName | Format-List *
      Get-ScheduledTaskInfo -TaskName $TaskName | Format-List *
    } catch {
    }
    Write-Host "--- web3pro stdout tail ---"
    if (Test-Path $StdOut) {
      Get-Content $StdOut -Tail 120
    }
    Write-Host "--- web3pro stderr tail ---"
    if (Test-Path $StdErr) {
      Get-Content $StdErr -Tail 120
    }
    throw "web3pro started process but localhost probes failed: $($_.Exception.Message)"
  }

  $runtimePid = if (Test-Path $PidFile) { Get-Content $PidFile | Select-Object -First 1 } else { "unknown" }
  Write-Host "web3pro started successfully on port 3000 (pid=$runtimePid)"
}

Stop-ExistingProcess
Start-Web3Pro
