#!/usr/bin/env bash
set -euo pipefail

# Rento 本地私有 HTTPS 验证辅助脚本
# 职责边界：
# - 负责渲染 Nginx 本地 HTTPS 模板
# - 负责校验 `.env` 与本地 HTTPS 来源是否一致
# - 负责串联“构建 -> 统一启动 -> compose-managed Nginx -> smoke check -> Android 真机验收”的最小执行提示
# 不负责：
# - 自动申请公网证书
# - 自动修改 system nginx 配置
# - 自动启动长期后台进程

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_ENV_FILE="${PROJECT_DIR}/.env"
DEFAULT_NGINX_TEMPLATE="${PROJECT_DIR}/nginx/templates/rento-local-https.conf.template"
DEFAULT_RENDER_OUTPUT="${PROJECT_DIR}/nginx/runtime/rento-local-https.conf"

APP_ENV_FILE="${DEFAULT_ENV_FILE}"
NGINX_ENV_FILE=""
TEMPLATE_FILE="${DEFAULT_NGINX_TEMPLATE}"
OUTPUT_FILE=""

usage() {
  cat <<'EOF'
Usage:
  bash ./scripts/pwa-local-https-helper.sh <command> [options]

Commands:
  render      Render the local Nginx HTTPS template.
  validate    Validate .env and local HTTPS settings consistency.
  checklist   Print the minimal local acceptance path.

Options:
  --env-file PATH      App env file used by the project. Defaults to ./.env
  --nginx-env PATH     Local HTTPS template variable file.
  --template PATH      Nginx template path. Defaults to nginx/templates/rento-local-https.conf.template
  --output PATH        Output path for rendered Nginx config. Defaults to stdout.
  -h, --help           Show this help message.

Examples:
  bash ./scripts/pwa-local-https-helper.sh render --nginx-env ~/rento-local-https.env --output ./nginx/runtime/rento-local-https.conf
  bash ./scripts/pwa-local-https-helper.sh validate --env-file ./.env --nginx-env ~/rento-local-https.env
  bash ./scripts/pwa-local-https-helper.sh checklist --env-file ./.env --nginx-env ~/rento-local-https.env
EOF
}

note() {
  printf '[INFO] %s\n' "$1"
}

pass() {
  printf '[PASS] %s\n' "$1"
}

warn() {
  printf '[WARN] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1" >&2
  exit 1
}

trim_whitespace() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

is_project_file_tracked() {
  local file_path="$1"
  local relative_path

  [[ -f "$file_path" ]] || return 1
  relative_path="$(realpath --relative-to="$PROJECT_DIR" "$file_path" 2>/dev/null)" || return 1

  git -C "$PROJECT_DIR" ls-files --error-unmatch -- "$relative_path" >/dev/null 2>&1
}

collect_tracked_sensitive_assets() {
  git -C "$PROJECT_DIR" ls-files | grep -E '(^\.env$)|(^\.env\.(local|development(\.local)?|production(\.local)?|test(\.local)?)$)|(^certs/)|(^nginx/ssl/)|(\.(pem|key|crt|p12)$)' || true
}

print_tracked_sensitive_assets() {
  local tracked_sensitive_assets="$1"

  [[ -n "$tracked_sensitive_assets" ]] || return 0

  printf '%s\n' "$tracked_sensitive_assets" | sed 's/^/  - /'
}

load_env_file() {
  local env_file="$1"

  [[ -n "$env_file" ]] || return 0
  [[ -f "$env_file" ]] || fail "找不到环境文件：$env_file"

  # shellcheck disable=SC1090
  set -a
  source "$env_file"
  set +a
}

parse_args() {
  COMMAND="${1:-}"
  [[ -n "${COMMAND}" ]] || {
    usage
    exit 1
  }

  shift || true

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --env-file)
        APP_ENV_FILE="$2"
        shift 2
        ;;
      --nginx-env)
        NGINX_ENV_FILE="$2"
        shift 2
        ;;
      --template)
        TEMPLATE_FILE="$2"
        shift 2
        ;;
      --output)
        OUTPUT_FILE="$2"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        fail "未知参数：$1"
        ;;
    esac
  done
}

ensure_nginx_vars() {
  [[ -n "${PWA_LOCAL_HTTPS_SERVER_NAMES:-}" ]] || fail '缺少 PWA_LOCAL_HTTPS_SERVER_NAMES'
  [[ -n "${PWA_LOCAL_HTTPS_CERT_PATH:-}" ]] || fail '缺少 PWA_LOCAL_HTTPS_CERT_PATH'
  [[ -n "${PWA_LOCAL_HTTPS_KEY_PATH:-}" ]] || fail '缺少 PWA_LOCAL_HTTPS_KEY_PATH'
  [[ -n "${PWA_LOCAL_HTTPS_UPSTREAM_URL:-}" ]] || fail '缺少 PWA_LOCAL_HTTPS_UPSTREAM_URL'
  PWA_LOCAL_HTTPS_HTTP_LISTEN_PORT="${PWA_LOCAL_HTTPS_HTTP_LISTEN_PORT:-80}"
  PWA_LOCAL_HTTPS_HTTPS_LISTEN_PORT="${PWA_LOCAL_HTTPS_HTTPS_LISTEN_PORT:-443}"
}

