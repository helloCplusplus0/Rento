#!/bin/bash
set -e

# 数据库初始化脚本
echo "开始初始化 Rento 数据库..."

# 创建数据库（如果不存在）
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- 创建扩展
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    
    -- 设置时区
    SET timezone = 'Asia/Shanghai';
    
    -- 创建索引优化查询性能
    -- 这些索引将在 Prisma migrate 后创建
    
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
EOSQL

echo "数据库初始化完成"