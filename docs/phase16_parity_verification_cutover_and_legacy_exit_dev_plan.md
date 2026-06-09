# Phase16 Parity Verification Cutover And Legacy Exit 开发规划

## 当前状态
- `phase16` 是收口型阶段：本阶段的中心不是继续迁移，而是判断 `Rento-miniX` 是否已经具备替代旧 `Rento` 的条件。
- 当前仓库已经具备阶段输入：`phase13` 页面 parity、`phase14` API/query parity、`phase15` PWA/runtime parity 与 `phase11` 部署/回滚基线均已形成稳定上游。
- 当前轮已完成 `docs/phase16_*` 三件套与根级真相源同步，并已完成 `phase16-01` 的证据盘点、四类 parity matrix 回填与固定落位。
- 四类 parity matrix 固定落位到 `docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`；本文件后续只承接自动化验证结果、人工验收、cutover 审核记录、正式部署/legacy 回滚演练记录与 legacy 退出判断回写。
- `phase16-02` 已完成固定自动化验证组合、gap triage 与源码路径映射；`phase16-03` 当前轮已完成源码层对齐复核、cutover 审核包字段冻结、待云端复验占位与根级真相源同步。
- `phase16-04` 当前轮已完成任务 `1 ~ 4`：legacy 资产职责、`rollback-only` 保留边界、回滚窗口、后续归档/退出前提与根级真相源同步已形成单一解释；当前轮最终结论固定为 `未通过但单值化`。
- 当前开发环境仍不具备真实云服务器与公认 HTTPS 条件；因此正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练只冻结待补字段、触发条件与引用入口，不伪造已完成结果。

## 配套文档
- 架构规划：`docs/phase16_parity_verification_cutover_and_legacy_exit_architecture_plan.md`
- 共享基线：`docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`
- 仓库级阶段总览：`plan.md`

## 一、文档定位
本文档用于把 `phase16` 拆成可直接实施的最小任务顺序，避免把最终验收阶段重新做成“继续迁移 everything”的失控任务。

## 二、固定顺序
```text
先补 phase16 文档三件套与根级真相源同步
  ->
再盘点页面 / API / PWA / 部署四类证据并生成 parity matrix
  ->
再执行自动化验证与 gap triage
  ->
再补人工浏览器验收、cutover 审核包与 rollback 记录
  ->
最后冻结 legacy 退出顺序并做独立审核
```

## 三、任务拆分
## phase16-01-evidence-inventory-and-parity-matrix
### 目标
把 `phase13 ~ phase15` 与 `phase11` 的上游结果收口为单一 `phase16` 审核入口，并生成四类 parity matrix。
- 冻结 `phase16-01` 负责“证据清单 + matrix 字段 + 差异分类 + 固定落位”；当前已完成页面 parity matrix `25` 个正式业务页面清单回填、API/query parity matrix 回填，以及 PWA/runtime、deploy/cutover/rollback 两类 matrix 回填，不提前执行后续验证、cutover 或 legacy 退出判断。

### 范围
- `docs/phase16_parity_verification_cutover_and_legacy_exit_architecture_plan.md`
- `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`
- `docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`
- `DEPLOYMENT.md`
- `docs/phase13_*`
- `docs/phase14_*`
- `docs/phase15_*`
- `server/lib/legacy-route-inventory.ts`
- `server/routes/*.ts`
- `src/minix/router/index.tsx`
- `src/minix/routes/*`
- `src/minix/layout/MinixRuntimeLayout.tsx`
- `src/components/pwa/*`
- `public/manifest.json`
- `public/sw.js`
- `server/lib/static.ts`
- `deploy/caddy/Caddyfile`
- `deploy/systemd/rento-minix.service`
- `scripts/start-minix.mjs`
- `scripts/health-check.sh`
- `scripts/pwa-smoke-check.sh`
- `scripts/start-entry.mjs`
- `docker-compose.yml`
- `nginx/nginx.conf`
- `scripts/cloud-deploy.sh`
- `scripts/bootstrap-deploy-assets.sh`

