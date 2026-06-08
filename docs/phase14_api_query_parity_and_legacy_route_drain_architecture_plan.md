# Phase14 API Query Parity And Legacy Route Drain 架构规划

## 当前状态
- `phase10` 已完成长期数据访问层、查询分层、统一事务边界与 legacy route inventory 的当前轮冻结，继续作为 `phase14` 的数据访问上游输入。
- `phase11` 已完成正式部署主线、发布门禁与 legacy 回滚基线冻结，继续作为 `phase14` 的运行与回滚上游输入。
- `phase12` 已冻结页面-API 联动、页面映射与 UI 保真边界；`phase13` 已完成正式业务页面 `25/25` 迁移、浏览器验收基线与页面-API/query 交接表。
- 当前文档用于冻结 `phase14-api-query-parity-and-legacy-route-drain` 的实施架构，不替代：
  - [phase14_api_query_parity_and_legacy_route_drain_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md)
  - [phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md)
- 当前轮不执行 `phase14` 的任何 API/query 切流实现，不删除旧 `src/app/api/*` 路由，不提前进入 `phase15` PWA parity 或 `phase16` cutover/legacy-exit。

## 一、文档目标
本文档用于回答以下问题，并把答案冻结成后续 `phase14-*` `/spec` 的单一依据：

- 当前旧 `src/app/api/*` 中哪些路径已经具备正式 Hono 宿主，哪些仍只是 compat wrapper，哪些仍是 retained-legacy
- 正式业务 API/query 在 `server/routes/*`、共享领域服务与查询层中的长期承接位应如何解释
- `phase13` 已迁页面对应的 retained-legacy API/query 应按什么顺序 drain，才能避免页面 parity 与 API parity 解释继续分裂
- 在不反向改写 `phase10` 查询分层、事务边界与 `phase11` 部署主线的前提下，如何给后续 `/spec` 提供可执行的 route inventory 退出顺序

## 二、继承输入
### 2.1 冻结自 `phase10` 的数据访问输入
- `Prisma + PostgreSQL` 继续作为正式数据访问主线
- 查询层继续显式区分：
  - 正式主链查询
  - legacy compat 查询
  - 治理/脚本查询
- `src/lib/transaction-manager.ts` 继续作为正式主链写路径事务策略来源
- 主链写事务继续固定为：
  - `Serializable`
  - `maxWait: 5000`
  - `timeout: 10000`
  - `P2034` 有界重试
- `server/lib/legacy-route-inventory.ts` 继续作为旧 `src/app/api/*` 的分类真相源

### 2.2 冻结自 `phase13` 的页面上游输入
- 正式业务页面 `25/25` 已迁入 `src/minix`
- 页面 parity 验收矩阵已冻结
- 浏览器最小验收路径已冻结
- 页面到 retained-legacy API/query 的交接关系已冻结，重点包括：
  - dashboard / settings
  - rooms / buildings / meters
  - contracts / checkout
  - bills / bill stats
  - renters
  - meter-readings / utility-readings

### 2.3 当前正式 Hono 宿主输入
- `server/app.ts`
- `server/routes/domain.ts`
- `server/routes/dashboard.ts`
- `server/routes/settings.ts`
- `server/routes/contracts.ts`
- `server/routes/checkout.ts`
- `server/routes/bills.ts`
- `server/routes/rooms.ts`
- `server/routes/buildings.ts`
- `server/routes/meters.ts`
- `server/routes/renters.ts`
- `server/routes/meter-readings.ts`

### 2.4 当前旧宿主输入
- `src/app/api/**/route.ts`
- `server/lib/legacy-route-inventory.ts`
- `src/lib/queries.ts`
- `src/lib/optimized-queries.ts`
- `src/lib/dashboard-queries.ts`
- `src/lib/global-settings.ts`
- `src/lib/page-closure-compat/*`

