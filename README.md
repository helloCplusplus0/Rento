# Rento

Rento 是一个面向房东/运营者的私有化租赁管理后台，覆盖房源、租客、合同、账单、仪表与抄表管理。

## 当前状态
- 默认工作流：`真实场景验证与 fix 闭环`
- PWA 交付状态：`phase05-pwa-delivery-05-private-deployment-and-installation-readiness` 已完成文档与验收口径收口；正式 PWA 交付仅面向受控私有部署。
- 当前定位：自用优先、私有部署优先、移动端友好、UI 视觉风格冻结。
- 当前登录方式：最小管理员门禁，默认通过 `/login` 进入后台。

## 核心能力
- 房源管理：楼栋、房间、状态、批量操作
- 租客管理：资料、合同关联、详情展示
- 合同管理：创建、续租、退租、状态流转
- 账单管理：租金、水电费、账单明细、支付状态
- 仪表管理：一个房间支持多个仪表，抄表与账单联动
- 运维辅助：健康检查、数据一致性检查、部署脚本

## 关键约束
- 数据库主线固定为 PostgreSQL，不再恢复 SQLite 开发/同步双轨。
- 在鉴权落地前，禁止将系统作为公网匿名可访问后台部署。
- 当前 UI 设计为已确认资产，后续只做不破坏视觉结果的优化。
- 仪表历史数据必须长期保留，不能因解绑或更换仪表而丢失。

## 技术栈
- 前端：Next.js 15、React 19、TypeScript、Tailwind CSS 4
- 后端：Next.js App Router Route Handlers
- 数据层：Prisma 6、PostgreSQL
- 基础设施：Docker/Podman、Redis、Nginx（可选）

## 快速开始
```bash
cp .env.example .env
podman-compose up -d
podman-compose exec app /app/scripts/migrate-and-seed.sh
curl "http://localhost:${APP_PORT:-3001}/api/health"
```