render_template() {
  load_env_file "$NGINX_ENV_FILE"
  ensure_nginx_vars
  [[ -f "$TEMPLATE_FILE" ]] || fail "找不到 Nginx 模板：$TEMPLATE_FILE"

  local rendered
  rendered="$(
    TEMPLATE_FILE="$TEMPLATE_FILE" python3 <<'PY'
from pathlib import Path
import os

template_path = Path(os.environ["TEMPLATE_FILE"])
template = template_path.read_text(encoding="utf-8")

replacements = {
    "__SERVER_NAMES__": os.environ["PWA_LOCAL_HTTPS_SERVER_NAMES"],
    "__CERT_PATH__": os.environ["PWA_LOCAL_HTTPS_CERT_PATH"],
    "__KEY_PATH__": os.environ["PWA_LOCAL_HTTPS_KEY_PATH"],
    "__UPSTREAM_URL__": os.environ["PWA_LOCAL_HTTPS_UPSTREAM_URL"],
    "__HTTP_LISTEN_PORT__": os.environ.get("PWA_LOCAL_HTTPS_HTTP_LISTEN_PORT", "80"),
    "__HTTPS_LISTEN_PORT__": os.environ.get("PWA_LOCAL_HTTPS_HTTPS_LISTEN_PORT", "443"),
}

for placeholder, value in replacements.items():
    template = template.replace(placeholder, value)

print(template, end="")
PY
  )"

  if [[ -n "$OUTPUT_FILE" ]]; then
    mkdir -p "$(dirname "$OUTPUT_FILE")"
    printf '%s' "$rendered" > "$OUTPUT_FILE"
    pass "已渲染 Nginx 配置：$OUTPUT_FILE"
  else
    printf '%s\n' "$rendered"
  fi
}

extract_origin() {
  local url="$1"
  python3 - "$url" <<'PY'
from urllib.parse import urlparse
import sys

value = sys.argv[1]
parsed = urlparse(value)
if not parsed.scheme or not parsed.netloc:
    raise SystemExit(1)

print(f"{parsed.scheme}://{parsed.netloc}")
PY
}

collect_nextauth_origin() {
  [[ -n "${NEXTAUTH_URL:-}" ]] || fail '缺少 NEXTAUTH_URL'
  extract_origin "$NEXTAUTH_URL" || fail "NEXTAUTH_URL 不是有效 URL：$NEXTAUTH_URL"
}

allowed_origins_include() {
  local target_origin="$1"
  local raw_origin
  local current_origin

  IFS=',' read -r -a allowed_origins <<< "${ALLOWED_ORIGINS:-}"
  for raw_origin in "${allowed_origins[@]}"; do
    current_origin="$(trim_whitespace "$raw_origin")"
    if [[ "$current_origin" == "$target_origin" ]]; then
      return 0
    fi
  done

  return 1
}

