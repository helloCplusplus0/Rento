#!/bin/bash
set -e

# Rento 应用健康检查脚本
# 默认命中 `/api/health` 这个当前阶段唯一主健康入口；
# `/api/health/system` 与 `/api/health/bills` 仅用于更细粒度的问题定位。
# 用于 Docker 健康检查和外部监控。

APP_BASE_URL="${NEXTAUTH_URL:-http://localhost:${APP_PORT:-${APP_INTERNAL_PORT:-3001}}}"
HEALTH_URL="${HEALTH_URL:-${APP_BASE_URL%/}/api/health}"
TIMEOUT="${TIMEOUT:-10}"
MAX_RETRIES="${MAX_RETRIES:-3}"

check_health() {
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        echo "健康检查尝试 $attempt/$MAX_RETRIES..."
        
        # 使用 curl 检查健康状态。
        # 不能使用 `-f`，否则 503 时拿不到 `/api/health` 返回的 JSON body，
        # 无法继续按顶层 `status` 做兼容判断。
        if response_bundle=$(curl -s --max-time $TIMEOUT -w '\n%{http_code}' "$HEALTH_URL" 2>/dev/null); then
            http_status=$(echo "$response_bundle" | tail -n1)
            response=$(echo "$response_bundle" | sed '$d')
            status=$(echo "$response" | grep -o '"status":"[^"]*"' | head -n1 | cut -d'"' -f4)

            case "$status" in
                "healthy")
                    echo "✅ 应用状态健康 (HTTP $http_status)"
                    echo "响应: $response"
                    exit 0
                    ;;
                "degraded")
                    echo "⚠️  应用状态降级但可用 (HTTP $http_status)"
                    echo "响应: $response"
                    exit 0
                    ;;
                "unhealthy")
                    echo "❌ 应用状态不健康 (HTTP $http_status)"
                    echo "响应: $response"
                    ;;
                *)
                    echo "❓ 未知健康状态: $status (HTTP $http_status)"
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
    echo "  -u, --url URL      健康检查 URL (默认从 NEXTAUTH_URL / APP_PORT 推导到 /api/health)"
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