## 三、当前实施基线
### 3.1 统一 `/api` 宿主当前形态
- 当前 `server/app.ts` 已把 `createDomainRoutes(env)` 一次性挂到统一 `/api`。
- `server/routes/domain.ts` 当前已挂入：
  - `/dashboard`
  - `/contracts`
  - `/contracts/:contractId/checkout`
  - `/bills`
  - `/buildings`
  - `/meters`
  - `/meter-readings`
  - `/renters`
  - `/rooms`
- 这说明 `phase14` 的核心不是“是否存在 Hono 宿主”，而是“哪些 Hono 路由已经是正式宿主，哪些仍只是 bridge/compat 包装”。

### 3.2 route inventory 当前分类现状
- `server/lib/legacy-route-inventory.ts` 已继续使用三类分类：
  - `formal-host-owned`
  - `compat-wrapper`
  - `retained-legacy`
- 当前 inventory 已能表达：
  - 旧路由的当前职责
  - formal host 是否已存在
  - bridge host 是否存在
  - 共享领域服务或 legacy query helper 的依赖落点
  - keep reason / exit condition / rollback condition
- 但当前仍缺：
  - 分域优先级
  - 与 `phase13` 页面影响面的绑定解释
  - “已存在 Hono 路由但仍不算正式宿主”的判定规则

### 3.2.1 `phase14-01` 冻结的 host matrix 字段集
`phase14-01` 当前轮不重写 inventory 数据结构，而是把现有 inventory、Hono 路由与 `phase13` 页面交接表统一收口为后续子任务可直接复用的字段集：

| 字段 | 固定含义 | 当前主要来源 |
| --- | --- | --- |
| `inventoryScope` | 当前业务域所覆盖的旧 `src/app/api/*` 路径集合 | `server/lib/legacy-route-inventory.ts` |
| `dominantCategory` | 当前业务域最能代表 drain 判断的主分类；若同域混合，则显式标注 `retained-legacy + compat-wrapper` | `server/lib/legacy-route-inventory.ts` |
| `formalHosts` | 当前已被 inventory 记录为正式宿主的 Hono 路由文件；为空即表示尚未冻结正式宿主 | `server/lib/legacy-route-inventory.ts` |
| `bridgeHosts` | 当前仍只承担 page-closure bridge、compat bridge 或静态路由兜底的承接位 | `server/lib/legacy-route-inventory.ts`、`server/routes/*.ts` |
| `domainServicePaths` | 当前仍支撑该域正式语义、legacy 查询或 compat helper 的共享服务/查询落点 | `server/lib/legacy-route-inventory.ts` |
| `pageImpact` | 直接受该域 retained-legacy API/query 影响的 `phase13` 已迁页面 | `docs/phase13_*` |
| `drainPriority` | 后续 `phase14-02 ~ phase14-07` 进入 `/spec` 的固定先后顺序输入 | `docs/phase14_*` |
| `freezeConclusion` | 对“当前正式宿主 / 当前 bridge / 当前 compat / 当前 retained-legacy”的单一解释 | 本文档当前轮冻结结论 |

### 3.2.2 “已有 Hono 路由但仍不算正式宿主”的统一判定
- 仅有 `server/routes/*.ts` 文件存在，或仅在 `server/app.ts` / `server/routes/domain.ts` 中完成挂载，不足以判定为 `formal-host-owned`。
- 若 inventory 的主分类仍是 `retained-legacy`，或 `formalHosts` 为空、页面首屏仍依赖 `src/lib/page-closure-compat/*` / legacy query helper，则当前 Hono 只能解释为 `bridge host` 或 `compat host`。
- 若 inventory 虽记录了部分 `formalHosts`，但同域关键读路径仍由旧 `src/app/api/*` 承担，或同域关键静态路径尚未在 Hono 中形成完整覆盖，也不得把整个业务域提前提升为“正式宿主已冻结”。
- 只有当以下四点同时成立时，业务域才可按 `formal-host-owned` 解释：
  - inventory 的相关主路径已切到 `formal-host-owned`
  - 页面/脚本调用方向具备单一解释
  - bridge helper 不再承担主查询真相
  - 退出条件与回滚条件能够直接复用 inventory 结论
