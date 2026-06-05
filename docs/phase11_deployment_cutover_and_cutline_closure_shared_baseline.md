# Phase11 Deployment Cutover And Cutline Closure Shared Baseline

## 当前状态
- `phase11` 的共享基线已完成当前轮产出，继续作为当前默认工作流的统一语义输入。
- 本文档直接建立在 `phase10` 已完成的长期数据访问层方案、查询分层、统一事务边界与迁移兼容边界之上。
- 本文档不替代 `architecture_plan` 的结构判断，也不替代 `dev_plan` 的任务拆分；它只负责冻结所有 `phase11-*` 子任务必须共同遵守的边界与词汇。
- 当前互链文档为 [phase11_deployment_cutover_and_cutline_closure_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md) 与 [phase11_deployment_cutover_and_cutline_closure_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md)。
- `phase11-02` 已把 `deploy/caddy/Caddyfile` 与 `deploy/systemd/rento-minix.service` 落位为正式部署资产基线；`phase11-03` 已把 `.env.example`、`scripts/health-check.sh` 与 `/api/health` 收口为统一环境与健康检查口径。后续子任务继续复用这些承接位而不再另起第二套部署入口。

## 一、文档目的
本文档用于冻结 `phase11-deployment-cutover-and-cutline-closure` 的共享判断标准，避免后续子任务分别从部署拓扑、环境变量、健康检查、发布门禁或 legacy 回滚基线视角出发，重新产出互相冲突的解释。

## 二、共享前提
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- `phase06-minix-replatform` 已完成完整路线图、模块分类与真相源切换冻结
- `phase07-app-shell-and-runtime-foundation` 已完成新应用壳、新运行时入口与旧运行线映射冻结
- `phase08-api-and-auth-foundation` 已完成统一 API 宿主、认证门禁、中间件链、错误处理与最小页面守卫冻结
- `phase09-domain-service-migration` 已完成共享领域服务、正式宿主、主链 smoke 与 compat wrapper 清单收口
- `phase10-data-access-and-migration-closure` 已完成长期数据访问层方案、查询分层、统一事务边界、迁移兼容项与 `phase11` 最小上游输入收口
- 当前根级真相源已切换到 `phase11-deployment-cutover-and-cutline-closure`

## 三、共享判断标准
- 默认优先冻结正式部署主线与 legacy 回滚基线，而不是继续让二者混写为同一入口。
- 默认优先让部署主线服务 `phase07~10` 已冻结的业务与运行时边界，而不是反向改写应用壳、API、领域服务与数据访问层。
- 默认优先补齐服务端预构建产物链，保证“云端不构建，只运行预构建产物”的部署底线真实成立。
- 默认优先让 `Caddy` 只承担公网入口职责，让 Hono 继续承担 `/api/*` 与 `dist/` 静态壳语义。
- 默认优先把环境模板、健康检查、发布门禁与回滚条件写成单一口径，而不是分散到脚本、文档和历史记忆中。
- 默认继续保持低复杂度、单仓库、单主线、单一真相源。

## 四、共享输入清单
### 4.1 正式上游输入
- `package.json`
- `scripts/start-minix.mjs`
- `scripts/dev-minix.mjs`
- `server/index.ts`
- `server/app.ts`
- `server/lib/static.ts`
- `server/lib/env.ts`
- `.env.example`
- `scripts/health-check.sh`
- `scripts/migrate-and-seed.sh`
- `DEPLOYMENT.md`

### 4.2 legacy 回滚输入
- `docker-compose.yml`
- `nginx/nginx.conf`
- `scripts/cloud-deploy.sh`
- `scripts/bootstrap-deploy-assets.sh`
- `scripts/start-entry.mjs`

### 4.3 顶层治理输入
- `AGENTS.md`
- `project_rules.md`
- `plan.md`
- `architecture_map.md`
- `docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md`
- `docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md`

## 五、统一词汇语义
### 5.1 正式部署主线
- 指 `Caddy + systemd + Hono + PostgreSQL` 这一条未来默认对外交付与运维的主路径
- 不等于“当前所有正式部署资产都已落地”
- 但等于：后续所有部署实现都必须以此为唯一真相源

### 5.2 legacy rollback baseline
- 指旧 `docker-compose + nginx + Next.js standalone` 容器化运行线
- 它仍是历史运行线与回滚参考
- 它不再是正式主线，也不再承担未来默认交付职责

### 5.3 cutover
- 指从 legacy 容器化运行线切换到正式新部署主线的过程
- cutover 必须同时满足：正式部署资产、健康检查、发布门禁、回滚条件四类要求

### 5.4 cutline closure
- 指把“正式主线是什么、legacy 基线保留到何时、何时允许退出 legacy 资产”这三类问题收口为单一答案
- 它不等同于“立即删除所有 legacy 资产”

### 5.5 发布门禁
- 指部署切线前必须共同满足的工程、运行和业务验证要求
- 本阶段最低共享门禁至少包括：
  - `npm run lint`
  - `npm run type-check`
  - `npm run build:minix`
  - `npm run audit:phase09:legacy-routes`
  - 条件允许时的 `npm run smoke:phase09:all`
  - `/api/health` 可用

