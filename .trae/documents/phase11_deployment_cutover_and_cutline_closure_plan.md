# phase11-deployment-cutover-and-cutline-closure /plan

## Summary
- 目标：为 `phase11-deployment-cutover-and-cutline-closure` 冻结一套可审核、可执行、可回滚的部署主线规划，使 `Rento-miniX` 从当前旧 `Next.js + docker-compose + nginx` 存量运行线，切换到文档已冻结的 `React + Vite + Hono + PostgreSQL + Caddy + systemd` 正式部署主线。
- 本轮 `/plan` 只产出文档与设计，不直接改实现；实现阶段必须建立在本计划审核通过之后。
- 本轮计划的核心决策是：
  - 正式公网入口由 `Caddy` 承担 HTTPS 与反向代理。
  - 单一业务进程由 `systemd` 托管，运行 `Rento-miniX` 的 Hono Node 运行时。
  - `Hono` 继续承接 `/api/*` 与 `dist/` 静态壳托管，`Caddy` 不额外复制前端路由语义。
  - PostgreSQL 是唯一正式数据库主线；`phase10` 已冻结的 `migrate deploy` 正式目标、`db push` 兼容兜底边界必须原样继承。
  - 旧 `docker-compose + nginx + Next.js standalone` 运行线只保留为历史运行线与回滚基线，不再继续扩写为未来正式主线。

## Current State Analysis

