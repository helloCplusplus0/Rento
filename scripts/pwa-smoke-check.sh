#!/bin/bash
set -euo pipefail

BASE_URL="${NEXTAUTH_URL:-http://localhost:${APP_PORT:-${APP_INTERNAL_PORT:-3001}}}"
TIMEOUT="${TIMEOUT:-10}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

detect_curl_ca_bundle() {
  [[ "$BASE_URL" =~ ^https:// ]] || return 0

  if [[ -n "${CURL_CA_BUNDLE:-}" && -f "${CURL_CA_BUNDLE}" ]]; then
    return 0
  fi

  if [[ -x "${HOME}/.local/bin/mkcert" ]]; then
    local mkcert_caroot
    mkcert_caroot="$("${HOME}/.local/bin/mkcert" -CAROOT 2>/dev/null || true)"

    if [[ -n "$mkcert_caroot" && -f "${mkcert_caroot}/rootCA.pem" ]]; then
      export CURL_CA_BUNDLE="${mkcert_caroot}/rootCA.pem"
      note "Detected mkcert root CA for local HTTPS smoke checks: ${CURL_CA_BUNDLE}"
    fi
  fi
}

show_usage() {
  cat <<'EOF'
Usage: bash ./scripts/pwa-smoke-check.sh [options]

Options:
  --base-url URL   Base URL to check. Defaults to NEXTAUTH_URL or localhost.
  --timeout SEC    Curl timeout in seconds. Defaults to 10.
  -h, --help       Show this help message.

This script is a minimal smoke check for phase05 PWA delivery.
It does not replace Android + Chrome + HTTPS device acceptance.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      show_usage
      exit 1
      ;;
  esac
done

BASE_URL="${BASE_URL%/}"

note() {
  printf '[INFO] %s\n' "$1"
}

pass() {
  printf '[PASS] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1" >&2
  exit 1
}

assert_contains() {
  local haystack="$1"
  local pattern="$2"
  local message="$3"

  if echo "$haystack" | grep -Eiq "$pattern"; then
    pass "$message"
  else
    fail "$message"
  fi
}

check_base_url() {
  if [[ "$BASE_URL" =~ ^https:// ]]; then
    pass "Base URL uses HTTPS: $BASE_URL"
    return
  fi

  if [[ "$BASE_URL" =~ ^http://(localhost|127\.0\.0\.1|\[::1\]|::1)(:[0-9]+)?$ ]]; then
    note "Base URL uses loopback HTTP. This is acceptable for local smoke checks only."
    return
  fi

  fail "Base URL must use HTTPS, or be localhost/127.0.0.1 for local smoke checks: $BASE_URL"
}

fetch_body() {
  local url="$1"
  curl -fsS --max-time "$TIMEOUT" "$url"
}

fetch_headers() {
  local url="$1"
  curl -fsSI --max-time "$TIMEOUT" "$url"
}

check_base_url
detect_curl_ca_bundle

note "Checking health endpoint"
health_body="$(fetch_body "$BASE_URL/api/health")"
assert_contains "$health_body" '"status":"(healthy|degraded|unhealthy)"' '/api/health responds with a recognized status'

note "Checking manifest"
manifest_body="$(fetch_body "$BASE_URL/manifest.json")"
assert_contains "$manifest_body" '"(name|short_name)"' 'manifest contains name or short_name'
assert_contains "$manifest_body" '"icons"' 'manifest contains icons'
assert_contains "$manifest_body" '192x192' 'manifest contains a 192x192 icon entry'
assert_contains "$manifest_body" '512x512' 'manifest contains a 512x512 icon entry'

note "Checking service worker"
sw_headers="$(fetch_headers "$BASE_URL/sw.js")"
assert_contains "$sw_headers" 'HTTP/[0-9.]+ 200' 'sw.js returns HTTP 200'
assert_contains "$sw_headers" 'Cache-Control: .*no-cache.*no-store.*must-revalidate' 'sw.js disables intermediary caching'
assert_contains "$sw_headers" 'Service-Worker-Allowed: /' 'sw.js exposes root service worker scope'

note "Checking offline fallback"
offline_body="$(fetch_body "$BASE_URL/offline")"
assert_contains "$offline_body" 'Rento' '/offline is reachable'

pass "Minimal PWA smoke check completed for $BASE_URL"
note "Next step: run Android + Chrome + HTTPS installation, update, offline fallback, and reinstall checks on a real device."
