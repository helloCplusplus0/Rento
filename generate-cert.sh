#!/bin/bash

# 生成兼容的自签名SSL证书用于PWA测试
# 修复 ERR_SSL_KEY_USAGE_INCOMPATIBLE 错误

echo "🔐 生成PWA测试用的兼容SSL证书..."

# 创建证书目录
mkdir -p certs

# 生成私钥 (使用RSA 2048位)
openssl genrsa -out certs/server.key 2048

# 创建证书签名请求配置 (修复密钥用途)
cat > certs/server.conf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = CN
ST = Beijing
L = Beijing
O = Rento PWA Test
OU = Development
CN = 192.168.31.84

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 192.168.31.84
IP.1 = 127.0.0.1
IP.2 = 192.168.31.84
EOF

# 生成自签名证书 (一步完成，避免CSR问题)
openssl req -new -x509 -key certs/server.key -out certs/server.crt -days 365 -config certs/server.conf -extensions v3_req

# 验证证书
echo "🔍 验证证书信息..."
openssl x509 -in certs/server.crt -text -noout | grep -A 5 "X509v3 extensions"

echo "✅ SSL证书生成完成！"
echo "📁 证书位置: $(pwd)/certs/"
echo "🔑 私钥: server.key"
echo "📜 证书: server.crt"
echo ""
echo "🔧 修复内容:"
echo "- 修正了密钥用途 (keyUsage)"
echo "- 添加了数字签名支持"
echo "- 使用X.509v3扩展"
echo ""
echo "📱 使用说明:"
echo "1. 在手机浏览器中访问 https://192.168.31.84:3002"
echo "2. 接受安全警告（自签名证书）"
echo "3. 重新测试PWA功能"
echo ""
echo "⚠️  注意: 自签名证书会显示安全警告，这是正常现象"