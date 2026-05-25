# Rento

Rento 是一个面向房东/运营者的私有化租赁管理后台，覆盖房源、租客、合同、账单、仪表与抄表管理。

## 当前状态
- 当前阶段：`phase04-performance-and-ops-03-observability-and-health-hardening`
- 当前目标：在查询性能完成首轮收口后，统一健康检查、错误日志与基础性能指标口径，降低问题定位对隐性知识的依赖。
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
- 如需验证更新提示，建议在 `npm run build && npm run start` 后访问应用，再发布一个新的 `sw.js` 版本并重新打开页面。
- 如怀疑旧缓存干扰行为，可在浏览器 DevTools 中取消注册 `sw.js` 并清空站点缓存。

更多运行说明见：`QUICK_START.md`、`ENVIRONMENT_GUIDE.md`、`DEPLOYMENT.md`。
