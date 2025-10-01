#!/bin/bash
set -e

# Rento Podman 部署验证脚本
# 用于验证Podman环境下的部署流程

echo "🚀 开始 Rento Podman 部署验证"

# 检查Podman环境
echo "📋 检查Podman环境..."
if ! command -v podman &> /dev/null; then
    echo "❌ Podman 未安装，请先安装 Podman"
    exit 1
fi

if ! command -v podman-compose &> /dev/null; then
    echo "❌ podman-compose 未安装，请先安装 podman-compose"
    exit 1
fi

echo "✅ Podman 版本: $(podman --version)"
echo "✅ podman-compose 版本: $(podman-compose --version | head -1)"

# 检查配置文件
echo "📋 检查配置文件..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env 文件不存在，从模板复制..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请根据需要修改配置"
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml 文件不存在"
    exit 1
fi

echo "✅ 配置文件检查完成"

# 验证配置文件语法
echo "📋 验证配置文件语法..."
if podman-compose config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml 语法正确"
else
    echo "❌ docker-compose.yml 语法错误"
    podman-compose config
    exit 1
fi

# 清理可能存在的旧容器
echo "📋 清理旧容器..."
podman-compose down -v 2>/dev/null || true
echo "✅ 清理完成"

# 启动服务
echo "📋 启动服务..."
podman-compose up -d

# 等待服务启动
echo "📋 等待服务启动..."
sleep 30

# 检查服务状态
echo "📋 检查服务状态..."
podman-compose ps

# 检查健康状态
echo "📋 检查应用健康状态..."
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "尝试 $attempt/$max_attempts: 检查健康状态..."
    
    if curl -f -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ 应用健康检查通过"
        curl -s http://localhost:3001/api/health | jq . 2>/dev/null || curl -s http://localhost:3001/api/health
        break
    else
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ 应用健康检查失败"
            echo "查看应用日志:"
            podman-compose logs app | tail -20
            exit 1
        fi
        echo "⏳ 等待应用启动... (${attempt}/${max_attempts})"
        sleep 10
        ((attempt++))
    fi
done

# 检查数据库连接
echo "📋 检查数据库连接..."
if podman exec rento-postgres-1 pg_isready -U rento > /dev/null 2>&1; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
    echo "查看数据库日志:"
    podman-compose logs postgres | tail -20
    exit 1
fi

# 显示部署信息
echo ""
echo "🎉 Podman 部署验证成功！"
echo ""
echo "📊 部署信息:"
echo "- 应用地址: http://localhost:3001"
echo "- 健康检查: http://localhost:3001/api/health"
echo "- 数据库: localhost:5432 (用户名: rento)"
echo ""
echo "🔧 管理命令:"
echo "- 查看状态: podman-compose ps"
echo "- 查看日志: podman-compose logs -f"
echo "- 停止服务: podman-compose down"
echo "- 重启服务: podman-compose restart"
echo ""
echo "✅ 验证完成，Rento 已成功部署在 Podman 环境中！"