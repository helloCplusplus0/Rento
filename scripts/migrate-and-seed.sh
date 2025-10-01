#!/bin/bash
set -e

echo "开始数据库迁移和种子数据初始化..."

# 等待数据库就绪
echo "等待数据库连接..."
until pg_isready -h postgres -p 5432 -U rento; do
  echo "数据库未就绪，等待中..."
  sleep 2
done

echo "数据库连接成功，开始迁移..."

# 运行 Prisma 迁移
npx prisma migrate deploy

# 检查是否需要运行种子数据
if [ "$RUN_SEED" = "true" ]; then
  echo "运行种子数据..."
  npx prisma db seed
else
  echo "跳过种子数据初始化"
fi

echo "数据库迁移和初始化完成"