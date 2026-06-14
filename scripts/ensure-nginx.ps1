$ErrorActionPreference = "Stop"

$NginxRoot = "C:\nginx"
$NginxExe = Join-Path $NginxRoot "nginx.exe"
$ConfigPath = Join-Path $NginxRoot "conf\nginx.conf"

if (-not (Test-Path $NginxExe)) {
  throw "nginx.exe not found at $NginxExe"
}

if (-not (Test-Path (Split-Path $ConfigPath))) {
  New-Item -ItemType Directory -Force -Path (Split-Path $ConfigPath) | Out-Null
}

$config = @"
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  get8.pro www.get8.pro;

        location / {
            proxy_pass http://127.0.0.1:3000;
            proxy_http_version 1.1;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
            proxy_set_header Upgrade `$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 90;
        }
    }
}
"@

$backupPath = $null
if (Test-Path $ConfigPath) {
  $backupPath = "$ConfigPath.bak"
  Copy-Item -LiteralPath $ConfigPath -Destination $backupPath -Force
}

Set-Content -LiteralPath $ConfigPath -Value $config -Encoding ASCII

Push-Location $NginxRoot
try {
  & $NginxExe -t
  if ($LASTEXITCODE -ne 0) {
    if ($backupPath -and (Test-Path $backupPath)) {
      Copy-Item -LiteralPath $backupPath -Destination $ConfigPath -Force
    }
    throw "nginx config test failed with code $LASTEXITCODE"
  }

  try {
    if (-not (Get-NetFirewallRule -DisplayName "web3pro-http-80" -ErrorAction SilentlyContinue)) {
      New-NetFirewallRule -DisplayName "web3pro-http-80" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80 | Out-Null
    }
  } catch {
    Write-Warning "Failed to ensure Windows Firewall rule for port 80: $($_.Exception.Message)"
  }

  $nginxProcesses = Get-Process nginx -ErrorAction SilentlyContinue
  if ($nginxProcesses) {
    & $NginxExe -s reload
    if ($LASTEXITCODE -ne 0) {
      Stop-Process -Name nginx -Force -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 1
      Start-Process -FilePath $NginxExe -WorkingDirectory $NginxRoot -WindowStyle Hidden
    }
  } else {
    Start-Process -FilePath $NginxExe -WorkingDirectory $NginxRoot -WindowStyle Hidden
  }

  Start-Sleep -Seconds 3
  $listener = Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue
  if (-not $listener) {
    throw "nginx is not listening on port 80"
  }

  Write-Host "nginx reverse proxy is listening on port 80"
} finally {
  Pop-Location
}
