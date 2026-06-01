# DEPLOYMENT.md

## 0. 文档职责
- 本文档只负责私有部署、PWA 验收、更新与回退
- 环境变量含义请看 [ENVIRONMENT_GUIDE.md](file:///home/dell/Projects/Rento/ENVIRONMENT_GUIDE.md)
- 首次启动命令请看 [QUICK_START.md](file:///home/dell/Projects/Rento/QUICK_START.md)

## 1. 部署定位
Rento 当前只面向受控私有部署，不面向公网开放注册或应用商店分发。`phase05-pwa-delivery-05` 的目标是把 PWA 交付闭环收口到“私有部署可安装、可更新、可回退、可验收”，而不是扩展为完整 DevOps 平台。

## 2. 正式支持矩阵
- 普通 Web 主线：受支持浏览器均可访问，前提是登录门禁、数据库与基础运行环境正常。
- 正式 PWA 交付：`Android + Chrome + HTTPS + NODE_ENV=production + NEXT_PUBLIC_ENABLE_PWA=1`
- 非正式支持环境：iOS、桌面浏览器、其他安卓浏览器、HTTP 非本地地址、开发态 `npm run dev`
- 退化原则：不满足正式支持矩阵时，Rento 必须继续作为普通响应式 Web 可用，但不计入 PWA 正式验收通过

## 3. 私有部署前提
- 使用私有 `.env`，不要把真实域名、密码、密钥回写到共享文档
- 若 `.env` 曾被 Git 追踪，先执行 `git rm --cached .env`，仅移除索引中的追踪状态，保留宿主机本地私有配置文件
- 若仓库历史上曾追踪过 `certs/` 或 `nginx/ssl/`，先执行 `git rm --cached -r certs nginx/ssl`，仅移除版本控制追踪状态，保留宿主机私有证书文件
- 至少补齐 `AUTH_SESSION_SECRET`、`ADMIN_PASSWORD_HASH`、`POSTGRES_PASSWORD`
- 正式 PWA 验收时，`NEXTAUTH_URL` 与 `ALLOWED_ORIGINS` 必须指向同一个 HTTPS 私有域名
- 必须保留最小登录门禁；PWA 不等于可以绕过鉴权
- 建议使用反向代理终止 HTTPS，并把应用固定在受控局域网或内网域名下
- 仍然禁止把当前后台当作公网匿名可访问产品部署

## 4. 部署路径
### 4.1 本地技术验证
```bash
cp .env.example .env
docker compose up --build -d
docker compose exec app /app/scripts/migrate-and-seed.sh
curl "http://localhost:${APP_PORT:-3001}/api/health"
```

- 若使用默认 `CONTAINER_PREFIX=rento`，`docker compose exec app ...` 等价于 `docker exec -it rento-app ...`
- 如使用 Podman，请替换为 `podman compose` / `podman-compose`
- 若修改 `APP_PORT`，请同步替换健康检查与浏览器访问地址，不要继续写死 `3001`
- `localhost` 只适用于技术验证，不作为 `phase05` 正式 PWA 验收环境
- 若要在不购买域名和公网证书的前提下完成私有 HTTPS 与 Android 真机 PWA 验证，请改走 [pwa_private_https_android_acceptance_runbook.md](file:///home/dell/Projects/Rento/docs/pwa_private_https_android_acceptance_runbook.md)

### 4.2 私有服务器源码实测
```bash
cp .env.example .env
npm ci
npx prisma generate
npm run lint
npm run type-check
npm run build
NODE_ENV=production npm run start
```

- 这是当前推荐的云服务器长期实测主线：直接运行当前源码，快速反馈真实问题
- 推荐把应用放在受控私有网络中，并通过 Nginx/Caddy/云负载均衡做 HTTPS 终止与反向代理
- 若反向代理启用 HTTPS，必须确保上游传递 `X-Forwarded-Proto=https`，以保持登录 Cookie 安全属性判断一致
- 正式实测前，至少确认 `/api/health`、`/login`、首页、房源、合同、账单主链可访问

### 4.3 私有服务器容器部署
```bash
chmod +x scripts/cloud-deploy.sh
./scripts/cloud-deploy.sh your-private-domain.example image
```

如需基于当前服务器源码构建容器，可改为：

```bash
./scripts/cloud-deploy.sh your-private-domain.example source
```

脚本当前负责最小容器部署辅助：
- 检测 Podman 或 Docker 及其 compose 入口
- 更新 `.env` 中的 `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS`
- 按 `source` 或 `image` 模式构建 / 拉取应用镜像
- 启动容器、执行数据库同步与健康检查
- 在启用 `USE_NGINX=true` 时额外拉起反向代理容器

这不是完整 DevOps 平台，也不负责公网 CDN、蓝绿发布、应用商店打包或多区域流量治理。

## 5. PWA 启用步骤
1. 在私有 `.env` 中设置 `NODE_ENV=production`
2. 将 `NEXTAUTH_URL` 设为 HTTPS 私有域名，例如 `https://rento.example.internal`
3. 将 `ALLOWED_ORIGINS` 收口为相同 HTTPS 来源
4. 显式设置 `NEXT_PUBLIC_ENABLE_PWA=1`
5. 完成构建与启动后，先验证 `/api/health`、`/manifest.json`、`/sw.js` 和 `/offline` 可访问
6. 再进入真机安装、更新与离线验收；详细执行链路统一见 [pwa_private_https_android_acceptance_runbook.md](file:///home/dell/Projects/Rento/docs/pwa_private_https_android_acceptance_runbook.md)

## 6. 生产启动说明
当前项目在 `next.config.ts` 中启用了 `output: 'standalone'`，因此生产启动口径固定为“构建后使用仓库统一入口”，不要直接执行裸 `next start`。

```bash
npm run build
NEXT_PUBLIC_ENABLE_PWA=1 npm run start
```

- `npm run start` 是当前唯一推荐的生产启动入口。
- 该入口会先校验 `.next` 是否为完整生产构建，再根据 `standalone` 产物自动补齐 `public` 与 `.next/static` 到 `.next/standalone`。
- 若存在 `.next/standalone/server.js`，统一入口会以 `node .next/standalone/server.js` 启动，并自动设置 `HOSTNAME=0.0.0.0`。
- 这样做的原因是：`standalone` 产物若缺少配套静态资源目录，浏览器可能出现“HTML 返回成功，但 `/_next/static/*` 资源 404/400 导致白屏”的假启动状态。
- 因此，后续无论是 PWA 验证还是普通生产验收，都应复用同一条 `npm run build -> npm run start` 主路径，避免形成第二套启动真相。

## 7. PWA 验收总览
### 7.1 核心检查项
- 安装入口可见：Chrome 可看到安装提示或菜单中的“安装应用”
- 安装成功：主屏生成 Rento 图标，并以独立窗口打开
- 登录可用：安装态下能进入 `/login` 并完成管理员登录
- 关键页面可用：首页、房源、合同、账单主链可访问
- 更新可见：发布新版本后，页面能出现“发现新版本”提示
- 更新生效：点击“立即更新”后页面刷新并切换到新版本
- 离线退化正确：断网后新的导航请求进入 `/offline`
- 失败退化可解释：关闭 PWA 或清除缓存后，仍能回到普通 Web 主线

### 7.2 最小自动化辅助
```bash
bash ./scripts/pwa-smoke-check.sh --base-url https://your-private-domain.example
```

- 该脚本只做最小烟雾检查，不替代真机安装、更新和离线验收
- 若当前目标是“在 Ubuntu 24 + Nginx + mkcert + Android 真机下完成私有 HTTPS 验收”，统一转到 [pwa_private_https_android_acceptance_runbook.md](file:///home/dell/Projects/Rento/docs/pwa_private_https_android_acceptance_runbook.md)

### 7.3 详细 Runbook
- 本地私有 HTTPS、mkcert、模板渲染、连续验收链路、真机问题排查统一以 [pwa_private_https_android_acceptance_runbook.md](file:///home/dell/Projects/Rento/docs/pwa_private_https_android_acceptance_runbook.md) 为真相源