validate_env_alignment() {
  load_env_file "$APP_ENV_FILE"
  [[ -n "${NGINX_ENV_FILE}" ]] && load_env_file "$NGINX_ENV_FILE"

  [[ -n "${ALLOWED_ORIGINS:-}" ]] || fail '缺少 ALLOWED_ORIGINS'
  [[ -n "${NEXT_PUBLIC_ENABLE_PWA:-}" ]] || fail '缺少 NEXT_PUBLIC_ENABLE_PWA'

  local nextauth_origin
  nextauth_origin="$(collect_nextauth_origin)"

  [[ "$nextauth_origin" =~ ^https:// ]] || fail "本地 PWA HTTPS 验证要求 NEXTAUTH_URL 使用 HTTPS，当前为：$NEXTAUTH_URL"

  if [[ "$NEXT_PUBLIC_ENABLE_PWA" == "1" ]]; then
    pass 'NEXT_PUBLIC_ENABLE_PWA=1，满足受控环境 PWA 开关要求'
  else
    fail "NEXT_PUBLIC_ENABLE_PWA 必须为 1，当前为：$NEXT_PUBLIC_ENABLE_PWA"
  fi

  if allowed_origins_include "$nextauth_origin"; then
    pass "ALLOWED_ORIGINS 已包含 NEXTAUTH_URL 来源：$nextauth_origin"
  else
    fail "ALLOWED_ORIGINS 未收口到 NEXTAUTH_URL 来源：$nextauth_origin"
  fi

  if [[ -n "${PWA_LOCAL_HTTPS_SERVER_NAMES:-}" ]]; then
    if grep -Eq "(^|[[:space:]])$(printf '%s' "${nextauth_origin#https://}" | sed 's/[.[\*^$()+?{|]/\\&/g')([[:space:]]|$)" <<< "${PWA_LOCAL_HTTPS_SERVER_NAMES}"; then
      pass "Nginx server_name 已覆盖 NEXTAUTH_URL 主机：${nextauth_origin#https://}"
    else
      warn "Nginx server_name 未显式包含 ${nextauth_origin#https://}，请确认模板变量是否已更新"
    fi
  else
    warn '未提供 --nginx-env，已跳过 Nginx server_name 覆盖校验'
  fi

  if [[ -n "${PWA_LOCAL_HTTPS_CERT_PATH:-}" ]]; then
    [[ -f "${PWA_LOCAL_HTTPS_CERT_PATH}" ]] && pass "证书文件存在：${PWA_LOCAL_HTTPS_CERT_PATH}" || warn "证书文件不存在：${PWA_LOCAL_HTTPS_CERT_PATH}"
  fi

  if [[ -n "${PWA_LOCAL_HTTPS_KEY_PATH:-}" ]]; then
    [[ -f "${PWA_LOCAL_HTTPS_KEY_PATH}" ]] && pass "私钥文件存在：${PWA_LOCAL_HTTPS_KEY_PATH}" || warn "私钥文件不存在：${PWA_LOCAL_HTTPS_KEY_PATH}"
  fi

  if [[ -f "${PROJECT_DIR}/.next/BUILD_ID" ]]; then
    pass '检测到 .next/BUILD_ID，当前仓库存在生产构建产物'
  else
    warn '尚未检测到 .next/BUILD_ID；执行真机验收前请先运行 `npm run build`'
  fi

  if [[ -f "${PROJECT_DIR}/.next/standalone/server.js" ]]; then
    pass '检测到 standalone 产物，可继续沿统一启动入口验证'
  else
    warn '尚未检测到 .next/standalone/server.js；构建后请通过 `npm run start` 统一启动'
  fi

  if [[ -f "${DEFAULT_RENDER_OUTPUT}" ]]; then
    pass "检测到 compose 本地 HTTPS 渲染配置：${DEFAULT_RENDER_OUTPUT}"
  else
    warn "尚未检测到 compose 本地 HTTPS 渲染配置：${DEFAULT_RENDER_OUTPUT}；启动 local-https profile 前请先执行 render"
  fi

  local tracked_sensitive_assets
  tracked_sensitive_assets="$(collect_tracked_sensitive_assets)"

  if [[ -n "$tracked_sensitive_assets" ]]; then
    warn '检测到仍被 Git 跟踪的本地敏感资产：'
    print_tracked_sensitive_assets "$tracked_sensitive_assets"
    fail '请先执行 git rm --cached ... 清理 .env、certs/、nginx/ssl/ 或其他证书私钥追踪状态'
  else
    pass '未检测到被 Git 跟踪的 .env / certs / nginx/ssl / 证书私钥敏感资产'
  fi
}

print_checklist_prechecks() {
  local nextauth_origin

  note '执行 checklist 前置校验：'
  nextauth_origin="$(collect_nextauth_origin)"

  if [[ "$nextauth_origin" =~ ^https:// ]]; then
    pass "NEXTAUTH_URL 已使用 HTTPS，可用于本地私有 HTTPS 验收：$nextauth_origin"
  else
    fail "checklist 仅适用于本地私有 HTTPS 验收；NEXTAUTH_URL 必须为 HTTPS，当前为：$NEXTAUTH_URL"
  fi

  if [[ -z "${NEXT_PUBLIC_ENABLE_PWA:-}" ]]; then
    warn 'NEXT_PUBLIC_ENABLE_PWA 未设置；以下步骤仅作提示，执行 build/start 前必须显式改为 1'
  elif [[ "$NEXT_PUBLIC_ENABLE_PWA" == "1" ]]; then
    pass 'NEXT_PUBLIC_ENABLE_PWA=1，满足本地 PWA 验收前置条件'
  else
    warn "NEXT_PUBLIC_ENABLE_PWA!=1（当前为：$NEXT_PUBLIC_ENABLE_PWA）；以下步骤仅作提示，执行 build/start 前请先改为 1 并重新构建"
  fi

  if [[ -n "${ALLOWED_ORIGINS:-}" ]]; then
    if allowed_origins_include "$nextauth_origin"; then
      pass "ALLOWED_ORIGINS 已覆盖 NEXTAUTH_URL 来源：$nextauth_origin"
    else
      warn "ALLOWED_ORIGINS 尚未包含 NEXTAUTH_URL 来源：$nextauth_origin"
    fi
  else
    warn 'ALLOWED_ORIGINS 未设置；执行正式验收前请先与 NEXTAUTH_URL 收口到同一 HTTPS 来源'
  fi

  if [[ "$APP_ENV_FILE" == "${PROJECT_DIR}/.env" ]] && is_project_file_tracked "$APP_ENV_FILE"; then
    warn "当前 ${APP_ENV_FILE} 仍被 Git 跟踪；请先执行 git rm --cached .env，保留本地私有配置文件"
  fi

  local tracked_sensitive_assets
  tracked_sensitive_assets="$(collect_tracked_sensitive_assets)"
  if [[ -n "$tracked_sensitive_assets" ]]; then
    warn '当前仓库仍存在被 Git 跟踪的本地敏感资产；正式验收前请先清理以下路径：'
    print_tracked_sensitive_assets "$tracked_sensitive_assets"
    warn '推荐先执行 git rm --cached .env certs/server.conf certs/server.crt certs/server.key，并确认 nginx/ssl/ 未被跟踪'
  else
    pass '当前仓库未检测到被 Git 跟踪的 .env / certs / nginx/ssl / 证书私钥敏感资产'
  fi

  return 0
}

print_checklist() {
  load_env_file "$APP_ENV_FILE"
  [[ -n "${NGINX_ENV_FILE}" ]] && load_env_file "$NGINX_ENV_FILE"

  local base_url="${NEXTAUTH_URL:-https://replace-me}"
  local rendered_target="${OUTPUT_FILE:-${DEFAULT_RENDER_OUTPUT}}"
  local smoke_base_url="$base_url"

  if [[ -n "${PWA_LOCAL_HTTPS_HTTPS_LISTEN_PORT:-}" && "${PWA_LOCAL_HTTPS_HTTPS_LISTEN_PORT}" != "443" ]]; then
    smoke_base_url="$(
      BASE_URL="$base_url" HTTPS_PORT="${PWA_LOCAL_HTTPS_HTTPS_LISTEN_PORT}" python3 <<'PY'
from urllib.parse import urlparse
import os

base = os.environ["BASE_URL"]
port = os.environ["HTTPS_PORT"]
parsed = urlparse(base)
host = parsed.hostname or "127.0.0.1"
print(f"https://{host}:{port}")
PY
    )"
  fi

  print_checklist_prechecks
  note '最小连续执行路径如下：'
  printf '1. 渲染 compose 托管的本地 HTTPS Nginx 配置：bash ./scripts/pwa-local-https-helper.sh render --nginx-env %s --output %s\n' \
    "${NGINX_ENV_FILE:-~/rento-local-https.env}" \
    "$rendered_target"
  printf '2. 校验变量与来源：bash ./scripts/pwa-local-https-helper.sh validate --env-file %s%s\n' \
    "${APP_ENV_FILE}" \
    "${NGINX_ENV_FILE:+ --nginx-env ${NGINX_ENV_FILE}}"
  printf '3. 生产构建：npm run build\n'
  printf '4. 统一启动宿主机应用：NEXT_PUBLIC_ENABLE_PWA=1 npm run start\n'
  printf '5. 载入 compose 环境：set -a && source %s && source %s && set +a\n' \
    "${APP_ENV_FILE}" \
    "${NGINX_ENV_FILE:-~/rento-local-https.env}"
  printf '6. 校验 compose 配置：docker compose -f docker-compose.local-https.yml config >/tmp/rento-local-https.compose.yaml\n'
  printf '7. 启动 compose 托管 Nginx：docker compose -f docker-compose.local-https.yml up -d local-https-nginx\n'
  printf '8. 资源烟雾检查：bash ./scripts/pwa-smoke-check.sh --base-url %s\n' "$smoke_base_url"
  printf '9. Android 真机验收：Chrome 访问 %s，完成安装、更新、离线与移除重装验证\n' "$smoke_base_url"
  printf '10. 停止本地 HTTPS Nginx：docker compose -f docker-compose.local-https.yml stop local-https-nginx\n'
  note '若使用 Podman，请将 docker compose 替换为 podman compose 或 podman-compose，并继续复用同一份渲染配置。'
}

main() {
  parse_args "$@"

  case "$COMMAND" in
    render)
      render_template
      ;;
    validate)
      validate_env_alignment
      ;;
    checklist)
      print_checklist
      ;;
    *)
      usage
      fail "未知命令：$COMMAND"
      ;;
  esac
}

main "$@"