- 当前最典型的“有 Hono 但仍不是正式宿主”示例包括：
  - `dashboard`：`server/routes/dashboard.ts` 已存在，但域主分类仍是 `retained-legacy`
  - `settings`：`server/routes/settings.ts` 已挂到 `/api/settings`，但 inventory 仍把其视为治理型 `retained-legacy`
  - `renters`：`server/routes/renters.ts` 已存在，但 inventory 的 `formalHosts` 仍为空，只能解释为 bridge
  - `meter-readings`：Hono 已承接写入与部分详情，但列表/history/status/repair 仍由 compat bridge 维持

### 3.3 Hono 宿主与 retained-legacy 的主要错位点
- `dashboard`：
  - `server/routes/dashboard.ts` 已可承接 `/api/dashboard/stats`、`/api/dashboard/vacant-rooms`、`/api/dashboard/leaving-tenants`、`/api/dashboard/upcoming-contracts`、`/api/dashboard/contract-alerts`
  - inventory 中仍保留 `/api/dashboard/overdue-payments` 与 `/api/dashboard/unpaid-rent` 两条 retained-legacy 路径，说明 dashboard 域当前仍未形成单一正式 query host
  - 但当前实现仍明确依赖 `src/lib/page-closure-compat/dashboard.ts`，属于 retained-legacy bridge，而不是最终 dashboard query 真相源
- `settings`：
  - `server/app.ts` 当前已显式挂载 `/settings` 子宿主，说明 settings API 不再只是“页面已迁移但服务端完全缺位”的状态
  - 但当前 settings 仍主要处于治理/初始化口径，`phase14` 必须先冻结它是治理型 bridge、正式业务 API 候选，还是继续 retained-legacy 保留
- `bills`：
  - `server/routes/bills.ts` 已承接列表、创建、详情、状态更新、删除与 `/stats`
  - 但 inventory 仍显示 `/api/bills`、`/api/bills/:id` 的部分 GET、`/api/bills/:id/details`、`/api/bills/:id/utility-details` 与 `/api/bills/stats` 仍存在 retained-legacy / bridge 角色
- `contracts`：
  - `server/routes/contracts.ts` 已承接列表、创建、详情、编辑、激活、续租、补账单、删除
  - 但 inventory 仍显示旧 `src/app/api/contracts*` 中 GET/PUT 与兼容删除/续租/checkout 混杂并存，说明需要拆清“正式宿主已冻结”与“旧入口仍在承接页面流量”的差异
- `rooms / buildings / meters`：
  - `server/routes/rooms.ts`、`buildings.ts`、`meters.ts` 已具备较完整 Hono 承接位
  - 但旧 `/api/rooms*` 仍保留大量 retained-legacy 查询与局部 compat 包装
- `renters / meter-readings`：
  - `server/routes/renters.ts` 与 `server/routes/meter-readings.ts` 已存在
  - 但当前仍大量依赖 `src/lib/page-closure-compat/renters.ts` 与 `src/lib/page-closure-compat/meter-readings.ts`，本质仍属 bridge / compat 过渡带
### 3.4 `phase13` 对 `phase14` 的直接输入
`phase13` 已冻结以下页面到 API/query 的交接事实，`phase14` 必须直接消费：

