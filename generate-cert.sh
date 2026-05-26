#!/usr/bin/env bash
set -euo pipefail

# 生成兼容的自签名证书，用于技术级 HTTPS 调试。
# 正式的 Android + Chrome + HTTPS 验收仍优先使用 mkcert，并把证书保留在宿主机私有目录。

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_OUTPUT_DIR="${HOME}/rento-local-certs-selfsigned"
OUTPUT_DIR="${CERT_OUTPUT_DIR:-${DEFAULT_OUTPUT_DIR}}"
CERT_HOSTS="${CERT_HOSTS:-192.168.31.84,localhost,127.0.0.1}"
CERT_DAYS="${CERT_DAYS:-365}"

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

trim_whitespace() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

ensure_output_dir_is_private() {
  if [[ "$OUTPUT_DIR" == "$PROJECT_DIR"* ]]; then
    fail "CERT_OUTPUT_DIR 必须位于仓库外部，当前为：$OUTPUT_DIR"
  fi
}

build_subject_alt_names() {
  local san_entries=""
  local dns_index=1
  local ip_index=1
  local host

  IFS=',' read -r -a cert_hosts <<< "$CERT_HOSTS"
  for host in "${cert_hosts[@]}"; do
    host="$(trim_whitespace "$host")"
    [[ -n "$host" ]] || continue

    if [[ "$host" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
      san_entries+="IP.${ip_index} = ${host}"$'\n'
      ((ip_index += 1))
    else
      san_entries+="DNS.${dns_index} = ${host}"$'\n'
      ((dns_index += 1))
    fi
  done

  [[ -n "$san_entries" ]] || fail 'CERT_HOSTS 至少需要包含一个域名或 IP'
  printf '%s' "$san_entries"
}

main() {
  ensure_output_dir_is_private
  mkdir -p "$OUTPUT_DIR"

  local cert_conf="${OUTPUT_DIR}/server.conf"
  local cert_key="${OUTPUT_DIR}/server.key"
  local cert_crt="${OUTPUT_DIR}/server.crt"
  local primary_cn
  local san_entries

  primary_cn="$(trim_whitespace "${CERT_HOSTS%%,*}")"
  [[ -n "$primary_cn" ]] || fail '无法从 CERT_HOSTS 推导证书 Common Name'
  san_entries="$(build_subject_alt_names)"

  note "生成自签名证书，输出目录：$OUTPUT_DIR"

  openssl genrsa -out "$cert_key" 2048

  cat > "$cert_conf" <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = CN
ST = Beijing
L = Beijing
O = Rento Local HTTPS
OU = Development
CN = ${primary_cn}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
${san_entries}
EOF

  openssl req -new -x509 \
    -key "$cert_key" \
    -out "$cert_crt" \
    -days "$CERT_DAYS" \
    -config "$cert_conf" \
    -extensions v3_req

  note '证书扩展摘要：'
  openssl x509 -in "$cert_crt" -text -noout | grep -A 5 'X509v3 extensions'

  pass "证书已生成：$cert_crt"
  pass "私钥已生成：$cert_key"
  note '该证书仅适用于技术级调试，自签名证书仍会触发浏览器安全提示。'
  note '正式 Android 真机验收请优先使用 mkcert，并通过 nginx/templates/rento-local-https.env.example 引用宿主机私有证书路径。'
}

main "$@"
