# ============================================================
# 单阶段构建：安装依赖 → 构建 → 清理开发依赖 → 运行
# 避免多阶段构建中 pnpm patchedDependencies 哈希不匹配问题
# ============================================================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# 安装 pnpm（固定版本 9，与本地开发环境一致）
RUN npm install -g pnpm@9

# 先复制依赖文件 + patches 目录（pnpm patch 必须在 install 前存在）
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# 安装全部依赖（含 devDependencies，构建需要）
RUN pnpm install --frozen-lockfile

# 复制全部源码
COPY . .

# 构建前端 + 后端
RUN pnpm run build

# 构建完成后删除 devDependencies，减小镜像体积
RUN pnpm prune --prod

EXPOSE 3000

CMD ["node", "dist/index.js"]