| 页面 / 域 | 当前页面状态 | 直接关联 retained-legacy API / query | `phase14` 需要冻结的解释 |
| --- | --- | --- | --- |
| 工作台 / 设置 | `/` 与 `/settings` 已迁移 | `/api/dashboard/*`、`/api/settings*` | dashboard 是否作为正式查询宿主迁入 Hono；settings 继续治理保留还是提升为正式宿主 |
| 房源 / 新增房源 | `/rooms*`、`/add/room` 已迁移 | `/api/rooms*`、`/api/rooms/:id/meters`、`/api/meters/:meterId*`、`/api/buildings*` | 房源读路径、楼栋引用数据、仪表读写与删除门禁的宿主归属 |
| 合同 / 快捷签约 | `/contracts*`、`/add/contract` 已迁移 | `/api/contracts*` | 列表/详情/编辑/续租/退租/补账单的读写切流顺序 |
| 账单 | `/bills*` 与 `/bills/stats` 已迁移 | `/api/bills*` | 账单列表/详情/明细/统计的 query host，及 compat 删除/状态更新的退出前提 |
| 租客 | `/renters*` 已迁移 | `/api/renters*` | 共享 compat helper 与 Hono bridge 的退出边界 |
| 抄表 | `/meter-readings*` 已迁移 | `/api/meter-readings*`、`/api/utility-readings` | 批量抄表、历史、状态检查、repair-status 与 utility 兼容层的去向 |

### 3.5 Context7 对路由组织的补充依据
- Hono 当前文档继续强调：
  - 子路由必须先在子应用内部挂好，再由父应用 `app.route()` 挂接
  - 更窄路径与更具体的静态路由必须优先于动态路径与兜底路由
- 因此 `phase14` 的正式路由组织原则继续固定为：
  - 以业务域拆分 `server/routes/*`
  - 用 `server/routes/domain.ts` 做单一聚合挂载
  - 在各域子路由内部先注册窄路径，再注册动态路径，再注册兜底/bridge

## 四、正式业务 API/query 全量分类矩阵
### 4.1 分类规则
| 分类 | 当前含义 | `phase14` 的默认动作 |
| --- | --- | --- |
| `formal-host-owned` | 正式 Hono 宿主已冻结，旧 Next 入口只剩回滚/退出评估价值 | 定义退出前提与回滚条件，不再重新规划主语义 |
| `compat-wrapper` | 正式语义已迁到 Hono 或共享领域服务，但旧入口仍承担兼容包装、会话透传或双入口 bridge | 先冻结桥接边界，再安排 drain 顺序与删除前提 |
| `retained-legacy` | 旧 `src/app/api/*` 仍承担正式读/写职责，或当前 Hono 仅是过渡 bridge | 作为 `phase14` 核心 drain 对象，必须给出正式宿主与退出顺序 |

