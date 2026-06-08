# Phase14 API Query Parity And Legacy Route Drain Shared Baseline

## 当前状态
- `phase14` 的共享基线用于冻结 API/query parity 与 legacy route drain 实施阶段必须共同遵守的词汇、边界与判断标准。
- 本文档直接建立在 `phase10` 已冻结的查询分层、canonical read path、统一事务边界与 legacy route inventory 之上。
- 本文档直接吸收 `phase13` 已冻结的页面 parity、浏览器基线与页面-API/query 交接表。
- 当前互链文档为：
  - [phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md)
  - [phase14_api_query_parity_and_legacy_route_drain_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md)
  - [phase14_execution_layer_correction_plan.md](file:///home/dell/Projects/Rento/.trae/documents/phase14_execution_layer_correction_plan.md)
- 本次纠偏 `/plan` 不执行新的 `phase14` API/query 切流实现，不删除旧 `src/app/api/*`，不进入 `phase15 ~ phase16` 的实现职责；但这不再等于“`phase14` 只做冻结”，当前应统一按“`phase14-01 ~ phase14-04` 只构成冻结与实施输入层，`phase14-05 ~ phase14-07` 才承担整阶段 API 迁移完成责任”解释。

## 一、文档目的
本文档用于冻结 `phase14-api-query-parity-and-legacy-route-drain` 的共享判断标准，避免后续子任务从页面影响、旧路由、Hono 子宿主、query helper 或 compat bridge 不同视角出发，重新产出互相冲突的解释。

## 二、共享前提
- `phase01 ~ phase13` 已完成当前轮阶段收口
- `phase10` 已完成：
  - 查询分层冻结
  - canonical read path 冻结
  - 统一事务边界冻结
  - legacy route inventory 冻结
- `phase11` 已完成：
  - 正式部署主线冻结
  - 回滚基线冻结
  - 发布门禁冻结
- `phase12` 已完成：
  - 页面-API 关系冻结
  - 旧页面到新宿主映射冻结
- `phase13` 已完成：
  - 正式业务页面 `25/25` 迁移
  - 页面 parity 验收矩阵
  - 浏览器验收基线
  - 页面到 retained-legacy API/query 的交接表
- 当前正式数据访问主线继续固定为 `Prisma + PostgreSQL`
- 当前正式 API 宿主继续固定为 `server/` 下的 Hono 子路由树

## 三、共享判断标准
- 默认优先以 `server/lib/legacy-route-inventory.ts` 作为旧 API 分类真相源，而不是在 `phase14` 中另建第二套路由清单。
- 默认优先以业务域为单位解释 route drain，而不是按 HTTP 方法或目录路径机械分组。
- 默认优先明确“当前正式宿主 / 当前 bridge / 当前 compat / 当前 retained-legacy”四层解释，再进入任何实现。
- 默认继续把 `phase13` 页面-API/query 交接表视为 `phase14` 的直接输入，不重新做页面审计。
- 默认继续把 `phase10` 查询分层与事务边界视为稳定上游输入，不在 `phase14` 中重开数据访问主线设计题。
- 默认继续保持低复杂度、单仓库、单主线、单一真相源。
- 默认不把治理接口、PWA parity、cutover 或 legacy 资产删除混入 `phase14`。

## 四、共享输入清单
### 4.1 API 与路由输入
- `server/app.ts`
- `server/lib/legacy-route-inventory.ts`
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
- `src/app/api/**/route.ts`

### 4.2 查询与事务输入
- `src/lib/queries.ts`
- `src/lib/optimized-queries.ts`
- `src/lib/dashboard-queries.ts`
- `src/lib/global-settings.ts`
- `src/lib/transaction-manager.ts`
- `src/lib/domain/*`
- `src/lib/page-closure-compat/*`

### 4.3 顶层治理输入
- `README.md`
- `AGENTS.md`
- `project_rules.md`
- `global_skills.md`
- `project_skills.md`
- `plan.md`
- `architecture_map.md`
- `docs/phase10_*`
- `docs/phase13_*`

## 五、统一词汇语义
### 5.1 formal-host-owned
- 指正式 Hono 宿主已经冻结，旧 `src/app/api/*` 入口只保留回滚、退出评估或旧运行线参考价值。
- 它不等于“仓库里存在一个同名 Hono 路由文件”。
- 只有当正式语义、事务边界、前端/脚本调用方向与退出前提都具备单一解释时，才能标记为 `formal-host-owned`。

### 5.2 compat-wrapper
- 指正式业务语义已迁入 Hono 或共享领域服务，但旧 `src/app/api/*` 仍承担兼容包装、会话透传、双入口 bridge 或过渡适配职责。
- 它不等于“已经完成 route drain”。
- `compat-wrapper` 默认必须同时写清：
  - 正式宿主或 bridge host
  - 保留原因
  - 退出条件
  - 回滚条件

### 5.3 retained-legacy
- 指旧 `src/app/api/*` 仍承担正式业务读/写职责，或当前 Hono 仅是 page-closure bridge，尚不能视为正式 query host。
- `retained-legacy` 是 `phase14` 的核心 drain 对象。
- 它不等于“技术债以后再说”，必须排入明确顺序。

### 5.4 bridge host
- 指当前存在于 Hono、loader 或 shared compat helper 中的过渡承接位，用于让页面先在新宿主可用，但尚未形成最终 API/query 真相。
- 典型示例包括：
  - `server/routes/dashboard.ts`
  - `/api/bills/stats` 的 page-to-legacy bridge
  - renter / meter-reading 的 shared page-closure compat helper

### 5.5 route drain
- 指把旧 `src/app/api/*` 中仍承担正式业务职责的路径，按已冻结顺序迁离旧宿主，并收口到单一正式宿主或明确 compat 保留边界的过程。
- 它不等于“立刻删除文件”。
- drain 至少包含：
  - 当前分类确认
  - 正式宿主确认
  - 页面影响面确认
  - 退出前提确认
  - 回滚条件确认

### 5.6 canonical read path
- 指 `phase10` 已冻结的正式查询来源与分层解释。
- `phase14` 可以继续把旧路由映射到 canonical read path，但不得重新定义 canonical read path。

### 5.7 main-chain write transaction
- 指 `phase10` 已冻结的正式主链写事务口径：
  - `Serializable`
  - `maxWait: 5000`
  - `timeout: 10000`
  - `P2034` 有界重试
- 当前继续由 `src/lib/transaction-manager.ts` 提供共享事务策略。

### 5.8 host matrix 字段集
- `phase14-01` 当前轮统一把 route inventory host matrix 固定为以下字段集：
  - `inventoryScope`
  - `dominantCategory`
  - `formalHosts`
  - `bridgeHosts`
  - `domainServicePaths`
  - `pageImpact`
  - `drainPriority`
  - `freezeConclusion`
- 后续 `phase14-02 ~ phase14-07` 只能复用这组字段解释各域宿主归属、迁移波次与阶段收口，不再自行扩写第二套矩阵口径。

### 5.9 “已有 Hono 路由但仍不算正式宿主”的统一规则
- 仅有 `server/routes/*.ts` 文件存在，或仅在 `server/app.ts` / `server/routes/domain.ts` 中挂载完成，不足以推导 `formal-host-owned`。
- 若 inventory 主分类仍是 `retained-legacy`，或 `formalHosts` 为空、页面仍依赖 `src/lib/page-closure-compat/*` / legacy query helper，则当前 Hono 只能解释为 bridge 或 compat 承接位。
- 若 inventory 对局部路径记录了 `formalHosts`，但同域关键读路径仍由旧 `src/app/api/*` 承担，也不得把整个业务域提前提升为“正式宿主已冻结”。
- 当前必须按该规则理解：
  - `dashboard` 为 retained-legacy + page-closure bridge
  - `settings` 为治理型 retained-legacy + 最小 Hono 兼容宿主
  - `renters` 为 compat-wrapper + shared helper bridge
  - `meter-readings` 为 formal/compat/bridge 混合带，不可一刀切

### 5.10 `phase14-02` D1 dashboard / settings 冻结口径
- D1 固定顺序为：
  - 先冻结 dashboard query host 与 page-closure bridge
  - 再冻结 settings API 身份与治理边界
  - 最后统一首页 `/`、设置页 `/settings` 与 governance 辅助接口的页面影响解释
- dashboard 当前继续按 `retained-legacy + page-closure bridge` 解释：
  - 正式 query host 仍是旧 `src/app/api/dashboard/**/route.ts` 与 `src/lib/dashboard-queries.ts` / `src/lib/page-closure-compat/dashboard.ts` 组合
  - `server/routes/dashboard.ts` 只承接 `/stats`、`/contract-alerts`、`/upcoming-contracts`、`/leaving-tenants`、`/vacant-rooms` 的首页首屏 bridge
  - `/api/dashboard/overdue-payments` 与 `/api/dashboard/unpaid-rent` 继续属于 retained-legacy
- settings 当前继续按 `治理型 retained-legacy + 最小 Hono 兼容宿主` 解释：
  - `/api/settings` 与 `/api/settings/init` 的核心治理语义继续锚定 `src/lib/global-settings.ts`
  - `server/routes/settings.ts` 只承接设置页首屏读写、重置与初始化，不等于正式业务 API 已切流
  - `/api/validation`、`/api/data-consistency`、健康辅助与 repair/status-check 继续按 governance 延后范围处理

### 5.11 `phase14-03` D2 rooms / buildings / meters 冻结口径
- D2 固定顺序为：
  - 先冻结 rooms 主链读写、局部 compat 与删除门禁解释
  - 再冻结 buildings 作为引用数据的 formal-host-owned 身份与删除条件
  - 再冻结 meters 作为独立资产的 compat-wrapper 身份与房间挂表 retained-legacy 边界
  - 最后统一 `/rooms*`、`/add/room`、`/add/contract`、`/meter-readings/*` 的页面影响与退出顺序
- rooms 当前继续按 `retained-legacy 为主 + 局部 compat` 解释：
  - `/api/rooms` 的 `GET`、`POST`、`PATCH` 以及 `/api/rooms/:id` 的 `GET`、`PUT`、`/api/rooms/:id/status`、`/api/rooms/:id/meters` 继续由旧 `src/app/api/*` 承担正式职责
  - `/api/rooms/batch` 已由 `server/routes/rooms.ts` 承接为 formal host；`DELETE /api/rooms/:id` 已由 `server/routes/rooms.ts` + `src/lib/domain/delete-guards/index.ts` 承接，旧入口只保留 compat wrapper
  - 房间删除与换楼栋必须继续受 `performRoomDeleteSafetyCheck()`、`deleteRoomWithoutRelatedHistory()` 与 `performRoomBuildingReassignmentSafetyCheck()` 约束；`OCCUPIED` / `OVERDUE`、合同、账单、仪表、抄表与账单明细历史都属于阻断条件
- buildings 当前继续按 `formal-host-owned` 解释：
  - `/api/buildings` 与 `/api/buildings/:id` 已由 `server/routes/buildings.ts` 冻结为单一正式宿主
  - 楼栋仍只是房源引用数据 formal 宿主，不能被误判为房间主链已切流
  - 楼栋删除条件固定为“仅空楼栋可删”，存在任意房间时必须阻断删除
- meters 当前继续按 `compat-wrapper 为主` 解释：
  - `/api/meters/:meterId` 与 `/api/meters/:meterId/status` 继续由 `server/routes/meters.ts` 承接正式语义，旧 Next 入口只保留 compat wrapper
  - `/api/rooms/:id/meters` 继续属于 rooms retained-legacy 边界；房间挂表不得因为独立资产 formal/compat 承接位已存在就被误判为已切流
  - 仪表存在抄表、账单或账单明细历史时只允许停用保留，无历史时才允许硬删除；当前数据模型仍不提供结构化解绑
- D2 退出顺序固定为：
  - 先评估 `/api/buildings*` 的旧入口退出
  - 再评估 `/api/meters/:meterId*` compat wrapper 的退出
  - 最后评估 rooms 主链 `/api/rooms*` 与 `/api/rooms/:id/meters` retained-legacy 的 drain

### 5.12 `phase14-04` D3 contracts / checkout 冻结口径
- D3 固定顺序为：
  - 先冻结 contracts 域 retained-legacy 读路径与 compat-wrapper 写路径解释
  - 再冻结 checkout 子域正式写入口、旧 Next compat-wrapper 与共享领域服务边界
  - 再冻结 `server/routes/domain.ts` 中 `'/contracts/:contractId/checkout'` 先于 `'/contracts'` 的挂接优先级解释
  - 最后统一 `/contracts*`、`/contracts/:id`、续租、退租、补账单与 `/add/contract` 的页面影响解释，并继续复用 `phase13` 页面交接与 `phase09-05` 共享领域服务结论
- contracts 当前继续按 `retained-legacy + compat-wrapper` 解释：
  - `GET/POST /api/contracts` 与 `GET/PUT /api/contracts/:id` 继续按 retained-legacy drain 解释；统一 `/api` runtime 的当前对外请求宿主已是 `server/routes/contracts.ts`，但其读写语义仍复用 legacy 查询/写路径，旧 `src/app/api/contracts*` 保留为镜像实现与回滚基线
  - `POST /api/contracts/activate`、`POST /api/contracts/:id/renew`、`POST /api/contracts/:id/generate-bills` 与 `DELETE /api/contracts/:id` 已由 `server/routes/contracts.ts` 承接正式语义，旧入口只保留 compat-wrapper
  - 合同继续作为租务事实锚点；账单、抄表、BillDetail 历史保留与删除门禁约束必须继续保持
- checkout 当前继续按 `formal write host + compat-wrapper` 解释：
  - `POST /api/contracts/:contractId/checkout` 的正式事务编排位于 `server/routes/checkout.ts` + `src/lib/domain/contracts/index.ts`
  - 旧 `src/app/api/contracts/[id]/checkout/route.ts` 只保留 compat-wrapper、会话透传与回滚基线职责
  - `server/routes/domain.ts` 必须继续保证 checkout 子路径优先于 `/contracts` 骨架挂接，避免更窄路径被吞掉
- D3 退出顺序固定为：
  - 先保留 contracts 主链 `GET/POST /api/contracts` 与 `GET/PUT /api/contracts/:id` 作为 retained-legacy drain 路径；当前虽已由 `server/routes/contracts.ts` 对外暴露，但旧 Next 镜像与 legacy 查询/写语义仍未退出
  - 再评估激活、续租、补账单、删除等 compat-wrapper 的旧入口退出
  - 最后在页面与存量调用统一切到 Hono 后，再评估 checkout compat-wrapper 的退出

### 5.13 `phase14` 阶段分层纠偏口径
- `phase14-01 ~ phase14-04` 统一按冻结与实施输入层解释：
  - 作用是把 route inventory、query host、D1/D2 顺序、contracts/checkout D3 边界、页面影响面与删除门禁边界冻结成单一解释
  - 已完成，但不能单独视为 `phase14` 阶段完成
- `phase14-05 ~ phase14-07` 统一按真实迁移与阶段收口层解释：
  - 作用是基于已冻结顺序，用两个真实迁移波次完成全部正式业务 API cutover，再统一完成 legacy exit baseline 收口
  - 未完成前，不得把 `phase14` 写成“已完成”
- `phase14` 的阶段完成固定同时要求：
  - 冻结与实施输入层完成
  - 真实迁移与阶段收口层完成
  - 独立审核验收通过

## 六、正式范围共享口径
### 6.1 `phase14` 主范围
- dashboard query host
- settings API 身份与边界
- rooms / buildings / meters API drain
- contracts / checkout API drain
- bills / bill-stats API drain
- renters / meter-readings / utility compat drain
- 旧 Next API 的退出前提与 compat 保留条件

### 6.2 治理 / 辅助 / 延后范围
- `/api/validation`
- `/api/data-consistency`
- `/api/health/system`
- `/api/health/bills`
- `/api/bills/repair-details`
- `meter-history-stats`
- repair/status-check 等治理辅助入口
- 以上路径可以在 `phase14` 文档中被明确分类，但不自动等于会在当前轮被提升为正式业务 API 并完成 drain。

### 6.3 当前阶段含义
- `phase14` 的“完成”不等于旧 `src/app/api/*` 已全部删除。
- `phase14` 的当前轮纠偏目标是先把冻结与实施输入层和真实迁移/收口层拆开，并把分类、顺序、宿主解释与退出条件固定为后续真实迁移波次的单一上游输入。
- `phase14` 的阶段完成不得只以冻结分类、顺序、宿主解释与退出条件视为通过；必须继续完成真实 API/query drain 实施。

## 七、页面影响共享口径
### 7.1 页面仍是 `phase14` 的直接输入
- 工作台页面仍直接依赖 dashboard API/query
- 设置页仍直接依赖 settings API
- 房源、合同、账单、租客、抄表页面都已在 `phase13` 迁入 `src/minix`，因此 `phase14` 的任何 API/query drain 都必须优先检查对应页面影响

### 7.2 页面 parity 不再重做，但必须被继承
- `phase14` 不重新判定页面是否迁移完成
- `phase14` 必须继承：
  - `phase13` 页面 parity 验收矩阵
  - 浏览器验收基线
  - 页面到 retained-legacy API/query 的交接表

### 7.3 页面影响面冻结结果
| 页面组 | 当前直接依赖域 | 冻结口径 |
| --- | --- | --- |
| `/` | Dashboard | 首页页面 parity 已完成，但首页查询仍属于 dashboard retained-legacy query host + Hono page-closure bridge 输入 |
| `/settings` | Settings、Governance | 设置页已迁移；settings API 仍按治理型 retained-legacy 解释，`server/routes/settings.ts` 仅作最小治理兼容宿主，治理辅助入口继续延后 |
| `/rooms*`、`/add/room` | Rooms、Buildings、Meters | 房源页面依赖 retained-legacy 房间主链、formal-host-owned 楼栋引用数据与 compat-wrapper 仪表独立资产路径；D2 已冻结三者边界不得混写 |
| `/add/contract` | Rooms、Buildings、Meters、Contracts | 快捷签约入口仍直接依赖空房、楼栋引用数据与房间挂表上下文；D2 必须先给 D3 提供稳定的 rooms/buildings/meters 上游解释 |
| `/contracts*` | Contracts、Checkout、Rooms、Renters | 合同页依赖 retained-legacy 合同读路径、生命周期 compat-wrapper 与 checkout formal write host；D3 已冻结该三者的单一解释，并继续复用 `phase13` 页面交接与 `phase09-05` 共享领域服务结论 |
| `/bills*`、`/bills/stats` | Bills、Dashboard | 账单页已迁移，但账单统计仍为 page-to-legacy bridge，明细读取仍是 retained-legacy |
| `/renters*` | Renters | 租客页仍直接受 shared compat helper 与 Hono bridge 双入口影响 |
| `/meter-readings/*` | Meter Readings、Utility、Meters | 抄表页已迁移，但房间挂表仍依赖 rooms retained-legacy，仪表详情/启停/删除门禁只在独立资产侧进入 compat-wrapper；history/status/repair 与 utility compat 尚未形成单一正式宿主 |

## 八、结构分层共享口径
### 8.1 route inventory 层
- `server/lib/legacy-route-inventory.ts` 继续作为分类真相源
- `phase14` 文档只能解释和排序，不另建第二套路由清单

### 8.2 Hono 宿主层
- `server/routes/*` 继续作为正式或过渡 API 宿主承接位
- `server/routes/domain.ts` 继续作为统一域路由挂载入口
- 继续遵循“先子路由、后父挂载；先窄路径、后动态路径”的 Hono 组织原则

### 8.3 兼容层
- `src/lib/page-closure-compat/*` 继续显式标注为兼容层
- 兼容层默认只承担过渡职责，不重新争夺正式 query host 身份

### 8.4 旧 Next API 层
- `src/app/api/**/route.ts` 继续作为：
  - retained-legacy 正式职责残留
  - compat-wrapper
  - legacy 回滚基线
- 当前阶段不得因为“文件仍存在”就误判 drain 尚未开始，也不得因为“已有 Hono 路由”就误判 drain 已完成

### 8.5 分域 host matrix 快照
| 业务域 | 当前主分类 | 当前宿主解释 | `drainPriority` |
| --- | --- | --- | --- |
| Dashboard | `retained-legacy` | 正式 query host 仍是旧 `src/app/api/dashboard/**/route.ts` + `src/lib/dashboard-queries.ts` / `src/lib/page-closure-compat/dashboard.ts`；`server/routes/dashboard.ts` 仍是首页 page-closure bridge，不构成正式 query host 完成 | D1 |
| Settings | `retained-legacy` | `src/lib/global-settings.ts` 仍是 settings 核心治理语义锚点；`server/routes/settings.ts` 是最小治理兼容宿主，不等于正式业务 API 已切流 | D1 |
| Rooms | `retained-legacy` 为主 | `server/routes/rooms.ts` 已具备列表、创建、详情、编辑、房态、挂表与删除门禁承接位，但只有 `/api/rooms/batch` 与 `DELETE /api/rooms/:id` 已冻结为 formal/compat；其余主链读写仍由旧宿主承担 | D2 |
| Buildings | `formal-host-owned` | `server/routes/buildings.ts` 已冻结为正式宿主；楼栋删除继续要求空楼栋约束 | D2 |
| Meters | `compat-wrapper` 为主 | `server/routes/meters.ts` 已承接独立资产详情、更新、启停与删除门禁；房间挂表仍留在 `/api/rooms/:id/meters` retained-legacy | D2 |
| Contracts | `retained-legacy drain + compat-wrapper` | 统一 `/api` runtime 的当前对外请求宿主已是 `server/routes/contracts.ts`；但 `GET/POST /api/contracts` 与 `GET/PUT /api/contracts/:id` 仍复用 legacy 查询/写路径，旧 `src/app/api/contracts*` 仅保留镜像实现与回滚基线；激活、续租、补账单与删除已进入 compat-wrapper | D3 |
| Checkout | `compat-wrapper` | `server/routes/checkout.ts` + `src/lib/domain/contracts/index.ts` 已是正式事务宿主，旧入口仅作 compat-wrapper、会话透传与回滚包装 | D3 |
| Bills | `retained-legacy + compat-wrapper` | `server/routes/bills.ts` 已承接部分正式语义，`/api/bills/stats` 仍是 retained-legacy bridge | D4 |
| Renters | `compat-wrapper` | `server/routes/renters.ts` + `src/lib/page-closure-compat/renters.ts` 仍属双入口 bridge | D5 |
| Meter Readings | `compat-wrapper` | 写入/详情更接近 formal，history/status/repair 仍是 compat bridge | D5 |
| Utility | `compat-wrapper` | 继续作为 meter-readings 域的历史 utility compat 尾项 | D5 |
| Governance | `retained-legacy` / 治理 compat | 只冻结边界，不纳入正式业务 API 完成判定 | 延后 |

## 九、与后续阶段的共享边界
### 9.1 对 `phase15` 的共享输出
- 正式 API/query 宿主清单
- route inventory 分类与 drain 顺序
- compat 保留原因与退出条件

### 9.2 对 `phase16` 的共享输出
- 旧 Next API 可删除前提
- legacy 回滚基线与 route exit 条件
- 正式宿主、compat-wrapper 与 retained-legacy 的最终分类记录

## 十、允许路线
- 允许继续复用 `server/lib/legacy-route-inventory.ts` 作为 route inventory 真相源
- 允许继续复用 `server/routes/*` 作为正式或 bridge 宿主输入
- 允许继续复用 `src/lib/page-closure-compat/*` 作为 compat 事实输入
- 允许继续复用 `src/lib/queries.ts`、`src/lib/optimized-queries.ts`、`src/lib/dashboard-queries.ts` 作为 legacy 查询事实输入
- 允许在文档中显式标注“当前 Hono 仍只是 bridge，不构成正式 query host 完成”

## 十一、禁止路线
- 禁止把 `phase14` 写成页面迁移补做阶段
- 禁止把 `phase14` 写成 PWA parity 或 cutover 实施阶段
- 禁止把治理接口包装成正式业务 API 已完成项
- 禁止重新打开 `Prisma` 替换、事务策略重构或查询层重写议题
- 禁止在没有冻结退出条件前直接删除旧 `src/app/api/*`

## 十二、统一验证要求
- 至少确认：
  - [phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md)
  - [phase14_api_query_parity_and_legacy_route_drain_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md)
  - [phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md)
  三份文档已齐备并互相引用一致
- 至少确认顶层真相源已与三份 `docs/phase14_*` 的状态一致
- 至少确认文档明确继承 `phase10` 查询分层、canonical read path 与事务边界
- 至少确认文档明确继承 `phase13` 页面 parity、浏览器基线与页面-API/query 交接表
- 至少确认被引用的 `server/*`、`src/lib/*`、`src/app/api/*` 路径真实存在
- 至少确认任何已分类路径都能被解释为：
  - `formal-host-owned`
  - `compat-wrapper`
  - 或 `retained-legacy`
  三者之一，不留模糊口径
- 至少确认当前文档轮次不会把 `phase15` PWA parity 或 `phase16` cutover/legacy-exit 写成本轮完成条件

## 十三、阶段结论
`phase14-api-query-parity-and-legacy-route-drain` 的共享基线价值不在于“立刻清零所有旧 API”，而在于：

```text
先把 route inventory、query host、compat 边界和 route drain 的判断标准冻结，
再让后续 /spec 和实现建立在单一 API 真相之上，
并为最终 legacy 退出保留可验证、可回滚、可审计的前置记录。
```

这能确保：
- 不让 formal-host-owned / compat-wrapper / retained-legacy 在不同文档中含义漂移
- 不让已有 Hono 宿主与仍存旧 Next API 的过渡状态继续混写
- 不让页面 parity 输出在 `phase14` 中丢失
- 不让后续 `phase15`、`phase16` 继承一套无法审计的 API 退出基线
- 不让 `phase14-01 ~ phase14-04` 的冻结与输入结果再次被误读为整个 `phase14` 已完成