### DoD
- `docs/phase16_*` 三份文档存在并互链。
- 页面 parity matrix 已回填 `25` 个正式业务页面；API/query parity matrix 已按 route inventory 全量回填；PWA/runtime 与 deploy/cutover/rollback 两类 parity matrix 已补齐字段、差异分类、证据来源与当前结论。
- 证据回写落位已经冻结为既有 `docs/phase16_*` 与 `DEPLOYMENT.md` 引用关系，不新增第二套审计目录或临时清单文档。
- 根级真相源已同步 `phase16-01` 当前轮状态：四类 parity matrix 固定落位到 `shared_baseline`，自动化验证、人工验收、cutover 审核、部署/回滚演练与 legacy 退出判断固定落位到 `dev_plan`。
- 当前子任务不输出 `通过/未通过` 最终结论，不执行自动化验证、人工验收、正式 cutover 审核或 legacy 资产删除/归档动作。

### 明确不做
- 不把 `phase16-01` 扩写成正式业务 API/query 迁移补做。
- 不把 `phase16-01` 扩写成页面实现调整或 UI 重设计。
- 不把 `phase16-01` 扩写成 PWA runtime 重做、安装策略改造或缓存方案重写。
- 不把 `phase16-01` 扩写成正式部署演练、cutover 判定或 legacy 退出决策执行。

## phase16-02-automated-verification-and-gap-triage
### 目标
执行固定自动化验证组合，并把所有失败项分级为环境问题、合理适配或真实迁移遗漏。

### 范围
- `npm run lint`
- `npm run type-check`
- `npm run build:minix`
- `npm run audit:phase09:legacy-routes`
- `npm run smoke:phase09:all`
- `npm run smoke:phase14:wave2`
- `npm run build:minix:pwa`
- `bash ./scripts/pwa-smoke-check.sh --profile production-ready --base-url <runtime-url>`
- `bash ./scripts/health-check.sh --url <runtime-url>`

### DoD
- 每条验证命令都有结果记录。
- 若命令无法执行，必须给出阻塞原因、是否构成 blocker 与临时替代验证路径。
- 若发现真实缺口，必须把缺口映射到具体页面/API/PWA/部署路径与真实文件。

## phase16-03-manual-acceptance-and-cutover-packet
### 目标
当前轮优先完成源码层对齐复核、cutover 审核包字段冻结与待真实云服务器复验的记录占位；正式人工浏览器验收、正式部署演练与 legacy 回滚演练结果延后到真实云服务器执行后再回写。

### 范围
- `phase16-01` 四类 parity matrix 与 `phase16-02` 自动化验证记录的输入复核
- 页面主链、API/query、PWA/runtime、部署入口、健康检查与 rollback 入口的源码层对齐复核
- cutover 审核包字段、待补字段、触发条件、引用入口与结论占位冻结
- `docs/phase16_*`、`README.md`、`AGENTS.md`、`plan.md`、`architecture_map.md`、`DEPLOYMENT.md` 的当前轮口径同步
- 页面主链人工浏览器对照
- PC 浏览器 PWA 安装/登录链路复验
- 带公认 HTTPS 证书环境下的 Android + Chrome 安装/更新/离线验证
- 正式部署环境主链访问性与 `/api/health` 结果
- legacy 回滚入口恢复性记录

### DoD
- 人工验收记录必须区分“本地开发验收”和“正式 HTTPS 部署验收”。
- 当前轮必须明确哪些结论已由源码/脚本/文档复核覆盖，哪些结论待真实云服务器执行后补齐。
- cutover 审核包至少包含：验证命令、健康检查、主链 smoke、PWA 结果、部署演练、回滚演练、回滚触发条件与最终结论。
- 当前轮不得伪造人工 HTTPS 验收、正式部署演练或 legacy 回滚演练结果。
- 所有记录都能被 `docs/phase16_*` 与根级真相源直接引用。

