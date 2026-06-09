# Phase16 Parity Verification Cutover And Legacy Exit Plan

## Summary

* 本阶段的唯一使命是回答一个最终问题：`Rento-miniX` 是否已经在页面、API/query、PWA、部署与回滚层面具备替代旧 `Rento` 的条件，并能在不依赖旧 `src/app/*`、旧 `src/app/api/*` 与旧 Next PWA 宿主的前提下继续推进开发。

* 本阶段默认采用“证据优先、差异分级、最小补齐”的路线，而不是重新打开页面/API/PWA 的大范围实现。所有差异都必须先被归类，再决定是补齐、保留还是忽略。

* 差异分类固定为三类：

  * `迁移遗漏 / parity-blocker`：旧 `Rento` 已具备、且新主线仍缺失的正式业务能力，必须补齐。

  * `合理技术适配差异 / acceptable-adaptation`：由 `Vite + Hono + React Router + systemd/Caddy` 新路线带来的宿主差异，只要不破坏主链语义、验收结果与可持续开发能力，即视为可接受。

  * `legacy 参考残留 / non-blocking-legacy-reference`：旧 `src/app/*`、旧 `src/app/api/*`、旧容器化资产仍保留为回滚、治理或只读参考，不再承担正式主职责，可在 `phase16` 中按退出条件处理，但不自动等于 blocker。

## Current State Analysis

### 阶段与真相源现状

* `plan.md`、`README.md`、`AGENTS.md` 与 `architecture_map.md` 已把当前默认阶段切换到 `phase16-parity-verification-cutover-and-legacy-exit`，并明确 `phase16` 只继承 `phase13` 页面 parity、`phase14` API/query parity、`phase15` PWA parity 与 `phase11` 部署/回滚基线结果。

* 仓库中当前不存在 `docs/phase16_*` 文件；说明 `phase16` 尚未形成自己的 `architecture_plan`、`dev_plan` 与 `shared_baseline`。

* 按当前仓库规则，进入 `phase16` 的 `/plan` 后，需要先同步顶层文档，再产出：

  * `docs/phase16_parity_verification_cutover_and_legacy_exit_architecture_plan.md`

  * `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`

  * `docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`

### 可直接继承的证据来源

* 页面 parity 证据来自：

  * `docs/phase13_frontend_page_parity_implementation_shared_baseline.md`

  * `src/minix/router/index.tsx`

  * `src/minix/routes/*`

  * `src/app/**/page.tsx`

* API/query parity 与 legacy 分类证据来自：

  * `docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md`

  * `server/lib/legacy-route-inventory.ts`

  * `scripts/phase14-06-query-cutover-smoke.ts`

  * `src/app/api/**/*.ts`

* PWA/runtime parity 证据来自：

  * `docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md`

  * `src/components/pwa/*`

  * `src/minix/layout/MinixRuntimeLayout.tsx`

  * `public/manifest.json`

  * `public/sw.js`

  * `scripts/pwa-smoke-check.sh`

* 部署、cutover 与回滚基线证据来自：

  * `DEPLOYMENT.md`

  * `deploy/caddy/Caddyfile`

  * `deploy/systemd/rento-minix.service`

  * `scripts/start-minix.mjs`

  * `scripts/health-check.sh`

  * `scripts/start-entry.mjs`

  * `docker-compose.yml`

  * `nginx/nginx.conf`

  * `scripts/cloud-deploy.sh`

  * `scripts/bootstrap-deploy-assets.sh`

* 自动化验证入口已经存在：

  * `npm run lint`

  * `npm run type-check`

  * `npm run build:minix`

  * `npm run build:minix:pwa`

  * `npm run audit:phase09:legacy-routes`

  * `npm run smoke:phase09:all`

  * `npm run smoke:phase14:wave2`

  * `bash ./scripts/pwa-smoke-check.sh --profile ...`

  * `bash ./scripts/health-check.sh --url ...`

### 当前关键未知数

* 目前还没有一个单一 `phase16` 文档把以下内容汇总成可审核结论：

  * 旧 `Rento` 与 `Rento-miniX` 的完整 parity 矩阵

  * 哪些残留差异属于迁移遗漏，哪些属于合理技术适配

  * cutover 审核通过的最小证据包

  * legacy 资产退出顺序与触发条件

