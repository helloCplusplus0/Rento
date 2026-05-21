# Rento

Rento 是一个面向房东/运营者的私有化租赁管理后台，覆盖房源、租客、合同、账单、仪表与抄表管理。

## 当前状态
- 当前阶段：`phase03-consistency-hardening-*`
- 当前目标：在最小认证门禁稳定后，继续收口一致性、删除门禁和历史语义漂移。
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
podman exec -it rento-app /app/scripts/migrate-and-seed.sh
curl http://localhost:3001/api/health
```

如使用 Docker，请将 `podman-compose` / `podman` 替换为 `docker-compose` / `docker`。
- 首次启用门禁前，请在 `.env` 中补齐：
  - `AUTH_SESSION_SECRET`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD_HASH`

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
- 当前启动入口会阻止缺少以下关键变量的开发启动：
  - `DATABASE_URL`
  - `ADMIN_PASSWORD_HASH`
  - `AUTH_SESSION_SECRET` 或 `NEXTAUTH_SECRET`
- 宿主机开发必须让 `DATABASE_URL` / `REDIS_URL` 指向宿主机可访问地址，例如 `127.0.0.1`；容器内应用连接统一写入 `CONTAINER_DATABASE_URL` / `CONTAINER_REDIS_URL`。
- `ADMIN_USERNAME` 未显式配置时默认回退为 `admin`。
- 若使用局域网地址访问开发环境，请同步更新 `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS`。
- 健康检查脚本与基准脚本默认复用 `NEXTAUTH_URL` / `APP_PORT` / `APP_INTERNAL_PORT` 推导应用地址，不再维护额外 URL 配置。
- `MAX_REQUEST_SIZE` 当前按字节解析，应使用纯数字，如 `10485760`，不要写成 `10mb`。

更多运行说明见：`QUICK_START.md`、`ENVIRONMENT_GUIDE.md`、`DEPLOYMENT.md`。