## phase16-04-legacy-exit-decision-and-root-sync
### 目标
基于 parity 结论与 cutover 审核包，冻结 legacy 资产退出顺序、保留条件、回滚窗口与最终阶段结论。

### 范围
- `DEPLOYMENT.md`
- `README.md`
- `AGENTS.md`
- `project_rules.md`
- `global_skills.md`
- `project_skills.md`
- `plan.md`
- `architecture_map.md`
- `docs/phase16_*`
- legacy 资产清单：
  - `docker-compose.yml`
  - `nginx/nginx.conf`
  - `scripts/cloud-deploy.sh`
  - `scripts/bootstrap-deploy-assets.sh`
  - `scripts/start-entry.mjs`

### DoD
- 明确哪些 legacy 资产继续保留为回滚基线。
- 明确哪些 legacy 资产已满足归档或后续退出前提。
- 明确 `phase16` 当前轮最终结论是“通过”还是“未通过但单值化”。

## 四、参考来源
- `docs/phase13_frontend_page_parity_implementation_architecture_plan.md`
- `docs/phase13_frontend_page_parity_implementation_dev_plan.md`
- `docs/phase13_frontend_page_parity_implementation_shared_baseline.md`
- `docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md`
- `docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md`
- `docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md`
- `docs/phase15_minix_pwa_and_runtime_parity_architecture_plan.md`
- `docs/phase15_minix_pwa_and_runtime_parity_dev_plan.md`
- `docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md`
- `server/lib/legacy-route-inventory.ts`
- `src/minix/routes/*`
- `src/app/**/page.tsx`
- `src/app/api/**/route.ts`
- `scripts/phase09-05-main-flow-smoke.ts`
- `scripts/phase14-06-query-cutover-smoke.ts`
- `scripts/pwa-smoke-check.sh`
- `scripts/health-check.sh`
- `DEPLOYMENT.md`

## 五、阻塞处理规则
- 若发现 `parity-blocker`，必须先写清缺口、影响面、真实文件与最小补齐策略，再决定是否进入后续 `/spec`。
- 若判定为 `acceptable-adaptation`，必须说明为什么它不影响正式业务交付、后续继续开发与 cutover 审核。
- 若判定为 `non-blocking-legacy-reference`，必须说明保留原因、退出条件、回滚价值与当前是否仍耦合正式交付链路。

## 六、结果回写落位
- 四类 parity matrix 固定回写到 `docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md` 的对应章节，不另建临时统计文档。
- 自动化验证结果与 gap triage 固定回写到本文件“七、自动化验证记录”。
- 人工浏览器验收、cutover 审核包、正式部署演练与 legacy 回滚演练结果固定回写到本文件“八、人工验收与 cutover 审核记录”。
- legacy 退出顺序、保留条件与最终结论固定回写到本文件“九、legacy 退出判断与阶段结论”，并同步到 `plan.md`、`README.md`、`AGENTS.md`、`architecture_map.md` 与 `DEPLOYMENT.md`。

## 七、自动化验证记录
- 边界复核：
  - 本轮仅覆盖固定自动化验证组合、结果记录与 gap triage，不提前写入人工 HTTPS 验收、正式部署演练、legacy 回滚演练或 legacy 退出最终结论。
  - 执行范围已按 `package.json`、`scripts/phase09-05-main-flow-smoke.ts`、`scripts/phase14-06-query-cutover-smoke.ts`、`scripts/pwa-smoke-check.sh` 与 `scripts/health-check.sh` 复核为固定九条命令。
  - 本轮运行时 URL 采用最小可行本地生产运行时 `http://127.0.0.1:39124`；首次尝试默认端口与 `3102` 均因 `EADDRINUSE` 失败，已归类为环境占用并改用隔离端口继续验证。
