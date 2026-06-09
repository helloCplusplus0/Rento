#!/bin/bash

set -euo pipefail

# rollback-only:
# This script keeps serving the legacy containerized rollback baseline.
# Formal deployment must use scripts/pull-release-deploy-bundle.sh instead.

REPO_URL="${RENTO_REPO_URL:-https://github.com/helloCplusplus0/Rento-miniX.git}"
REPO_REF="${RENTO_REPO_REF:-main}"
TARGET_DIR="${1:-./rento-deploy}"

DEPLOY_PATHS=(
  ".env.example"
  "README.md"
  "DEPLOYMENT.md"
  "docker-compose.yml"
  "nginx/nginx.conf"
  "scripts/bootstrap-deploy-assets.sh"
  "scripts/cloud-deploy.sh"
  "scripts/health-check.sh"
  "scripts/init-db.sh"
)

print_info() {
  printf '[INFO] %s\n' "$1"
}

print_error() {
  printf '[ERROR] %s\n' "$1" >&2
}

ensure_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    print_error "缺少命令: $1"
    exit 1
  fi
}

prepare_repo() {
  if [[ -e "$TARGET_DIR" && ! -d "$TARGET_DIR/.git" ]]; then
    print_error "目标目录已存在且不是 Git 仓库: $TARGET_DIR"
    exit 1
  fi

  if [[ ! -d "$TARGET_DIR/.git" ]]; then
    print_info "初始化稀疏仓库: $TARGET_DIR"
    git clone --filter=blob:none --no-checkout "$REPO_URL" "$TARGET_DIR"
  fi
}

apply_sparse_checkout() {
  print_info "配置仅部署所需文件"
  git -C "$TARGET_DIR" remote set-url origin "$REPO_URL"
  git -C "$TARGET_DIR" sparse-checkout init --cone
  git -C "$TARGET_DIR" sparse-checkout set "${DEPLOY_PATHS[@]}"
  git -C "$TARGET_DIR" fetch origin "$REPO_REF" --depth 1
  git -C "$TARGET_DIR" checkout -B "$REPO_REF" "origin/$REPO_REF"
}

prepare_runtime_dirs() {
  mkdir -p \
    "$TARGET_DIR/nginx/ssl" \
    "$TARGET_DIR/logs/nginx" \
    "$TARGET_DIR/backups"
}

print_summary() {
  cat <<EOF
[OK] 已完成 legacy 回滚资产拉取

目录: $TARGET_DIR
分支: $REPO_REF
仓库: $REPO_URL

说明:
- 该脚本只服务于 rollback-only 容器化运行线。
- 正式主线请改用 scripts/pull-release-deploy-bundle.sh 从 GitHub Release 拉取部署包。

legacy 回滚下一步:
1. cd "$TARGET_DIR"
2. cp .env.example .env
3. 编辑 .env 中的域名、密钥、管理员哈希和数据库密码
4. 放置证书:
   - nginx/ssl/fullchain.pem
   - nginx/ssl/privkey.pem
5. 执行:
   - chmod +x scripts/cloud-deploy.sh
   - ./scripts/cloud-deploy.sh your-domain.example
EOF
}

main() {
  ensure_command git
  prepare_repo
  apply_sparse_checkout
  prepare_runtime_dirs
  print_summary
}

main "$@"
