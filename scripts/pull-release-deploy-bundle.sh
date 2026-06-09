#!/bin/bash

set -euo pipefail

REPO_SLUG="${RENTO_GITHUB_REPO:-helloCplusplus0/Rento-miniX}"
RELEASE_TAG="${1:-${RENTO_RELEASE_TAG:-}}"
INSTALL_ROOT="${RENTO_INSTALL_ROOT:-/opt/rento-minix}"
CURRENT_LINK="${INSTALL_ROOT}/current"
RELEASES_DIR="${INSTALL_ROOT}/releases"
TMP_DIR="${INSTALL_ROOT}/tmp"

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

resolve_asset_name() {
  local version="${RELEASE_TAG#v}"
  ASSET_NAME="${RENTO_RELEASE_ASSET_NAME:-rento-minix-${version}-deploy-bundle.tar.gz}"
  CHECKSUM_NAME="${ASSET_NAME}.sha256"
}

prepare_directories() {
  mkdir -p "$RELEASES_DIR" "$TMP_DIR"
}

download_assets() {
  print_info "从 GitHub Release 拉取正式部署包: ${REPO_SLUG}@${RELEASE_TAG}"
  rm -f "${TMP_DIR}/${ASSET_NAME}" "${TMP_DIR}/${CHECKSUM_NAME}"

  gh release download "$RELEASE_TAG" \
    --repo "$REPO_SLUG" \
    --pattern "$ASSET_NAME" \
    --pattern "$CHECKSUM_NAME" \
    --dir "$TMP_DIR"
}

verify_bundle() {
  print_info "校验正式部署包 SHA256"
  (
    cd "$TMP_DIR"
    sha256sum -c "$CHECKSUM_NAME"
  )
}

extract_bundle() {
  RELEASE_DIR="${RELEASES_DIR}/${RELEASE_TAG}"
  rm -rf "$RELEASE_DIR"
  mkdir -p "$RELEASE_DIR"

  print_info "解压正式部署包到 ${RELEASE_DIR}"
  tar -xzf "${TMP_DIR}/${ASSET_NAME}" -C "$RELEASE_DIR" --strip-components=1

  if [ ! -f "${RELEASE_DIR}/scripts/start-minix.mjs" ]; then
    print_error "部署包缺少 scripts/start-minix.mjs"
    exit 1
  fi

  if [ ! -f "${RELEASE_DIR}/dist/index.html" ]; then
    print_error "部署包缺少 dist/index.html"
    exit 1
  fi

  if [ ! -f "${RELEASE_DIR}/build/minix-server/index.mjs" ]; then
    print_error "部署包缺少 build/minix-server/index.mjs"
    exit 1
  fi

  ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
}

print_summary() {
  cat <<EOF
[OK] 已完成正式部署包拉取与解压

Release: ${RELEASE_TAG}
Repo: ${REPO_SLUG}
Current: ${CURRENT_LINK}
Release dir: ${RELEASE_DIR}

建议:
1. 常规正式部署请直接运行完整脚本:
   - sudo <repo>/scripts/deploy-release-on-server.sh ${RELEASE_TAG} [--domain <your-domain>]
2. 若仅做高级诊断或手动回滚，本脚本只负责拉包、校验、解压与切换 current
3. 操作手册见:
   - <repo>/DEPLOY_RUNBOOK.md

说明:
- 该脚本不会执行 npm run build、vite build 或 next build。
- legacy docker-compose / GHCR 仅保留 rollback-only 职责。
EOF
}

main() {
  if [ -z "$RELEASE_TAG" ]; then
    print_error "用法: $0 <release-tag>，例如: $0 v1.2.3"
    exit 1
  fi

  ensure_command gh
  ensure_command tar
  ensure_command sha256sum

  resolve_asset_name
  prepare_directories
  download_assets
  verify_bundle
  extract_bundle
  print_summary
}

main "$@"