## 六、正式部署拓扑共享口径
### 6.1 入口与进程
- `Caddy` 是唯一公网入口
- `systemd` 是唯一正式守护进程承接位
- Hono 是唯一正式应用进程
- Hono 只监听本机环回端口，例如 `127.0.0.1:3002`

### 6.2 前端与 API 托管
- Hono 继续统一承接：
  - `/api/*`
  - `dist/` 静态资源
  - SPA fallback
- `Caddy` 不复制第二套前端路由语义
- 不新增第二套 `nginx`、`caddy`、`compose` 并行正式入口

### 6.3 数据与迁移
- PostgreSQL 是唯一正式数据库主线
- `migrate deploy` 继续是正式迁移目标路径
- `db push` 只保留兼容兜底语义，不得重新包装为正式主路径
- `phase10` 已冻结的迁移兼容边界在 `phase11` 中继续原样继承

### 6.4 依赖边界
- 正式部署主线默认不再引入 `redis`
- `redis` 只允许继续存在于 legacy 回滚基线中
- 不允许为了部署便利重新引入第二套运行时、第二套 API 宿主或第二套数据库主线

## 七、环境变量共享口径
### 7.1 正式主变量
- `NODE_ENV=production`
- `NEXTAUTH_URL`
- `ALLOWED_ORIGINS`
- `AUTH_SESSION_SECRET`
- `DATABASE_URL`
- `MINIX_SERVER_HOST`
- `MINIX_SERVER_PORT`
- `MINIX_DIST_DIR`
- `CORS_ENABLED`
- `MAX_REQUEST_SIZE`
- `REQUEST_TIMEOUT`

### 7.2 兼容回退变量
- `NEXTAUTH_SECRET`
  - 仅保留历史兼容回退语义
  - 不得重新成为正式主变量

### 7.3 环境模板规则
- `.env.example` 是唯一共享模板
- `.env` 是服务器私有配置，不应提交到版本控制
- `NEXTAUTH_URL` 与 `ALLOWED_ORIGINS` 默认保持一致
- 任何环境变量变动都必须同步更新实现、模板、部署手册与阶段文档

## 八、健康检查与发布门禁共享口径
### 8.1 主健康入口
- `/api/health` 是唯一主健康入口
- `scripts/health-check.sh` 默认优先命中 `NEXTAUTH_URL`，未配置时回退到 `MINIX_SERVER_HOST:MINIX_SERVER_PORT` 上的 `/api/health`
- 其他更细粒度健康路径只作为辅助排障入口

### 8.2 正式验证要求
- 工程验证：`lint`、`type-check`、`build:minix`
- 路由与兼容验证：`audit:phase09:legacy-routes`
- 业务 smoke：条件允许时执行 `smoke:phase09:all`
- 运行验证：`/api/health`、登录页、房源/合同/账单主链可访问

### 8.3 禁止误读
- 不得把“文档已冻结”误读成“正式部署资产已全部落地”
- 不得把 legacy 容器化运行线继续表述成正式主线
- 不得把 `Rento-legacy` 仓库写成部署或回滚入口

## 九、允许路线
- 允许继续复用 `server/`、`src/minix/`、`scripts/start-minix.mjs` 与 `server/lib/env.ts` 作为正式部署主线的直接承接位
- 允许在后续 `/spec` 中继续围绕已落地的 `deploy/caddy/Caddyfile`、`deploy/systemd/rento-minix.service`、服务端产物链与正式健康检查脚本做收口
- 允许保留 legacy 容器化资产作为回滚基线，但必须明确其身份与退出条件

## 十、禁止路线
- 禁止在 `phase11` 中新增新的主链领域迁移范围
- 禁止在 `phase11` 中重写 UI 设计语言
- 禁止在 `phase11` 中重新打开 SQLite 正式支持选项
- 禁止在 `phase11` 中继续把 `redis` 放入正式部署主线
- 禁止通过切换 remote 到 `Rento-legacy` 来处理部署或运行故障

## 十一、统一验证要求
- 至少确认：
  - `docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md`
  - `docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md`
  - `docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md`
  三份文档已齐备并互相引用一致
- 至少确认顶层真相源已与三份 `docs/phase11_*` 的状态一致
- 至少确认正式部署主线、legacy 回滚基线、环境模板与发布门禁的边界已形成单一判断标准

## 十二、阶段结论
`phase11-deployment-cutover-and-cutline-closure` 的共享基线价值不在于“马上上线 Caddy + systemd”，而在于：

```text
先把正式部署主线、legacy 回滚基线、环境模板、健康检查与发布门禁的共享词汇冻结，
再让后续 /spec 和实现建立在单一部署真相之上。
```

这能确保：
- 不让 legacy 容器化运行线继续占据默认部署入口
- 不让源码运行被误读成已满足“预构建产物”底线
- 不让 `Caddy`、Hono 与健康检查口径再次出现多套解释