* `server/lib/legacy-route-inventory.ts` 已可汇总 `formal-host-owned` / `compat-wrapper` / `retained-legacy` 分类，但当前尚未有 `phase16` 文档把这些分类进一步翻译为“正式 blocker / 可接受差异 / 治理延后项”。

* `phase15` 已记录“本地 PC + Edge/Chrome + HTTP 安装成功，本地移动端 HTTP 无安装入口属于预期退化”；但 `phase16` 仍需把“带公认 HTTPS 证书的移动端最终浏览器结论”纳入 cutover 证据包，而不是继续停留在上游说明层。

## Proposed Changes

### 1. 产出 `phase16` 文档包并冻结差异分类标准

#### `docs/phase16_parity_verification_cutover_and_legacy_exit_architecture_plan.md`

* 冻结 `phase16` 的唯一职责、直接继承输入、与 `phase11 ~ phase15` 的关系、正式交付边界与 legacy 退出边界。

* 明确 `phase16` 不承担：

  * 正式业务 API 新迁移

  * 页面重设计

  * PWA 新方案重构

  * ORM / 数据访问主线重开

* 固定 `phase16` 的差异分类标准：

  * `迁移遗漏 / parity-blocker`

  * `合理技术适配差异 / acceptable-adaptation`

  * `legacy 参考残留 / non-blocking-legacy-reference`

* 明确“合理技术适配差异”的判断口径：

  * 新旧宿主协议不同，但页面信息结构、主链流程、状态反馈、API 行为与发布能力一致

  * 新主线已能继续开发，旧入口只剩参考/兼容/回滚价值

  * 差异不导致业务主链不可用、不导致数据语义漂移、不导致正式部署依赖旧技术栈

#### `docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`

* 冻结 `phase16` 的统一词汇与共享判断标准。

* 至少写清四类最终验收矩阵：

  * 页面 parity matrix

  * API/query parity matrix

  * PWA/runtime parity matrix

  * deploy/cutover/rollback matrix

* 把现有上游证据翻译成最终可审计分类：

  * `phase13` 的 `25/25` 正式业务页面迁移结论

  * `phase14` 的 `formal-host-owned / compat-wrapper / retained-legacy` route inventory

  * `phase15` 的 PWA 最小验收路径与 HTTPS 前提

  * `phase11` 的部署/回滚记录字段与 legacy 资产保留/退出条件

* 在本文件中明确：

  * 旧 `src/app/**/page.tsx` 仍可保留为原型/只读参考，不自动视为 blocker

  * 旧 `src/app/api/*` 中 remaining governance / compat wrapper 只有在仍承担正式业务主职责时才是 blocker

  * 旧容器化资产只有在正式 cutover 审核通过、替代入口与回滚记录冻结后才允许进入退出决策

#### `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`

* 按固定顺序拆成最小实施步骤：

  * `phase16-01-evidence-inventory-and-parity-matrix`

    * 汇总页面/API/PWA/部署证据来源

    * 生成最终 parity 矩阵

    * 给每个差异打上 `parity-blocker / acceptable-adaptation / non-blocking-legacy-reference`

  * `phase16-02-automated-verification-and-gap-triage`

    * 固定自动化验证命令组合

    * 对失败项进行 gap triage

    * 若发现迁移遗漏，必须把具体缺口映射到真实文件与真实验收影响面

  * `phase16-03-manual-acceptance-and-cutover-packet`

    * 冻结人工浏览器验收清单与结果记录格式

    * 冻结正式部署/回滚演练记录模板

    * 收口 cutover 审核通过条件

  * `phase16-04-legacy-exit-decision-and-root-sync`

    * 冻结 legacy 资产退出顺序、删除前提、回滚窗口

    * 同步根级真相源

    * 明确“哪些 legacy 资产继续保留、哪些可归档、哪些可停止作为正式依赖”

* 对每个子任务写清：

  * 参考来源

  * 输入文件

  * 产出文件

  * blocker 判定方式

  * 是否允许进入后续 `/spec` / 实施

### 2. 同步根级真相源，让 `phase16` 进入单一解释

#### 需要同步的文件

* `README.md`

* `AGENTS.md`

