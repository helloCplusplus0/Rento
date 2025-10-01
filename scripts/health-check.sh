#!/bin/bash
set -e

# Rento 应用健康检查脚本
# 用于 Docker 健康检查和外部监控

HEALTH_URL="${HEALTH_URL:-http://localhost:3001/api/health}"
TIMEOUT="${TIMEOUT:-10}"
MAX_RETRIES="${MAX_RETRIES:-3}"

check_health() {
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        echo "健康检查尝试 $attempt/$MAX_RETRIES..."
        
        # 使用 curl 检查健康状态
        if response=$(curl -s -f --max-time $TIMEOUT "$HEALTH_URL" 2>/dev/null); then
            # 解析 JSON 响应
            status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
            
            case "$status" in
                "healthy")
                    echo "✅ 应用状态健康"
                    echo "响应: $response"
                    exit 0
                    ;;
                "degraded")
                    echo "⚠️  应用状态降级但可用"
                    echo "响应: $response"
                    exit 0
                    ;;
                "unhealthy")
                    echo "❌ 应用状态不健康"
                    echo "响应: $response"
                    ;;
                *)
                    echo "❓ 未知健康状态: $status"
                    echo "响应: $response"
                    ;;
            esac
        else
            echo "❌ 健康检查请求失败"
        fi
        
        if [ $attempt -lt $MAX_RETRIES ]; then
            echo "等待 2 秒后重试..."
            sleep 2
        fi
        
        attempt=$((attempt + 1))
    done
    
    echo "❌ 健康检查失败，已达到最大重试次数"
    exit 1
}

# 显示使用说明
show_usage() {
    echo "用法: $0 [选项]"
    echo "选项:"
    echo "  -u, --url URL      健康检查 URL (默认: http://localhost:3001/api/health)"
    echo "  -t, --timeout SEC  请求超时时间 (默认: 10)"
    echo "  -r, --retries NUM  最大重试次数 (默认: 3)"
    echo "  -h, --help         显示此帮助信息"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            HEALTH_URL="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -r|--retries)
            MAX_RETRIES="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            show_usage
            exit 1
            ;;
    esac
done

# 执行健康检查
check_health