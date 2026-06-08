# Phase14 API Query Parity And Legacy Route Drain /plan

## Summary
- 目标：为 `phase14-api-query-parity-and-legacy-route-drain` 产出可审核的阶段文档，冻结 retained-legacy / compat-wrapper / formal-host-owned 的路由分类、正式 API/query 宿主清单、drain 顺序，以及对 `phase10` 查询分层/事务边界与 `phase13` 页面 parity 输出的继承方式。
- 本轮只进入 `/plan`：不实现 API 切流，不删除旧 `src/app/api/*` 路由，不重写查询模型，不提前进入 `phase15` PWA parity 或 `phase16` cutover。
- 产出物应遵循现有阶段文档模板：
  - `docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md`
  - `docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md`
  - `docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md`
- 在产出阶段文档前，先同步根级真相源中与当前默认工作流、阶段目标、下一步动作直接相关的状态描述，确保不出现第二套阶段入口。

## Current State Analysis
### 已确认的上游输入
- `plan.md#phase14-api-query-parity-and-legacy-route-drain` 已冻结本阶段目标、关键交付与验收条件，且明确前置输入来自 `phase12` 页面-API 关系与 `phase13` 页面 parity 结果。
- `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 已冻结：
  - 正式业务页面 `25/25` 已迁入 `src/minix`
  - 页面 parity 验收矩阵
  - 浏览器验收基线
  - 页面到 retained-legacy API/query 的交接表
- `docs/phase13_frontend_page_parity_implementation_dev_plan.md` 已冻结：
  - `phase13-05` 最终复核结论
  - `/` 与 `/bills/stats` 尾项已收口
  - 后续默认重点切换到 `phase14` 的 retained-legacy API/query drain
- `docs/phase13_frontend_page_parity_implementation_shared_baseline.md` 已冻结：
  - `phase14` 的共享输出必须包含页面清单、迁移状态终结论、验收矩阵、页面与 retained-legacy API 最新依赖关系

### 已确认的代码与宿主现状
- `server/routes/domain.ts` 当前已把以下子宿主挂入统一 Hono `/api`：
  - `/dashboard`
  - `/contracts`
  - `/contracts/:contractId/checkout`
  - `/bills`
  - `/buildings`
  - `/meters`
  - `/meter-readings`
  - `/renters`
  - `/rooms`
- `server/routes/dashboard.ts` 当前是最小 page-closure bridge 宿主，不是最终 dashboard query 真相源；其 `meta.compatBoundary` 明确标注当前处于 retained-legacy bridge 状态。
- `server/lib/legacy-route-inventory.ts` 已是路由分类真相源，并显式区分：
  - `formal-host-owned`
  - `compat-wrapper`
  - `retained-legacy`
- 实际 Hono 正式/半正式承接范围已经显著扩张，示例：
  - `server/routes/contracts.ts` 已有 `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `POST /activate`, `POST /:id/renew`, `POST /:id/generate-bills`, `DELETE /:id`
  - `server/routes/bills.ts` 已有 `GET /`, `POST /`, `GET /stats`, `GET /:id/details`, `GET /:id`, `PATCH /:id`, `PATCH /:id/status`, `DELETE /:id`
  - `server/routes/rooms.ts` 已有 `GET /`, `POST /`, `POST /batch`, `GET /:id`, `PUT /:id`, `PATCH /:id/status`, `GET/POST /:id/meters`, `DELETE /:id`
  - `server/routes/renters.ts`、`server/routes/meter-readings.ts`、`server/routes/meters.ts` 也都已具备 Hono 承接位
- `src/app/api/**/route.ts` 仍大面积保留，说明 `phase14` 不是“从零设计 API 宿主”，而是要把“已经存在但解释分裂”的正式 Hono 宿主、compat wrapper 与 retained-legacy 路由重新排成单一 drain 路径。

### 已确认的阶段继承约束
- `phase10` 已冻结：
  - 查询分层与 canonical read path
  - 统一事务边界 `Serializable + 有界重试`
  - `src/lib/transaction-manager.ts` 作为正式主链写路径事务策略来源
  - `server/lib/legacy-route-inventory.ts` 作为 route inventory 真相源
- `phase13` 已冻结：
  - 工作台、房源、合同、账单、租客、抄表页面分别依赖哪些 retained-legacy API/query
  - 账单 stats、dashboard、renter compat、meter-reading compat 等属于 `phase14` 必须优先解释的桥接带

