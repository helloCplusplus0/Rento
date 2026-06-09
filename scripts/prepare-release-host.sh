#!/bin/bash

set -euo pipefail

RUN_USER="${RENTO_RUN_USER:-rento}"
RUN_GROUP="${RENTO_RUN_GROUP:-rento}"
INSTALL_ROOT="${RENTO_INSTALL_ROOT:-/opt/rento-minix}"
CONFIG_DIR="${RENTO_CONFIG_DIR:-/etc/rento-minix}"
ENV_FILE="${RENTO_ENV_FILE:-${CONFIG_DIR}/rento-minix.env}"
ENV_TEMPLATE_TARGET="${CONFIG_DIR}/rento-minix.env.example"
RELEASE_TAG="${RENTO_RELEASE_TAG:-}"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
APP_ROOT="${RENTO_APP_ROOT:-$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)}"
SOURCE_ENV_TEMPLATE="${APP_ROOT}/.env.example"

info() {
  printf '[INFO] %s\n' "$1"
}

warn() {
  printf '[WARN] %s\n' "$1" >&2
}

error() {
  printf '[ERROR] %s\n' "$1" >&2
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

show_usage() {
  cat <<EOF
用法:
  sudo $0 [--release-tag <tag>]

选项:
  --release-tag <tag>   用指定 Git tag 中的 .env.example 同步环境模板，避免与目标 release 漂移
  -h, --help            显示帮助
EOF
}

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --release-tag)
        [ $# -ge 2 ] || {
          error "--release-tag 需要提供 tag"
          exit 1
        }
        RELEASE_TAG="$2"
        shift 2
        ;;
      -h|--help)
        show_usage
        exit 0
        ;;
      *)
        error "未知选项: $1"
        show_usage
        exit 1
        ;;
    esac
  done
}

ensure_group() {
  if getent group "$RUN_GROUP" >/dev/null 2>&1; then
    info "运行组已存在: ${RUN_GROUP}"
    return
  fi

  info "创建运行组: ${RUN_GROUP}"
  groupadd --system "$RUN_GROUP"
}

ensure_user() {
  if id "$RUN_USER" >/dev/null 2>&1; then
    info "运行用户已存在: ${RUN_USER}"
    return
  fi

  info "创建运行用户: ${RUN_USER}"
  useradd \
    --system \
    --gid "$RUN_GROUP" \
    --home-dir /var/lib/rento-minix \
    --create-home \
    --shell /usr/sbin/nologin \
    "$RUN_USER"
}

create_directories() {
  info "创建正式部署目录与配置目录"
  install -d -m 0750 -o "$RUN_USER" -g "$RUN_GROUP" \
    "$INSTALL_ROOT" \
    "${INSTALL_ROOT}/releases" \
    "${INSTALL_ROOT}/tmp"

  install -d -m 0750 -o root -g root "$CONFIG_DIR"
}

sync_env_template() {
  if [ -n "$RELEASE_TAG" ]; then
    local temp_template
    temp_template="$(mktemp)"

    if ! git -C "$APP_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      rm -f "$temp_template"
      error "APP_ROOT 不是 Git 工作区，无法按 tag 同步环境模板: ${APP_ROOT}"
      exit 1
    fi

    git -C "$APP_ROOT" fetch --tags origin >/dev/null 2>&1 || true

    if git -C "$APP_ROOT" show "${RELEASE_TAG}:.env.example" > "$temp_template" 2>/dev/null; then
      install -m 0640 -o root -g root "$temp_template" "$ENV_TEMPLATE_TARGET"
      info "已按 release tag ${RELEASE_TAG} 同步环境变量模板到 ${ENV_TEMPLATE_TARGET}"
      rm -f "$temp_template"
    else
      rm -f "$temp_template"
      error "未能从 tag ${RELEASE_TAG} 提取 .env.example，请确认目标 tag 已存在于当前仓库。"
      exit 1
    fi
  elif [ -f "$SOURCE_ENV_TEMPLATE" ]; then
    install -m 0640 -o root -g root "$SOURCE_ENV_TEMPLATE" "$ENV_TEMPLATE_TARGET"
    info "已同步环境变量模板到 ${ENV_TEMPLATE_TARGET}"
    warn "当前未指定 --release-tag；若即将部署特定 release，建议使用对应 tag 同步模板。"
  else
    warn "未找到源模板: ${SOURCE_ENV_TEMPLATE}"
  fi

  if [ -f "$ENV_FILE" ]; then
    info "已检测到私有环境文件: ${ENV_FILE}"
  else
    warn "尚未找到私有环境文件: ${ENV_FILE}"
    warn "请基于 ${ENV_TEMPLATE_TARGET} 创建 ${ENV_FILE} 后再执行正式部署。"
  fi
}

check_prerequisites() {
  local required_commands="bash gh git tar sha256sum systemctl curl node"
  local cmd

  for cmd in $required_commands; do
    ensure_command "$cmd"
  done

  if ! command -v caddy >/dev/null 2>&1; then
    warn "未检测到 caddy 命令；若使用系统包安装，后续请确认 caddy 服务存在。"
  fi

  if gh auth status >/dev/null 2>&1; then
    info "GitHub CLI 已登录，可直接拉取 Release asset"
  else
    warn "GitHub CLI 尚未登录；后续请先执行 gh auth login 或配置 GH_TOKEN。"
  fi
}

print_summary() {
  cat <<EOF
[OK] 已完成服务器准备

运行用户: ${RUN_USER}:${RUN_GROUP}
部署目录: ${INSTALL_ROOT}
配置目录: ${CONFIG_DIR}
环境文件: ${ENV_FILE}

下一步建议:
1. 确认 ${ENV_FILE} 已按实际环境填写完成
2. 确认 gh auth status 可用，或已配置 GH_TOKEN
3. 阅读部署手册:
   ${APP_ROOT}/DEPLOY_RUNBOOK.md
4. 执行:
   sudo ${APP_ROOT}/scripts/deploy-release-on-server.sh <tag>
EOF
}

main() {
  require_root
  parse_args "$@"
  check_prerequisites
  ensure_group
  ensure_user
  create_directories
  sync_env_template
  print_summary
}

main "$@"
