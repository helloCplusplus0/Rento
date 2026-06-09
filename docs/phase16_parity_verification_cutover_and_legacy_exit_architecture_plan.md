# Phase16 Parity Verification Cutover And Legacy Exit 架构规划

## 当前状态
- `phase13` 已完成正式业务页面 `25/25` 迁移，`src/minix/routes/*`、`src/minix/router/index.tsx` 与 `src/app/**/page.tsx` 已形成“新宿主承接位 + 旧页面原型参考”的双层结构。
- `phase14` 已完成正式业务 API/query parity，`server/routes/*.ts` 与 `server/lib/legacy-route-inventory.ts` 已形成 `formal-host-owned / compat-wrapper / retained-legacy` 的单一分类；旧 `src/app/api/*` 中已不存在承担正式业务主职责的 retained-legacy 路由，剩余 retained-legacy 仅限治理/辅助接口。
- `phase15` 已完成纯新主线 PWA/runtime parity，`src/components/pwa/*`、`src/minix/layout/MinixRuntimeLayout.tsx`、`public/manifest.json`、`public/sw.js`、`server/lib/static.ts` 与 `scripts/pwa-smoke-check.sh` 已形成单一交付链路。
- `phase11` 已冻结正式部署主线、回滚基线与部署/回滚演练记录要求；`DEPLOYMENT.md`、`deploy/caddy/Caddyfile`、`deploy/systemd/rento-minix.service`、`scripts/start-minix.mjs` 与 `scripts/start-entry.mjs` 已具备 cutover / rollback 的直接输入价值。

## 配套文档
- 开发规划：`docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`
- 共享基线：`docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`
- 仓库级阶段总览：`plan.md`

## 一、文档目标
本文档用于冻结 `phase16-parity-verification-cutover-and-legacy-exit` 的最小实施架构，只回答以下问题：
- `Rento-miniX` 现在是否已经具备替代旧 `Rento` 的条件
- 哪些新旧差异是必须补齐的迁移遗漏
- 哪些新旧差异只是宿主切换后的合理技术适配
- 哪些 legacy 资产只是回滚/归档/只读参考，而不是正式运行必需项
- cutover、rollback 与 legacy-exit 的单一判断入口在哪里

## 二、唯一职责
- 基于 `phase13 ~ phase15` 的已完成结果，形成页面、API/query、PWA/runtime、deploy/cutover/rollback 四类 parity 审核闭环。
- 把“是否已经完成原地重构”的判断从口头描述收口为可审计证据包。
- 对剩余差异进行单值化分级，避免后续阶段继续把“旧文件还在”误写成“重构未完成”。
- 在不重开页面迁移、正式业务 API 迁移、PWA 重构和 ORM 议题的前提下，冻结 legacy 退出顺序与回滚窗口。

## 三、直接继承输入
### 3.1 来自 `phase11`
- 正式部署主线固定为 `Caddy + systemd + Hono + PostgreSQL`。
- 部署/回滚演练记录字段、健康检查与发布门禁继续以 `DEPLOYMENT.md` 为单一真相源。
- legacy 容器化运行线继续作为回滚基线保留，直到 `phase16` 审核通过。

### 3.2 来自 `phase13`
- 正式业务页面 `25/25` 已迁入 `src/minix`。
- 页面 parity 的默认比较对象继续是旧 `src/app/**/page.tsx` 源代码，而不是抽象页面描述。
- 页面级浏览器验收基线与“接近 `100%` 还原旧页面信息结构/交互节奏”的门槛继续继承。

### 3.3 来自 `phase14`
- `server/lib/legacy-route-inventory.ts` 是旧 API 分类的唯一真相源。
- `formal-host-owned`、`compat-wrapper`、`retained-legacy` 的定义不在 `phase16` 重新改写，只在本阶段继续翻译为“通过 / blocker / 非阻断残留”。
- `phase14-05 ~ phase14-07` 的真实 drain 结果是 `phase16` 的前置事实，不允许再把正式业务 API 迁移债务回写到本阶段。

