#!/bin/bash

# SQLite到PostgreSQL数据迁移脚本
# 使用方法: ./scripts/migrate-to-postgresql.sh

set -e

echo "🚀 开始Rento数据库迁移 (SQLite -> PostgreSQL)"

# 配置变量
SQLITE_DB="prisma/dev.db"
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/sqlite_backup_$TIMESTAMP.sql"
POSTGRES_BACKUP="$BACKUP_DIR/postgres_data_$TIMESTAMP.sql"

# 检查必要文件
if [ ! -f "$SQLITE_DB" ]; then
    echo "❌ SQLite数据库文件不存在: $SQLITE_DB"
    exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "📦 步骤1: 备份SQLite数据库"
sqlite3 "$SQLITE_DB" .dump > "$BACKUP_FILE"
echo "✅ SQLite备份完成: $BACKUP_FILE"

echo "🔄 步骤2: 转换SQL格式 (SQLite -> PostgreSQL)"
# 创建PostgreSQL兼容的SQL文件
cat > "$POSTGRES_BACKUP" << 'EOF'
-- PostgreSQL数据导入脚本
-- 自动生成，请勿手动编辑

-- 禁用外键检查
SET session_replication_role = replica;

-- 清理现有数据 (谨慎操作)
TRUNCATE TABLE "bill_details" CASCADE;
TRUNCATE TABLE "bills" CASCADE;
TRUNCATE TABLE "meter_readings" CASCADE;
TRUNCATE TABLE "meters" CASCADE;
TRUNCATE TABLE "contracts" CASCADE;
TRUNCATE TABLE "renters" CASCADE;
TRUNCATE TABLE "rooms" CASCADE;
TRUNCATE TABLE "buildings" CASCADE;
TRUNCATE TABLE "global_settings" CASCADE;

EOF

# 处理SQLite导出的数据，转换为PostgreSQL格式
sed -e 's/PRAGMA foreign_keys=OFF;//g' \
    -e 's/BEGIN TRANSACTION;//g' \
    -e 's/COMMIT;//g' \
    -e 's/sqlite_sequence/pg_sequence/g' \
    -e 's/AUTOINCREMENT/SERIAL/g' \
    -e "s/'t'/true/g" \
    -e "s/'f'/false/g" \
    -e 's/INSERT INTO \([^(]*\)/INSERT INTO "\1"/g' \
    -e 's/CREATE TABLE \([^(]*\)/CREATE TABLE "\1"/g' \
    "$BACKUP_FILE" | \
grep -v "^CREATE TABLE sqlite_" | \
grep -v "^INSERT INTO sqlite_" >> "$POSTGRES_BACKUP"

# 添加序列重置
cat >> "$POSTGRES_BACKUP" << 'EOF'

-- 重置序列
SELECT setval(pg_get_serial_sequence('"buildings"', 'id'), COALESCE(MAX(id), 1)) FROM "buildings";
SELECT setval(pg_get_serial_sequence('"rooms"', 'id'), COALESCE(MAX(id), 1)) FROM "rooms";
SELECT setval(pg_get_serial_sequence('"renters"', 'id'), COALESCE(MAX(id), 1)) FROM "renters";
SELECT setval(pg_get_serial_sequence('"contracts"', 'id'), COALESCE(MAX(id), 1)) FROM "contracts";
SELECT setval(pg_get_serial_sequence('"bills"', 'id'), COALESCE(MAX(id), 1)) FROM "bills";
SELECT setval(pg_get_serial_sequence('"meters"', 'id'), COALESCE(MAX(id), 1)) FROM "meters";
SELECT setval(pg_get_serial_sequence('"meter_readings"', 'id'), COALESCE(MAX(id), 1)) FROM "meter_readings";
SELECT setval(pg_get_serial_sequence('"bill_details"', 'id'), COALESCE(MAX(id), 1)) FROM "bill_details";
SELECT setval(pg_get_serial_sequence('"global_settings"', 'id'), COALESCE(MAX(id), 1)) FROM "global_settings";

-- 启用外键检查
SET session_replication_role = DEFAULT;

EOF

echo "✅ SQL格式转换完成: $POSTGRES_BACKUP"

echo "🗄️ 步骤3: 准备PostgreSQL数据库"
# 检查PostgreSQL连接
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL客户端未安装，请先安装postgresql-client"
    exit 1
fi

# 从环境变量或默认值获取数据库配置
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-rento_production}
DB_USER=${POSTGRES_USER:-rento}
DB_PASSWORD=${POSTGRES_PASSWORD}

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ 请设置POSTGRES_PASSWORD环境变量"
    exit 1
fi

export PGPASSWORD="$DB_PASSWORD"

echo "🔗 测试PostgreSQL连接..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ 无法连接到PostgreSQL数据库"
    echo "请确保数据库服务正在运行，并且连接参数正确"
    exit 1
fi

echo "✅ PostgreSQL连接成功"

echo "📋 步骤4: 运行Prisma迁移"
# 确保Prisma schema指向PostgreSQL
if grep -q "sqlite" prisma/schema.prisma; then
    echo "⚠️  检测到schema.prisma仍在使用SQLite"
    echo "请手动更新prisma/schema.prisma中的datasource配置:"
    echo '  provider = "postgresql"'
    echo '  url      = env("DATABASE_URL")'
    echo ""
    read -p "是否已更新schema.prisma? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 请先更新schema.prisma后重新运行迁移"
        exit 1
    fi
fi

# 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
npx prisma generate

# 运行数据库迁移
echo "🚀 执行数据库迁移..."
npx prisma migrate deploy

echo "📥 步骤5: 导入数据"
echo "正在导入数据到PostgreSQL..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$POSTGRES_BACKUP" > /dev/null 2>&1; then
    echo "✅ 数据导入成功"
else
    echo "⚠️  数据导入可能存在问题，请检查日志"
    echo "可以手动执行: psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $POSTGRES_BACKUP"
fi

echo "🔍 步骤6: 验证数据完整性"
# 检查表记录数
echo "验证数据迁移结果:"

for table in buildings rooms renters contracts bills meters meter_readings bill_details global_settings; do
    sqlite_count=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
    postgres_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$sqlite_count" = "$postgres_count" ]; then
        echo "✅ $table: $sqlite_count 条记录"
    else
        echo "⚠️  $table: SQLite($sqlite_count) != PostgreSQL($postgres_count)"
    fi
done

echo ""
echo "🎉 数据库迁移完成!"
echo ""
echo "📋 迁移摘要:"
echo "  - SQLite备份: $BACKUP_FILE"
echo "  - PostgreSQL数据: $POSTGRES_BACKUP"
echo "  - 目标数据库: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "🔧 后续步骤:"
echo "  1. 更新应用的DATABASE_URL环境变量"
echo "  2. 重启应用服务"
echo "  3. 验证应用功能正常"
echo "  4. 备份原SQLite文件以防万一"
echo ""
echo "⚠️  重要提醒:"
echo "  - 请在生产环境部署前充分测试"
echo "  - 建议保留SQLite备份文件"
echo "  - 确保PostgreSQL定期备份"

# 清理临时文件
unset PGPASSWORD