### 4.2 `phase14-01` 分域 host matrix 冻结结果
| 业务域 | `inventoryScope` | `dominantCategory` | `formalHosts` / `bridgeHosts` 冻结结论 | `pageImpact` | `drainPriority` | `freezeConclusion` |
| --- | --- | --- | --- | --- | --- | --- |
| Auth / Health | `/api/auth/*`、`/api/health` | `formal-host-owned` | `server/routes/auth.ts`、`server/routes/health.ts` 已冻结为正式宿主 | `/login`、运行时健康检查 | 不纳入主线 drain | 保持已完成态，只保留退出评估与回滚基线 |
| Dashboard | `/api/dashboard/stats`、`/contract-alerts`、`/upcoming-contracts`、`/leaving-tenants`、`/overdue-payments`、`/unpaid-rent`、`/vacant-rooms` | `retained-legacy` | `server/routes/dashboard.ts` 当前只可解释为 page-closure bridge；inventory 虽对部分路径记录 `formalHosts`，但 `/unpaid-rent`、`/vacant-rooms` 仍无正式宿主冻结，且首页查询继续依赖 `src/lib/page-closure-compat/dashboard.ts` | `/` | D1 | dashboard 域尚未形成单一正式 query host，需先在 `phase14-02` 统一“正式 Hono 查询宿主”还是“继续 bridge”结论 |
| Settings | `/api/settings`、`/api/settings/init` | `retained-legacy` | `server/app.ts` 已挂 `server/routes/settings.ts`，但 inventory 仍将 settings 视为治理型 retained-legacy；当前 Hono 仅能解释为最小治理兼容宿主 | `/settings` | D1 | settings 不因 Hono 已挂载就自动升级为正式业务 API；后续需先冻结其治理身份、权限边界与审计口径 |
| Rooms | `/api/rooms`、`/api/rooms/batch`、`/api/rooms/:id`、`/api/rooms/:id/status`、`/api/rooms/:id/meters` | `retained-legacy` 为主 | `server/routes/rooms.ts` 仅对批量创建与删除门禁相关路径具备 formal/compat 承接；列表、详情、编辑、房态修改、房间挂表仍无正式宿主冻结 | `/rooms`、`/rooms/:id`、`/rooms/:id/edit`、`/add/room`、`/add/contract` | D2 | 房源域必须按“读路径 retained、局部写路径 compat”解释，不能把 `rooms.ts` 的存在误判成整域已切流 |
| Buildings | `/api/buildings`、`/api/buildings/:id` | `formal-host-owned` | `server/routes/buildings.ts` 已冻结为正式宿主；旧 Next 入口仅保留回滚价值 | `/rooms`、`/add/room` | D2 | 楼栋域已可按 formal-host-owned 解释，但其退出仍受房源引用数据回滚基线约束 |
| Meters | `/api/meters/:meterId`、`/api/meters/:meterId/status`，以及与 `/api/rooms/:id/meters` 的联动边界 | `compat-wrapper` 为主 | `server/routes/meters.ts` 已承接仪表详情、更新、状态切换与受控删除；但房间挂表仍留在 `/api/rooms/:id/meters` retained-legacy | `/rooms`、`/rooms/:id`、`/add/room`、`/meter-readings/*` | D2 | 仪表域不能脱离房间挂表链路单独宣布完成，需把“独立资产正式宿主”与“房间绑定 retained-legacy”同时写清 |
| Contracts | `/api/contracts`、`/api/contracts/:id`、`/activate`、`/:id/generate-bills`、`/:id/renew` | `retained-legacy + compat-wrapper` | `server/routes/contracts.ts` 已承接激活、续租、补账单、删除等正式语义；合同列表、详情、编辑读写仍由旧宿主承担 | `/contracts`、`/contracts/new`、`/contracts/:id`、`/contracts/:id/edit`、`/contracts/:id/renew`、`/add/contract` | D3 | 合同域必须拆成“读路径 retained-legacy + 生命周期/删除/补账单 compat”双层解释 |
| Checkout | `/api/contracts/:id/checkout` | `compat-wrapper` | `server/routes/checkout.ts` 已是退租结算正式事务宿主；旧 Next 入口仅保留 compat 包装 | `/contracts/:id/checkout` | D3 | checkout 已具备明确 formal host，但仍与 contracts 主域一起验收，避免退租结算与合同主链分裂 |
| Bills | `/api/bills`、`/api/bills/:id`、`/api/bills/:id/status`、`/api/bills/:id/details`、`/api/bills/:id/utility-details`、`/api/bills/stats` | `retained-legacy + compat-wrapper` | `server/routes/bills.ts` 已承接创建、状态更新、删除与静态 `/stats` bridge；列表、详情读取、明细、utility details 仍由 legacy 查询承接 | `/bills`、`/bills/:id`、`/bills/:id/edit`、`/bills/stats`、`/contracts/:id` | D4 | 账单域需明确把 `/stats` 视为 retained-legacy page-to-legacy bridge，而非已完成正式统计宿主切流 |
| Renters | `/api/renters`、`/api/renters/:id`、`/api/renters/stats` | `compat-wrapper` | inventory 的 `formalHosts` 为空，`bridgeHosts` 明确指向 `server/routes/renters.ts`；当前 Hono 与旧 Next 共同复用 `src/lib/page-closure-compat/renters.ts` | `/renters`、`/renters/new`、`/renters/:id`、`/renters/:id/edit`、`/add/contract` | D5 | renters 域当前只能解释为 bridge/compat 双入口，不能提前视为正式 Hono 宿主已冻结 |
| Meter Readings | `/api/meter-readings`、`/api/meter-readings/:id`、`/api/meter-readings/:id/related-bills`、`/api/meter-readings/status-check`、`/api/meter-readings/repair-status` | `compat-wrapper` | `POST /api/meter-readings` 与详情/关联账单已具备 Hono formal/compat 承接，但列表/history、status-check、repair-status 仍通过 `server/routes/meter-readings.ts` + shared helper 维持 bridge | `/meter-readings/batch`、`/meter-readings/history`、`/bills/:id` | D5 | 抄表域必须按“写入与详情较接近正式宿主、history/status/repair 仍是 bridge”解释，避免误删历史兼容链路 |
| Utility | `/api/utility-readings` | `compat-wrapper` | 当前无 Hono 正式宿主；仅复用 `src/lib/domain/meters/index.ts` 提供 legacy utility compat | `/meter-readings/history`、`/bills/:id` | D5 | utility 继续视为抄表域的历史兼容尾项，不因 meters 领域服务已存在就误判为已切流 |
| Governance | `/api/validation`、`/api/data-consistency`、`/api/health/system`、`/api/health/bills`、`/api/bills/repair-details`、repair/status-check 等 | `retained-legacy` 或治理型 `compat-wrapper` | 默认不进入正式业务 API 完成判定；仅保留治理/修复/健康辅助职责 | `/settings` 辅助入口、延后治理页 `/system-health`、`/data-consistency` | 延后 | 本轮只冻结边界，不把治理/辅助接口包装成已完成切流的正式业务 API |

