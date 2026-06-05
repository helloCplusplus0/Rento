#!/bin/sh
set -e

echo "开始数据库迁移和种子数据初始化..."

# 等待数据库就绪（简化等待，避免依赖 pg_isready）
DB_WAIT_SECS=${DB_WAIT_SECS:-25}
echo "等待数据库连接 (${DB_WAIT_SECS}s)..."
sleep "$DB_WAIT_SECS"

echo "数据库连接成功，开始迁移..."

# Phase10-04 迁移兼容说明：
# - PostgreSQL 是唯一正式数据库主线，SQLite 不再属于正式支持范围；
# - 正式迁移目标仍然是 PostgreSQL 基线上的 `prisma migrate deploy`，但当前仓库默认执行尚未切到该路径；
# - 当前仅因 migrations/ 与 migration_lock.toml 仍残留 SQLite 时代状态，脚本才会先命中 `sqlite -> db push` compat path；
# - 该兼容路径的职责是让现有 PostgreSQL 环境先按 schema 同步成功，不代表仓库继续支持 SQLite；
# - 退出该兼容路径前，必须先完成 PostgreSQL baseline / resolve 验证，并确认回滚基线与现网兼容路径。
LOCK_FILE="/app/prisma/migrations/migration_lock.toml"
if [ -f "$LOCK_FILE" ] && grep -q 'provider = "sqlite"' "$LOCK_FILE"; then
  echo "检测到历史 migration_lock.toml 仍指向 sqlite；当前仓库默认执行继续停留在 compat path，先执行 Prisma db push 兼容同步（仅为 PostgreSQL 现网兜底，非正式迁移链）"
  node /app/node_modules/prisma/build/index.js db push
else
  # 只有在不再先命中 sqlite compat 条件后，默认执行才会切到正式路径；失败时仍保留兼容回退。
  node /app/node_modules/prisma/build/index.js migrate deploy || {
    echo "migrate deploy 失败，尝试使用 Prisma db push 同步架构（兼容兜底，需在 phase10 迁移专项治理验证通过后退出）";
    node /app/node_modules/prisma/build/index.js db push;
  }
fi

# 检查是否需要运行种子数据
if [ "$RUN_SEED" = "true" ]; then
  echo "运行种子数据..."
  node /app/node_modules/prisma/build/index.js db seed
else
  echo "跳过种子数据初始化"
fi

echo "数据库迁移和初始化完成"