### Context7 依据
- Hono 最新文档确认：
  - 子路由必须先在子应用内部挂好，再由父应用 `app.route()` 挂接，否则会出现路径缺失
  - 路由按注册顺序匹配，具体路由与窄路径必须优先于更宽泛的动态路径或 catch-all
- 这与当前 `server/routes/domain.ts` 的挂载注释和 `server/routes/bills.ts` 中 `/stats` 需要先于 `/:id` 的现实问题一致，因此 `phase14` 文档应继续沿用“按域拆分子路由 + 显式说明挂载顺序”的组织策略。

## Proposed Changes
### 1. 同步顶层真相源
- 文件：
  - `AGENTS.md`
  - `project_rules.md`
  - `plan.md`
  - `architecture_map.md`
  - 必要时 `README.md`
- 做什么：
  - 把“当前默认工作流已进入 `phase14 /plan`”写成单一状态
  - 明确 `phase14` 的职责不是继续做页面迁移，而是承接 retained-legacy API/query drain 规划
  - 将 `phase13` 的交付物列为 `phase14` 的直接上游输入
- 为什么：
  - 项目规则要求切换默认工作流前，先同步根级真相源
  - 当前虽然入口已切到 `phase14`，但执行时仍需把“阶段目标/下一步/阶段重点”完全对齐到同一口径
- 怎么做：
  - 仅更新状态、职责、下一步和阶段重点描述
  - 不在此轮加入 `phase14` 具体子任务实现细节

### 2. 新建 `phase14` 架构规划
- 文件：
  - `docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md`
- 做什么：
  - 冻结 `phase14` 的核心问题拆分：
    - formal-host-owned：已具备正式 Hono 宿主，仅需定义退出前提
    - compat-wrapper：Hono 已承接主语义，但仍保留旧 Next 包装或 bridge
    - retained-legacy：仍由旧 `src/app/api/*` 承担正式读/写职责，必须排入 drain 顺序
  - 以业务域组织正式宿主规划：
    - dashboard / settings
    - rooms / buildings / meters
    - contracts / checkout
    - bills / bill stats / bill details
    - renters
    - meter-readings / utility-readings
  - 冻结“正式宿主清单 + 临时 bridge 清单 + 可删除前提”
  - 继承 `phase10` 的 query layering / transaction boundary，不重新发明数据访问层
- 为什么：
  - 当前真正缺的是“哪些接口已算正式 Hono，哪些只是桥接，哪些仍然完全留在旧宿主”的单一解释
  - 若没有架构文档，后续 `/spec` 容易把 dashboard bridge、账单 stats、renter/meter compat 和治理接口混成一锅
- 怎么做：
  - 直接引用 `server/lib/legacy-route-inventory.ts` 与 `server/routes/*.ts`
  - 用分域矩阵列出 route path、当前分类、当前正式宿主、依赖页面、退出条件、回滚条件
  - 单独列出“不在 phase14 范围内”的治理接口、PWA、cutover、legacy 资产删除

### 3. 新建 `phase14` 开发规划
- 文件：
  - `docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md`
- 做什么：
  - 把 `phase14` 拆成可进入 `/spec` 的子任务顺序
  - 推荐按“先读路径、后写路径；先 bridge 收口、后 route 删除评估”的顺序拆分
- 建议拆分方向：
  - `phase14-01-route-inventory-reclassification-and-host-matrix`
  - `phase14-02-dashboard-and-settings-query-host-closure`
  - `phase14-03-rooms-buildings-meters-api-drain`
  - `phase14-04-contracts-and-checkout-api-drain`
  - `phase14-05-bills-and-bill-stats-api-drain`
  - `phase14-06-renters-and-meter-readings-api-drain`
  - `phase14-07-legacy-next-api-exit-baseline-closure`
- 为什么：
  - 当前代码面已经不是“缺接口”，而是“缺顺序、缺分类、缺退出边界”
  - 需要让后续每个 `/spec` 只处理一类主问题，避免一次性重写整个 `src/app/api/*`
- 怎么做：
  - 每个子任务固定：目标、范围、当前事实基线、参考来源、不在范围内、DoD、验证要求
  - 每个子任务都显式引用 `phase13` 页面-API 交接表，说明其页面影响面

### 4. 新建 `phase14` 共享基线
- 文件：
  - `docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md`