### 4.3 `phase13` 页面影响面绑定结果
| 页面组 | 当前直接依赖域 | 当前绑定解释 |
| --- | --- | --- |
| `/` | Dashboard | 首页已完成页面 parity，但首页数据仍依赖 dashboard retained-legacy / bridge 查询组合 |
| `/settings` | Settings、Governance | 设置主页已迁移；settings API 仍属治理型 retained-legacy，治理辅助入口仍保持延后边界 |
| `/rooms*`、`/add/room` | Rooms、Buildings、Meters | 房源页面已迁移，但列表/详情/房态/挂表仍跨 retained-legacy、formal-host-owned 与 compat-wrapper 三类 |
| `/contracts*`、`/add/contract` | Contracts、Checkout、Rooms、Renters | 合同与退租页面已迁移，但合同读路径 retained-legacy 与 checkout formal host 仍需分开解释 |
| `/bills*`、`/bills/stats` | Bills、Dashboard | 账单页已迁移，但 `/api/bills/stats` 仍是 page-to-legacy bridge，账单详情/明细仍依赖旧查询路径 |
| `/renters*` | Renters | 租客页面已迁移，但仍直接受 shared compat helper + Hono bridge 双入口影响 |
| `/meter-readings/*` | Meter Readings、Utility、Meters | 抄表页面已迁移，但 history/status/repair 与 utility compat 仍未形成单一正式宿主 |

## 五、route drain 架构
### 5.1 drain 总原则
- 先冻结解释，再进入实现；不允许先删旧路由、再补文档。
- 先读路径，后写路径；读路径的正式宿主清楚后，再判断 compat wrapper 的去留。
- 先 bridge 分类，后 route 删除；若当前 Hono 只是 bridge，不得误判为已经完成 drain。
- 任何 drain 判断都必须能回溯到：
  - `server/lib/legacy-route-inventory.ts`
  - `phase10` 查询分层 / 事务边界
  - `phase13` 页面-API/query 交接表

### 5.2 推荐顺序
```text
先统一 route inventory 分类与 host matrix
  ->
先处理 dashboard / settings 的 query host 解释
  ->
再处理 rooms / buildings / meters
  ->
再处理 contracts / checkout
  ->
再处理 bills / bill-stats
  ->
再处理 renters / meter-readings / utility-readings
  ->
最后收口旧 Next API 的退出前提与 legacy baseline
```