如使用 Docker，请将 `podman-compose` / `podman` 替换为 `docker-compose` / `docker`。
- 若保持默认 `CONTAINER_PREFIX=rento`，`podman-compose exec app ...` 与 `podman exec -it rento-app ...` 等价。
- 若仓库历史上曾追踪过 `.env`，请先执行 `git rm --cached .env`；该命令只会把 `.env` 从 Git 索引中移除，不会删除你本地的私有配置文件。
- 首次启用门禁前，请在 `.env` 中补齐：
  - `AUTH_SESSION_SECRET`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD_HASH`
- 当前数据库主线固定为 PostgreSQL；`scripts/migrate-and-seed.sh` 中保留的 `db push` 仅用于兼容 SQLite 历史迁移链，不代表现有 Prisma 迁移目录已经完成 PostgreSQL 基线收口。

## 本地开发
推荐通过统一入口手动启动开发服务器，而不是直接执行裸 `next dev`：

```bash
cp .env.example .env
npm run dev:check
npm run dev
```

- `npm run dev:check` 只校验开发态运行上下文，不会启动服务器。
- `npm run dev:check` 会同时验证 `DATABASE_URL` 的真实连通性与认证是否有效。
- `npm run dev` 会先校验 `.env*` 中的关键变量，再启动 `next dev --port 3001`。
- `.env` 与 `.env.example` 现在统一作为唯一环境配置入口；宿主机开发与容器运行使用同一组键名，不再允许并列维护第二套真相。
- `phase05-pwa-delivery-03` 引入的最小 PWA / service worker 只会在受控环境显式开启：开发态默认不注册，避免缓存污染日常调试。
- 当前启动入口会阻止缺少以下关键变量的开发启动：
  - `DATABASE_URL`
  - `ADMIN_PASSWORD_HASH`
  - `AUTH_SESSION_SECRET` 或 `NEXTAUTH_SECRET`
- 宿主机开发必须让 `DATABASE_URL` / `REDIS_URL` 指向宿主机可访问地址，例如 `127.0.0.1`；容器内应用连接统一写入 `CONTAINER_DATABASE_URL` / `CONTAINER_REDIS_URL`。
- `ADMIN_USERNAME` 未显式配置时默认回退为 `admin`。
- 若使用局域网地址访问开发环境，请同步更新 `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS`。
- 健康检查脚本与基准脚本默认复用 `NEXTAUTH_URL` / `APP_PORT` / `APP_INTERNAL_PORT` 推导应用地址，不再维护额外 URL 配置。
- `MAX_REQUEST_SIZE` 当前按字节解析，应使用纯数字，如 `10485760`，不要写成 `10mb`。

## 运行治理入口
- 主健康入口：`/api/health`
- 辅助健康入口：`/api/health/system`、`/api/health/bills`
- 健康状态口径：整体状态固定为 `healthy` / `degraded` / `unhealthy`；主入口对子检查固定使用 `pass` / `warn` / `fail`
- 错误日志主线：`src/lib/error-logger.ts`，API 主链默认通过 `withApiErrorHandler` 接入
- 文件型兼容日志：`src/lib/error-tracker.ts`，按 `LOG_DIR` 写入结构化日志文件，仅作为辅助/兼容定位入口
- 基础性能指标主线：`src/lib/performance-monitor.ts`，当前最小输出集合通过 `/api/health` 的 `metrics.performance` 暴露

## 运行治理说明
- `./scripts/health-check.sh` 默认检查 `/api/health`，并把 `degraded` 视为“可用但需关注”的状态。
- `/api/health` 返回当前阶段统一的运行治理说明，包括主入口、辅助入口、错误日志主线和慢请求阈值。
- `SLOW_REQUEST_THRESHOLD` 控制慢请求判定阈值，默认 `2000` 毫秒。
- `MAX_PERFORMANCE_METRICS` 控制当前进程内保留的性能样本数量，默认 `1000`。
- `MEM_WARN_MB` / `MEM_FAIL_MB` 控制主健康入口的内存告警阈值。
- `LOG_DIR` 控制兼容型文件日志输出目录，默认 `./logs`。

## PWA 调试提示
- 使用 `NEXT_PUBLIC_ENABLE_PWA=1` 显式开启最小 PWA，仅建议在受控测试环境或私有部署生产环境使用。
- 当前 service worker 只缓存静态壳资源、`manifest`、图标与 `/offline`；不会缓存动态业务接口和鉴权态业务页面响应。
- 如需验证更新提示，建议先执行 `npm run build`，再通过统一入口 `npm run start` 启动应用后访问页面，再发布一个新的 `sw.js` 版本并重新打开页面。
- 当前项目启用了 `next.config.ts` 中的 `output: 'standalone'`；生产启动必须走仓库统一入口 `npm run start`，不要直接执行裸 `next start`。
- `npm run start` 会先校验 `.next` 是否为完整的生产构建；若缺少 `BUILD_ID` 或缺少生产静态资源，会直接失败并提示先执行 `npm run build`。
- 当检测到 `.next/standalone/server.js` 存在时，统一入口会自动补齐 `public` 与 `.next/static` 到 `standalone` 运行目录，再以 `node .next/standalone/server.js` 启动，避免出现“HTML 能打开但 `/_next/static/*` 404/400 导致白屏”的假启动状态。
- 如怀疑旧缓存干扰行为，可在浏览器 DevTools 中取消注册 `sw.js` 并清空站点缓存。

## PWA 私有交付说明
- 正式支持环境固定为：`Android + Chrome + HTTPS + NODE_ENV=production + NEXT_PUBLIC_ENABLE_PWA=1`，并要求部署在受控私有网络与最小登录门禁之后。
- `localhost` / `127.0.0.1` 仅可用于本地技术验证；它能帮助确认 `manifest`、`sw.js` 与更新提示是否工作，但不算 `phase05` 的正式交付验收通过。
- iOS、桌面浏览器和其他移动浏览器只保留最小兼容或说明路径，不承诺一致安装体验；若浏览器不支持统一安装提示，Rento 必须继续按普通响应式 Web 可用。
- 即使某些浏览器在只依赖 `manifest` 的情况下仍允许“安装网站”，Rento 的正式交付口径仍要求显式启用 `NEXT_PUBLIC_ENABLE_PWA=1`，以保证最小 service worker、更新提示与离线兜底路径完整可解释。

## Android 安装步骤
1. 使用 Chrome 打开受控私有部署地址，例如 `https://rento.example.internal`，先确认可以正常访问 `/login` 并完成登录。
2. 等待地址栏或页面中的安装提示出现；若页面底部出现“安装 Rento 到桌面”，点击“立即安装”，或从 Chrome 菜单中选择“安装应用”。
3. 安装完成后，从安卓主屏图标重新打开 Rento，确认它以独立窗口启动，并继续复用同一套业务界面。
4. 至少复核首页、房源、合同、账单和离线兜底页入口在安装态与浏览器态都能正常访问。

## 更新与回退
- 当前更新策略只覆盖最小静态壳、图标、`manifest` 与 `/offline`；当新版本 `sw.js` 被发现后，页面会显示“发现新版本”，点击“立即更新”会触发 `skipWaiting` 并自动刷新到新版本。
- 若用户长时间停留在旧标签页，新 service worker 可能先进入 `waiting`；此时先点击页面更新提示，若仍未生效，关闭所有 Rento 标签页或已安装窗口后重新打开。
- 若怀疑缓存异常，可在 Chrome DevTools 中取消注册 `sw.js`、清空站点缓存后重新访问；这属于受控回退手段，不会影响 PostgreSQL 中的业务数据。
- 最小回退路径是发布一个 `NEXT_PUBLIC_ENABLE_PWA=0` 的新版本。用户重新访问后，前端会注销 Rento 的 service worker，使系统退回普通响应式 Web 主线；这不是“公网分发回退”，而是私有部署内的最小退化方案。

## 最小验收入口
- 部署与 HTTPS 前提见：`DEPLOYMENT.md`
- 环境变量与私有部署口径见：`ENVIRONMENT_GUIDE.md`
- 若需在不购买域名和公网证书的前提下完成私有 HTTPS + Android 真机验证，优先复用以下仓库资产：
  - `docker-compose.local-https.yml`
  - `nginx/templates/rento-local-https.conf.template`
  - `nginx/templates/rento-local-https.env.example`
  - `scripts/pwa-local-https-helper.sh`
  - 详细说明见 [pwa_private_https_android_acceptance_runbook.md](file:///home/dell/Projects/Rento/docs/pwa_private_https_android_acceptance_runbook.md)
- 推荐先把模板变量复制到宿主机私有路径，再渲染 compose 托管的本地 HTTPS Nginx 配置：

```bash
cp ./nginx/templates/rento-local-https.env.example ~/rento-local-https.env
git rm --cached .env 2>/dev/null || true
git rm --cached -r certs nginx/ssl 2>/dev/null || true
bash ./scripts/pwa-local-https-helper.sh render --nginx-env ~/rento-local-https.env --output ./nginx/runtime/rento-local-https.conf
bash ./scripts/pwa-local-https-helper.sh validate --env-file ./.env --nginx-env ~/rento-local-https.env
set -a && source ./.env && source ~/rento-local-https.env && set +a
docker compose -f docker-compose.local-https.yml config >/tmp/rento-local-https.compose.yaml
```

- `docker-compose.local-https.yml` 中的 `local-https-nginx` 只服务本地私有 HTTPS 验收：它通过 host network 反代宿主机 `http://127.0.0.1:3001` 的统一启动入口；若 rootless Podman 无法绑定 80/443，可把模板变量中的监听端口改为 8080/8443，不改动现有生产 `nginx` 服务路径
- `certs/` 与 `nginx/ssl/` 只允许作为宿主机私有路径或历史迁移对象存在，不再作为仓库内长期资产；若历史提交中仍追踪过这些路径，先执行 `git rm --cached -r certs nginx/ssl`
- `scripts/pwa-local-https-helper.sh checklist --env-file ./.env --nginx-env ~/rento-local-https.env` 现在会先执行前置校验，并输出 `render -> npm run start -> docker compose config -> docker compose up local-https-nginx -> pwa-smoke-check` 的连续验收链路
- 受控环境下可先运行 `bash ./scripts/pwa-smoke-check.sh --base-url https://your-private-domain` 做资源与头部的最小烟雾检查
- 若宿主机 `curl` 尚未信任 mkcert 根证书，可临时使用 `CURL_CA_BUNDLE=/home/dell/.local/share/mkcert/rootCA.pem bash ./scripts/pwa-smoke-check.sh --base-url https://127.0.0.1:18443` 进行高位端口 smoke
- 正式发布前仍需按 `DEPLOYMENT.md` 中的真机清单，在 `Android + Chrome + HTTPS` 环境完成安装、更新、离线兜底和移除重装验收

更多运行说明见：`QUICK_START.md`、`ENVIRONMENT_GUIDE.md`、`DEPLOYMENT.md`。
