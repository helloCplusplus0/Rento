#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
APP_ROOT="${RENTO_APP_ROOT:-$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)}"
PULL_SCRIPT="${SCRIPT_DIR}/pull-release-deploy-bundle.sh"

RELEASE_TAG="${RENTO_RELEASE_TAG:-}"
INSTALL_ROOT="${RENTO_INSTALL_ROOT:-/opt/rento-minix}"
CURRENT_LINK="${INSTALL_ROOT}/current"
CONFIG_DIR="${RENTO_CONFIG_DIR:-/etc/rento-minix}"
ENV_FILE="${RENTO_ENV_FILE:-${CONFIG_DIR}/rento-minix.env}"
SYSTEMD_TARGET="${RENTO_SYSTEMD_UNIT_PATH:-/etc/systemd/system/rento-minix.service}"
CADDY_TARGET="${RENTO_CADDYFILE_PATH:-/etc/caddy/Caddyfile}"
SYSTEMD_SOURCE_RELATIVE="deploy/systemd/rento-minix.service"
CADDY_SOURCE_RELATIVE="deploy/caddy/Caddyfile"
HEALTH_URL_OVERRIDE=""
PUBLIC_DOMAIN="${RENTO_PUBLIC_DOMAIN:-}"
REFRESH_SYSTEM_CONFIG=false
SKIP_MIGRATE=false
SKIP_HEALTH_CHECK=false

info() {
  printf '[INFO] %s\n' "$1"
}

warn() {
  printf '[WARN] %s\n' "$1" >&2
}

error() {
  printf '[ERROR] %s\n' "$1" >&2
}

show_usage() {
  cat <<EOF
用法:
  sudo $0 <release-tag> [选项]

示例:
  sudo $0 v1.2.3 --domain rento.example.com
  sudo $0 v1.2.4 --refresh-system-config

选项:
  --domain DOMAIN            首次写入或刷新 Caddy 配置时使用的公网域名
  --health-url URL           显式指定健康检查地址
  --refresh-system-config    用当前 release 重新覆盖 systemd/Caddy 基线
  --skip-migrate             跳过数据库迁移
  --skip-health-check        跳过部署后的健康检查
  -h, --help                 显示帮助

说明:
  - 该脚本会调用 scripts/pull-release-deploy-bundle.sh 拉取 GitHub Release 正式部署包。
  - 服务器部署过程不会执行 npm run build、vite build 或 next build。
EOF
}

require_root() {
  if [ "${EUID:-$(id -u)}" -ne 0 ]; then
    error "请使用 root 或 sudo 运行该脚本。"
    exit 1
  fi
}

ensure_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    error "缺少命令: $1"
    exit 1
  fi
}

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --domain)
        [ $# -ge 2 ] || {
          error "--domain 需要提供域名"
          exit 1
        }
        PUBLIC_DOMAIN="$2"
        shift 2
        ;;
      --health-url)
        [ $# -ge 2 ] || {
          error "--health-url 需要提供 URL"
          exit 1
        }
        HEALTH_URL_OVERRIDE="$2"
        shift 2
        ;;
      --refresh-system-config)
        REFRESH_SYSTEM_CONFIG=true
        shift
        ;;
      --skip-migrate)
        SKIP_MIGRATE=true
        shift
        ;;
      --skip-health-check)
        SKIP_HEALTH_CHECK=true
        shift
        ;;
      -h|--help)
        show_usage
        exit 0
        ;;
      -*)
        error "未知选项: $1"
        show_usage
        exit 1
        ;;
      *)
        if [ -z "$RELEASE_TAG" ]; then
          RELEASE_TAG="$1"
        else
          error "多余参数: $1"
          show_usage
          exit 1
        fi
        shift
        ;;
    esac
  done

  if [ -z "$RELEASE_TAG" ]; then
    error "缺少 release tag，例如: v1.2.3"
    show_usage
    exit 1
  fi
}

validate_inputs() {
  if [ ! -x "$PULL_SCRIPT" ]; then
    error "未找到可执行的拉包脚本: $PULL_SCRIPT"
    exit 1
  fi
}

pull_release_bundle() {
  info "拉取正式部署包 ${RELEASE_TAG}"
  "$PULL_SCRIPT" "$RELEASE_TAG"
}

current_release_path() {
  printf '%s/%s' "$CURRENT_LINK" "$1"
}

ensure_release_file() {
  local path
  path="$(current_release_path "$1")"

  if [ ! -f "$path" ]; then
    error "当前 release 缺少文件: $path"
    exit 1
  fi
}

