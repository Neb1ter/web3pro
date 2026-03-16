#!/usr/bin/env pwsh
# ============================================================
# deploy.ps1 — web3pro 服务器端自动部署脚本
# 用途：在 Windows 服务器上执行，拉取最新代码并重启服务
# 使用：在 PowerShell 中运行 .\scripts\deploy.ps1
# ============================================================

param(
    [string]$Branch = "main",
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$ProjectDir = "C:\web3pro"

function Write-Step($msg) {
    Write-Host "`n=== $msg ===" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "✅ $msg" -ForegroundColor Green
}

function Write-Fail($msg) {
    Write-Host "❌ $msg" -ForegroundColor Red
}

try {
    Write-Step "开始部署 web3pro (分支: $Branch)"
    Set-Location $ProjectDir

    # ── 1. 拉取最新代码 ──────────────────────────────────────
    Write-Step "拉取最新代码"
    git fetch origin
    git reset --hard "origin/$Branch"
    git clean -fd --exclude='.env' --exclude='logs/'
    Write-Success "代码已更新到最新版本"

    if (-not $SkipBuild) {
        # ── 2. 安装依赖 ──────────────────────────────────────
        Write-Step "安装/更新依赖"
        pnpm install --frozen-lockfile
        Write-Success "依赖安装完成"

        # ── 3. 构建项目 ──────────────────────────────────────
        Write-Step "构建前端 + 后端"
        $env:NODE_ENV = "production"
        pnpm run build
        Write-Success "构建完成"
    }

    # ── 4. 重启 PM2 服务 ─────────────────────────────────────
    Write-Step "重启 PM2 服务"
    pm2 restart web3pro --update-env
    pm2 save
    Write-Success "服务已重启"

    # ── 5. 输出状态 ──────────────────────────────────────────
    Write-Step "部署结果"
    pm2 status
    Write-Success "部署完成！访问 https://get8.pro 验证"

} catch {
    Write-Fail "部署失败: $_"
    Write-Host "`n--- PM2 最近日志 ---" -ForegroundColor Yellow
    pm2 logs web3pro --lines 30 --nostream
    exit 1
}
