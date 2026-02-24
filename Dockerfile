# ---- 构建阶段 ----
FROM node:22-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@10.4.1

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY patches/ ./patches/

# 安装依赖（跳过 postinstall 脚本）
RUN pnpm install --frozen-lockfile --ignore-scripts

# 复制源码
COPY . .

# 构建生产版本
RUN pnpm build

# ---- 运行阶段 ----
FROM node:22-alpine AS runner

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@10.4.1

# 只复制生产依赖所需文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY patches/ ./patches/

# 仅安装生产依赖
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/index.js"]
