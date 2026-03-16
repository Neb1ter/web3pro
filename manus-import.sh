#!/usr/bin/env bash
# =============================================================================
# manus-import.sh — 一键将此 GitHub 仓库导入到 Manus web-db-user 项目
#
# 用法：
#   1. 在 Manus sandbox 中已初始化 web-db-user 项目（PROJECT_DIR）
#   2. 克隆此仓库到 /home/ubuntu/source_repo
#   3. 运行：bash /home/ubuntu/source_repo/manus-import.sh <PROJECT_DIR>
#
# 示例：
#   bash /home/ubuntu/source_repo/manus-import.sh /home/ubuntu/gatetoweb3
# =============================================================================

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${1:-/home/ubuntu/gatetoweb3}"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ 目标项目目录不存在: $PROJECT_DIR"
  echo "   请先在 Manus 中初始化 web-db-user 项目"
  exit 1
fi

echo "📦 开始导入: $REPO_DIR → $PROJECT_DIR"

# ── 1. 数据库 Schema & 迁移文件 ──────────────────────────────────────────────
echo "  [1/5] 迁移数据库 schema..."
cp "$REPO_DIR/drizzle/schema.ts"   "$PROJECT_DIR/drizzle/schema.ts"
cp "$REPO_DIR/drizzle/relations.ts" "$PROJECT_DIR/drizzle/relations.ts" 2>/dev/null || true
cp "$REPO_DIR/drizzle/"*.sql       "$PROJECT_DIR/drizzle/" 2>/dev/null || true
cp -r "$REPO_DIR/drizzle/meta/"    "$PROJECT_DIR/drizzle/meta/"

# ── 2. 服务端业务文件 ─────────────────────────────────────────────────────────
echo "  [2/5] 迁移服务端文件..."
cp "$REPO_DIR/server/db.ts"      "$PROJECT_DIR/server/db.ts"
cp "$REPO_DIR/server/routers.ts" "$PROJECT_DIR/server/routers.ts"
cp "$REPO_DIR/server/storage.ts" "$PROJECT_DIR/server/storage.ts" 2>/dev/null || true
cp "$REPO_DIR/server/"*.test.ts  "$PROJECT_DIR/server/" 2>/dev/null || true

# ── 3. 共享类型 ───────────────────────────────────────────────────────────────
echo "  [3/5] 迁移共享类型..."
cp "$REPO_DIR/shared/const.ts" "$PROJECT_DIR/shared/const.ts"
cp "$REPO_DIR/shared/types.ts" "$PROJECT_DIR/shared/types.ts" 2>/dev/null || true

# ── 4. 前端文件 ───────────────────────────────────────────────────────────────
echo "  [4/5] 迁移前端文件..."
cp "$REPO_DIR/client/index.html"         "$PROJECT_DIR/client/index.html"
cp "$REPO_DIR/client/src/index.css"      "$PROJECT_DIR/client/src/index.css"
cp "$REPO_DIR/client/src/const.ts"       "$PROJECT_DIR/client/src/const.ts"
cp "$REPO_DIR/client/src/main.tsx"       "$PROJECT_DIR/client/src/main.tsx"
cp "$REPO_DIR/client/src/App.tsx"        "$PROJECT_DIR/client/src/App.tsx"

# lib
mkdir -p "$PROJECT_DIR/client/src/lib"
cp "$REPO_DIR/client/src/lib/"*.ts  "$PROJECT_DIR/client/src/lib/" 2>/dev/null || true

# contexts
mkdir -p "$PROJECT_DIR/client/src/contexts"
cp "$REPO_DIR/client/src/contexts/"*.tsx "$PROJECT_DIR/client/src/contexts/" 2>/dev/null || true

# hooks
mkdir -p "$PROJECT_DIR/client/src/hooks"
cp "$REPO_DIR/client/src/hooks/"*.ts  "$PROJECT_DIR/client/src/hooks/" 2>/dev/null || true
cp "$REPO_DIR/client/src/hooks/"*.tsx "$PROJECT_DIR/client/src/hooks/" 2>/dev/null || true

# components（跳过 ui 子目录，Manus 模板已包含）
mkdir -p "$PROJECT_DIR/client/src/components"
for f in "$REPO_DIR/client/src/components/"*.tsx; do
  [ -f "$f" ] && cp "$f" "$PROJECT_DIR/client/src/components/"
done
# 仅复制 source 中新增的 ui 组件（不覆盖 Manus 模板已有的）
if [ -d "$REPO_DIR/client/src/components/ui" ]; then
  for f in "$REPO_DIR/client/src/components/ui/"*.tsx; do
    fname="$(basename "$f")"
    if [ ! -f "$PROJECT_DIR/client/src/components/ui/$fname" ]; then
      cp "$f" "$PROJECT_DIR/client/src/components/ui/$fname"
      echo "    + 新增 ui 组件: $fname"
    fi
  done
fi

# pages（含子目录）
mkdir -p "$PROJECT_DIR/client/src/pages"
cp "$REPO_DIR/client/src/pages/"*.tsx "$PROJECT_DIR/client/src/pages/" 2>/dev/null || true
for subdir in "$REPO_DIR/client/src/pages/"/*/; do
  [ -d "$subdir" ] || continue
  dname="$(basename "$subdir")"
  mkdir -p "$PROJECT_DIR/client/src/pages/$dname"
  cp "$subdir"*.tsx "$PROJECT_DIR/client/src/pages/$dname/" 2>/dev/null || true
done

# ── 5. 数据库迁移 ─────────────────────────────────────────────────────────────
echo "  [5/5] 运行数据库迁移..."
cd "$PROJECT_DIR"
pnpm db:push 2>&1 | tail -5

echo ""
echo "✅ 导入完成！"
echo "   运行测试: cd $PROJECT_DIR && pnpm test"
echo "   预览网站: 查看 Manus 管理面板中的 Preview"