### 5.3 为什么这样排序
- dashboard / settings 是首页和设置页的直接上游，不先解释，后续页面/API 边界会继续分裂。
- rooms / buildings / meters 与房源、仪表和删除门禁高度耦合，且包含三类分类并存，是最容易误删历史语义的区域。
- contracts / bills 是主链业务锚点，必须建立在前面引用数据和 bridge 解释稳定后再处理。
- renters / meter-readings 当前桥接痕迹最重，适合在前述主域解释稳定后整体处理。
- legacy exit baseline 必须最后收口，避免在 formal-host-owned / compat-wrapper / retained-legacy 的解释尚未稳定时提前谈删除。

## 六、查询与事务继承边界
### 6.1 查询继承边界
- `phase14` 继续继承 `phase10` 已冻结的 query 分层与 canonical read path。
- 不允许把 `phase14` 写成“重新设计查询层”的阶段。
- 文档必须继续区分：
  - 正式主链查询
  - legacy compat 查询
  - 治理/脚本查询
- 对每条 retained-legacy 路径，都必须明确它当前依赖的是：
  - `src/lib/optimized-queries.ts`
  - `src/lib/queries.ts`
  - `src/lib/prisma.ts`
  - `src/lib/dashboard-queries.ts`
  - `src/lib/global-settings.ts`
  - 或 shared compat helper

### 6.2 写事务继承边界
- `phase14` 不重新打开事务策略选择题。
- 正式主链写路径继续默认继承：
  - `src/lib/transaction-manager.ts`
  - `runInMainChainWriteTransaction()`
  - `getMainChainWriteArrayTransactionOptions()`
- 若某旧 Next API 仍未切流，其文档结论必须说明：
  - 当前是否已接入正式事务 helper
  - 若未接入，属于 retained-legacy 历史债务还是 compat 保留
  - 退出前提是否包含事务边界统一

## 七、不在范围内
- 不实现任何 `phase14` API/query drain 代码
- 不删除旧 `src/app/api/*` 文件
- 不重写 `src/lib/queries.ts`、`src/lib/optimized-queries.ts`、`src/lib/dashboard-queries.ts`
- 不重开页面迁移、PWA parity 或 `phase16` cutover
- 不把治理接口、修复脚本、健康辅助接口包装成 `phase14` 的正式业务 API 完成项

## 八、验证要求
- 确认 `docs/phase14_*` 三份文档互链完整
- 确认架构描述与当前 `server/routes/domain.ts`、`server/routes/*.ts`、`server/lib/legacy-route-inventory.ts` 一致
- 确认文档继续继承 `phase10` 查询分层与事务边界，不反向改写长期数据访问主线
- 确认文档直接引用并吸收 `phase13` 页面 parity 输出，而不是重新做页面审计
- 确认文档明确区分：
  - 正式 Hono 宿主已冻结
  - Hono bridge / compat 仍未完成
  - retained-legacy 仍在承担正式职责
- 确认治理接口、PWA、cutover 与 legacy 资产删除未被写成 `phase14` 完成条件

## 九、阶段结论
`phase14-api-query-parity-and-legacy-route-drain` 在当前轮的架构价值不在于“马上删掉全部旧 API”，而在于：

```text
先把 route inventory 的分类、正式宿主、bridge 边界和 drain 顺序冻结成单一真相，
再让后续 /spec 按业务域逐步清空 retained-legacy 正式业务 API，
并保持 phase10 的查询/事务边界与 phase13 的页面 parity 输出持续可复用。
```

这能确保：
- 不让 Hono 已存在但仍属 bridge 的接口被误判为“已经完成切流”
- 不让 retained-legacy / compat-wrapper / formal-host-owned 继续在不同文档中各说各话
- 不让页面 parity 和 API parity 再次脱节
- 不让 `phase15` PWA parity 或 `phase16` cutover 提前闯入本阶段
