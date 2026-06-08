# phase14 review-before-spec 收口计划

## Summary
- 目标：在不重写 `phase14` 阶段设计的前提下，完成 `phase14-api-query-parity-and-legacy-route-drain` 当前轮 `/plan` 的最终收口，让仓库稳定停在“阶段文档已产出、等待用户审核、未经批准不得进入 `/spec` 或实现”的单一状态。
- 本轮执行范围只包含文档治理与一致性复核，不进入任何 API/query 切流实现，不删除旧 `src/app/api/*`，不改动 `phase14` 的任务边界、route drain 顺序或 `phase10`/`phase13` 继承结论。
- 已确认必须吸收的上游输入：
  - `docs/phase13_frontend_page_parity_implementation_architecture_plan.md`
  - `docs/phase13_frontend_page_parity_implementation_dev_plan.md`
  - `docs/phase13_frontend_page_parity_implementation_shared_baseline.md`
- 本轮要使用的工具与依据：
  - `Read` / `Grep`：定位根级真相源、`phase13` 上游文档、`phase14` 文档和当前冲突语句。
  - `run_mcp` + Context7：
    - `Hono` 选用 `/websites/hono_dev`，用于确认 `app.route()` 的正确挂载顺序与“静态/更窄路径优先于动态路径”的路由原则。
    - `Prisma` 选用 `/prisma/web`，用于确认交互式事务继续采用 `Serializable + maxWait: 5000 + timeout: 10000 + P2034 有界重试` 的文档依据。
  - `Task`（独立审核时）或等价的只读复核流程：在文档修复后做一次独立一致性审核，确认已进入 review-before-spec 状态。

## Current State Analysis
- `plan.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md` 已基本同步到 `phase14` 审核态，并明确 `docs/phase14_*` 为当前阶段真相源。
- `docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md` 与 `docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md` 已完成主体收口，已吸收：
  - `phase10` 的查询分层、canonical read path 与事务边界；
  - `phase13` 的页面 parity、浏览器验收基线与页面-API/query 交接。
- 当前剩余的明确缺口只有两处，且都已通过只读核对证实：
  - `README.md` 同时存在“当前等待审核，未经批准不进入 `/spec` 或实现”的正确口径，以及“当前默认路线图已不再停留在‘等待审核/不进入 spec’的旧口径”的冲突表述，导致根级入口内部自相矛盾。
  - `docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md` 的 `4.1 API 与路由输入` 漏掉了 `server/app.ts` 与 `server/routes/settings.ts`，但当前仓库实际已由 `server/app.ts` 显式挂载 `apiApp.route('/settings', createSettingsRoutes(env))`，因此 shared baseline 的输入清单不完整。
- 这些缺口不影响 `phase14` 方向判断，但会破坏“文档已产出、等待审核”的单一状态，因此必须在进入用户审核前最小修复。

## Proposed Changes
### 1. 修复 `README.md` 的审核态口径冲突
- 文件：`/home/dell/Projects/Rento/README.md`
- What：
  - 删除或改写与“当前等待审核、未经批准不进入 `/spec` 或实现”相冲突的句子。
  - 保留 `phase12 ~ phase16` 的路线图说明，但不得再暗示当前已越过 `phase14` 审核门槛。
- Why：
  - `README.md` 是对外总览入口，必须与 `AGENTS.md`、`plan.md`、`project_rules.md` 保持相同的 review-before-spec 状态。
- How：
  - 只改动冲突段落附近的最小文本，不新增新阶段结论，不扩写 `phase15`/`phase16`。
  - 路线图保留为“后续阶段序列/长期顺序”说明，而不是“当前已不再等待审核”的状态说明。

### 2. 补齐 `phase14` shared baseline 的 API 输入清单
- 文件：`/home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md`
- What：
  - 在 `4.1 API 与路由输入` 中补入：
    - `server/app.ts`
    - `server/routes/settings.ts`
- Why：
  - `server/app.ts` 是统一 `/api` 与 `/settings` 子宿主的真实挂载入口。
  - `server/routes/settings.ts` 已被 `phase14` 架构文档、当前 Hono 路由形态和 settings 域解释实际使用，shared baseline 漏掉后会造成输入清单不闭环。
