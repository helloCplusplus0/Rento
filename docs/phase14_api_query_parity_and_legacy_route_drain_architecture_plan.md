# Phase14 API Query Parity And Legacy Route Drain 架构规划

## 当前状态
- `phase10` 已完成长期数据访问层、查询分层、统一事务边界与 legacy route inventory 的当前轮冻结，继续作为 `phase14` 的数据访问上游输入。
- `phase11` 已完成正式部署主线、发布门禁与 legacy 回滚基线冻结，继续作为 `phase14` 的运行与回滚上游输入。
- `phase12` 已冻结页面-API 联动、页面映射与 UI 保真边界；`phase13` 已完成正式业务页面 `25/25` 迁移、浏览器验收基线与页面-API/query 交接表。
- 当前文档用于冻结 `phase14-api-query-parity-and-legacy-route-drain` 的实施架构，不替代：
  - [phase14_api_query_parity_and_legacy_route_drain_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md)
  - [phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md)
  - [phase14_execution_layer_correction_plan.md](file:///home/dell/Projects/Rento/.trae/documents/phase14_execution_layer_correction_plan.md)
- `phase14-07` 已完成 route inventory 审计、保留边界复核、回滚基线冻结与顶层真相源同步；`phase14` 当前轮已整体完成，不再处于“等待审核后进入真实实现层”的状态。
- `2026-06` 收口补记：当前代码与 `server/lib/legacy-route-inventory.ts` 已吸收 `phase14-05 ~ phase14-07` 的全部收口结果。旧 `src/app/api/*` 中已不存在承担正式业务主职责的 retained-legacy 路由；正式业务路径已统一收口为 `formal-host-owned` 或 `compat-wrapper`，剩余 retained-legacy 仅限治理/辅助接口。本文后续仍保留的“retained-legacy 主域 / 待切流”描述，均属于 `phase14-01 ~ phase14-04` 的历史冻结输入，不再代表当前运行时真相。

## 一、文档目标
本文档用于回答以下问题，并把答案冻结成后续 `phase14-*` `/spec` 的单一依据：

- 当前旧 `src/app/api/*` 中哪些路径已经具备正式 Hono 宿主，哪些仍只是 compat wrapper，哪些仍是 retained-legacy
- 正式业务 API/query 在 `server/routes/*`、共享领域服务与查询层中的长期承接位应如何解释
- `phase13` 已迁页面对应的 retained-legacy API/query 应按什么顺序 drain，才能避免页面 parity 与 API parity 解释继续分裂
- 在不反向改写 `phase10` 查询分层、事务边界与 `phase11` 部署主线的前提下，如何给后续 `/spec` 提供可执行的 route inventory 退出顺序

## 一点五、纠偏后的阶段分层
- `phase14-01 ~ phase14-04`：冻结与实施输入层
  - 作用是统一 route inventory 分类、dashboard/settings query host、rooms/buildings/meters 边界，以及 contracts/checkout 的 D3 宿主解释、页面影响与 route priority
  - 已完成，并继续作为 `phase14-05 ~ phase14-07` 的历史上游输入保留，但不能单独代表当前完成态
- `phase14-05 ~ phase14-07`：真实实施与阶段收口层
  - 作用是用两个真实迁移波次完成全部正式业务 API cutover，再统一完成旧 Next API 的迁移完成判定、compat 保留边界与回滚基线收口
  - 当前已完成；`phase14-07` 已把“正式业务 retained-legacy 主职责已清零、旧入口仅保留 compat/formal/rollback 边界”的结论回写到 inventory 与顶层真相源
- 因此，本文件除保留输入层冻结记录外，也明确承接“整阶段真实迁移已完成”的最终验收判断；`phase15` 与 `phase16` 只继承本阶段输出结果。

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
- `server/routes/utility-readings.ts`

### 2.4 当前旧宿主输入
- `src/app/api/**/route.ts`
- `server/lib/legacy-route-inventory.ts`
- `src/lib/queries.ts`
- `src/lib/optimized-queries.ts`
- `src/lib/dashboard-queries.ts`
- `src/lib/global-settings.ts`
- `src/lib/page-closure-compat/*`

### 2.5 当前完成态快照
- 正式业务域中，auth、health、buildings 已保持 `formal-host-owned`；dashboard、settings、rooms、meters、contracts、checkout、bills、renters、meter-readings 与 utility 的旧 Next 入口已统一降级为 `compat-wrapper` 或仅保留 rollback-only 价值。
- 旧 `src/app/api/*` 中已不存在承担正式业务主职责的 retained-legacy 路由；剩余 retained-legacy 仅限 `validation`、`data-consistency`、细分 health、repair/status-check 与统计辅助等治理/辅助接口。
- `server/lib/legacy-route-inventory.ts` 现已可作为 `phase14` 最终完成态的单一分类真相源，而不仅是冻结输入层的审计材料。
- `phase15` 与 `phase16` 只继承本阶段形成的正式 API/query 宿主清单、compat 保留条件、退出前提与回滚基线，不再承担任何正式业务 API 迁移职责。

## 三、历史冻结输入基线
以下小节用于保留 `phase14-01 ~ phase14-04` 的冻结输入与实施前解释，便于追溯本阶段如何完成迁移。除 `2.5 当前完成态快照` 与第九节外，下述“当前”均应按历史输入阅读，不再直接等同 `phase14-07` 收口后的运行时状态。

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
| `drainPriority` | 后续 `phase14-02 ~ phase14-07` 进入 `/spec` 与迁移波次编排的固定先后顺序输入 | `docs/phase14_*` |
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

### 3.2.3 `phase14-02` 冻结的 dashboard / settings D1 结论
- D1 的固定顺序继续冻结为：
  - 先统一 dashboard query host 与 page-closure bridge 解释
  - 再统一 settings API 身份与治理边界
  - 最后统一首页 `/`、设置页 `/settings` 与 governance 辅助接口的页面影响解释
- dashboard：
  - 当前正式 query host 仍由旧 `src/app/api/dashboard/**/route.ts` 与 `src/lib/dashboard-queries.ts` / `src/lib/page-closure-compat/dashboard.ts` 组合承担
  - `server/routes/dashboard.ts` 当前仅是 page-closure bridge；它承接首页首屏所需的 `/stats`、`/contract-alerts`、`/upcoming-contracts`、`/leaving-tenants`、`/vacant-rooms`
  - `/api/dashboard/overdue-payments` 与 `/api/dashboard/unpaid-rent` 仍属 retained-legacy 查询入口
  - 当前页面影响面固定为首页 `/`
- settings：
  - `/api/settings` 与 `/api/settings/init` 继续按治理型 retained-legacy 解释，核心治理语义继续锚定 `src/lib/global-settings.ts`
  - `server/routes/settings.ts` 当前属于最小治理兼容宿主，只承接设置页首屏读写、重置与初始化动作，不构成正式业务 API 已切流
  - 当前页面影响面固定为 `/settings`
  - `/api/validation`、`/api/data-consistency`、健康辅助与 repair/status-check 等接口继续按 governance 延后范围解释
- 以上 D1 结论已冻结为 `phase14-03` 及后续业务域 drain 的直接上游输入，不再重复改写 dashboard/settings 宿主身份

### 3.2.4 `phase14-03` 冻结的 rooms / buildings / meters D2 结论
- D2 的固定顺序继续冻结为：
  - 先冻结 rooms 主链读写、局部 compat 与删除门禁解释
  - 再冻结 buildings 作为引用数据的 formal-host-owned 身份与删除条件
  - 再冻结 meters 作为独立资产的 compat-wrapper 身份与房间挂表 retained-legacy 边界
  - 最后统一 `/rooms*`、`/add/room`、`/add/contract`、`/meter-readings/*` 的页面影响与退出顺序
- rooms：
  - `/api/rooms` 的 `GET`、`POST`、`PATCH` 继续按 retained-legacy 解释；列表、单体创建与批量状态更新当前仍由旧宿主承担正式职责
  - `/api/rooms/batch` 已具备 `server/routes/rooms.ts` formal host，旧 Next 入口只保留 compat-wrapper
  - `/api/rooms/:id` 的 `GET`、`PUT` 继续按 retained-legacy 解释，但 `DELETE` 已迁入 `server/routes/rooms.ts` + `src/lib/domain/delete-guards/index.ts`，旧入口只保留 compat-wrapper
  - `/api/rooms/:id/status` 与 `/api/rooms/:id/meters` 当前仍是 retained-legacy；即使 Hono 已有对应承接位，也不足以把整域提前判定为 formal-host-owned
  - 删除门禁必须继续锚定 `performRoomDeleteSafetyCheck()`、`deleteRoomWithoutRelatedHistory()` 与 `performRoomBuildingReassignmentSafetyCheck()`：`OCCUPIED` / `OVERDUE` 房态、未结束合同、未结账单、已绑定仪表、抄表历史与账单明细都会阻断删除或换楼栋
- buildings：
  - `/api/buildings` 与 `/api/buildings/:id` 已冻结为 formal-host-owned；`server/routes/buildings.ts` 是单一正式宿主
  - 楼栋继续只按房源引用数据解释，不得把楼栋 formal 宿主误写成房间主链已切流
  - 楼栋删除条件继续保持“仅空楼栋可删”；存在任意房间时必须阻断删除，旧 Next 入口仅保留回滚价值
- meters：
  - `/api/meters/:meterId` 与 `/api/meters/:meterId/status` 继续按 compat-wrapper 解释；`server/routes/meters.ts` 已承接详情、更新、启停与删除门禁，旧 Next 入口只保留 compat wrapper
  - `/api/rooms/:id/meters` 仍属于 rooms retained-legacy 边界；房间挂表列表/新增不能因为 `server/routes/meters.ts` 存在就被误判为已经切流
  - 仪表删除必须继续区分“独立资产”与“历史事实”：存在抄表、账单或账单明细时只允许停用并保留历史；仅无历史的误加仪表才允许硬删除；当前数据模型仍不提供结构化解绑
- D2 的退出顺序固定为：
  - 第一步：仅把 `/api/buildings*` 视为可进入 exit-evaluation 的 formal-host-owned 旧入口
  - 第二步：保留 `/api/meters/:meterId*` compat wrapper，待前端与存量调用统一切到 Hono 后再退出
  - 第三步：保留 rooms 的 `/api/rooms`、`/api/rooms/:id`、`/api/rooms/:id/status`、`/api/rooms/:id/meters` 为 retained-legacy 主链，最后再结合 `phase14-05` 的主链迁移波次与 `phase14-06` 的残余桥接迁移统一评估
- 上述 D2 结论已冻结为 `phase14-04` 及后续业务域 drain 的直接上游输入，不再重复改写 rooms/buildings/meters 的宿主身份

### 3.2.5 `phase14-04` 同步后的 contracts / checkout D3 结论
- D3 的固定顺序继续冻结为：
  - 先冻结 contracts 域 retained-legacy 读路径与 compat-wrapper 写路径的单一解释
  - 再冻结 checkout 子域的正式写入口、旧 Next compat-wrapper 与共享领域服务边界
  - 再冻结 `server/routes/domain.ts` 中 `'/contracts/:contractId/checkout'` 先于 `'/contracts'` 挂接的路由优先级解释
  - 最后统一 `/contracts*`、`/contracts/:id`、续租、退租、补账单与 `/add/contract` 的页面影响，并继续复用 `phase13` 页面交接与 `phase09-05` 共享领域服务结论
- contracts：
  - `GET/POST /api/contracts` 与 `GET/PUT /api/contracts/:id` 继续按 retained-legacy drain 解释；统一 `/api` runtime 的当前对外请求宿主已是 `server/routes/contracts.ts`，但列表、新签创建、详情与编辑仍复用 legacy 查询/写路径，旧 `src/app/api/contracts*` 保留为镜像实现与回滚基线
  - `POST /api/contracts/activate`、`POST /api/contracts/:id/renew`、`POST /api/contracts/:id/generate-bills` 与 `DELETE /api/contracts/:id` 已冻结为 compat-wrapper；正式语义已锚定 `server/routes/contracts.ts`，并继续复用 `src/lib/domain/contracts/index.ts` 与 `src/lib/domain/delete-guards/index.ts`
  - 合同仍是租务主链事实锚点；补账单、续租、删除门禁与账务/抄表/BillDetail 历史保留约束继续有效，不得被误写成普通 CRUD 切流
- checkout：
  - `POST /api/contracts/:contractId/checkout` 当前已冻结为“formal write host + legacy compat-wrapper”双层解释：正式事务编排位于 `server/routes/checkout.ts` + `src/lib/domain/contracts/index.ts`，旧 `src/app/api/contracts/[id]/checkout/route.ts` 只保留会话透传、兼容包装与回滚基线价值
  - `server/routes/domain.ts` 中 `domainRoutes.route('/contracts/:contractId/checkout', createCheckoutRoutes(env))` 必须先于 `domainRoutes.route('/contracts', createContractRoutes(env))` 挂接；该顺序既符合当前代码事实，也符合 Hono “先组装子路由、再挂父应用，且按注册顺序匹配”的路由组织原则
- D3 的统一冻结结论为：
  - contracts 域当前仍是“读路径 retained-legacy + 生命周期/删除/补账单 compat-wrapper”并存状态
  - checkout 子域当前已具备独立 formal write host，但旧 Next 入口仍保留 compat-wrapper 与回滚职责
  - `phase13` 的合同详情、编辑、续租、退租页面交接与 `phase09-05` 的 checkout / renew / generate-bills 共享领域服务结论继续作为 D3 直接输入，不重新回到页面迁移审计或业务规则重写

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
  - `server/routes/contracts.ts` 已具备列表、创建、详情、编辑、激活、续租、补账单与删除门禁承接位
  - inventory 当前应统一解释为：`GET/POST /api/contracts` 与 `GET/PUT /api/contracts/:id` 仍是 retained-legacy drain，但 `formalHosts` 已指向 `server/routes/contracts.ts`；这代表统一 Hono 请求宿主已暴露，同名旧 Next 文件只保留镜像实现与回滚基线，而不是 contracts 主域已完成 formal-host-owned 切流
- `checkout`：
  - `server/routes/checkout.ts` 已承接 `POST /api/contracts/:contractId/checkout` 的正式事务编排
  - 但旧 `src/app/api/contracts/[id]/checkout/route.ts` 仍保留 compat-wrapper、会话透传与回滚职责，且必须继续与 contracts 主域分开解释
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
| Dashboard | `/api/dashboard/stats`、`/contract-alerts`、`/upcoming-contracts`、`/leaving-tenants`、`/overdue-payments`、`/unpaid-rent`、`/vacant-rooms` | `retained-legacy` | `server/routes/dashboard.ts` 当前只可解释为 page-closure bridge；当前仅覆盖 `/stats`、`/contract-alerts`、`/upcoming-contracts`、`/leaving-tenants`、`/vacant-rooms` 首页首屏桥接，`/overdue-payments` 与 `/unpaid-rent` 继续留在 retained-legacy | `/` | D1 | dashboard 域当前正式 query host 仍是旧 `src/app/api/dashboard/**/route.ts` + `src/lib/dashboard-queries.ts` / `src/lib/page-closure-compat/dashboard.ts` 组合，Hono bridge 不构成正式查询切流完成 |
| Settings | `/api/settings`、`/api/settings/init` | `retained-legacy` | `server/app.ts` 已挂 `server/routes/settings.ts`，但当前 Hono 仅能解释为最小治理兼容宿主；核心治理语义继续锚定 `src/lib/global-settings.ts` | `/settings` | D1 | settings 继续按治理型 retained-legacy 解释；`server/routes/settings.ts` 只承接设置页首屏读写、重置与初始化，不等于正式业务 API 已切流 |
| Rooms | `/api/rooms`、`/api/rooms/batch`、`/api/rooms/:id`、`/api/rooms/:id/status`、`/api/rooms/:id/meters` | `retained-legacy` 为主 | `server/routes/rooms.ts` 已具备列表、创建、批量创建、详情、编辑、单体状态更新、挂表与删除门禁承接位；但 inventory 只把 `/api/rooms/batch` 与 `DELETE /api/rooms/:id` 冻结为 formal/compat，其余读写仍由旧 Next 入口承担正式职责 | `/rooms`、`/rooms/:id`、`/rooms/:id/edit`、`/add/room`、`/add/contract` | D2 | 房源域必须按“主链读写 retained-legacy + 批量创建/删除门禁 compat”解释；`OCCUPIED` / `OVERDUE`、合同、账单、仪表、抄表与账单明细门禁继续由共享 delete-guards 决定 |
| Buildings | `/api/buildings`、`/api/buildings/:id` | `formal-host-owned` | `server/routes/buildings.ts` 已冻结为正式宿主；旧 Next 入口仅保留回滚价值；楼栋删除继续要求 `roomCount === 0` | `/rooms`、`/rooms/:id/edit`、`/add/room` | D2 | 楼栋域已可按 formal-host-owned 解释，但它仍只是房源引用数据 formal 宿主，退出评估必须服从房源页面与回滚基线 |
| Meters | `/api/meters/:meterId`、`/api/meters/:meterId/status`，以及与 `/api/rooms/:id/meters` 的联动边界 | `compat-wrapper` 为主 | `server/routes/meters.ts` 已承接仪表详情、更新、状态切换与受控删除；旧 Next 入口只保留 compat wrapper；房间挂表仍留在 `/api/rooms/:id/meters` retained-legacy | `/rooms`、`/rooms/:id`、`/add/room`、`/meter-readings/*` | D2 | 仪表域必须同时写清“独立资产 formal/compat”与“房间绑定 retained-legacy”；有历史事实时只能停用保留，无历史时才可硬删除 |
| Contracts | `/api/contracts`、`/api/contracts/:id`、`/api/contracts/activate`、`/api/contracts/:id/generate-bills`、`/api/contracts/:id/renew`、`DELETE /api/contracts/:id` | `retained-legacy drain + compat-wrapper` | 统一 `/api` runtime 的当前对外请求宿主已是 `server/routes/contracts.ts`；但 `GET/POST /api/contracts` 与 `GET/PUT /api/contracts/:id` 仍复用 legacy 查询/写路径，旧 `src/app/api/contracts*` 仅保留镜像实现与回滚基线；激活、续租、补账单与删除门禁继续按 compat-wrapper 冻结 | `/contracts`、`/contracts/new`、`/contracts/:id`、`/contracts/:id/edit`、`/contracts/:id/renew`、`/add/contract` | D3 | 合同域必须固定为“统一 Hono 请求宿主已暴露，但主链 GET/POST/PUT 仍在 retained-legacy drain；生命周期/删除/补账单为 compat-wrapper”；不得因此误判整域已切流 |
| Checkout | `/api/contracts/:id/checkout`（旧 Next inventory） / `/api/contracts/:contractId/checkout`（当前 Hono 宿主） | `compat-wrapper` | `server/routes/checkout.ts` + `src/lib/domain/contracts/index.ts` 已冻结为退租结算正式事务宿主；旧 Next 入口仅保留 compat-wrapper、会话透传与回滚能力 | `/contracts/:id/checkout`、`/contracts/:id` | D3 | checkout 已具备独立 formal write host；inventory 中的 `:id` 与 Hono 宿主中的 `:contractId` 仅是参数命名差异，不代表两套不同业务路径，但仍需与 contracts 主域一起校验页面影响、route priority 与 compat 退出前提 |
| Bills | `/api/bills`、`/api/bills/:id`、`/api/bills/:id/status`、`/api/bills/:id/details`、`/api/bills/:id/utility-details`、`/api/bills/stats` | `retained-legacy + compat-wrapper` | `server/routes/bills.ts` 已承接创建、状态更新、删除与静态 `/stats` bridge；列表、详情读取、明细、utility details 仍由 legacy 查询承接 | `/bills`、`/bills/:id`、`/bills/:id/edit`、`/bills/stats`、`/contracts/:id` | D4 | 账单域需明确把 `/stats` 视为 retained-legacy page-to-legacy bridge，而非已完成正式统计宿主切流 |
| Renters | `/api/renters`、`/api/renters/:id`、`/api/renters/stats` | `compat-wrapper` | inventory 的 `formalHosts` 为空，`bridgeHosts` 明确指向 `server/routes/renters.ts`；当前 Hono 与旧 Next 共同复用 `src/lib/page-closure-compat/renters.ts` | `/renters`、`/renters/new`、`/renters/:id`、`/renters/:id/edit`、`/add/contract` | D5 | renters 域当前只能解释为 bridge/compat 双入口，不能提前视为正式 Hono 宿主已冻结 |
| Meter Readings | `/api/meter-readings`、`/api/meter-readings/:id`、`/api/meter-readings/:id/related-bills`、`/api/meter-readings/status-check`、`/api/meter-readings/repair-status` | `compat-wrapper` | `POST /api/meter-readings` 与详情/关联账单已具备 Hono formal/compat 承接，但列表/history、status-check、repair-status 仍通过 `server/routes/meter-readings.ts` + shared helper 维持 bridge | `/meter-readings/batch`、`/meter-readings/history`、`/bills/:id` | D5 | 抄表域必须按“写入与详情较接近正式宿主、history/status/repair 仍是 bridge”解释，避免误删历史兼容链路 |
| Utility | `/api/utility-readings` | `compat-wrapper` | 当前无 Hono 正式宿主；仅复用 `src/lib/domain/meters/index.ts` 提供 legacy utility compat | `/meter-readings/history`、`/bills/:id` | D5 | utility 继续视为抄表域的历史兼容尾项，不因 meters 领域服务已存在就误判为已切流 |
| Governance | `/api/validation`、`/api/data-consistency`、`/api/health/system`、`/api/health/bills`、`/api/bills/repair-details`、repair/status-check 等 | `retained-legacy` 或治理型 `compat-wrapper` | 默认不进入正式业务 API 完成判定；仅保留治理/修复/健康辅助职责 | `/settings` 辅助入口、延后治理页 `/system-health`、`/data-consistency` | 延后 | 本轮只冻结边界，不把治理/辅助接口包装成已完成切流的正式业务 API |

### 4.3 `phase13` 页面影响面绑定结果
| 页面组 | 当前直接依赖域 | 当前绑定解释 |
| --- | --- | --- |
| `/` | Dashboard | 首页已完成页面 parity，但首页数据仍依赖 dashboard retained-legacy query host 与 Hono page-closure bridge 组合 |
| `/settings` | Settings、Governance | 设置主页已迁移；settings API 仍属治理型 retained-legacy，`server/routes/settings.ts` 仅作最小治理兼容宿主，治理辅助入口继续延后 |
| `/rooms*`、`/add/room` | Rooms、Buildings、Meters | 房源页面已迁移，但列表/详情/编辑/房态/挂表仍跨 retained-legacy、formal-host-owned 与 compat-wrapper 三类；D2 已冻结“rooms 主链 retained、buildings 引用数据 formal、meters 独立资产 compat”的单一解释 |
| `/add/contract` | Rooms、Buildings、Meters、Contracts | 快捷签约入口仍直接消费空房与引用数据；D2 输出必须先保证房间主链、楼栋选择与仪表资产边界稳定，后续 D3 才能收口合同读写宿主 |
| `/contracts*` | Contracts、Checkout、Rooms、Renters | 合同与退租页面已迁移；D3 已冻结“合同读路径 retained-legacy、生命周期写路径 compat-wrapper、checkout 独立 formal write host”的单一解释，并继续复用 `phase13` 页面交接与 `phase09-05` 共享领域服务结论 |
| `/bills*`、`/bills/stats` | Bills、Dashboard | 账单页已迁移，但 `/api/bills/stats` 仍是 page-to-legacy bridge，账单详情/明细仍依赖旧查询路径 |
| `/renters*` | Renters | 租客页面已迁移，但仍直接受 shared compat helper + Hono bridge 双入口影响 |
| `/meter-readings/*` | Meter Readings、Utility、Meters | 抄表页面已迁移，但房间挂表仍依赖 rooms retained-legacy，仪表详情/启停/删除门禁只在独立资产侧进入 compat-wrapper；history/status/repair 与 utility compat 仍未形成单一正式宿主 |

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
先完成 `phase14-01 ~ phase14-04` 的冻结与实施输入
  ->
执行真实迁移波次一：rooms / contracts / checkout / bills 主链 cutover
  ->
执行真实迁移波次二：dashboard / settings / renters / meter-readings / utility 与残余 bridge/compat cutover
  ->
最后收口旧 Next API 的迁移完成判定、compat 保留边界与 legacy baseline
```

### 5.3 为什么这样排序
- `phase14-01 ~ phase14-04` 已足够提供单一解释，后续不再新增冻结型子任务。
- rooms / contracts / checkout / bills 是同一条核心业务主链，必须在同一迁移波次里一起完成真实 cutover，避免页面调用继续被 retained-legacy 牵制。
- dashboard / settings / renters / meter-readings / utility 当前的主要问题是 query host、shared compat helper 与 bridge 尾项，这更适合作为第二个迁移波次整体清理。
- legacy exit baseline 必须最后收口，避免在真实迁移尚未完成时过早讨论“旧文件能不能删”。

### 5.4 D2 退出顺序冻结结果
- `buildings` 旧 Next 路径最先进入 exit-evaluation：formal host 已冻结，但仍需保留旧运行线回滚基线，直到房源引用页面与发布回滚条件允许退出。
- `meters` 的 `/api/meters/:meterId*` 次序在 `buildings` 之后：正式承接位已存在，但旧入口仍承担 compat wrapper，需等统一 Hono 调用方向稳定后再退出。
- `rooms` 的 `/api/rooms`、`/api/rooms/:id`、`/api/rooms/:id/status`、`/api/rooms/:id/meters` 最后处理：它们仍承担页面直接消费的 retained-legacy 主链职责，必须等 D3 ~ D5 交接稳定后再评估 drain。
- `DELETE /api/rooms/:id` 与 `/api/rooms/batch` 虽已有 compat/formal 承接，但仍跟随 rooms 主域整体退出，不单独提前宣布 D2 已完成切流。

### 5.5 D3 退出顺序冻结结果
- `GET/POST /api/contracts` 与 `GET/PUT /api/contracts/:id` 继续作为 contracts 域最后一批 retained-legacy 主链读写路径保留；当前虽然已由 `server/routes/contracts.ts` 对外暴露同名入口，但必须等正式 query/write drain、页面调用方向与旧 Next 镜像退出条件统一后再评估收口。
- `POST /api/contracts/activate`、`POST /api/contracts/:id/renew`、`POST /api/contracts/:id/generate-bills` 与 `DELETE /api/contracts/:id` 当前继续保留 compat-wrapper；它们虽已具备 Hono + shared domain service 正式语义，但仍需等待前端与存量调用全部切到统一 Hono 宿主后再退出旧入口。
- `POST /api/contracts/:id/checkout`（旧 Next inventory）/ `POST /api/contracts/:contractId/checkout`（当前 Hono 宿主）当前统一解释为“正式事务编排已在 Hono，旧 Next 入口只保留 compat-wrapper”；checkout 旧入口的退出评估必须同时满足“前端与脚本调用统一走 `server/routes/checkout.ts`”以及“`server/routes/domain.ts` 的 checkout 优先挂接顺序继续成立”。
- D3 的退出判断必须继续继承 `phase13` 页面-API/query 交接与 `phase09-05` 共享领域服务结论，不得把 query parity、页面 parity 与合同业务规则改写混成同一类任务。

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
- 本次纠偏 `/plan` 不实现新的 `phase14` API/query drain 代码
- 不删除旧 `src/app/api/*` 文件
- 不重写 `src/lib/queries.ts`、`src/lib/optimized-queries.ts`、`src/lib/dashboard-queries.ts`
- 不重开页面迁移、PWA parity 或 `phase16` cutover
- 不把治理接口、修复脚本、健康辅助接口包装成 `phase14` 的正式业务 API 完成项
- 回顾 `phase14-01 ~ phase14-04` 历史冻结输入时，不得把“冻结输入层已完成”误写成“整个 `phase14` 已完成”；整阶段完成判断以 `phase14-05 ~ phase14-07` 的实现、审计与验收结果为准

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
`phase14-api-query-parity-and-legacy-route-drain` 在当前轮收口后的架构价值不在于“立刻删空全部旧 API 文件”，而在于：

```text
先把 route inventory 的分类、正式宿主、bridge 边界和 drain 顺序冻结成单一真相，
再用两个真实迁移波次与最终审计清空 retained-legacy 正式业务 API，
并把 phase10 的查询/事务边界、phase13 的页面 parity 输出与 phase14 的 API/query parity 结果一起冻结为后续阶段可复用输入。
```

这能确保：
- 不让 Hono 已存在但仍属 bridge 的接口被误判为“已经完成切流”
- 不让 retained-legacy / compat-wrapper / formal-host-owned 继续在不同文档中各说各话
- 不让页面 parity 和 API parity 再次脱节
- 不让 `phase15` PWA parity 或 `phase16` cutover 反向承担正式业务 API 迁移职责
- 不让 `phase14-01 ~ phase14-04` 的冻结与实施输入层再次被误判为整个 `phase14` 的当前运行时状态
- 不让“旧 `src/app/api/*` 文件仍存在”被误读为“正式业务 retained-legacy 主职责仍未清零”
