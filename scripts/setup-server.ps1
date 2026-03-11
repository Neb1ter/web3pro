#!/usr/bin/env pwsh
# ============================================================
# setup-server.ps1 — 服务器首次配置脚本
# 用途：在 Windows 服务器上运行一次，配置 git 自动拉取
# ============================================================

$ErrorActionPreference = "Stop"
$ProjectDir = "C:\web3pro"
$RepoUrl = "https://github.com/Neb1ter/web3pro.git"

function Write-Step($msg) {
    Write-Host "`n=== $msg ===" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "✅ $msg" -ForegroundColor Green
}

# ── 1. 检查 git 是否安装 ─────────────────────────────────────
Write-Step "检查 Git 安装"
try {
    $gitVersion = git --version
    Write-Success "Git 已安装: $gitVersion"
} catch {
    Write-Host "Git 未安装，正在下载安装..." -ForegroundColor Yellow
    $gitInstaller = "$env:TEMP\git-installer.exe"
    Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.2/Git-2.47.1.2-64-bit.exe" -OutFile $gitInstaller -UseBasicParsing
    Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT /NORESTART" -Wait
    $env:PATH += ";C:\Program Files\Git\bin"
    Write-Success "Git 安装完成"
}

# ── 2. 配置 git ──────────────────────────────────────────────
Write-Step "配置 Git"
git config --global user.email "deploy@get8.pro"
git config --global user.name "Deploy Bot"
git config --global credential.helper store
Write-Success "Git 配置完成"

# ── 3. 初始化项目目录为 git 仓库 ────────────────────────────
Write-Step "初始化 Git 仓库"

if (Test-Path "$ProjectDir\.git") {
    Write-Host "Git 仓库已存在，跳过初始化" -ForegroundColor Yellow
    Set-Location $ProjectDir
    git remote set-url origin $RepoUrl
} else {
    # 备份 .env 文件
    $envBackup = "$env:TEMP\web3pro_env_backup"
    if (Test-Path "$ProjectDir\.env") {
        Copy-Item "$ProjectDir\.env" $envBackup
        Write-Host "已备份 .env 文件" -ForegroundColor Yellow
    }

    # 初始化 git
    Set-Location $ProjectDir
    git init
    git remote add origin $RepoUrl
    git fetch origin
    git checkout -b main --track origin/main
    git reset --hard origin/main

    # 恢复 .env 文件
    if (Test-Path $envBackup) {
        Copy-Item $envBackup "$ProjectDir\.env" -Force
        Write-Success "已恢复 .env 文件"
    }
}

Write-Success "Git 仓库配置完成"

# ── 4. 设置 git 忽略 .env ────────────────────────────────────
Write-Step "配置 .gitignore 保护"
git update-index --assume-unchanged .env 2>$null
Write-Success ".env 文件已标记为不跟踪（防止被 git pull 覆盖）"

# ── 5. 测试拉取 ──────────────────────────────────────────────
Write-Step "测试代码拉取"
git pull origin main
Write-Success "代码拉取成功！"

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "✅ 服务器初始化完成！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "以后每次更新，只需在 GitHub 推送代码即可自动部署。"
Write-Host "也可以手动运行：  .\scripts\deploy.ps1"
Write-Host ""
