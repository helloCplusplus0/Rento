#!/bin/bash

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        print_error "缺少命令: $1"
        exit 1
    fi
}

detect_runtime() {
    if command -v podman >/dev/null 2>&1; then
        CONTAINER_CMD="podman"
        if podman compose version >/dev/null 2>&1; then
            COMPOSE_CMD="podman compose"
        elif command -v podman-compose >/dev/null 2>&1; then
            COMPOSE_CMD="podman-compose"
        else
            print_error "未找到 podman compose 或 podman-compose"
            exit 1
        fi
        return
    fi

    if command -v docker >/dev/null 2>&1; then
        CONTAINER_CMD="docker"
        if docker compose version >/dev/null 2>&1; then
            COMPOSE_CMD="docker compose"
        elif command -v docker-compose >/dev/null 2>&1; then
            COMPOSE_CMD="docker-compose"
        else
            print_error "未找到 docker compose 或 docker-compose"
            exit 1
        fi
        return
    fi

    print_error "未找到 podman 或 docker"
    exit 1
}

ensure_env_file() {
    if [[ -f ".env" ]]; then
        return
    fi

    if [[ ! -f ".env.example" ]]; then
        print_error "缺少 .env.example"
        exit 1
    fi

    cp .env.example .env
    print_success "已从模板创建 .env"
}

set_config_value() {
    local key="$1"
    local value="$2"

    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    else
        printf '%s=%s\n' "$key" "$value" >> .env
    fi
}

apply_domain_override() {
    local domain="$1"

    if [[ -z "$domain" ]]; then
        return
    fi

    set_config_value "NEXTAUTH_URL" "https://${domain}"
    set_config_value "ALLOWED_ORIGINS" "https://${domain}"
    print_success "已将域名写入 .env: ${domain}"
}

load_env_file() {
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a

    APP_CONTAINER_NAME="${CONTAINER_PREFIX:-rento}-app"
    POSTGRES_CONTAINER_NAME="${CONTAINER_PREFIX:-rento}-postgres"
    REDIS_CONTAINER_NAME="${CONTAINER_PREFIX:-rento}-redis"
    NGINX_CONTAINER_NAME="${CONTAINER_PREFIX:-rento}-nginx"
}

validate_required_var() {
    local key="$1"
    local value="${!key:-}"

    if [[ -z "$value" ]]; then
        print_error ".env 中缺少必填项: ${key}"
        exit 1
    fi
}

validate_environment() {
    local required_vars=(
        NEXTAUTH_URL
        ALLOWED_ORIGINS
        AUTH_SESSION_SECRET
        NEXTAUTH_SECRET
        ADMIN_PASSWORD_HASH
        POSTGRES_PASSWORD
        CONTAINER_DATABASE_URL
        CONTAINER_REDIS_URL
        APP_IMAGE
    )

    for var_name in "${required_vars[@]}"; do
        validate_required_var "$var_name"
    done

    if [[ "${NEXTAUTH_URL}" != https://* ]]; then
        print_error "NEXTAUTH_URL 必须使用 https://"
        exit 1
    fi

    if [[ "${ALLOWED_ORIGINS}" != "${NEXTAUTH_URL}" ]]; then
        print_warning "ALLOWED_ORIGINS 与 NEXTAUTH_URL 不一致，请确认是否确有多来源需求"
    fi
}

prepare_directories() {
    mkdir -p \
        "${HOST_LOG_DIR:-./logs}" \
        "${HOST_BACKUP_DIR:-./backups}" \
        "${HOST_NGINX_LOG_DIR:-./logs/nginx}" \
        "${NGINX_SSL_DIR:-./nginx/ssl}"
}

validate_certificates() {
    local ssl_dir="${NGINX_SSL_DIR:-./nginx/ssl}"
    local fullchain="${ssl_dir}/fullchain.pem"
    local privkey="${ssl_dir}/privkey.pem"

    if [[ ! -f "$fullchain" ]]; then
        print_error "缺少证书文件: ${fullchain}"
        exit 1
    fi

    if [[ ! -f "$privkey" ]]; then
        print_error "缺少私钥文件: ${privkey}"
        exit 1
    fi
}

prepare_images() {
    print_info "拉取镜像"
    $COMPOSE_CMD pull postgres redis app nginx
}

wait_for_container_state() {
    local container_name="$1"
    local expected_state="$2"
    local timeout_secs="$3"
    local waited=0
    local state=""

    while (( waited < timeout_secs )); do
        state="$($CONTAINER_CMD inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_name" 2>/dev/null || true)"
        if [[ "$state" == "$expected_state" ]]; then
            print_success "${container_name} 状态: ${state}"
            return 0
        fi

        sleep 5
        waited=$((waited + 5))
    done

    print_error "${container_name} 未在 ${timeout_secs}s 内进入 ${expected_state} 状态，当前: ${state:-unknown}"
    return 1
}

start_core_services() {
    print_info "启动 postgres / redis / app"
    $COMPOSE_CMD down --remove-orphans 2>/dev/null || true
    $COMPOSE_CMD up -d postgres redis app

    wait_for_container_state "$POSTGRES_CONTAINER_NAME" "healthy" 120
    wait_for_container_state "$REDIS_CONTAINER_NAME" "healthy" 60
    wait_for_container_state "$APP_CONTAINER_NAME" "healthy" 180
}

initialize_database() {
    print_info "执行数据库初始化"
    $CONTAINER_CMD exec "$APP_CONTAINER_NAME" /app/scripts/migrate-and-seed.sh
    print_success "数据库初始化完成"
}

start_nginx() {
    print_info "启动 nginx"
    $COMPOSE_CMD up -d nginx
    wait_for_container_state "$NGINX_CONTAINER_NAME" "running" 60
}

extract_host_from_url() {
    local url="$1"
    local without_scheme="${url#https://}"
    without_scheme="${without_scheme#http://}"
    without_scheme="${without_scheme%%/*}"
    echo "${without_scheme%%:*}"
}

build_local_https_url() {
    local https_port="${HTTPS_PORT:-443}"
    if [[ "$https_port" == "443" ]]; then
        echo "https://127.0.0.1/api/health"
    else
        echo "https://127.0.0.1:${https_port}/api/health"
    fi
}

verify_https() {
    local host_header
    local probe_url

    host_header="$(extract_host_from_url "$NEXTAUTH_URL")"
    probe_url="$(build_local_https_url)"

    print_info "验证 HTTPS 健康检查"
    curl -kfsS -H "Host: ${host_header}" "$probe_url" >/dev/null
    print_success "HTTPS 健康检查通过"
}

print_summary() {
    echo
    print_success "Rento 部署完成"
    echo "应用地址: ${NEXTAUTH_URL}"
    echo "健康检查: ${NEXTAUTH_URL}/api/health"
    echo "容器运行时: ${CONTAINER_CMD}"
    echo "查看状态: ${COMPOSE_CMD} ps"
    echo "查看日志: ${COMPOSE_CMD} logs -f"
    echo "停止服务: ${COMPOSE_CMD} down"
}

main() {
    local domain="${1:-}"

    check_command "curl"
    detect_runtime
    prepare_directories
    ensure_env_file
    apply_domain_override "$domain"
    load_env_file
    validate_environment
    validate_certificates
    prepare_images
    start_core_services
    initialize_database
    start_nginx
    verify_https
    print_summary
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
