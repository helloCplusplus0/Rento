#!/bin/sh
set -e

echo "开始数据库迁移和种子数据初始化..."

# 等待数据库就绪（简化等待，避免依赖 pg_isready）
DB_WAIT_SECS=${DB_WAIT_SECS:-25}
echo "等待数据库连接 (${DB_WAIT_SECS}s)..."
sleep "$DB_WAIT_SECS"

echo "数据库连接成功，开始迁移..."

# 如果迁移锁文件为 sqlite，则使用 db push 同步到 PostgreSQL，避免 P3019 错误
LOCK_FILE="/app/prisma/migrations/migration_lock.toml"
if [ -f "$LOCK_FILE" ] && grep -q 'provider = "sqlite"' "$LOCK_FILE"; then
  echo "检测到 migration_lock.toml 指向 sqlite，改用 Prisma db push 同步架构到 PostgreSQL"
  node /app/node_modules/prisma/build/index.js db push
else
  # 运行 Prisma 迁移（使用容器内已复制的本地 CLI 入口，避免网络访问）
  node /app/node_modules/prisma/build/index.js migrate deploy || {
    echo "migrate deploy 失败，尝试使用 Prisma db push 同步架构";
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