render_caddyfile() {
  local source_file="$1"
  local output_file="$2"

  if [ -z "$PUBLIC_DOMAIN" ]; then
    error "首次安装或刷新 Caddy 配置时必须提供 --domain"
    exit 1
  fi

  sed "s|rento.example.com|${PUBLIC_DOMAIN}|g" "$source_file" > "$output_file"
}

install_systemd_unit() {
  local source_file
  source_file="$(current_release_path "$SYSTEMD_SOURCE_RELATIVE")"

  ensure_release_file "$SYSTEMD_SOURCE_RELATIVE"

  if [ ! -f "$SYSTEMD_TARGET" ] || [ "$REFRESH_SYSTEM_CONFIG" = true ]; then
    install -D -m 0644 "$source_file" "$SYSTEMD_TARGET"
    info "已同步 systemd 服务文件到 ${SYSTEMD_TARGET}"
  else
    info "保留现有 systemd 服务文件: ${SYSTEMD_TARGET}"
  fi
}

install_caddyfile() {
  local source_file rendered_file
  source_file="$(current_release_path "$CADDY_SOURCE_RELATIVE")"
  rendered_file="$(mktemp)"

  ensure_release_file "$CADDY_SOURCE_RELATIVE"

  if [ ! -f "$CADDY_TARGET" ]; then
    render_caddyfile "$source_file" "$rendered_file"
    install -D -m 0644 "$rendered_file" "$CADDY_TARGET"
    info "已首次写入 Caddy 配置: ${CADDY_TARGET}"
  elif [ "$REFRESH_SYSTEM_CONFIG" = true ]; then
    render_caddyfile "$source_file" "$rendered_file"
    install -D -m 0644 "$rendered_file" "$CADDY_TARGET"
    info "已按当前 release 刷新 Caddy 配置: ${CADDY_TARGET}"
  else
    if [ -n "$PUBLIC_DOMAIN" ]; then
      warn "检测到已存在的 Caddy 配置，未覆盖；如需刷新请追加 --refresh-system-config"
    fi
    info "保留现有 Caddy 配置: ${CADDY_TARGET}"
  fi

  rm -f "$rendered_file"
}

load_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    error "缺少环境文件: ${ENV_FILE}"
    error "请先运行 scripts/prepare-release-host.sh，并基于 .env.example 创建私有环境文件。"
    exit 1
  fi

  info "加载环境变量: ${ENV_FILE}"
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
}

run_migration() {
  if [ "$SKIP_MIGRATE" = true ]; then
    warn "按参数要求跳过数据库迁移"
    return
  fi

  info "执行数据库迁移"
  (
    cd "$CURRENT_LINK"
    bash ./scripts/migrate-and-seed.sh
  )
}

reload_services() {
  info "刷新 systemd 配置"
  systemctl daemon-reload

  info "启用并重启 rento-minix"
  systemctl enable --now rento-minix
  systemctl restart rento-minix

  info "启用并刷新 Caddy"
  systemctl enable --now caddy
  if ! systemctl reload caddy; then
    warn "Caddy reload 失败，尝试 restart"
    systemctl restart caddy
  fi
}

run_health_check() {
  if [ "$SKIP_HEALTH_CHECK" = true ]; then
    warn "按参数要求跳过健康检查"
    return
  fi

  if [ -n "$HEALTH_URL_OVERRIDE" ]; then
    info "按显式 URL 执行健康检查: ${HEALTH_URL_OVERRIDE}"
    bash "$(current_release_path "scripts/health-check.sh")" --url "$HEALTH_URL_OVERRIDE"
    return
  fi

  info "执行默认健康检查"
  bash "$(current_release_path "scripts/health-check.sh")"
}

print_summary() {
  cat <<EOF
[OK] 已完成正式部署

Release: ${RELEASE_TAG}
Current: ${CURRENT_LINK}
Environment file: ${ENV_FILE}
Systemd unit: ${SYSTEMD_TARGET}
Caddyfile: ${CADDY_TARGET}

说明:
- 本次部署未在服务器执行任何 build 命令
- 默认正式入口继续固定为 GitHub Release asset -> /opt/rento-minix/current -> systemd/Caddy
- 若需要覆盖系统级配置，请使用:
  sudo $0 ${RELEASE_TAG} --refresh-system-config --domain <your-domain>
- 若需要查看完整操作步骤，请阅读:
  ${APP_ROOT}/DEPLOY_RUNBOOK.md
EOF
}

main() {
  require_root
  parse_args "$@"
  validate_inputs

  ensure_command bash
  ensure_command gh
  ensure_command tar
  ensure_command sha256sum
  ensure_command systemctl
  ensure_command install
  ensure_command sed
  ensure_command curl

  pull_release_bundle
  install_systemd_unit
  install_caddyfile
  load_env_file
  run_migration
  reload_services
  run_health_check
  print_summary
}

main "$@"
