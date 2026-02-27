# ============================================================
# 阶段 1: 构建阶段
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

RUN echo ">>> Step 1: pnpm installed" && pnpm --version

# 先复制依赖文件（利用 Docker 层缓存）
COPY package.json pnpm-lock.yaml ./

RUN echo ">>> Step 2: Installing dependencies..."
RUN pnpm install --frozen-lockfile

RUN echo ">>> Step 3: Dependencies installed, copying source..."
COPY . .

RUN echo ">>> Step 4: Building project..."
RUN pnpm run build

RUN echo ">>> Step 5: Build complete!" && ls -la dist/ && ls -la dist/public/ 2>/dev/null || true

# ============================================================
# 阶段 2: 运行阶段（Express 服务器托管前端 + 提供 API）
# ============================================================
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 并只安装生产依赖
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# 从构建阶段复制编译产物
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
