#!/bin/bash

# Rento Cloud Deployment Script
# 适用于云服务器（如阿里云、腾讯云等）的自动化部署脚本
# 
# 使用方法:
#   ./scripts/cloud-deploy.sh [domain]
#   例如: ./scripts/cloud-deploy.sh your-domain.com

set -e  # 遇到错误立即退出

# 颜色输出定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "命令 $1 未找到，请先安装"
        exit 1
    fi
}

# 主函数
main() {
    local domain="${1:-localhost}"
    local protocol="${2:-http}"
    
    if [[ "$domain" != "localhost" ]]; then
        protocol="https"
    fi
    
    print_info "开始 Rento 云服务器部署"
    print_info "目标域名: $domain"
    print_info "访问协议: $protocol"
    echo
    
    # 步骤1：环境检查
    print_info "步骤 1/8: 环境检查"
    check_environment
    
    # 步骤2：系统准备
    print_info "步骤 2/8: 系统准备"
    prepare_system
    
    # 步骤3：配置环境变量
    print_info "步骤 3/8: 配置环境变量"
    configure_environment "$domain" "$protocol"
    
    # 步骤4：拉取镜像
    print_info "步骤 4/8: 拉取Docker镜像"
    pull_images
    
    # 步骤5：启动服务
    print_info "步骤 5/8: 启动容器服务"
    start_services
    
    # 步骤6：等待服务就绪
    print_info "步骤 6/8: 等待服务就绪"
    wait_for_services
    
    # 步骤7：初始化数据库
    print_info "步骤 7/8: 初始化数据库"
    initialize_database
    
    # 步骤8：验证部署
    print_info "步骤 8/8: 验证部署"
    verify_deployment "$domain" "$protocol"
    
    # 部署完成
    print_deployment_summary "$domain" "$protocol"
}

# 环境检查
check_environment() {
    # 检查必要的命令
    check_command "git"
    check_command "curl"
    
    # 检查容器运行时
    if command -v podman &> /dev/null; then
        CONTAINER_CMD="podman"
        COMPOSE_CMD="podman-compose"
        check_command "podman-compose"
    elif command -v docker &> /dev/null; then
        CONTAINER_CMD="docker"
        COMPOSE_CMD="docker-compose"
        check_command "docker-compose"
    else
        print_error "未找到 podman 或 docker，请先安装容器运行时"
        exit 1
    fi
    
    print_success "使用容器运行时: $CONTAINER_CMD"
    
    # 检查系统资源
    local mem_gb=$(free -g | awk 'NR==2{printf "%.1f", $2}')
    local disk_gb=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    
    if (( $(echo "$mem_gb < 1.5" | bc -l) )); then
        print_warning "内存不足 2GB，可能影响性能"
    fi
    
    if (( disk_gb < 10 )); then
        print_warning "磁盘空间不足 10GB，可能影响运行"
    fi
    
    print_success "环境检查完成"
}

# 系统准备
prepare_system() {
    # 创建必要的目录
    mkdir -p logs/nginx backups
    
    # 设置目录权限
    chmod 755 logs backups
    
    # 检查端口占用
    local ports=("3001" "5432" "6379")
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_warning "端口 $port 已被占用，请检查是否有冲突"
        fi
    done
    
    print_success "系统准备完成"
}

# 配置环境变量
configure_environment() {
    local domain="$1"
    local protocol="$2"
    
    if [[ ! -f ".env" ]]; then
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            print_success "从模板创建 .env 文件"
        else
            print_error ".env.example 文件不存在"
            exit 1
        fi
    fi
    
    # 根据域名更新配置
    if [[ "$domain" != "localhost" ]]; then
        # 更新域名相关配置
        sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=${protocol}://${domain}|g" .env
        sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=${protocol}://${domain}|g" .env
        print_success "已更新域名配置: $domain"
    fi
    
    # 验证必要的环境变量
    local required_vars=("NEXTAUTH_SECRET" "POSTGRES_PASSWORD")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env; then
            print_error "环境变量 $var 未设置，请检查 .env 文件"
            exit 1
        fi
    done
    
    print_success "环境变量配置完成"
}

