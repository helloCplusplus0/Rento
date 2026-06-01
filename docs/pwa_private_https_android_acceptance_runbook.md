# 私有 HTTPS 与 Android 真机 PWA 验证 Runbook

## 1. 文档职责
- 本文档只负责 `Ubuntu 24 + Nginx + mkcert + Android 真机` 的执行步骤与常见问题
- 部署口径以 [DEPLOYMENT.md](file:///home/dell/Projects/Rento/DEPLOYMENT.md) 为准
- 环境变量口径以 [ENVIRONMENT_GUIDE.md](file:///home/dell/Projects/Rento/ENVIRONMENT_GUIDE.md) 为准

## 2. 适用边界
- 当前方案只服务于受控私有网络内的技术验证与真机验收
- 正式支持矩阵不变：`Android + Chrome + HTTPS + NODE_ENV=production + NEXT_PUBLIC_ENABLE_PWA=1`
- 当前方案不扩展为公网发布、商业 CA 证书或应用商店分发

## 3. 执行步骤版
### 3.1 前置确认
- 宿主机为 Ubuntu 24，Android 真机与宿主机在同一局域网
- 当前项目可通过 `npm run build` 与 `npm run start` 正常启动
- `.env` 已补齐 `AUTH_SESSION_SECRET`、`ADMIN_USERNAME`、`ADMIN_PASSWORD_HASH`
- `.env`、`certs/`、`nginx/ssl/` 未作为版本控制主路径继续追踪

### 3.2 安装 mkcert
```bash
sudo apt update
sudo apt install -y mkcert libnss3-tools
mkcert -install
```

### 3.3 生成本地证书
```bash
mkdir -p ~/rento-local-certs
cd ~/rento-local-certs
mkcert 192.168.x.x localhost 127.0.0.1 rento.example.internal
```

- 证书与私钥只保留在宿主机私有目录
- 不要把证书文件复制进仓库路径

### 3.4 准备本地 HTTPS Nginx 模板变量
```bash
cp ./nginx/templates/rento-local-https.env.example ~/rento-local-https.env
```

- 至少修改以下字段：
- `PWA_LOCAL_HTTPS_SERVER_NAMES`
- `PWA_LOCAL_HTTPS_CERT_PATH`
- `PWA_LOCAL_HTTPS_KEY_PATH`
- `PWA_LOCAL_HTTPS_UPSTREAM_URL`

### 3.5 收口应用环境变量
```bash
NODE_ENV=production
NEXT_PUBLIC_ENABLE_PWA=1
NEXTAUTH_URL=https://192.168.x.x
ALLOWED_ORIGINS=https://192.168.x.x
```

- 若改用私有主机名，则把 `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS` 一起改为相同来源，例如 `https://rento.example.internal`

### 3.6 渲染并校验本地 HTTPS 配置
```bash
bash ./scripts/pwa-local-https-helper.sh render --nginx-env ~/rento-local-https.env --output ./nginx/runtime/rento-local-https.conf
bash ./scripts/pwa-local-https-helper.sh validate --env-file ./.env --nginx-env ~/rento-local-https.env
bash ./scripts/pwa-local-https-helper.sh checklist --env-file ./.env --nginx-env ~/rento-local-https.env
```

- `render` 负责生成 Nginx 最终配置
- `validate` 负责检查 HTTPS 来源、证书路径与构建前置条件
- `checklist` 负责输出仓库统一定义的连续验收顺序

### 3.7 构建并启动应用
```bash
npm run build
NEXT_PUBLIC_ENABLE_PWA=1 npm run start
```

- 不要直接执行裸 `next start`

### 3.8 启动本地 HTTPS Nginx
```bash
set -a && source ./.env && source ~/rento-local-https.env && set +a
docker compose -f docker-compose.local-https.yml config >/tmp/rento-local-https.compose.yaml
docker compose -f docker-compose.local-https.yml up -d local-https-nginx
```

### 3.9 导入 Android 根证书
- 将 `mkcert` 本地根证书导出到手机
- 在 Android 系统中执行“从存储安装证书”
- 若手机未信任该根证书，HTTPS 访问会失败或被浏览器标记为不安全

### 3.10 先做 smoke check
```bash
bash ./scripts/pwa-smoke-check.sh --base-url https://192.168.x.x
```

- 若宿主机 `curl` 未信任 mkcert 根证书，可临时追加 `CURL_CA_BUNDLE=/path/to/mkcert/rootCA.pem`

### 3.11 真机验收
- 使用 Android Chrome 访问 HTTPS 地址
- 确认 `/login` 可访问，登录成功
- 确认首页、房源、合同、账单主链可访问
- 确认存在安装入口，或 Chrome 菜单中存在“安装应用”
- 安装后确认以独立窗口打开
- 发布新版本后确认出现更新提示，并可切换到新版本
- 断网后确认新的导航请求进入 `/offline`

## 4. 常见问题版
### 4.1 PC Edge 可以安装，手机没有安装提示
- 先检查是否为 HTTPS
- 先检查手机是否已信任本地根证书
- 先检查浏览器是否为 Android Chrome
- 先检查 `NEXT_PUBLIC_ENABLE_PWA=1` 是否已在 production 构建中生效

### 4.2 手机能访问网页，但无法进入安装态
- 检查 `/manifest.json` 是否可访问
- 检查 `/sw.js` 是否可访问
- 检查 service worker 是否注册成功
- 检查当前环境是否满足安全上下文

### 4.3 更换代码后，真机还是旧页面
- 重新执行 `npm run build`
- 重新走统一入口 `npm run start`
- 清空站点缓存或取消注册旧的 service worker
- 关闭已安装窗口或浏览器标签页后重新打开

### 4.4 如何更换 IP 或主机名
1. 更新 `.env` 中的 `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS`
2. 更新 `~/rento-local-https.env` 中的 `PWA_LOCAL_HTTPS_SERVER_NAMES`
3. 若证书 SAN 不再覆盖新地址，重新执行 `mkcert`
4. 重新执行 `render -> validate -> smoke-check`
5. 再重启 `local-https-nginx`

### 4.5 如何最小回退到普通 Web
```bash
npm run build
NEXT_PUBLIC_ENABLE_PWA=0 npm run start
```

- 用户重新访问后，前端会注销 Rento 的 service worker，并退回普通 Web
- 如需彻底停止本地 HTTPS 验证，再移除宿主机本地 Nginx 配置与 mkcert 私有证书

## 5. 执行结论
- `Ubuntu 24 + Nginx + mkcert + Android 真机` 仍是当前最小、低成本、可解释的私有 HTTPS 验证方案
- 这份 runbook 只负责执行层细节，不改变 `phase05` 已冻结的支持矩阵与部署口径
