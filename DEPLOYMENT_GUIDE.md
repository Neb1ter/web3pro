# Web3Pro 部署指南

**最后更新**: 2026-03-11

本文档为 `web3pro` 项目在百度云 Windows 服务器上的部署和维护提供标准操作流程，旨在方便未来接手的 AI 或开发者快速理解和操作。

---

## 1. 架构概览

| 组件 | 技术/服务 | 描述 |
| :--- | :--- | :--- |
| **云服务** | 百度云 | 提供 Windows Server 虚拟机 |
| **操作系统** | Windows Server | 托管应用和服务的操作系统 |
| **Web 服务器** | Nginx | 反向代理，将 80 端口的 HTTP 请求转发到 Node.js 服务的 3000 端口 |
| **域名 & CDN** | Cloudflare | 提供 DNS 解析、HTTPS (SSL/TLS Flexible 模式) 和 CDN 缓存 |
| **应用运行时** | Node.js v24+ | 后端 JavaScript 运行环境 |
| **包管理器** | pnpm | 用于管理 Node.js 依赖 |
| **进程管理** | PM2 | 保证 Node.js 应用在后台持续运行，并实现崩溃后自动重启 |
| **数据库** | MariaDB | 关系型数据库，存储应用数据 |
| **CI/CD** | GitHub Actions | 持续集成和持续部署，实现代码推送后自动部署 |

## 2. 服务器环境

| 属性 | 值 |
| :--- | :--- |
| **IP 地址** | `120.48.26.50` |
| **登录用户** | `Administrator` (或您设置的其他用户) |
| **项目根目录** | `C:\web3pro` |
| **Nginx 根目录** | `C:\nginx` |
| **PM2 应用名** | `gatetoweb3` |
| **数据库名** | `web3pro_db` |

## 3. 自动化部署流程 (CI/CD)

项目已配置 GitHub Actions 实现自动化部署。**这是标准部署方式，除非紧急情况，否则不应手动部署。**

**触发条件**: 推送 (`git push`) 代码到 `main` 分支。

**工作流程** (`.github/workflows/deploy.yml`):

1.  **在 GitHub 云端构建**: GitHub Actions 会在一个临时的 Ubuntu 环境中：
    *   拉取最新代码。
    *   使用 `pnpm` 安装所有依赖。
    *   使用 Vite (`pnpm run build`) 构建前端静态资源。
    *   使用 esbuild (`npx esbuild ...`) 构建后端代码。
    *   将构建产物 (整个 `dist` 目录) 打包成 `dist.tar.gz`。

2.  **传输到服务器**:
    *   使用 SCP (安全复制协议) 将 `dist.tar.gz` 上传到服务器的 `C:\web3pro` 目录下。

3.  **在服务器上部署**:
    *   通过 SSH 连接到服务器 (端口 22)。
    *   解压 `dist.tar.gz` 覆盖旧的 `dist` 目录。
    *   删除服务器上的 `dist.tar.gz` 压缩包。
    *   使用 `npx pm2 restart ecosystem.config.cjs` 命令平滑重启后端服务。

**必要条件**:
*   服务器必须开启 **OpenSSH Server** 服务，且防火墙放行 22 端口。
*   GitHub 仓库的 **Settings > Secrets and variables > Actions** 中必须配置以下 **Repository secrets**：

| Secret 名称 | 说明 |
| :--- | :--- |
| `SERVER_HOST` | 服务器 IP，即 `120.48.26.50` |
| `SERVER_USER` | 服务器登录用户名 |
| `SERVER_PASSWORD` | 服务器登录密码 |

## 4. 手动部署流程 (紧急情况备用)

仅在自动化部署失败或需要紧急调试时使用。

1.  **连接服务器**: 通过远程桌面 (RDP) 登录到服务器 (`120.48.26.50`)。

2.  **打开 PowerShell (管理员)**: 确保以管理员身份运行 PowerShell。

3.  **执行部署命令**:

    ```powershell
    # 1. 进入项目目录
    cd C:\web3pro

    # 2. 拉取最新代码
    git pull origin main

    # 3. 安装/更新依赖
    pnpm install --frozen-lockfile

    # 4. 构建前端
    pnpm run build

    # 5. 构建后端
    npx esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

    # 6. 重启服务
    npx pm2 restart ecosystem.config.cjs
    ```

## 5. 关键配置文件

| 文件路径 | 用途 |
| :--- | :--- |
| `C:\web3pro\.env` | **核心配置文件**，包含数据库连接字符串、API 密钥等敏感信息。**不提交到 Git** |
| `C:\web3pro\ecosystem.config.cjs` | PM2 配置文件，定义应用启动方式、名称、模式 |
| `C:\nginx\conf\nginx.conf` | Nginx 配置文件，定义反向代理规则 |
| `.github/workflows/deploy.yml` | CI/CD 配置文件，定义自动化部署的所有步骤 |
| `vite.config.ts` | Vite 前端构建配置，**不使用 manualChunks**（已知会导致循环依赖崩溃） |
| `server/_core/security.ts` | CSP 安全头配置，`script-src` 已包含 `'unsafe-inline'` |

## 6. 已知问题与解决方案

### 6.1 Vite 构建循环依赖

**问题**: `vite.config.ts` 中如果使用 `manualChunks` 手动分包，会导致 vendor chunk 之间产生循环依赖，浏览器报错 `Cannot access 'XX' before initialization`，页面白屏。

**解决方案**: `vite.config.ts` 中**不使用 `manualChunks`**，让 Rollup 自动处理分包。

### 6.2 CSP 阻止内联脚本

**问题**: 默认 CSP 策略会阻止内联 JavaScript 执行，导致 React 应用无法启动。

**解决方案**: 已在 `server/_core/security.ts` 的生产环境配置中，将 `'unsafe-inline'` 加入 `script-src`。

### 6.3 数据库权限不足 (500 错误)

**问题**: 数据库用户权限不足，导致 `/api/trpc/exchanges` 等接口返回 500 错误。

**排查**: 检查 `C:\web3pro\.env` 中的 `DATABASE_URL`，确认数据库用户名和密码正确，且该用户对 `web3pro_db` 数据库拥有完整的读写权限 (GRANT ALL)。

---

> **给未来 AI 的提示**: 接手此项目时，请优先阅读本文档了解整体架构。排查部署问题时，先查看 GitHub Actions 运行日志；排查应用错误时，在服务器执行 `npx pm2 logs gatetoweb3 --lines 100 --nostream` 查看实时日志。修改 `.env` 文件或数据库配置前，务必向用户确认。
