# Phase11 Deployment Cutover And Cutline Closure 架构规划

## 一、文档定位
本文档用于承接 `phase10-data-access-and-migration-closure` 完成后的下一阶段工作流，回答以下问题：

- 为什么 `phase11` 现在可以进入部署切线规划，而不是继续停留在旧容器化运行线
- 为什么正式部署主线固定为 `Caddy + systemd + Hono + PostgreSQL`
- 为什么 `Caddy` 只承担公网入口而不重复接管一套前端路由语义
- 为什么 `phase11` 必须先收口服务端预构建产物链，才能满足“云端不构建”的部署底线
- 为什么旧 `docker-compose + nginx + Next.js standalone` 运行线只能降级为 legacy 回滚基线

本文档不替代：

- [plan.md](file:///home/dell/Projects/Rento/plan.md) 的阶段顺序与当前结论职责
- [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md) 的入口摘要职责
- [phase11_deployment_cutover_and_cutline_closure_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md) 的子任务拆分职责
- [phase11_deployment_cutover_and_cutline_closure_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md) 的共享边界职责

## 当前文档状态
- 本文档已与 [phase11_deployment_cutover_and_cutline_closure_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md) 和 [phase11_deployment_cutover_and_cutline_closure_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md) 完成互链收口。
- `phase11` 当前已进入已批准 spec 的顺序实现；`phase11-02` 已补齐 `deploy/caddy/Caddyfile` 与 `deploy/systemd/rento-minix.service` 正式部署资产基线，`phase11-03` 已把 `.env.example`、`scripts/health-check.sh` 与 `/api/health` 收口到统一部署口径，`phase11-04` 已把 legacy 回滚资产清单、保留条件、退出条件与 `Rento-legacy` 边界同步到根级真相源与 `docs/phase11_*`。

## 二、当前阶段前提
### 2.1 已完成上游
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- `phase06-minix-replatform` 已完成完整路线图、模块分类与真相源切换冻结
- `phase07-app-shell-and-runtime-foundation` 已完成新应用壳、新运行时入口与旧运行线映射冻结
- `phase08-api-and-auth-foundation` 已完成统一 API 宿主、认证门禁、中间件链、错误处理与最小页面守卫收口
- `phase09-domain-service-migration` 已完成共享领域服务、正式宿主、主链 smoke 与 compat wrapper 清单收口
- `phase10-data-access-and-migration-closure` 已完成长期数据访问层方案、查询分层、统一事务边界、迁移兼容项与 `phase11` 最小上游输入收口

### 2.2 真实现状
- 当前完整可运行的部署入口仍是旧容器化运行线：
  - `docker-compose.yml`
  - `nginx/nginx.conf`
  - `scripts/cloud-deploy.sh`
  - `scripts/bootstrap-deploy-assets.sh`
  - `scripts/start-entry.mjs`
- 新主线运行时承接位已经存在：
  - `server/index.ts`
  - `server/app.ts`
  - `server/lib/static.ts`
  - `scripts/dev-minix.mjs`
  - `scripts/start-minix.mjs`
- 当前最大缺口不是运行时骨架，而是正式交付链：
  - `build:minix` 已产出前端 `dist/` 与服务端 `build/minix-server/`；`phase11-03` 已完成环境模板、健康检查与发布门禁的当前轮收口
  - `start:minix` 已切换为读取预构建产物的生产入口，后续需要与正式部署手册和 cutover 门禁保持一致
- `phase11-02` 已补齐正式部署资产基线：
  - `deploy/caddy/Caddyfile`
  - `deploy/systemd/rento-minix.service`
- 当前代码已经证明：
  - Hono 可以统一承接 `/api/*` 与 `dist/` 静态壳
  - `redis` 不再是当前新主线的正式运行依赖
  - `/api/health` 已是统一主健康入口

### 2.3 为什么现在进入 `phase11`
当前最合理的下一阶段是：

```text
phase11-deployment-cutover-and-cutline-closure
```

原因如下：

- `phase07~10` 已经把运行时、API、领域服务、数据访问层与迁移兼容边界冻结完毕，部署切线不再会反向决定业务边界。
- 若继续让正式部署主线停留在旧容器化运行线上，根级 `README.md`、`DEPLOYMENT.md` 与目标技术栈之间会长期失真。
- 当前最缺的不是新的业务能力，而是“哪条是正式部署主线、哪条是 legacy 回滚基线、什么情况下允许切线与回退”的单一解释。
- 先冻结部署拓扑、环境模板、发布门禁与回滚职责，才能让后续 `phase11-*` `/spec` 建立在清晰的上线口径之上。

### 2.4 外部资料校验
按当前阶段要求，已通过 Context7 核验与本阶段直接相关的官方资料，得到以下结论：

- `@hono/node-server` 官方支持以 Node 进程方式启动 Hono，并在进程退出时执行优雅停机；当前 `server/index.ts` 已与该方向一致。
- Prisma 官方继续将 `migrate deploy` 定位为 staging / production 等非开发环境的正式迁移入口；`db push` 不应承担正式迁移链职责。
- Caddy 官方支持以 `reverse_proxy` 承接公网入口，也支持 `file_server`；但当前仓库已在 Hono 中冻结 `dist/` 托管能力，因此无需再复制一套前端 fallback 语义。
- systemd 官方支持通过 `WorkingDirectory`、`EnvironmentFile`、`ExecStart` 与 `Restart` 等字段定义长期守护进程；这与本项目的单一 Hono 运行时目标匹配。

## 三、关键决策
### 3.1 正式部署主线：固定为 `Caddy + systemd + Hono + PostgreSQL`
选择原因：

- 该栈已经在根级真相源中冻结为目标技术栈。
- 新主线运行时、统一 API 宿主和 SPA 静态壳托管位都已经落在 `server/` 与 `src/minix/`，不需要引入第二套应用进程模型。
- 相比旧容器化运行线，它更符合“低配服务器、云端不构建、低 I/O、低维护负担”的项目目标。

本阶段结论：

- 正式部署主线固定为 `Caddy + systemd + Hono + PostgreSQL`
- `redis` 不进入正式部署主线
- legacy 容器化运行线继续保留回滚职责，但退出正式主入口地位

### 3.2 公网入口：`Caddy` 只做 HTTPS 与反向代理
选择原因：

- 当前 `server/app.ts` 与 `server/lib/static.ts` 已统一承接 `/api/*` 与 `dist/` 的应用语义。
- 若让 `Caddy` 再接管一套静态壳与 SPA fallback 规则，会产生第二套前端路由真相源。
- `Caddy` 在此阶段的最小职责应是：公网入口、证书、HTTPS、反向代理。

本阶段结论：

- `Caddy` 只负责 `80/443`、证书与反向代理到 Hono 内部端口
- Hono 保持对 `dist/` 静态壳与 `/api/*` 的应用级托管职责
- 不新增第二套 nginx / caddy / compose 并存入口

### 3.3 应用进程：单一 `systemd` 服务托管 Hono Node 运行时
选择原因：

- 当前 `server/index.ts` 已具备单进程监听、优雅停机与正式 API/静态壳承接能力。
- 该模型最贴近“低复杂度、单主线、单一真相源”的项目治理原则。
- systemd 能直接提供守护、重启、状态查询与日志接入，不需要额外引入进程管理栈。

本阶段结论：

- 正式应用进程固定为单一 `systemd` 服务
- Hono 运行时只监听本机环回端口，例如 `127.0.0.1:3002`
- 正式部署不再依赖 `Next.js standalone` 或容器内网络转发

### 3.4 正式交付链：必须先补齐服务端预构建产物
选择原因：

- 在 `phase11-01` 前，`build:minix` 只执行 `vite build`，不能产出服务端运行所需 JS。
- 在 `phase11-01` 前，`scripts/start-minix.mjs` 仍通过源码入口启动，无法满足“云端不构建，只运行预构建产物”的冻结底线。
- 因此必须先收口服务端产物链，避免所谓部署切线只把源码运行迁到 systemd，而没有真正完成正式主线切换。

本阶段结论：

- 正式构建入口必须升级为“前端 + 服务端”联合产物链
- 正式生产启动入口必须切到已编译 JS 产物
- 开发态可继续保留 `dev:minix` 使用 `tsx watch`，不影响当前开发拓扑

### 3.5 环境变量、健康检查与发布门禁：必须统一成单一口径
选择原因：

- 在进入 `phase11-03` 前，`.env.example` 仍偏向旧容器化部署模板，与新主线正式部署方向不一致。
- `/api/health` 已经是统一主健康入口，必须被正式部署手册、脚本与发布门禁共同引用。
- 如果阶段切线不同时收口环境变量、健康检查与发布门禁，后续实施会再次出现文档、脚本、运行口径漂移。

本阶段结论：

- `.env.example` 必须升级为正式新主线模板
- `/api/health` 继续作为主健康入口
- 正式发布门禁至少包括：`lint`、`type-check`、`build:minix`、`audit:phase09:legacy-routes` 与主链 smoke
- 当前实现已把 `.env.example`、`scripts/health-check.sh` 与正式部署手册对齐到上述口径

### 3.6 legacy 运行线：显式降级为回滚基线
选择原因：

- 旧容器化运行线仍可运行，直接删除会丢失已知可用的回滚路径。
- 但若继续让其占据默认部署说明，就会让正式部署主线长期无法形成单一真相源。
- `Rento-legacy` 仓库只承担历史备份职责，不适合作为运行回滚入口。

本阶段结论：

- `docker-compose.yml`、`nginx/nginx.conf`、`scripts/cloud-deploy.sh`、`scripts/bootstrap-deploy-assets.sh`、`scripts/start-entry.mjs` 与历史容器化镜像/容器/`nginx`/`redis` 变量口径继续保留，但身份明确降级为 legacy rollback baseline
- legacy 线的回滚职责边界、保留条件与退出条件已写入 `phase11` 文档，并固定为“历史运行参考 + 故障回滚 + 差异对照”
- 不通过切换 remote 到 `Rento-legacy` 来处理部署或运行问题
- 只有在正式部署主线、发布门禁、部署演练与回滚验证全部完成并通过审核，且替代真相源与回滚记录冻结后，legacy 基线才允许进入后续退出决策

## 四、承接资产与实现边界
### 4.1 允许直接承接的资产
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
- `docker-compose.yml`
- `nginx/nginx.conf`
- `scripts/cloud-deploy.sh`
- `scripts/bootstrap-deploy-assets.sh`
- `scripts/start-entry.mjs`
- `DEPLOYMENT.md`
- `deploy/caddy/Caddyfile`
- `deploy/systemd/rento-minix.service`

### 4.2 允许做的事
- 冻结正式部署拓扑、服务端产物链、环境模板、健康检查与发布门禁
- 冻结 legacy 回滚基线、cutline 退出条件与 `Rento-legacy` 的职责边界
- 为后续 `phase11-*` `/spec` 提供可直接顺序消费的实施蓝图

### 4.3 暂不做的事
- 不新增新的主链领域服务迁移范围
- 不重做 UI 设计语言
- 不改变 `phase10` 已冻结的迁移兼容边界
- 不直接删除 legacy 运行资产
- 不在本轮文档阶段直接落地正式部署脚本或配置文件

## 五、目标结构
### 5.1 正式部署主线承接位
`phase11` 中正式部署主线的目标结构固定为：

```text
公网入口：Caddy
应用进程：systemd -> Hono runtime
前端与 API：server/app.ts + server/lib/static.ts
部署资产：deploy/caddy/Caddyfile + deploy/systemd/rento-minix.service
数据库：PostgreSQL
健康检查：/api/health
```

### 5.2 服务端产物链承接位
`phase11` 的正式交付链将围绕以下现有承接位收口：

```text
package.json
scripts/start-minix.mjs
server/index.ts
server/app.ts
server/lib/static.ts
server/lib/env.ts
```

### 5.3 legacy 回滚基线承接位
legacy 回滚基线继续收口在：

```text
docker-compose.yml
nginx/nginx.conf
scripts/cloud-deploy.sh
scripts/bootstrap-deploy-assets.sh
scripts/start-entry.mjs
```

补充冻结说明：
- 以上资产只继续承担历史运行参考、故障回滚与新旧运行线差异对照职责
- 它们不再作为默认部署入口、默认运维入口或正式真相源
- 本阶段只冻结保留条件与退出条件，不直接删除这些资产

## 六、阶段结论
`phase11-deployment-cutover-and-cutline-closure` 的价值不在于“立即上线正式部署栈”，而在于：

```text
先把正式部署主线、服务端产物链、环境模板、健康检查、发布门禁与 legacy 回滚职责冻结，
再让后续 /spec 和实现建立在单一部署真相之上。
```

这能确保：
- 不让旧容器化运行线继续冒充正式部署主线
- 不让源码运行继续被误读为“云端只跑预构建产物”
- 不让 `Caddy`、Hono 与静态壳托管形成多套路由真相源
- 不让切线与回滚口径继续依赖口头约定或历史记忆