### 1. 阶段与治理现状
- `phase11` 目前只在 [plan.md](file:///home/dell/Projects/Rento/plan.md#L177-L189) 中定义为待启动阶段，仓库内尚不存在任何 `docs/phase11_*` 正式阶段文档。
- 顶层真相源仍明确：`phase10` 已完成当前轮收口并作为 `phase11` 上游输入，部署主线切换必须后置，不得反向干扰 `phase07~10` 已冻结边界，见 [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md)、[project_rules.md](file:///home/dell/Projects/Rento/project_rules.md)、[architecture_map.md](file:///home/dell/Projects/Rento/architecture_map.md)。
- 规则要求：当用户发起新的 `/plan`，必须先同步顶层规范文档，再产出阶段级 `architecture_plan`、`dev_plan` 与必要的 `shared_baseline`，文档产出后停下等待审核。

### 2. 当前存量部署线
- 当前唯一完整可运行的部署手册仍是 [DEPLOYMENT.md](file:///home/dell/Projects/Rento/DEPLOYMENT.md)，其内容明确写明自己描述的是旧容器化运行线，而非 `Rento-miniX` 未来正式部署主线。
- 存量运行线的资产集合已冻结为：
  - [docker-compose.yml](file:///home/dell/Projects/Rento/docker-compose.yml)
  - [nginx/nginx.conf](file:///home/dell/Projects/Rento/nginx/nginx.conf)
  - [scripts/cloud-deploy.sh](file:///home/dell/Projects/Rento/scripts/cloud-deploy.sh)
  - [scripts/bootstrap-deploy-assets.sh](file:///home/dell/Projects/Rento/scripts/bootstrap-deploy-assets.sh)
  - [scripts/health-check.sh](file:///home/dell/Projects/Rento/scripts/health-check.sh)
  - [.env.example](file:///home/dell/Projects/Rento/.env.example)
- 该链路仍绑定旧宿主与容器化资产：
  - `app + postgres + redis + nginx` 四容器
  - `Dockerfile` 生产产物仍是 `.next/standalone`
  - [scripts/start-entry.mjs](file:///home/dell/Projects/Rento/scripts/start-entry.mjs) 仍服务旧 `Next.js` 启动与回滚基线

### 3. 新主线承接位已存在，但生产交付链未闭合
- 新主线运行时已经具备最小承接位：
  - [server/index.ts](file:///home/dell/Projects/Rento/server/index.ts) 使用 `@hono/node-server` 启动 Hono Node 运行时，并具备优雅退出处理。
  - [server/app.ts](file:///home/dell/Projects/Rento/server/app.ts) 已同时承接 `/api/*` 与前端静态壳路由。
  - [server/lib/static.ts](file:///home/dell/Projects/Rento/server/lib/static.ts) 已支持生产态从 `dist/` 提供 SPA 静态文件与 fallback。
  - [scripts/dev-minix.mjs](file:///home/dell/Projects/Rento/scripts/dev-minix.mjs) 已冻结 `Vite + Hono` 双服务开发拓扑。
- 但生产交付链尚未闭合：
  - [package.json](file:///home/dell/Projects/Rento/package.json) 中 `build:minix` 目前只执行 `vite build`。
  - [scripts/start-minix.mjs](file:///home/dell/Projects/Rento/scripts/start-minix.mjs) 生产入口仍通过 `npx tsx server/index.ts` 直接运行 TypeScript 源码。
  - [tsconfig.json](file:///home/dell/Projects/Rento/tsconfig.json) 为 `noEmit: true`，仓库没有单独的服务端生产构建配置。
- 这与根级已冻结的“云端不构建，只运行预构建产物”要求存在直接缺口，因此 `phase11` 不能只补部署脚本，还必须收口服务端产物链。

### 4. 正式部署主线的可推导结论
- 目标技术栈已在 [README.md](file:///home/dell/Projects/Rento/README.md) 与 `phase06` 文档中冻结为 `React + Vite + Hono + PostgreSQL + Caddy + systemd`。
- 代码层已经表明：
  - Hono 可以直接承接 SPA 静态壳与 `/api`。
  - `Caddy` 更适合作为 HTTPS 终止与反向代理，而不是再重复接管一套前端路由逻辑。
  - 新部署主线不再需要 `redis` 作为正式运行依赖；当前仓库内 `redis` 仅存在于旧容器化部署线与旧开发脚本对照说明中，`src/` 与 `server/` 当前主线并未使用它。
- 因此正式部署拓扑应冻结为：
  - 公网：`Caddy`
  - 本机私网：单一 `Hono` 运行时监听 `127.0.0.1:<MINIX_SERVER_PORT>`
  - 数据库：PostgreSQL
  - 进程托管：`systemd`
  - 前端：`dist/` 由 Hono 从本机文件系统直接提供

### 5. Context7 补充口径
- `@hono/node-server` 官方资料支持以 Node 进程方式启动 Hono，并可在进程退出时通过 `server.close()` 做优雅停机；当前 [server/index.ts](file:///home/dell/Projects/Rento/server/index.ts) 已符合这一方向。
- Prisma 官方生产口径继续指向 `migrate deploy` 作为非交互生产迁移命令；这与 `phase10` 已冻结结论一致，`db push` 不能在 `phase11` 被重新包装成正式主路径。
- Caddy 官方模式支持 `reverse_proxy` 与 `file_server`；但鉴于本仓库已在 Hono 内冻结 `dist/` 托管能力，正式部署线优先采用“Caddy 做 HTTPS/入口、Hono 做应用语义”的更低分叉方案。
- systemd 官方资料支持通过 `WorkingDirectory`、`EnvironmentFile`、`ExecStart`、`Restart` 等字段定义长期守护进程；这与本项目“单进程 Hono 运行时 + 外层 Caddy”目标一致。

## Assumptions & Decisions

### 1. 已锁定决策
- 不恢复或扩写 `docker-compose + nginx` 为未来正式主线。
- 不把 `Rento-legacy` 当作部署入口、切线入口或回滚运行入口；它只保留 GitHub 侧只读历史备份职责。
- 不在 `phase11` 反向重构 `phase07~10` 已冻结的应用壳、API、领域服务与数据访问层语义。
- 不在云服务器执行源码构建；服务器仅接收预构建产物、最小运行依赖与部署配置。
- 不让 `redis` 继续进入正式部署主线；它只保留在旧容器化回滚基线中。

### 2. 部署拓扑决策
- 正式入口：`Caddy` 监听 `80/443`，负责证书、HTTPS 与反向代理。
- 应用进程：单一 `systemd` 服务，例如 `rento-minix.service`，启动编译后的 Hono Node 运行时。
- 应用监听：Hono 只监听本机环回地址上的内部端口，例如 `127.0.0.1:3002`。
- 前端托管：继续由 Hono 使用 `dist/` 提供 SPA 壳与静态资源；`Caddy` 只代理，不再复制一套 SPA fallback 规则。
- 迁移路径：正式生产前置使用 `prisma migrate deploy`；仅当 `phase10` 已知兼容兜底条件被命中时，才允许保留说明性的 fallback，而不能把 fallback 写成默认主路径。

### 3. 文档治理决策
- 根级 [DEPLOYMENT.md](file:///home/dell/Projects/Rento/DEPLOYMENT.md) 在 `phase11` 实施后必须升级为当前正式部署真相源。
- 当前旧容器化部署说明应迁入 `docs/archive/` 或作为 `DEPLOYMENT.md` 中的“legacy rollback baseline”章节保留，但不能继续占据默认主入口语义。
- 顶层真相源需要把默认工作流从 `phase10` 切到 `phase11 /plan`，同时明确“当前是阶段文档产出待审核”，而不是直接进入 `/spec`。

## Proposed Changes

### A. 顶层真相源同步

#### 1. `AGENTS.md`
- 做什么：
  - 把默认工作流切换为 `phase11-deployment-cutover-and-cutline-closure`。
  - 将“当前下一步”更新为审核 `docs/phase11_*`，而不是继续停留在 `phase10` 最终审核表述。
  - 冻结 `phase11` 的上游输入、最小验证命令与不越界边界。
- 为什么：
  - 用户已经显式发起 `phase11 /plan`，入口摘要必须切到当前阶段。
- 怎么做：
  - 复用 `phase10` 同步方式，增加 `docs/phase11_*` 导航与阶段说明。

#### 2. `project_rules.md`
- 做什么：
  - 增加 `phase11` 阶段前置冻结条件、允许项、禁止项、审核通过最低前提。
  - 明确正式部署线为 `Caddy + systemd + Hono + PostgreSQL`。
  - 明确旧容器化运行线只保留历史运行/回滚职责，且 `redis` 不进入正式主线。
- 为什么：
  - 部署切线、安全边界、回滚与发布门禁都属于刚性规则，必须进入项目级门禁文档。
- 怎么做：
  - 沿用既有 phase 规则段落结构，新增 `phase11` 对应冻结项、发布门禁和退出条件。

#### 3. `architecture_map.md`
- 做什么：
  - 把“现有运行线部署真相源”拆分为“正式部署真相源”和“legacy 回滚基线”。
  - 加入新正式部署资产映射：服务端产物链、`Caddy` 配置、`systemd` 单元、正式健康检查入口、旧资产归档去向。
- 为什么：
  - `architecture_map.md` 必须准确反映仓库结构与部署载体变化，避免部署资产再次形成双重真相源。
- 怎么做：
  - 保留当前旧资产清单为回滚参考，同时补上新部署主线结构图与文件承接位。

#### 4. `plan.md`
- 做什么：
  - 将 `phase11` 当前结论更新为“已完成阶段级文档产出，待审核”。
  - 更新“当前阶段结论”与“默认推进方向”。
- 为什么：
  - `plan.md` 是阶段总览真相源，必须反映当前已经进入 `phase11 /plan`。
- 怎么做：
  - 仅同步阶段状态与下一步，不在这里展开子任务细节。

#### 5. `README.md`
- 做什么：
  - 将当前项目状态更新为“`phase11` 规划中”。
  - 把部署部分改写为“当前正式目标部署栈”和“legacy 回滚基线”的双层说明。
- 为什么：
  - README 负责对外当前状态说明，不能继续只停留在 `phase10` 或继续把旧容器化线放在默认位置。
- 怎么做：
  - 精简保留正式部署目标、低配服务器原则、当前审核状态与回滚基线说明。

#### 6. `DEPLOYMENT.md`
- 做什么：
  - 升级为正式 `phase11` 部署主线手册。
  - 明确正式部署流程、环境变量、构建产物、`Caddy`/`systemd` 配置、健康检查、发布门禁与回滚流程。
  - 旧容器化运行线说明移入历史回滚章节，或迁入 `docs/archive/` 后在此留链接。
- 为什么：
  - 根级部署手册必须回到“当前有效入口”，否则会继续由 legacy 部署文档占据默认真相源。
- 怎么做：
  - 采用“正式主线优先 + legacy baseline 附录/归档链接”的结构。

#### 7. `global_skills.md` 与 `project_skills.md`
- 做什么：
  - 最小同步 `phase11` 当前阶段的治理重点：部署切线、发布门禁、回滚基线、低配服务器原则。
- 为什么：
  - 规则要求阶段切换前同步顶层技能文档，避免方法论仍停留在旧阶段。
- 怎么做：
  - 仅补与 `phase11` 相关的新增约束，不扩写无关方法论。

### B. `phase11` 阶段文档产出

#### 1. `docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md`
- 做什么：
  - 冻结正式部署拓扑、进程模型、部署资产边界、回滚基线与 legacy 线退出原则。
  - 明确为什么选择“Caddy 反代 + 单一 Hono systemd 服务 + Hono 托管 dist”。
  - 解释与 `phase07~10` 的上下游关系和不越界边界。
- 为什么：
  - 这是 `phase11` 的核心架构真相源。
- 怎么做：
  - 用现有代码证据支撑每个决策：`server/index.ts`、`server/app.ts`、`server/lib/static.ts`、`scripts/start-minix.mjs`、旧部署资产集合。

#### 2. `docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md`
- 做什么：
  - 冻结阶段共享术语与边界：
    - 正式部署主线
    - legacy rollback baseline
    - cutover
    - cutline closure
    - 发布门禁
    - 回滚条件
    - 正式环境变量口径
  - 冻结 `Caddy`、`systemd`、Hono、Prisma 之间的职责分层。
- 为什么：
  - 部署阶段最容易因“脚本、手册、环境模板、服务名”口径不一致而失真，需要独立 shared baseline。
- 怎么做：
  - 采用与 `phase08~10` 相同的 baseline 结构，单独列出环境变量矩阵、健康检查矩阵与发布/回滚边界。

#### 3. `docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md`
- 做什么：
  - 拆分顺序执行子任务、DoD、验证要求与越界禁止项。
- 为什么：
  - 后续 `/spec` 必须按顺序逐个消费，不能边做边想。
- 怎么做：
  - 建议冻结为以下 5 个子任务：
    - `phase11-01-production-runtime-artifact-and-startup-closure`
      - 收口服务端产物链、正式构建命令、正式启动入口、预构建产物边界。
    - `phase11-02-caddy-and-systemd-deployment-baseline`
      - 新增正式部署资产、服务单元、反向代理配置与目录约定。
    - `phase11-03-env-template-health-and-release-gate-closure`
      - 环境模板、健康检查、构建/迁移/发布门禁收口。
    - `phase11-04-legacy-runtime-demotion-and-rollback-baseline`
      - 旧容器化运行线降级为历史运行/回滚基线，明确退出条件与保留资产。
    - `phase11-05-documentation-consistency-and-deployment-rehearsal-closure`
      - 顶层文档、部署手册、阶段文档、验证记录与最终审核链路收口。

### C. 执行阶段将落地的实现与资产范围

#### 1. 服务端产物链
- 涉及文件：
  - [package.json](file:///home/dell/Projects/Rento/package.json)
  - [tsconfig.json](file:///home/dell/Projects/Rento/tsconfig.json)
  - 新增 `tsconfig.minix-server.json`
  - [scripts/start-minix.mjs](file:///home/dell/Projects/Rento/scripts/start-minix.mjs)
- 做什么：
  - 为 Hono 运行时新增可产出 JS 的服务端构建配置。
  - 把 `build:minix` 升级为“前端 + 服务端”正式构建入口。
  - 把 `start:minix` 从 `tsx server/index.ts` 切到已编译 JS 产物。
- 为什么：
  - 不解决这一点，就无法满足“云端不构建，只运行预构建产物”。
- 怎么做：
  - 采用独立 `tsconfig` 为 `server/` 与必要共享 Node 侧模块产出 JS。
  - 保持 `dev:minix` 继续使用 `tsx watch`，不影响开发态。

#### 2. 正式部署资产
- 涉及新增文件：
  - 建议新增 `deploy/Caddyfile`
  - 建议新增 `deploy/systemd/rento-minix.service`
  - 如有必要，新增 `deploy/README.md` 或等价说明文件
- 做什么：
  - 引入正式 `Caddy` 配置与 `systemd` 单元模板。
  - 冻结工作目录、环境文件、运行命令、重启策略、日志路径与端口关系。
- 为什么：
  - 仓库目前没有任何 `Caddy` 或 `systemd` 实体资产，`phase11` 必须把目标主线从纯文档目标变成真实部署入口。
- 怎么做：
  - `Caddy` 只做 HTTPS 与反向代理到 Hono 内部端口。
  - `systemd` 只托管单一 Hono 服务进程。

#### 3. 环境模板与健康检查
- 涉及文件：
  - [.env.example](file:///home/dell/Projects/Rento/.env.example)
  - [scripts/health-check.sh](file:///home/dell/Projects/Rento/scripts/health-check.sh)
  - [server/lib/env.ts](file:///home/dell/Projects/Rento/server/lib/env.ts)
- 做什么：
  - 把 `.env.example` 从旧容器化模板收口为正式新主线模板，并保留 legacy baseline 注释。
  - 统一 `DATABASE_URL`、`AUTH_SESSION_SECRET`、`ALLOWED_ORIGINS`、`NEXTAUTH_URL`、`MINIX_SERVER_PORT` 等正式变量口径。
  - 让健康检查脚本同时适配正式新主线与 legacy 回滚基线。
- 为什么：
  - 阶段规则明确：环境变量、认证、CORS、来源限制、健康检查调整必须同步更新实现、模板和文档。
- 怎么做：
  - 以 `server/lib/env.ts` 当前读取口径为准建立正式变量矩阵。
  - 保留兼容回退项时写清存在原因与退出条件。

#### 4. 迁移与发布门禁
- 涉及文件：
  - [scripts/migrate-and-seed.sh](file:///home/dell/Projects/Rento/scripts/migrate-and-seed.sh)
  - [DEPLOYMENT.md](file:///home/dell/Projects/Rento/DEPLOYMENT.md)
  - `docs/phase11_*`
- 做什么：
  - 把 `phase10` 已冻结的正式/兼容迁移边界带入正式部署流程。
  - 冻结发布前必须执行的构建、迁移、健康检查与主链 smoke 流程。
- 为什么：
  - `phase11` 是部署切线阶段，不能重新模糊 `migrate deploy` 与 `db push` 的职责边界。
- 怎么做：
  - 正式流程默认写成 `migrate deploy`。
  - 若存在兼容 fallback，只写入“命中条件、风险、回滚条件”，不写成默认 happy path。

#### 5. legacy 线降级与归档
- 涉及文件：
  - [docker-compose.yml](file:///home/dell/Projects/Rento/docker-compose.yml)
  - [nginx/nginx.conf](file:///home/dell/Projects/Rento/nginx/nginx.conf)
  - [scripts/cloud-deploy.sh](file:///home/dell/Projects/Rento/scripts/cloud-deploy.sh)
  - [scripts/bootstrap-deploy-assets.sh](file:///home/dell/Projects/Rento/scripts/bootstrap-deploy-assets.sh)
  - [scripts/start-entry.mjs](file:///home/dell/Projects/Rento/scripts/start-entry.mjs)
  - 可能新增 `docs/archive/` 下的 legacy 部署归档文档
- 做什么：
  - 明确这些文件在 `phase11` 后的定位是“历史运行线 / 回滚参考”。
  - 写清保留条件、退出条件与不得继续扩写的边界。
- 为什么：
  - 旧资产仍需保留回滚职责，但不能继续与新主线争夺当前真相源。
- 怎么做：
  - 在文档与必要文件头注释中显式标明 legacy baseline 身份。
  - 若根级入口需要精简，则把大段旧说明迁入 `docs/archive/` 并在根级留下索引。

## Verification Steps

### 1. `/plan` 阶段文档校验
- 互链校验：
  - `AGENTS.md`
  - `project_rules.md`
  - `plan.md`
  - `architecture_map.md`
  - `README.md`
  - `DEPLOYMENT.md`
  - `docs/phase11_*`
- 要求：
  - 当前默认工作流一致指向 `phase11`
  - `phase11` 当前状态一致表述为“文档已产出，待审核”
  - legacy 回滚基线与正式部署主线不再混写

### 2. 执行阶段最低工程验证
- `npm run lint`
- `npm run type-check`
- `npm run build:minix`
- 新增的服务端生产构建命令
- `npm run audit:phase09:legacy-routes`
- 如条件允许，执行 `npm run smoke:phase09:all`

### 3. 正式部署线验证
- 产物验证：
  - 前端 `dist/` 存在
  - 服务端编译产物存在
  - `start:minix` 不再依赖 `tsx` 直接跑源码
- 运行验证：
  - `systemd` 服务可启动、可重启、可优雅停止
  - `Caddy` 配置可校验通过
  - `https://<domain>/api/health` 可返回健康状态
  - 登录页、首页、房源、合同、账单主链可访问

### 4. 回滚验证
- legacy 回滚路径仍可解释：
  - 旧容器化运行线的资产集合与触发条件明确
  - 新主线失败时可退回上一个已知可用 baseline
  - 不通过切换 remote 到 `Rento-legacy` 处理运行故障

## Exit Condition For This `/plan`
- 本轮 `/plan` 完成的标志是：
  - 顶层真相源已同步到 `phase11 /plan`
  - `docs/phase11_*` 三份阶段文档已产出
  - 文档互链与阶段边界可读
  - 然后停止，等待用户审核后再进入任一 `phase11-*` `/spec`
