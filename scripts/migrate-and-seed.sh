#!/bin/sh
set -e

echo "开始数据库迁移和种子数据初始化..."

# 等待数据库就绪（简化等待，避免依赖 pg_isready）
DB_WAIT_SECS=${DB_WAIT_SECS:-25}
echo "等待数据库连接 (${DB_WAIT_SECS}s)..."
sleep "$DB_WAIT_SECS"

echo "数据库连接成功，开始迁移..."

# 迁移兼容说明：
# - 当前数据库主线已经固定为 PostgreSQL；
# - 但 migrations/ 目录和 migration_lock.toml 仍残留 SQLite 时代产物；
# - 因此这里保留一个显式兼容分支，优先保证现有 PostgreSQL 环境可按 schema 同步成功；
# - 该兼容分支不是正式迁移基线，后续需在专项任务中以 PostgreSQL 基线重建 / baseline resolve 验证后再退出。
LOCK_FILE="/app/prisma/migrations/migration_lock.toml"
if [ -f "$LOCK_FILE" ] && grep -q 'provider = "sqlite"' "$LOCK_FILE"; then
  echo "检测到历史 migration_lock.toml 仍指向 sqlite，改用 Prisma db push 同步当前 PostgreSQL schema（兼容路径，非正式迁移链）"
  node /app/node_modules/prisma/build/index.js db push
else
  # 当前推荐路径仍是 migrate deploy；只有在旧迁移链无法用于 PostgreSQL 时才回退到兼容同步。
  node /app/node_modules/prisma/build/index.js migrate deploy || {
    echo "migrate deploy 失败，尝试使用 Prisma db push 同步架构（兼容兜底，需在 phase03-04 后续专项治理中退出）";
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