- 做什么：
  - 冻结 `phase14` 的统一词汇：
    - formal-host-owned
    - compat-wrapper
    - retained-legacy
    - bridge host
    - route drain
    - canonical read path
    - main-chain write transaction
  - 冻结分类判定规则：
    - 哪类接口可以标记为 formal-host-owned
    - 哪类接口虽有 `server/routes/*` 但仍只能算 compat-wrapper
    - 哪类 dashboard / governance 路径仍不能被误写成正式业务 API 完成
  - 冻结 `phase10` 与 `phase13` 的继承边界
- 为什么：
  - `legacy-route-inventory.ts` 已有分类，但阶段文档仍需要解释“在 phase14 里如何用这些分类做决策”
  - 没有共享基线，后续不同子任务会重新定义“桥接已完成”或“可以删除旧入口”
- 怎么做：
  - 以现有 inventory 类型和阶段文档术语为基础
  - 明确治理接口、健康辅助接口、PWA/cutover 不纳入本阶段主范围

### 5. 把 `phase13` 交付物直接吸收到 `phase14`
- 文件：
  - 三份 `docs/phase14_*`
- 做什么：
  - 在 `phase14` 文档中显式引用并继承 `phase13` 的页面-API 交接矩阵
  - 将页面风险转换为 drain 优先级，而不是重新做页面审计
- 重点吸收内容：
  - dashboard/settings 页面仍依赖 `/api/dashboard/*`、`/api/settings*`
  - rooms/add-room 仍依赖 `/api/rooms*`、`/api/buildings*`、`/api/meters*`
  - contracts/add-contract 仍依赖 `/api/contracts*` 与 checkout 相关路由
  - bills/bill-stats 仍依赖 `/api/bills*` 与 retained-legacy stats bridge
  - renters / meter-readings 仍依赖 compat helper + Hono bridge 双入口
- 为什么：
  - 用户明确要求必须吸收 `phase13` 上游产物
  - `phase14` 如果不直接继承这些输入，就会重新做一轮“页面影响面猜测”
- 怎么做：
  - 在架构文档中做“页面域 -> API 域 -> 当前分类 -> phase14 优先级”的映射表
  - 在开发规划中把优先顺序与页面影响面绑定

## Assumptions & Decisions
- 决策：本轮 `/plan` 只产出文档，不做任何 API 切流或代码实现。
- 决策：`phase14` 继续固定正式 API 宿主为 `server/routes/*` + Hono，而不是重新引入第二套服务入口。
- 决策：`server/lib/legacy-route-inventory.ts` 继续作为分类真相源，`phase14` 文档负责解释和排序，不另建第二套路由清单。
- 决策：dashboard 虽已在 `server/routes/dashboard.ts` 提供最小 Hono bridge，但当前仍按 retained-legacy / bridge 问题处理，不能直接判定为正式查询宿主已完成。
- 决策：settings 继续按治理接口处理，除非在 `phase14` 文档中明确被提升为正式业务接口，否则不得借页面已迁移把其误写成主链 drain 完成项。
- 决策：`phase14` 默认优先冻结读路径与 bridge 分类，再安排写路径 compat drain 和旧入口退出判断。
- 假设：后续 `phase14` 的 `/spec` 将沿业务域拆分，而不是按 HTTP 方法或目录结构机械切片。
- 假设：`phase15` 与 `phase16` 不会在本轮 `/plan` 中混入完成条件。

## Verification Steps
- 文档一致性：
  - 复核 `AGENTS.md`、`project_rules.md`、`plan.md`、`architecture_map.md` 与新增 `docs/phase14_*` 的阶段状态、当前下一步、职责边界一致
  - 确认 `docs/phase14_*` 与 `docs/phase13_*` 的上游/下游引用链完整
- 路由事实复核：
  - 交叉检查 `server/lib/legacy-route-inventory.ts`
  - 交叉检查 `server/routes/domain.ts` 与各 `server/routes/*.ts`
  - 交叉检查 `src/app/api/**/route.ts` 仍存路径与文档分类是否一致
- 范围边界复核：
  - 确认文档只规划 API/query parity 与 legacy route drain
  - 确认未把 PWA parity、部署 cutover、legacy 资产删除写成 `phase14` 完成条件
- 继承约束复核：
  - 确认文档明确继承 `phase10` 查询分层、canonical read path 与事务边界
  - 确认文档明确继承 `phase13` 页面 parity、浏览器基线与页面-API 交接表
- 子任务可执行性复核：
  - 确认 `dev_plan` 中每个 `phase14-*` 子任务都有明确目标、范围、DoD、验证要求
  - 确认后续执行者无需再补关键决策即可进入 `/spec`
