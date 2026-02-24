#!/bin/bash
# =============================================
# gatetoweb3 一键部署脚本
# 适用于：CentOS 7/8、Ubuntu 20.04/22.04
# 使用方法：chmod +x deploy.sh && ./deploy.sh
# =============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   gatetoweb3 一键部署脚本             ${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否为 root 或有 sudo 权限
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}提示：建议以 root 用户或 sudo 运行本脚本${NC}"
fi

# 1. 检查并安装 Docker
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}[1/5] 正在安装 Docker...${NC}"
  curl -fsSL https://get.docker.com | sh
  systemctl start docker
  systemctl enable docker
  echo -e "${GREEN}Docker 安装完成${NC}"
else
  echo -e "${GREEN}[1/5] Docker 已安装：$(docker --version)${NC}"
fi

# 2. 检查并安装 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo -e "${YELLOW}[2/5] 正在安装 Docker Compose...${NC}"
  curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
  echo -e "${GREEN}Docker Compose 安装完成${NC}"
else
  echo -e "${GREEN}[2/5] Docker Compose 已安装${NC}"
fi

# 3. 检查 .env 文件
echo -e "${YELLOW}[3/5] 检查环境变量配置...${NC}"
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${RED}⚠️  已创建 .env 文件，请先编辑填写必要配置后重新运行本脚本！${NC}"
    echo -e "${YELLOW}必填项：DATABASE_URL、JWT_SECRET${NC}"
    echo ""
    echo "  nano .env"
    echo ""
    exit 1
  else
    echo -e "${RED}错误：未找到 .env 或 .env.example 文件${NC}"
    exit 1
  fi
fi

# 检查必填项
source .env
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "mysql://root:your_password@localhost:3306/gatetoweb3" ]; then
  echo -e "${RED}错误：请在 .env 中设置正确的 DATABASE_URL${NC}"
  exit 1
fi
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your_jwt_secret_here" ]; then
  echo -e "${YELLOW}提示：JWT_SECRET 未设置，自动生成随机密钥...${NC}"
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
  echo -e "${GREEN}JWT_SECRET 已自动生成并写入 .env${NC}"
fi
echo -e "${GREEN}环境变量检查通过${NC}"

# 4. 构建并启动容器
echo -e "${YELLOW}[4/5] 构建并启动 Docker 容器...${NC}"
docker compose down --remove-orphans 2>/dev/null || docker-compose down --remove-orphans 2>/dev/null || true
docker compose build --no-cache 2>/dev/null || docker-compose build --no-cache
docker compose up -d 2>/dev/null || docker-compose up -d
echo -e "${GREEN}容器启动成功${NC}"

# 5. 检查运行状态
echo -e "${YELLOW}[5/5] 检查服务状态...${NC}"
sleep 5
docker compose ps 2>/dev/null || docker-compose ps

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   部署完成！                           ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  本地访问：${GREEN}http://localhost${NC}"
echo -e "  服务器 IP 访问：${GREEN}http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')${NC}"
echo ""
echo -e "${YELLOW}如需配置域名和 HTTPS，请参考 DEPLOY.md${NC}"
