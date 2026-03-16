# get8.pro 域名迁移流程文档

> 记录日期：2026-03-01  
> 操作目标：将 `get8.pro` 从 Render.com 迁移到 Railway（`distinguished-analysis` 项目）

---

## 背景

项目存在两个 Railway 部署环境：

| 项目名 | 服务 | 说明 |
|---|---|---|
| `feisty-harmony` | `web3pro-static`（无数据库） | 旧备用项目，可废弃 |
| `distinguished-analysis` | `web3pro-static` + `MySQL` | **正式生产环境**，有完整数据库 |

迁移前，`get8.pro` 域名通过 Cloudflare DNS 指向 **Render.com**（旧平台），导致访问 `get8.pro` 看到的是老版本网站，而新版本只能通过 `web3pro-static-production.up.railway.app` 访问。

---

## 迁移步骤

### 第一步：在 Railway 添加自定义域名

1. 进入 Railway → `distinguished-analysis` 项目 → `web3pro-static` 服务
2. 点击 **Settings** → **Public Networking** → **Custom Domain**
3. 输入 `get8.pro`，选择端口 `8080 (node)`，点击 **Add Domain**
4. Railway 提供 CNAME 地址：`48ifxkc2.up.railway.app`
5. Railway 同时提供 TXT 验证记录：`_railway-verify` → `railway-verify=2ab125...`

### 第二步：在 Cloudflare 修改 DNS 记录

进入 Cloudflare → `get8.pro` → **DNS Records**，做以下修改：

| 操作 | 记录类型 | 名称 | 内容 | 代理状态 |
|---|---|---|---|---|
| **修改** | CNAME | `www` | `48ifxkc2.up.railway.app`（原为 `web3pro-zj23.onrender.com`） | Proxied（橙色） |
| **修改** | CNAME | `get8.pro`（根域名） | `48ifxkc2.up.railway.app`（原为 `www.get8.pro`） | **DNS only（灰色）** |
| **新增** | TXT | `_railway-verify` | `railway-verify=2ab125...` | DNS only |

> **重要**：根域名 `get8.pro` 必须设置为 **DNS only**，因为 Railway 需要直接处理 SSL 证书颁发（ACME 验证）。`www` 可以保持 Proxied，由 Cloudflare 代理。

### 第三步：清除 Cloudflare 缓存

进入 Cloudflare → `get8.pro` → **Caching** → **Purge Everything**，清除旧的 Render.com IP 缓存。

### 第四步：配置 www → 根域名重定向

由于 Railway 免费套餐只允许 1 个自定义域名，无法同时绑定 `get8.pro` 和 `www.get8.pro`。使用 Cloudflare Redirect Rules 处理：

1. 进入 Cloudflare → `get8.pro` → **Rules** → **Redirect Rules**
2. 点击 **Create rule** → 选择模板 **"Redirect from WWW to root"**
3. 直接点击 **Deploy** 部署（模板已预填正确配置）

规则效果：`https://www.get8.pro/*` → `301` → `https://get8.pro/*`

---

## 最终 DNS 架构

```
用户访问 get8.pro
  └─→ Cloudflare DNS（DNS only）
      └─→ 48ifxkc2.up.railway.app
          └─→ Railway web3pro-static 服务（端口 8080）
              └─→ MySQL 数据库（distinguished-analysis 项目内）

用户访问 www.get8.pro
  └─→ Cloudflare 代理（Proxied）
      └─→ Cloudflare Redirect Rule：301 → get8.pro
```

---

## 验证命令

```bash
# 验证根域名是否指向 Railway
curl -sI https://get8.pro | grep -E "server|x-railway"
# 期望输出：server: railway-edge

# 验证 www 重定向
curl -sIL https://www.get8.pro | grep -E "location|HTTP/"
# 期望输出：HTTP/1.1 301 → location: https://get8.pro/
```

---

## 注意事项

1. **Railway 套餐限制**：免费套餐每个服务只能绑定 1 个自定义域名。升级后可同时绑定 `get8.pro` 和 `www.get8.pro`，届时可将根域名也改为 Proxied，获得完整 Cloudflare 防护。

2. **SSL 证书**：根域名使用 DNS only 模式时，SSL 证书由 Railway 自动管理（Let's Encrypt）。Cloudflare 的 SSL 防护只对 `www`（Proxied）生效。

3. **旧平台 Render.com**：迁移完成后，Render.com 上的旧版本网站仍在运行，但 DNS 已不再指向它，用户无法通过 `get8.pro` 访问。可登录 Render.com 手动删除旧服务以节省资源。

4. **feisty-harmony 项目**：该 Railway 项目无数据库，所有需要 API 的功能（币圈资讯、工具、联系表单）均无法正常工作。建议保留作为备用，或直接删除。

---

## 相关环境变量（distinguished-analysis 项目）

| 变量名 | 说明 |
|---|---|
| `DATABASE_URL` | Railway MySQL 内部连接 URL |
| `ADMIN_PASSWORD` | 管理员登录密码 |
| `JWT_SECRET` | Session Token 签名密钥 |
| `NODE_ENV` | 设置为 `production` |
| `VITE_APP_ID` | 应用 ID |