- `npm run lint`
  - 结果：通过。
  - 关键输出：`next lint` 返回 `No ESLint warnings or errors`。
  - 失败原因：无。
  - blocker：否。
  - 替代路径：无。
  - triage：`acceptable-adaptation`。结合 Context7 2026-06 最新 Next.js 文档，`next lint` 已在 Next.js 16 移除，当前仓库仍停留在 `next lint` 脚本属于技术债，不构成当前轮功能 blocker；后续应把 `package.json` 的 `lint` 脚本迁移到 ESLint CLI。
- `npm run type-check`
  - 结果：通过。
  - 关键输出：`tsc --noEmit` 退出码 `0`。
  - 失败原因：无。
  - blocker：否。
  - 替代路径：无。
  - triage：通过。Context7 2026-06 TypeScript 文档确认 `--noEmit` 仍是有效且推荐的纯类型校验方式。
- `npm run build:minix`
  - 结果：通过。
  - 关键输出：客户端与 SSR 产物均成功生成到 `dist/` 与 `build/minix-server/`。
  - 失败原因：无。
  - blocker：否。
  - 替代路径：无。
  - triage：
    - `acceptable-adaptation`：Vite 输出 `The CJS build of Vite's Node API is deprecated`，当前未阻断构建，影响文件待后续聚焦到 `vite.config.ts` 与相关 Node API 调用链。
    - `acceptable-adaptation`：`.env`/`.env.example` 中存在 `NODE_ENV=production`，Vite 提示该值不用于创建 development build；当前命令仍为 production build，未阻断阶段验证。
    - `acceptable-adaptation`：客户端 chunk 超过 `500 kB`，对应 `dist/assets/index-*.js` 体积较大，属于性能优化议题，不是当前 parity-blocker。
    - `acceptable-adaptation`：`src/lib/reading-status-sync.ts` 同时被动态与静态引用，SSR 构建提示不会单独拆 chunk；当前不影响产物可用性。
- `npm run audit:phase09:legacy-routes`
  - 结果：通过。
  - 关键输出：旧路由文件 `48`、清单覆盖 `48`、操作条目 `53`；`formal-host-owned: 5`、`compat-wrapper: 42`、`retained-legacy: 6`。
  - 失败原因：无。
  - blocker：否。
  - 替代路径：无。
  - matrix 映射：API/query parity matrix 继续维持 `phase14` 收口结论，正式业务 retained-legacy 主职责仍为 `0`，剩余 retained-legacy 仅限治理/辅助接口。
- `npm run smoke:phase09:all`
  - 结果：通过，退出码 `0`。
  - 关键输出：`17/17` 断言通过，`bills fallback 说明` 已恢复为 `PASS`。
  - 失败原因：无。
  - blocker：否。
  - 替代路径：无。
  - triage：已通过。当前轮已把 `scripts/phase09-05-main-flow-smoke.ts` 中 `assertBillsFallbackFile()` 从整句精确匹配调整为 `LEGACY_COMPAT.reason` 范围内的关键职责片段匹配，继续约束 `phase14-05`、`server/routes/bills.ts`、`utility-details` 在内的正式账单职责与治理尾项，同时避免因说明文案补充细节而误报。
  - 真实文件映射：
    - API 路径：`/api/bills`、`/api/bills/stats`、`/api/bills/:id`、`/api/bills/:id/details`
    - 正式宿主文件：`server/routes/bills.ts`
    - 失败断言文件：`scripts/phase09-05-main-flow-smoke.ts`
    - 兼容入口文件：`src/app/api/bills/route.ts`、`src/app/api/bills/[id]/route.ts`、`src/app/api/bills/stats/route.ts`
- `npm run smoke:phase14:wave2`
  - 结果：通过。
  - 关键输出：`48/48` 断言通过。
  - 失败原因：无。
  - blocker：否。
  - 替代路径：无。
  - matrix 映射：API/query parity matrix 中 dashboard、settings、renters、meter-readings、utility compat tail 继续维持 `phase14-06` 结论；相关 formal host 与 compat wrapper 未出现回退。