* `project_rules.md`

* `global_skills.md`

* `project_skills.md`

* `plan.md`

* `architecture_map.md`

* `DEPLOYMENT.md`

#### 同步内容

* 把当前阶段从“进入 `phase16` 准备”同步为“`phase16` 已完成 `/plan` 文档冻结，等待实施/审核”。

* 明确 `phase16` 的正式目标不是“继续迁移”，而是：

  * 验证 `Rento-miniX` 是否已经足以替代 `Rento`

  * 枚举并分类剩余差异

  * 对迁移遗漏形成补齐任务

  * 对合理适配差异形成接受结论

  * 对 legacy 资产形成退出顺序与回滚窗口

* 在顶层文档中统一写明：

  * 旧 `Rento` 页面/API/PWA 宿主是否仍是正式运行必需项

  * 哪些 legacy 资产只是回滚基线

  * `phase16` 的通过条件是什么

### 3. 冻结页面 / API / PWA / 部署四类 parity 矩阵的具体组织方式

#### 页面 parity matrix

* 直接以 `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 中的 `25` 个正式业务页面为基线，不重开范围。

* 对每个页面只允许三种结论：

  * `已满足 parity`

  * `存在迁移遗漏，必须补齐`

  * `存在可接受宿主差异，可忽略`

* P2/P3/P4 页面继续按 `phase13` 已冻结口径处理，不被误计为正式业务 blocker。

#### API/query parity matrix

* 直接以 `server/lib/legacy-route-inventory.ts` 为唯一旧 API 分类真相源。

* `formal-host-owned` 默认视为“已满足宿主替代”，除非自动化验证或主链 smoke 证明其仍依赖旧入口。

* `compat-wrapper` 默认需要继续判断：

  * 是否仍承担正式业务主职责

  * 是否只是 in-process proxy / 回滚基线 / 双入口兼容

  * 是否具备明确退出条件

* `retained-legacy` 默认拆成两类：

  * 正式业务 blocker：若仍承担正式业务主职责，必须补齐

  * 治理/辅助延后项：若只属于 governance/health/辅助统计且不阻断纯新主线交付，可作为 non-blocking legacy reference 记录

#### PWA/runtime parity matrix

* 直接继承 `phase15` 的验证结果与差异解释。

* 在 `phase16` 中补齐并固定：

  * 本地 PC 验收记录

  * 正式 HTTPS 环境下的移动端安装/更新/离线验收结果

  * 哪些浏览器差异属于合理适配而非 blocker

* 明确：

  * 本地移动端 HTTP 无安装入口不构成 blocker

  * 带公认 HTTPS 证书的部署环境仍是最终移动端安装判断基线

#### deploy / cutover / rollback matrix

* 直接继承 `DEPLOYMENT.md` 中的正式部署主线、回滚基线与记录字段要求。

* `phase16` 需要把以下内容汇总为单一审计包：

  * `npm run build:minix` / `npm run start:minix` 路径

  * `/api/health` 与主链 smoke

  * `build:minix:pwa` 与 PWA smoke

  * 正式部署演练记录

  * legacy 回滚演练记录

  * `LEGACY_START=1 npm run start` 的 legacy-only 身份

### 4. 固定 gap 处理规则，避免 phase16 重新发散

#### 若发现 `迁移遗漏 / parity-blocker`

* 必须在 `phase16` 文档中写清：

  * 受影响的旧能力

  * 对应的新主线缺口

  * 实际受影响的页面/API/PWA/部署路径

  * 涉及的真实文件

  * 最小补齐策略

  * 回归验证路径

* 后续实现时只允许围绕这些已命名缺口做最小补丁，不重新扩写阶段范围。

#### 若判定为 `合理技术适配差异`

* 必须明确写出：

  * 差异来源

  * 为什么不影响正式业务交付

  * 为什么不影响后续继续开发

  * 为什么不构成 cutover blocker

* 不允许只写“看起来没问题”或“体验差不多”。

#### 若判定为 `legacy 参考残留`

* 必须写明：

  * 当前保留原因

  * 退出条件

  * 回滚价值

  * 是否仍与正式交付链路耦合

* 若仍与正式交付链路耦合，则不得按“残留参考项”处理，必须上调为 blocker。

### 5. 固定 `phase16` 的验证组合

#### 文档与路径验证

* `docs/phase16_*` 三件套互链复核

* 被引用路径存在性复核，至少覆盖：

  * `src/minix/*`

  * `src/components/pwa/*`

  * `server/lib/legacy-route-inventory.ts`

  * `scripts/phase09-05-main-flow-smoke.ts`

  * `scripts/phase14-06-query-cutover-smoke.ts`

  * `scripts/pwa-smoke-check.sh`

  * `deploy/caddy/Caddyfile`

  * `deploy/systemd/rento-minix.service`

  * `docker-compose.yml`

  * `nginx/nginx.conf`

#### 自动化验证

* 最低固定组合：

  * `npm run lint`

  * `npm run type-check`

  * `npm run build:minix`

  * `npm run audit:phase09:legacy-routes`

  * `npm run smoke:phase09:all`

  * `npm run smoke:phase14:wave2`

  * `npm run build:minix:pwa`

  * `bash ./scripts/pwa-smoke-check.sh --profile production-ready --base-url <runtime-url>`

  * `bash ./scripts/health-check.sh --url <runtime-url>`

* 若其中任一验证无法执行，必须在 `phase16` 文档中解释：

  * 无法执行的原因

  * 它是否构成 blocker

  * 临时替代验证路径

#### 人工验收

* 至少包含：

  * 页面主链人工浏览器对照

  * PC 浏览器 PWA 安装/登录链路

  * 带公认 HTTPS 证书环境下的 Android + Chrome 安装/更新/离线验证

  * 正式部署环境主链可访问性

  * legacy 回滚入口可恢复性

## Assumptions & Decisions

* 假设 `phase16` 的首要交付仍是文档与审核基线，而不是直接开始补丁实现；只有在证据盘点后确认存在真实 blocker，才进入后续 `/spec` 或实现。

* 决定以现有仓库中的脚本与 inventory 文件作为一手证据源，不再另外创建第二套 parity 统计脚本作为当前 `/plan` 前提。

* 决定不把“旧文件仍存在”直接等同于“重构未完成”；只有当旧文件仍承担正式运行主职责、或阻断纯新主线交付时，才视为 blocker。

* 决定把“移动端本地 HTTP 无安装入口”固定为可接受技术差异，而把“带公认 HTTPS 证书环境下的移动端安装/更新/离线结果”固定为最终 PWA cutover 判断基线。

* 决定 `phase16` 可以有两种合法结论：

  * `通过`：纯新主线具备替代旧 `Rento` 的条件，剩余 legacy 资产只保留归档/回滚/只读参考职责。

  * `未通过但单值化`：明确列出全部 blocker，并把每个 blocker 映射到具体补齐任务；不得给出“差不多可以”这类模糊结论。

## Verification Steps

1. 只读确认 `docs/phase16_*` 当前不存在，且上游输入确实来自 `phase13_*`、`phase14_*`、`phase15_*`、`DEPLOYMENT.md`、`server/lib/legacy-route-inventory.ts` 与现有 smoke 脚本。
2. 产出 `docs/phase16_*` 三件套，并在文档中冻结四类 parity 矩阵、差异分类标准、cutover/rollback/legacy-exit 判断规则。
3. 同步 `README.md`、`AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md`、`architecture_map.md`、`DEPLOYMENT.md` 的 `phase16` 口径。
4. 在实施阶段按文档执行固定验证组合：

   * `npm run lint`

   * `npm run type-check`

   * `npm run build:minix`

   * `npm run audit:phase09:legacy-routes`

   * `npm run smoke:phase09:all`

   * `npm run smoke:phase14:wave2`

   * `npm run build:minix:pwa`

   * `bash ./scripts/pwa-smoke-check.sh --profile production-ready --base-url <runtime-url>`

   * `bash ./scripts/health-check.sh --url <runtime-url>`
5. 把人工浏览器验收、正式部署演练与 legacy 回滚演练记录回写到 `phase16` 文档与根级真相源。
6. 最终用独立审核再次判断：

   * `Rento-miniX` 是否已具备完整替代旧 `Rento` 的条件

   * 剩余差异是否都已被合理归类

   * legacy 资产是否只剩归档/只读参考职责

