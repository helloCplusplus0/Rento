# DEPLOYMENT.md

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

## 4. 本地与受控环境部署
### 4.1 本地技术验证
```bash
cp .env.example .env
podman-compose up -d
podman-compose exec app /app/scripts/migrate-and-seed.sh
curl "http://localhost:${APP_PORT:-3001}/api/health"
```

- 若使用默认 `CONTAINER_PREFIX=rento`，`podman-compose exec app ...` 等价于 `podman exec -it rento-app ...`
- 若修改 `APP_PORT`，请同步替换健康检查与浏览器访问地址，不要继续写死 `3001`
- `localhost` 只适用于技术验证，不作为 `phase05` 正式 PWA 验收环境
- 若要在不购买域名和公网证书的前提下完成私有 HTTPS 与 Android 真机 PWA 验证，请改走 [pwa_private_https_android_acceptance_runbook.md](file:///home/dell/Projects/Rento/docs/pwa_private_https_android_acceptance_runbook.md)
- 仓库内统一骨架固定为：
  - `docker-compose.local-https.yml`
  - `nginx/templates/rento-local-https.conf.template`
  - `nginx/templates/rento-local-https.env.example`
  - `scripts/pwa-local-https-helper.sh`

### 4.2 私有服务器部署
```bash
chmod +x scripts/cloud-deploy.sh
./scripts/cloud-deploy.sh your-private-domain.example
```

脚本当前只负责最小部署辅助：
- 检测 Podman 或 Docker
- 更新 `.env` 中的 `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS`
- 启动容器
- 执行数据库同步与健康检查

这不是完整 DevOps 平台，也不负责公网 CDN、蓝绿发布、应用商店打包或多区域流量治理。

## 5. PWA 启用步骤
1. 在私有 `.env` 中设置 `NODE_ENV=production`
2. 将 `NEXTAUTH_URL` 设为 HTTPS 私有域名，例如 `https://rento.example.internal`
3. 将 `ALLOWED_ORIGINS` 收口为相同 HTTPS 来源
4. 显式设置 `NEXT_PUBLIC_ENABLE_PWA=1`
5. 完成构建与启动后，先验证 `/api/health`、`/manifest.json`、`/sw.js` 和 `/offline` 可访问
6. 再进入 Android 真机安装与更新验收，不要把“服务已启动”误判成“PWA 已交付”

## 5.1 生产启动说明
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

## 6. Android + Chrome + HTTPS 安装步骤
1. 使用 Android 设备上的 Chrome 访问私有 HTTPS 地址并完成登录
2. 等待页面底部安装提示或使用 Chrome 菜单中的“安装应用”
3. 安装后从主屏图标重新打开 Rento，确认它以独立窗口运行
4. 验证首页、房源、合同、账单等关键页面可访问，且安装态与浏览器态复用同一套业务 UI
5. 断网后再次打开一个新导航请求，确认会落到 `/offline` 最小离线兜底，而不是伪装成业务数据离线可用

## 7. 更新、回退与失败退化
### 7.1 更新
- Rento 当前只缓存最小静态壳、图标、`manifest` 与 `/offline`
- 当新版本 `sw.js` 下载完成后，页面会显示“发现新版本”
- 点击“立即更新”后会向 waiting worker 发送 `SKIP_WAITING`，随后页面自动刷新
- 若用户始终停留在旧标签页，更新可能延后到下次可见性切换或重新进入应用时才被发现

### 7.2 最小回退
- 若需撤回 PWA 交付，优先发布一个 `NEXT_PUBLIC_ENABLE_PWA=0` 的新版本
- 用户重新访问页面后，前端会注销 Rento 的 service worker，系统退回普通响应式 Web
- 如已安装桌面图标仍保留，可要求用户关闭所有 Rento 窗口后重新打开；必要时移除旧图标再按普通 Web 访问

### 7.3 失败退化
- 若浏览器不支持统一安装提示，继续通过浏览器访问 Rento，不视为故障
- 若 `sw.js` 注册失败、缓存被清除或 HTTPS 失效，系统必须回退到普通 Web 主线
- 若遇到缓存异常，先清空站点数据或取消注册 `sw.js`，再重新访问；不要把业务数据错误与浏览器缓存问题混为一谈

## 8. 最小自动化辅助
在受控环境中，可先执行最小烟雾检查：

```bash
bash ./scripts/pwa-smoke-check.sh --base-url https://your-private-domain.example
```

该脚本只验证：
- `/api/health`
- `/manifest.json`
- `/sw.js`
- `/offline`
- `sw.js` 的 `Cache-Control` 与 `Service-Worker-Allowed` 头部

该脚本不替代真机安装、更新和离线兜底验收。
- 若当前目标是“在 Ubuntu 24 + Nginx + mkcert + Android 真机下完成私有 HTTPS 验收”，请同时参考 [pwa_private_https_android_acceptance_runbook.md](file:///home/dell/Projects/Rento/docs/pwa_private_https_android_acceptance_runbook.md)。
- 推荐先通过统一辅助入口收口本地模板、来源与验收顺序：

```bash
cp ./nginx/templates/rento-local-https.env.example ~/rento-local-https.env
git rm --cached .env 2>/dev/null || true
git rm --cached -r certs nginx/ssl 2>/dev/null || true
bash ./scripts/pwa-local-https-helper.sh render --nginx-env ~/rento-local-https.env --output ./nginx/runtime/rento-local-https.conf
bash ./scripts/pwa-local-https-helper.sh validate --env-file ./.env --nginx-env ~/rento-local-https.env
set -a && source ./.env && source ~/rento-local-https.env && set +a
docker compose -f docker-compose.local-https.yml config >/tmp/rento-local-https.compose.yaml
bash ./scripts/pwa-local-https-helper.sh checklist --env-file ./.env --nginx-env ~/rento-local-https.env
```

- `render` 负责生成 compose 托管本地 HTTPS Nginx 所需的最终配置文件 `./nginx/runtime/rento-local-https.conf`
- `validate` 会额外拦截仍被 Git 跟踪的 `.env` / `certs/` / `nginx/ssl/` / 证书私钥敏感资产，并校验 HTTPS 来源、证书路径、渲染配置与构建产物，不会自动改写系统配置
- `docker-compose.local-https.yml` 中的 `local-https-nginx` 只服务本地私有 HTTPS 验收：容器通过 host network 监听宿主机 `80/443`，并反代宿主机 `http://127.0.0.1:3001` 的 `npm run start` 入口
- `checklist` 会先执行前置校验：`NEXTAUTH_URL` 非 HTTPS 时直接失败，`NEXT_PUBLIC_ENABLE_PWA!=1` 或 `.env` 仍被 Git 跟踪时给出明确警告；随后再输出连续验收链路：`npm run build -> NEXT_PUBLIC_ENABLE_PWA=1 npm run start -> source .env + rento-local-https.env -> docker compose config -> docker compose up local-https-nginx -> pwa-smoke-check -> Android 真机安装/更新/离线验证`

## 9. 最小真机验收清单
以下项目必须在 `Android + Chrome + HTTPS` 环境完成，并逐项标记通过或不通过：

- 安装入口可见：Chrome 可看到安装提示或菜单中的“安装应用”
- 安装成功：主屏生成 Rento 图标，点击后以独立窗口打开
- 登录可用：安装态下能进入 `/login` 并完成管理员登录
- 关键页面可用：首页、房源、合同、账单至少各访问一次，无布局或导航阻断
- 更新可见：发布新版本后，页面能出现“发现新版本”提示
- 更新生效：点击“立即更新”后页面刷新并切换到新版本
- 离线退化正确：断网后新的导航请求进入 `/offline`，而不是展示过期业务数据
- 失败退化可解释：关闭 PWA 或清除缓存后，仍能通过普通浏览器路径访问系统
- 移除重装可行：删除主屏图标后再次安装，流程可重复执行

推荐的连续执行顺序为：

```text
render 本地 HTTPS compose 配置
-> validate .env / 证书路径 / rendered config / standalone 构建产物
-> npm run build
-> NEXT_PUBLIC_ENABLE_PWA=1 npm run start
-> set -a && source ./.env && source ~/rento-local-https.env && set +a
-> docker compose -f docker-compose.local-https.yml config
-> docker compose -f docker-compose.local-https.yml up -d local-https-nginx
-> bash ./scripts/pwa-smoke-check.sh --base-url https://your-private-origin
-> Android 真机执行安装 / 更新 / 离线 / 失败退化 / 移除重装验收
```

## 10. PostgreSQL 说明
- 当前主线数据库为 PostgreSQL
- 现有 Prisma schema 已固定为 PostgreSQL
- 历史迁移锁仍保留 SQLite 时代遗留，因此 `scripts/migrate-and-seed.sh` 当前保留两级兼容：
- 若 `migration_lock.toml` 仍指向 SQLite，则直接走 `prisma db push`
- 若 `migrate deploy` 在当前历史迁移链上失败，也会临时回退到 `prisma db push`
- 上述路径仅用于过渡期保证 PostgreSQL 环境按现状 schema 可启动，不代表现有 `prisma/migrations/` 已是正式 PostgreSQL 迁移基线
- 在完成 PostgreSQL 基线重建或 baseline resolve 验证前，不应移除该兼容分支

## 11. 常用命令
```bash
podman-compose ps
podman-compose logs -f
podman-compose restart
podman-compose down
```

如使用 Docker，请替换为对应的 `docker-compose` 命令。

## 12. 故障排查
### 健康检查失败
```bash
./scripts/health-check.sh
curl "http://localhost:${APP_PORT:-3001}/api/health"
```

- `/api/health` 是当前阶段唯一主健康入口，返回整体状态、子检查信号、性能快照和运行治理说明
- `/api/health/system`、`/api/health/bills` 仅用于更细粒度的问题定位，不替代主健康入口
- 主健康入口中 `healthy` / `degraded` / `unhealthy` 为统一整体状态；子检查固定使用 `pass` / `warn` / `fail`

### PWA 资源检查
```bash
bash ./scripts/pwa-smoke-check.sh --base-url https://your-private-domain.example
```

- 若脚本报告 `sw.js` 头部缺失，先检查 `next.config.ts` 中的 `Cache-Control` 与 `Service-Worker-Allowed`
- 若脚本通过但手机仍无法安装，优先排查 HTTPS 证书、Chrome 版本、是否为受支持浏览器，以及真机是否实际访问了 HTTPS 地址

### 错误日志定位
```bash
podman-compose logs app
tail -f "${LOG_DIR:-./logs}"/error-*.log
```

- `src/lib/error-logger.ts` 是当前阶段的主错误日志口径，API 主路径默认通过 `withApiErrorHandler` 接入
- `src/lib/error-tracker.ts` 保留为文件型兼容日志能力；只有显式接入的路径才会写入 `LOG_DIR`

### 数据库未就绪
```bash
podman-compose logs postgres
podman-compose restart postgres
```

### 应用容器异常
```bash
podman-compose logs app
```

## 13. 反向代理
如需启用 Nginx：
```bash
podman-compose --profile nginx up -d
```

证书与代理配置位于：
- `nginx/nginx.conf`
- `nginx/ssl/`

生产环境请使用正式证书，不要依赖开发用自签名材料。