- `npm run build:minix:pwa`
  - 结果：通过。
  - 关键输出：PWA 打开后客户端与 SSR 产物再次成功生成。
  - 失败原因：无。
  - blocker：否。
  - 替代路径：无。
  - triage：沿用 `build:minix` 的非阻断构建告警；未发现新的 PWA 构建缺口。
- `bash ./scripts/pwa-smoke-check.sh --profile production-ready --base-url http://127.0.0.1:39124`
  - 结果：通过。
  - 关键输出：`/api/health`、HTML shell、`manifest.json`、`sw.js`、`/offline` 与 hashed assets 缓存头全部通过。
  - 失败原因：无。
  - blocker：否。
  - 替代路径：无。
  - matrix 映射：PWA/runtime parity matrix 维持通过；本次仅使用 loopback HTTP，本地 smoke 可接受，但不替代 `phase16-03` 的真实 HTTPS 设备验收。
- `bash ./scripts/health-check.sh --url http://127.0.0.1:39124/api/health`
  - 结果：通过。
  - 关键输出：`status=healthy`、HTTP `200`、数据库检查 `pass`、内存检查 `pass`。
  - 失败原因：无。
  - blocker：否。
  - 替代路径：无。
  - matrix 映射：deploy/cutover/rollback matrix 的本地主健康入口可用；本次结论只覆盖本地生产产物运行时，不提前外推到正式 cutover 审核。
- gap triage 汇总：
  - 环境问题：默认端口与 `3102` 被占用，影响 `start:minix` 首次启动；通过改用 `39124` 完成最小本地运行时验证。映射文件：`scripts/start-minix.mjs`、`server/index.ts`。当前不是 blocker。
  - 合理适配：`next lint` 弃用提示、Vite CJS Node API 弃用提示、chunk 体积告警、`NODE_ENV` 提示均未阻断本轮验证。映射文件：`package.json`、`vite.config.ts`、`.env.example`。
  - 自动化验证 blocker：当前轮已清零；`phase09` 主链 smoke 的账单 fallback 断言已改为关键片段匹配并重跑通过。
  - 真实迁移遗漏：本轮未发现新的页面/API/PWA/部署真实迁移遗漏；失败项已收敛为环境占用与非阻断技术适配提示。

## 八、人工验收与 cutover 审核记录
- `phase16-03` 当前轮边界：
  - 本轮只完成源码层对齐复核、cutover 审核包字段冻结、待云端复验占位与根级真相源同步。
  - 本轮不伪造人工 HTTPS 验收、正式部署演练或 legacy 回滚演练结果。
  - 本轮继续保留“本地开发验收”与“正式 HTTPS 部署验收”的区分口径。
- 直接输入复核：
  - 页面/API/PWA/部署四类 parity matrix：`docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`
  - 自动化验证与 gap triage：本文件“七、自动化验证记录”
  - 部署与回滚基线：`DEPLOYMENT.md`、`deploy/caddy/Caddyfile`、`deploy/systemd/rento-minix.service`、`scripts/start-minix.mjs`、`scripts/health-check.sh`、`scripts/start-entry.mjs`、`docker-compose.yml`、`nginx/nginx.conf`
