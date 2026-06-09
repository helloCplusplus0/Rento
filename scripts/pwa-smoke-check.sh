#!/bin/bash
set -euo pipefail

BASE_URL="${NEXTAUTH_URL:-http://127.0.0.1:${MINIX_SERVER_PORT:-${APP_INTERNAL_PORT:-3002}}}"
TIMEOUT="${TIMEOUT:-10}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE="${PROFILE:-runtime-only}"
EXPECT_PWA_ENABLED="${EXPECT_PWA_ENABLED:-}"
EXPECT_HEALTH_STATUS="${EXPECT_HEALTH_STATUS:-}"

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
  --profile production-ready|runtime-only|pwa-disabled
                   Selects the default verification profile.
                   production-ready: PWA enabled + healthy health endpoint.
                   runtime-only: PWA enabled + relaxed health status contract.
                   pwa-disabled: PWA disabled + relaxed health status contract.
                   Defaults to runtime-only.
  --expect-pwa-enabled true|false
                   Overrides the profile-level PWA expectation.
  --expect-health-status healthy|degraded|unhealthy|any
                   Overrides the profile-level /api/health expectation.
  -h, --help       Show this help message.

This script is a minimal smoke check for phase15 Minix PWA parity.
It validates the pure Vite + Hono runtime and does not replace Android + Chrome + HTTPS device acceptance.
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
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --expect-pwa-enabled)
      EXPECT_PWA_ENABLED="$2"
      shift 2
      ;;
    --expect-health-status)
      EXPECT_HEALTH_STATUS="$2"
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

fetch_body_allow_http_error() {
  local url="$1"
  curl -sS --max-time "$TIMEOUT" "$url"
}

fetch_headers() {
  local url="$1"
  curl -fsSI --max-time "$TIMEOUT" "$url"
}

fetch_headers_allow_http_error() {
  local url="$1"
  curl -sSI --max-time "$TIMEOUT" "$url"
}

extract_first_asset_path() {
  local html="$1"
  echo "$html" | grep -Eo '/assets/[^"]+\.(js|css)' | head -n 1
}

check_base_url
detect_curl_ca_bundle

case "$PROFILE" in
  production-ready)
    EXPECT_PWA_ENABLED="${EXPECT_PWA_ENABLED:-true}"
    EXPECT_HEALTH_STATUS="${EXPECT_HEALTH_STATUS:-healthy}"
    ;;
  runtime-only)
    EXPECT_PWA_ENABLED="${EXPECT_PWA_ENABLED:-true}"
    EXPECT_HEALTH_STATUS="${EXPECT_HEALTH_STATUS:-any}"
    ;;
  pwa-disabled)
    EXPECT_PWA_ENABLED="${EXPECT_PWA_ENABLED:-false}"
    EXPECT_HEALTH_STATUS="${EXPECT_HEALTH_STATUS:-any}"
    ;;
  *)
    fail "--profile must be production-ready, runtime-only, or pwa-disabled"
    ;;
esac

case "$EXPECT_PWA_ENABLED" in
  true|false)
    ;;
  *)
    fail "--expect-pwa-enabled must be true or false"
    ;;
esac

case "$EXPECT_HEALTH_STATUS" in
  healthy|degraded|unhealthy|any)
    ;;
  *)
    fail "--expect-health-status must be healthy, degraded, unhealthy, or any"
    ;;
esac

note "Checking Minix runtime health endpoint"
health_body="$(fetch_body_allow_http_error "$BASE_URL/api/health")"
health_headers="$(fetch_headers_allow_http_error "$BASE_URL/api/health")"
expected_health_http_pattern='HTTP/[0-9.]+ 200'

if [[ "$EXPECT_HEALTH_STATUS" == "any" ]]; then
  assert_contains "$health_headers" 'HTTP/[0-9.]+ (200|503)' '/api/health returns a recognized HTTP status'
  assert_contains "$health_body" '"status":"(healthy|degraded|unhealthy)"' '/api/health body returns a recognized status'
else
  if [[ "$EXPECT_HEALTH_STATUS" == "unhealthy" ]]; then
    expected_health_http_pattern='HTTP/[0-9.]+ 503'
  fi

  assert_contains "$health_headers" "$expected_health_http_pattern" "/api/health returns the expected HTTP status for ${EXPECT_HEALTH_STATUS}"
  assert_contains "$health_body" "\"status\":\"${EXPECT_HEALTH_STATUS}\"" "/api/health body matches expected status ${EXPECT_HEALTH_STATUS}"
fi

note "Checking HTML shell delivery"
home_body="$(fetch_body "$BASE_URL/")"
home_headers="$(fetch_headers "$BASE_URL/")"
assert_contains "$home_headers" 'HTTP/[0-9.]+ 200' 'root document returns HTTP 200'
assert_contains "$home_headers" 'Cache-Control: .*no-cache' 'root document disables cache'
assert_contains "$home_body" 'rel="manifest"' 'root document links manifest'
assert_contains "$home_body" "name=\"rento-pwa-enabled\" content=\"${EXPECT_PWA_ENABLED}\"" 'root document exposes the expected PWA runtime flag'

note "Checking PWA manifest"
manifest_body="$(fetch_body "$BASE_URL/manifest.json")"
manifest_headers="$(fetch_headers "$BASE_URL/manifest.json")"
assert_contains "$manifest_headers" 'HTTP/[0-9.]+ 200' 'manifest.json returns HTTP 200'
assert_contains "$manifest_headers" 'Cache-Control: .*no-cache' 'manifest.json disables cache'
assert_contains "$manifest_headers" 'Content-Type: application/manifest\+json' 'manifest.json returns manifest content type'
assert_contains "$manifest_body" '"(name|short_name)"' 'manifest contains name or short_name'
assert_contains "$manifest_body" '"icons"' 'manifest contains icons'
assert_contains "$manifest_body" '192x192' 'manifest contains a 192x192 icon entry'
assert_contains "$manifest_body" '512x512' 'manifest contains a 512x512 icon entry'

note "Checking service worker delivery headers"
sw_headers="$(fetch_headers "$BASE_URL/sw.js")"
assert_contains "$sw_headers" 'HTTP/[0-9.]+ 200' 'sw.js returns HTTP 200'
assert_contains "$sw_headers" 'Cache-Control: .*no-cache.*no-store.*must-revalidate' 'sw.js disables intermediary caching'
assert_contains "$sw_headers" 'Service-Worker-Allowed: /' 'sw.js exposes root service worker scope'

note "Checking offline fallback"
offline_body="$(fetch_body "$BASE_URL/offline")"
assert_contains "$offline_body" 'Rento' '/offline is reachable'

note "Checking hashed asset caching"
asset_path="$(extract_first_asset_path "$home_body")"
if [[ -z "$asset_path" ]]; then
  fail 'root document exposes at least one /assets/* resource'
fi

asset_headers="$(fetch_headers "$BASE_URL$asset_path")"
assert_contains "$asset_headers" 'HTTP/[0-9.]+ 200' 'hashed asset returns HTTP 200'
assert_contains "$asset_headers" 'Cache-Control: .*max-age=31536000.*immutable' 'hashed asset uses immutable cache policy'

pass "Minimal Minix PWA smoke check completed for $BASE_URL"
note "Next step: run Android + Chrome + HTTPS installation, update, offline fallback, and reinstall checks on a real device."
