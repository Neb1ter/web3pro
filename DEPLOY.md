# gatetoweb3 部署指南

## 技术栈

- **前端**：React 19 + Vite + TailwindCSS
- **后端**：Node.js + Express + tRPC
- **数据库**：MySQL 8.0 / TiDB（兼容 MySQL 协议）
- **容器化**：Docker + Docker Compose + Nginx

---

## 一、服务器要求

| 项目 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 1 核 | 2 核+ |
| 内存 | 1 GB | 2 GB+ |
| 磁盘 | 20 GB | 40 GB+ |
| 系统 | CentOS 7/8、Ubuntu 20.04/22.04 | Ubuntu 22.04 LTS |
| 端口 | 80、443、3000 | 80、443 |

---

## 二、数据库准备

### 方案 A：使用百度云 RDS for MySQL（推荐）

1. 在百度云控制台创建 **RDS for MySQL 8.0** 实例
2. 创建数据库：`gatetoweb3`
3. 创建用户并授权
4. 获取连接地址，格式为：
   ```
   mysql://用户名:密码@RDS实例地址:3306/gatetoweb3
   ```

### 方案 B：服务器本地安装 MySQL

```bash
# Ubuntu
sudo apt update && sudo apt install -y mysql-server
sudo mysql -e "CREATE DATABASE gatetoweb3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'gatetoweb3'@'%' IDENTIFIED BY 'your_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON gatetoweb3.* TO 'gatetoweb3'@'%'; FLUSH PRIVILEGES;"
```

---

## 三、快速部署（推荐）

### 步骤 1：克隆代码到服务器

```bash
# 方式一：通过 GitHub 克隆（需要在服务器上配置 SSH Key 或 Token）
git clone https://github.com/Neb1ter/gatetoweb3.git
cd gatetoweb3

# 方式二：上传 zip 包到服务器后解压
unzip gatetoweb3.zip
cd gatetoweb3
```

### 步骤 2：配置环境变量

```bash
cp .env.example .env
nano .env
```

**必须填写以下两项：**

```env
# 替换为您的 MySQL 连接字符串
DATABASE_URL=mysql://gatetoweb3:your_password@your-rds-host:3306/gatetoweb3

# 生成随机密钥（在服务器上执行：openssl rand -hex 32）
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 步骤 3：执行一键部署

```bash
chmod +x deploy.sh
./deploy.sh
```

脚本会自动：
- 安装 Docker 和 Docker Compose（如未安装）
- 构建 Docker 镜像
- 启动 Nginx + Node.js 容器
- 检查运行状态

### 步骤 4：初始化数据库表结构

首次部署后需要执行数据库迁移：

```bash
# 进入容器执行迁移
docker compose exec app node -e "
import('./dist/index.js').then(() => {
  console.log('Server started, run migrations separately');
});
"

# 或者直接在宿主机安装 pnpm 后执行
npm install -g pnpm
pnpm install
DATABASE_URL='your_database_url' pnpm db:push
```

---

## 四、配置域名和 HTTPS

### 步骤 1：域名解析

在您的域名服务商（或百度云 DNS）添加 A 记录，将域名指向服务器 IP。

### 步骤 2：申请 SSL 证书

```bash
# 安装 Certbot（Let's Encrypt 免费证书）
sudo apt install -y certbot
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 证书文件位置
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

或者在百度云控制台申请免费 SSL 证书，下载后上传到服务器。

### 步骤 3：配置 Nginx HTTPS

编辑 `nginx/nginx.conf`：

1. 将证书文件复制到 `nginx/ssl/` 目录：
   ```bash
   cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
   cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
   ```

2. 取消注释 `nginx/nginx.conf` 中的 HTTPS 配置块，并填写您的域名。

3. 重启 Nginx 容器：
   ```bash
   docker compose restart nginx
   ```

---

## 五、常用运维命令

```bash
# 查看容器状态
docker compose ps

# 查看应用日志
docker compose logs -f app

# 查看 Nginx 日志
docker compose logs -f nginx

# 重启应用
docker compose restart app

# 停止所有服务
docker compose down

# 更新代码后重新部署
git pull
docker compose build app
docker compose up -d app

# 进入容器调试
docker compose exec app sh
```

---

## 六、百度云安全组配置

在百度云控制台 → 云服务器 ECS → 安全组，添加以下入站规则：

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 80 | 0.0.0.0/0 | HTTP |
| TCP | 443 | 0.0.0.0/0 | HTTPS |
| TCP | 22 | 您的 IP | SSH（建议限制来源 IP） |

---

## 七、常见问题

**Q：容器启动后访问显示 502 Bad Gateway？**
A：等待约 10 秒让 Node.js 完全启动，或执行 `docker compose logs app` 查看错误日志。

**Q：数据库连接失败？**
A：确认 `DATABASE_URL` 格式正确，且数据库服务器允许来自容器 IP 的连接（检查 MySQL 用户的 host 设置）。

**Q：如何备份数据库？**
A：
```bash
# 导出
mysqldump -h your-rds-host -u user -p gatetoweb3 > backup_$(date +%Y%m%d).sql
# 导入
mysql -h your-rds-host -u user -p gatetoweb3 < backup_20260224.sql
```