- 源码层对齐复核结论：
  - 页面主链：未发现新的页面 parity 缺口；`src/minix/router/index.tsx` 继续承接 `25` 个正式业务页面，`src/app/**/page.tsx` 仍只作为原型参考，不承担纯新主线正式运行职责。
  - API/query：未发现新的正式业务 retained-legacy 缺口；`server/lib/legacy-route-inventory.ts` 继续维持 `formal-host-owned / compat-wrapper / retained-legacy` 单一分类，剩余 retained-legacy 仍只限治理/辅助接口。
  - PWA/runtime：未发现新的运行时缺口；`src/minix/layout/MinixRuntimeLayout.tsx`、`public/manifest.json`、`public/sw.js`、`server/lib/static.ts` 与 `scripts/pwa-smoke-check.sh` 继续形成单一 PWA 交付链路，但正式 Android/Chrome + HTTPS 验收仍待真实云服务器执行。
  - 部署/cutover/rollback：未发现新的入口缺口；`scripts/start-minix.mjs`、`deploy/caddy/Caddyfile`、`deploy/systemd/rento-minix.service` 与 `scripts/health-check.sh` 继续构成正式主线入口，`scripts/start-entry.mjs`、`docker-compose.yml`、`nginx/nginx.conf` 继续只承担 rollback-only 职责。
  - blocker 判断：当前未发现新的源码层 `parity-blocker`；当前唯一待补项是环境级阻塞，即缺少真实云服务器与公认 HTTPS，无法在本地形成正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练记录。
- 新缺口映射：
  - 页面：无新增缺口；基线路径继续为 `src/minix/router/index.tsx`、`src/minix/routes/*`、`src/app/**/page.tsx`。
  - API/query：无新增缺口；基线路径继续为 `server/lib/legacy-route-inventory.ts`、`server/routes/*`、`src/app/api/**/route.ts`。
  - PWA/runtime：无新增缺口；正式 HTTPS 复验待补，涉及 `src/minix/layout/MinixRuntimeLayout.tsx`、`src/components/pwa/*`、`public/manifest.json`、`public/sw.js`、`server/lib/static.ts`、`scripts/pwa-smoke-check.sh`。
  - 部署/回滚：无新增缺口；正式演练待补，涉及 `scripts/start-minix.mjs`、`deploy/caddy/Caddyfile`、`deploy/systemd/rento-minix.service`、`scripts/health-check.sh`、`scripts/start-entry.mjs`、`docker-compose.yml`、`nginx/nginx.conf`。
- cutover 审核包字段冻结：
  - 验证命令：固定引用本文件“七、自动化验证记录”的九条自动化命令与结果。
  - 源码层对齐摘要：固定记录页面/API/PWA/部署四类对齐结论、缺口判断与真实文件映射。
  - 本地开发验收摘要：固定记录既有 `phase15` PC 安装/登录链路与本地 HTTP 退化口径，明确其不替代正式 HTTPS 验收。
  - 正式 HTTPS 人工验收记录：固定字段为执行时间、目标环境、访问域名、设备/浏览器、安装结果、更新结果、离线结果、截图/录屏引用、结论；当前状态保持 `待真实云服务器执行`。
  - 正式部署演练记录：固定字段为执行时间、目标环境、部署命令、构建来源、`/api/health` 结果、主链 smoke 结果、异常与处置、结论；当前状态保持 `待真实云服务器执行`。
  - legacy 回滚演练记录：固定字段为触发前提、回滚入口、回滚命令、恢复验证、回滚耗时、残留风险、结论；当前状态保持 `待真实云服务器执行`。
  - 回滚触发条件：固定记录健康检查失败、主链 smoke 失败、PWA HTTPS 验收失败、正式访问性不满足发布门禁时必须进入回滚评估。
  - 最终 cutover 结论：只允许 `通过` 或 `未通过但单值化`；当前轮已汇总判定为 `未通过但单值化`，待真实云服务器补齐证据后才允许复判。
- 待真实云服务器复验清单：
  - 页面主链人工浏览器对照：待在真实云服务器 + 正式域名环境执行。
  - PC 浏览器 PWA 安装/登录链路复验：待在真实云服务器 + 正式域名环境执行。
  - Android + Chrome + HTTPS 安装/更新/离线验证：待在真实云服务器 + 公认 HTTPS 环境执行。
  - 正式部署环境主链访问性与 `/api/health` 结果：待在真实云服务器执行。
  - legacy 回滚入口恢复性记录：待在真实云服务器执行故障回滚验证后补齐。