- How：
  - 按现有清单风格追加，不改动该文档其他结构。
  - 使 shared baseline 与 `architecture_plan` 第 `2.3` 节、`server/app.ts`、`server/routes/settings.ts` 的现实保持一致。

### 3. 做一次最小范围的根级真相源终审
- 文件范围：
  - `/home/dell/Projects/Rento/README.md`
  - `/home/dell/Projects/Rento/AGENTS.md`
  - `/home/dell/Projects/Rento/project_rules.md`
  - `/home/dell/Projects/Rento/architecture_map.md`
  - `/home/dell/Projects/Rento/plan.md`
  - `/home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md`
  - `/home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md`
  - `/home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md`
- What：
  - 确认所有入口文件都统一表达为：
    - `phase14` 当前轮阶段文档已产出；
    - 当前等待用户审核；
    - 未经批准不得进入 `phase14` 任一 `/spec` 或实现。
  - 确认 `docs/phase14_*` 三份文档继续明确吸收 `phase13` 的页面 parity 输出，而不是重做页面审计。
- Why：
  - 当前仓库已很接近收口完成，终审应只做“是否还有显式矛盾”的检查，不再扩大改动面。
- How：
  - 先只读复核；若发现新的明确冲突，仅允许对该文件做最小文本同步。
  - 若没有新的冲突，则停止在文档审核态，不新增额外改动。

### 4. 做一次独立审核并以结果决定是否收口
- 文件范围同上，重点检查 `README.md` 与 `docs/phase14_*`
- What：
  - 使用独立于主执行流的只读审核手段，验证是否还存在：
    - 审核态/非审核态的冲突描述；
    - `phase14` 输入清单与真实代码路径不一致；
    - `phase13` 上游输入被遗漏或表述回退。
- Why：
  - 当前剩余问题都属于“文档一致性”，最容易被局部遗漏；独立审核能在进入用户审核前给出明确通过/未通过判断。
- How：
  - 优先使用只读型独立审核流程，不做任何实现代码变更。
  - 若独立审核通过，则本轮工作立即停止并交还给用户审核。
  - 若独立审核失败，仅按失败结论补最小文档缺口，不扩大到 `phase14` 内容重构。

## Assumptions & Decisions
- 决策 1：`phase14` 三份文档已经存在且主体内容有效，本轮不是重新产出 `docs/phase14_*`，而是完成“review-before-spec 收口”。
- 决策 2：`phase13` 的三份上游文档已被 `phase14` 主体吸收；本轮只修复“入口状态冲突”和“shared baseline 输入遗漏”，不重新改写 `phase13` 输出。
- 决策 3：继续继承 `phase10` 已冻结的事务边界，不在 `phase14` 文档中重新讨论 Prisma 事务策略；Context7 已确认当前项目采用的 `Serializable + maxWait: 5000 + timeout: 10000 + P2034 有界重试` 口径与 Prisma 文档一致。
- 决策 4：继续继承 Hono 的路由组织原则，不在本轮修改实现；Context7 已确认：
  - 子路由需先在子应用挂好，再由父应用 `app.route()` 挂载；
  - 更具体静态路径应先于动态路径注册。
- 假设 1：除已定位的两处缺口外，根级真相源不会再出现大面积状态漂移；若终审发现额外问题，也应仅限文字同步级修复。
- 假设 2：本轮仍严格停留在 `/plan` 审核前阶段；完成后必须停止，等待用户审核，而不是继续进入 `/spec`。

## Verification Steps
- 复核 `README.md` 中与 `phase14` 状态相关的所有句子，确认不存在“当前等待审核”与“已不再等待审核”的并存描述。
- 复核 `docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md` 的 `4.1 API 与路由输入`，确认至少包含：
  - `server/app.ts`
  - `server/routes/settings.ts`
  - `server/routes/domain.ts`
  - 其余已列出的 `server/routes/*` 与 `src/app/api/**/route.ts`
- 复核 `plan.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`，确认它们都表达为“`phase14` 文档已产出、等待审核、不得进入 `/spec` 或实现”。
- 复核 `docs/phase14_*` 三份文档互链、与 `docs/phase13_*` 的继承关系、以及被引用 `server/*` / `src/lib/*` / `src/app/api/*` 路径存在性。
- 执行一次独立只读审核；只有当审核明确给出“通过”时，才把本轮 `/plan` 视为完成，并停在用户审核态。