### 3.4 来自 `phase15`
- 纯新主线已完成最小受控 PWA 交付链路。
- 本地 `PC + Edge/Chrome + HTTP` 安装/登录链路通过。
- 本地移动端 HTTP 无安装入口是预期退化，移动端安装提示、更新与离线兜底的最终判断继续以带公认 HTTPS 证书的部署环境为准。
- 若当前开发环境缺少真实云服务器与公认 HTTPS 条件，`phase16-03` 当前轮允许只冻结待补字段、触发条件与引用入口，不伪造正式人工验收结果。

### 3.5 对 `phase16-01` 的直接约束
- `phase16-01` 负责冻结证据清单、四类 parity matrix 字段、差异分类规则、固定回写落位，并完成四类 matrix 回填。
- 其中页面 parity matrix 已基于 `phase13` 已冻结的 `25` 个正式业务页面清单完成回填。
- API/query parity matrix 已基于 `phase14` 收口后的 `server/lib/legacy-route-inventory.ts`、`server/routes/*.ts`、`src/app/api/**/route.ts` 与 `scripts/phase14-06-query-cutover-smoke.ts` 完成回填，并把 route inventory 逐条翻译为 `formal-host-owned / compat-wrapper / retained-legacy` 的 `phase16` 判定口径。
- PWA/runtime parity matrix 已基于 `phase15` 共享基线、`src/components/pwa/*`、`src/minix/layout/MinixRuntimeLayout.tsx`、`public/manifest.json`、`public/sw.js`、`server/lib/static.ts` 与 `scripts/pwa-smoke-check.sh` 完成回填。
- deploy / cutover / rollback matrix 已基于 `DEPLOYMENT.md`、`deploy/caddy/Caddyfile`、`deploy/systemd/rento-minix.service`、`scripts/start-minix.mjs`、`scripts/health-check.sh`、`scripts/start-entry.mjs`、`docker-compose.yml` 与 `nginx/nginx.conf` 完成回填。
- `phase16-01` 不执行正式业务 API/query drain、页面实现调整、PWA runtime 重做、正式部署演练、cutover 结论或 legacy 退出判断。
- 任何“是否通过”“是否删除/归档 legacy 资产”“是否需要最小补齐实现”的结论，统一后移到 `phase16-02 ~ phase16-04`。

## 四、唯一证据入口
### 4.1 页面 parity
- `docs/phase13_frontend_page_parity_implementation_shared_baseline.md`
- `src/minix/router/index.tsx`
- `src/minix/routes/*`
- `src/app/**/page.tsx`

### 4.2 API/query parity
- `docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md`
- `server/lib/legacy-route-inventory.ts`
- `server/routes/*.ts`
- `src/app/api/**/route.ts`
- `scripts/phase14-06-query-cutover-smoke.ts`

### 4.3 PWA/runtime parity
- `docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md`
- `src/components/pwa/*`
- `src/minix/layout/MinixRuntimeLayout.tsx`
- `public/manifest.json`
- `public/sw.js`
- `server/lib/static.ts`
- `scripts/pwa-smoke-check.sh`

### 4.4 deploy / cutover / rollback
- `DEPLOYMENT.md`
- `deploy/caddy/Caddyfile`
- `deploy/systemd/rento-minix.service`
- `scripts/start-minix.mjs`
- `scripts/health-check.sh`
- `scripts/start-entry.mjs`
- `docker-compose.yml`
- `nginx/nginx.conf`
- `scripts/cloud-deploy.sh`
- `scripts/bootstrap-deploy-assets.sh`

## 五、差异分类标准
### 5.1 parity-blocker
- 旧 `Rento` 已具备、且当前纯新主线仍缺失的正式业务能力。
- 仍要求旧 `src/app/*`、旧 `src/app/api/*`、旧 Next PWA 宿主或旧容器化运行线承担正式运行主职责。
- 会导致主链页面、正式 API、PWA 交付或正式部署无法独立完成交付。

### 5.2 acceptable-adaptation
- 由 `Vite + React Router + Hono + systemd/Caddy` 新路线带来的宿主差异。
- 只要不破坏页面信息结构、主链流程、状态反馈、API 行为、历史保留与正式发布能力，即视为可接受。
- 典型例子包括：宿主级路由协议差异、浏览器对本地 HTTP PWA 能力的限制、部署拓扑从容器化切换为 `systemd + Caddy`。

### 5.3 non-blocking-legacy-reference
- 旧 `src/app/**/page.tsx` 继续保留为页面原型与只读参考。
- 旧 `src/app/api/*` 中 remaining governance / compat wrapper 仅承担辅助查询、会话透传、回滚包装或历史对照职责。
- 旧容器化部署资产仅承担回滚基线、差异对照与归档前参考职责。

## 六、统一设计决策
### 6.1 页面判断决策
- 页面 parity 不重新做范围管理，直接沿用 `phase13` 已冻结的 `25` 个正式业务页面。
- 旧页面文件继续存在不等于 blocker；只有当前页面主链仍依赖旧宿主正式运行时，才上调为 blocker。

### 6.2 API/query 判断决策
- `formal-host-owned` 默认视为已完成宿主替代，除非自动化验证或主链 smoke 能证明仍依赖旧入口。
- `compat-wrapper` 必须继续判断是否还承担正式业务主职责；若仅保留代理/桥接/回滚职责，可作为 non-blocking legacy reference。
- `retained-legacy` 只要仍承担正式业务主职责，就必须升级为 parity-blocker；若只是治理/辅助接口，则可保留为 non-blocking legacy reference。

### 6.3 PWA/runtime 判断决策
- 本地移动端 HTTP 无安装入口不构成 blocker。
- 带公认 HTTPS 证书环境下的 Android + Chrome 安装/更新/离线结果，才是最终 cutover 判断基线。
- 在缺少真实云服务器与公认 HTTPS 条件时，`phase16-03` 当前轮只冻结正式 HTTPS 验收模板与引用入口，待云端复验后再回写结果。
- 旧 Next PWA 宿主只有在仍承担正式 `manifest`、`sw.js`、安装提示或更新提示主职责时，才构成 blocker。

### 6.4 deploy / rollback 判断决策
- `npm run build:minix`、`npm run start:minix`、`/api/health` 与 smoke 脚本继续构成纯新主线正式验证入口。
- `LEGACY_START=1 npm run start` 只保留 legacy-only 身份，不得再被视为当前正式运行入口。
- 在缺少真实云服务器条件时，`phase16-03` 当前轮只冻结正式部署演练与 legacy 回滚演练模板、触发条件与引用入口，真实演练结果延后到云端执行。
- legacy 资产退出的前提不是“文件删掉了”，而是“替代入口、验证记录与回滚窗口已形成可审计闭环”。

## 七、明确不做
- 不重新打开正式业务 API 迁移。
- 不重新打开页面重设计或新的 UI 方案。
- 不重新打开 PWA 技术方案选型。
- 不把 Prisma 替换、迁移链专项治理或角色权限完善混入本阶段。
- 不因存在 legacy 资产就提前删除它们。

## 八、验收判断
- `phase16` 至少能给出页面/API/PWA/部署四类 parity matrix 的单一结论。
- 每个剩余差异都必须被归类为 `parity-blocker`、`acceptable-adaptation` 或 `non-blocking-legacy-reference`。
- cutover 审核、回滚演练与 legacy 退出顺序必须具备单一解释，且能被根级真相源直接引用。
- 本阶段最终允许两种合法结果：
  - `通过`：`Rento-miniX` 已具备替代旧 `Rento` 的条件，legacy 资产只剩回滚/归档/只读参考职责。
  - `未通过但单值化`：全部 blocker 已被明确映射到真实缺口与后续最小补齐任务，不再保留模糊灰区。

## 九、证据产物固定落位
- 不新增第二套 phase16 审计目录；本阶段证据统一回写到既有真相源。
- `phase16-01` 当前轮已完成四类 parity matrix 回填；不提前填入自动化验证结果、人工验收记录、cutover 结论或 legacy 退出决定。
- 固定落位如下：
  - 页面 parity matrix：`docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`
  - API/query parity matrix：`docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`
  - PWA/runtime parity matrix：`docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`
  - deploy / cutover / rollback matrix：`docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`
  - 自动化验证结果与 gap triage：`docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`
  - 人工浏览器验收记录：`docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`
  - 正式部署演练记录与 legacy 回滚演练记录：`docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`，并由 `DEPLOYMENT.md` 引用摘要结论
  - 最终 cutover 结论与 legacy 退出判断：`docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`、`plan.md`、`README.md`、`AGENTS.md`、`architecture_map.md` 与 `DEPLOYMENT.md`