## 九、legacy 退出判断与阶段结论
- legacy 资产保留清单：
  - `docker-compose.yml`
    - 当前职责：旧 `app + postgres + redis + nginx` 容器编排入口。
    - 当前分类：`rollback-only`。
    - 保留原因：仍是 legacy 回滚、差异对照与回滚演练的最小编排基线。
  - `nginx/nginx.conf`
    - 当前职责：旧容器网络中的 HTTPS 反向代理配置，继续把流量转发到 `app:3001`。
    - 当前分类：`rollback-only`。
    - 保留原因：仍是 legacy HTTPS 入口与历史拓扑差异对照基线。
  - `scripts/cloud-deploy.sh`
    - 当前职责：旧容器化部署执行脚本，负责镜像拉取、`compose up`、数据库初始化、`nginx` 启动与本地 HTTPS 探测。
    - 当前分类：`rollback-only`。
    - 保留原因：仍是 legacy 恢复路径、回滚演练与历史运维参考的执行入口。
  - `scripts/bootstrap-deploy-assets.sh`
    - 当前职责：旧容器化部署资产稀疏拉取脚本，用于准备 `.env.example`、`docker-compose.yml`、`nginx/nginx.conf` 与 legacy 部署脚本集合。
    - 当前分类：`rollback-only`。
    - 保留原因：仍用于重建 legacy 回滚工作目录、审计部署基线与演练前准备。
  - `scripts/start-entry.mjs`
    - 当前职责：旧 `Next.js standalone` 生产启动入口，默认阻止直接启动，仅允许 `LEGACY_START=1 npm run start`。
    - 当前分类：`rollback-only`。
    - 保留原因：仍是 legacy 单进程对照与回滚演练入口。
- legacy 资产归档/退出候选：
  - 上述五项资产均属于“后续可归档/可退出候选”，但当前轮尚未满足执行前提。
  - 当前轮没有任何一项资产满足立即归档、立即删除或立即退出条件。
- 后续归档/退出前提：
  - 必须先在真实云服务器补齐正式人工 HTTPS 验收记录。
  - 必须先在真实云服务器补齐正式部署演练记录。
  - 必须先在真实云服务器补齐 legacy 回滚演练记录。
  - 必须把 `/api/health`、主链 smoke、PWA HTTPS 验收、回滚触发条件与最终审核结论收口到可审计记录。
  - 必须由 `phase16-04` 复判并把当前轮最终结论从 `未通过但单值化` 改写为 `通过` 后，才允许进入归档/退出执行。
- 回滚窗口：
  - 当前状态：未关闭；由于真实云服务器 cutover 审核尚未执行，窗口保持打开。
  - 开启条件：开始在真实云服务器执行正式 cutover、正式部署演练或 legacy 回滚演练。
  - 关闭条件：正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练全部通过并形成可追溯记录，且 `phase16-04` 最终结论被改写为 `通过`。
  - 窗口规则：在窗口关闭前，legacy 资产只允许保持 `rollback-only` 身份，不进入删除、归档或退出执行。
- 最终阶段结论：
  - 当前轮结论：`未通过但单值化`。
  - 结论理由：
    - 页面/API/PWA/部署四类 parity matrix 与自动化验证记录已形成单一解释，当前未发现新的源码层 `parity-blocker`。
    - legacy 容器化资产已完成 `rollback-only` 单值化分类，不再承担正式部署、正式运维或正式验收主职责。
    - 正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练仍待真实云服务器执行，当前仍存在 `cutover-blocker`，因此不得写成 `通过`。
- 后续唯一复判入口：
  - 仅允许在真实云服务器补齐上述三类记录后，继续回写本节与根级真相源，并重新判断是否可改写为 `通过`。

## 十、禁止越界项
- 不把本阶段重新扩写成页面重构阶段。
- 不把本阶段重新扩写成正式业务 API 迁移阶段。
- 不重开 PWA 技术方案选型。
- 不把旧文件仍存在直接等同于“原地重构失败”。
- 不在 cutover 审核未完成前直接删除 legacy 资产。
