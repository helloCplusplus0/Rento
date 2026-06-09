# Phase16 Parity Verification Cutover And Legacy Exit 开发规划

## 当前状态
- `phase16` 是收口型阶段：本阶段的中心不是继续迁移，而是判断 `Rento-miniX` 是否已经具备替代旧 `Rento` 的条件。
- 当前仓库已经具备阶段输入：`phase13` 页面 parity、`phase14` API/query parity、`phase15` PWA/runtime parity 与 `phase11` 部署/回滚基线均已形成稳定上游。
- 当前轮已完成 `docs/phase16_*` 三件套与根级真相源同步，并已完成 `phase16-01` 的证据盘点、四类 parity matrix 回填与固定落位。
- 四类 parity matrix 固定落位到 `docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`；本文件后续只承接自动化验证结果、人工验收、cutover 审核记录、正式部署/legacy 回滚演练记录与 legacy 退出判断回写。

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
形成本阶段的人工浏览器验收记录、正式部署演练记录、legacy 回滚演练记录与 cutover 审核包。

### 范围
- 页面主链人工浏览器对照
- PC 浏览器 PWA 安装/登录链路复验
- 带公认 HTTPS 证书环境下的 Android + Chrome 安装/更新/离线验证
- 正式部署环境主链访问性与 `/api/health` 结果
- legacy 回滚入口恢复性记录

### DoD
- 人工验收记录必须区分“本地开发验收”和“正式 HTTPS 部署验收”。
- cutover 审核包至少包含：验证命令、健康检查、主链 smoke、PWA 结果、部署演练、回滚演练、回滚触发条件与最终结论。
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
- 待 `phase16-02` 回写：
  - `npm run lint`
  - `npm run type-check`
  - `npm run build:minix`
  - `npm run audit:phase09:legacy-routes`
  - `npm run smoke:phase09:all`
  - `npm run smoke:phase14:wave2`
  - `npm run build:minix:pwa`
  - `bash ./scripts/pwa-smoke-check.sh --profile production-ready --base-url <runtime-url>`
  - `bash ./scripts/health-check.sh --url <runtime-url>`

## 八、人工验收与 cutover 审核记录
- 待 `phase16-03` 回写：
  - 页面主链人工浏览器对照
  - PC 浏览器 PWA 安装/登录链路
  - 带公认 HTTPS 证书环境下的 Android + Chrome 安装/更新/离线验证
  - 正式部署演练记录
  - legacy 回滚演练记录
  - cutover 审核结论

## 九、legacy 退出判断与阶段结论
- 待 `phase16-04` 回写：
  - legacy 资产保留清单
  - legacy 资产归档/退出候选
  - 回滚窗口
  - 最终阶段结论

## 十、禁止越界项
- 不把本阶段重新扩写成页面重构阶段。
- 不把本阶段重新扩写成正式业务 API 迁移阶段。
- 不重开 PWA 技术方案选型。
- 不把旧文件仍存在直接等同于“原地重构失败”。
- 不在 cutover 审核未完成前直接删除 legacy 资产。