# 拉取镜像
pull_images() {
    print_info "正在拉取最新镜像..."
    
    # 拉取应用镜像
    if ! $COMPOSE_CMD pull app; then
        print_warning "应用镜像拉取失败，尝试使用本地构建"
    fi
    
    # 拉取数据库和Redis镜像
    $COMPOSE_CMD pull postgres redis
    
    print_success "镜像拉取完成"
}

# 启动服务
start_services() {
    print_info "正在启动服务..."
    
    # 停止现有服务（如果存在）
    $COMPOSE_CMD down --remove-orphans 2>/dev/null || true
    
    # 启动服务
    $COMPOSE_CMD up -d postgres redis
    sleep 10  # 等待数据库启动
    
    $COMPOSE_CMD up -d app
    
    print_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    local max_wait=120  # 最大等待时间（秒）
    local wait_time=0
    
    print_info "等待服务就绪（最大等待 ${max_wait}s）..."
    
    # 简化等待逻辑：轮询健康端点
    while [ $wait_time -lt $max_wait ]; do
        if curl -s -f http://localhost:3001/api/health >/dev/null; then
            print_success "健康端点可用"
            return 0
        fi
        
        print_info "应用未就绪，重试中... (${wait_time}s/${max_wait}s)"
        sleep 5
        wait_time=$((wait_time + 5))
    done
    
    print_warning "等待超时，继续初始化步骤"
}

# 初始化数据库
initialize_database() {
    print_info "正在初始化数据库..."
    
    # 运行数据库迁移和种子数据
    if $CONTAINER_CMD exec rento-app /app/scripts/migrate-and-seed.sh; then
        print_success "数据库初始化完成"
    else
        print_warning "数据库初始化失败，请手动执行"
        print_info "手动执行命令: $CONTAINER_CMD exec -it rento-app /app/scripts/migrate-and-seed.sh"
    fi
}

# 验证部署
verify_deployment() {
    local domain="$1"
    local protocol="$2"
    local base_url="${protocol}://${domain}:3001"
    
    if [[ "$domain" == "localhost" ]]; then
        base_url="http://localhost:3001"
    fi
    
    print_info "验证部署状态..."
    
    # 检查健康端点
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "${base_url}/api/health" >/dev/null; then
            print_success "健康检查通过"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "健康检查失败，请检查服务状态"
            print_info "检查日志: $COMPOSE_CMD logs -f"
            return 1
        fi
        
        print_info "健康检查失败，重试 $attempt/$max_attempts"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    # 检查容器状态
    print_info "容器状态检查:"
    $COMPOSE_CMD ps
    
    print_success "部署验证完成"
}

# 打印部署摘要
print_deployment_summary() {
    local domain="$1"
    local protocol="$2"
    local base_url="${protocol}://${domain}:3001"
    
    if [[ "$domain" == "localhost" ]]; then
        base_url="http://localhost:3001"
    fi
    
    echo
    print_success "🎉 Rento 部署完成！"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 部署信息"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 应用地址:     ${base_url}"
    echo "🏥 健康检查:     ${base_url}/api/health"
    echo "📊 系统信息:     ${base_url}/api/system/info"
    echo "🐳 容器运行时:   $CONTAINER_CMD"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 管理命令"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "查看状态:       $COMPOSE_CMD ps"
    echo "查看日志:       $COMPOSE_CMD logs -f"
    echo "重启服务:       $COMPOSE_CMD restart"
    echo "停止服务:       $COMPOSE_CMD down"
    echo "健康检查:       ./scripts/health-check.sh"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📞 获取帮助"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "项目文档:       https://github.com/helloCplusplus0/Rento"
    echo "问题反馈:       GitHub Issues"
    echo "部署指南:       ./DEPLOYMENT.md"
    echo
    
    if [[ "$domain" != "localhost" ]]; then
        echo "💡 提示: 生产环境建议配置 HTTPS 证书和防火墙规则"
    fi
}

# 脚本入口点
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi