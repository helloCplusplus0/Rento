# Phase14 Rooms Buildings Meters API Drain Spec

## Why
`phase14-03` 需要把房源、楼栋与仪表域的正式宿主、compat 保留边界、删除门禁与退出顺序冻结成单一解释，否则后续 `/spec` 会继续把房间读写、楼栋引用数据和仪表独立资产语义混写。

## What Changes
- 冻结 `rooms / buildings / meters` 三个业务域的当前主分类、正式宿主、bridge/compat 保留原因与退出顺序。
- 明确楼栋作为房源引用数据的 formal-host-owned 身份，以及与房源主链的边界。
- 明确仪表作为独立资产的正式宿主与房间挂表 retained-legacy 边界，不改变“一房多表 + 仪表历史保留”约束。
- 明确房间删除门禁、楼栋删除条件、房态修改与房间仪表绑定读写的归属解释。
- 写入 D2 固定顺序：先 rooms 主链与删除门禁，再 buildings 引用数据 formal 宿主，再 meters 独立资产 compat 与房间挂表 retained-legacy，最后统一页面影响与退出顺序。
- 保持本子任务只做冻结与解释，不实现 API 切流、不重写查询模型、不删除旧路由。

## Impact
- Affected specs: `phase14-api-query-parity-and-legacy-route-drain`、`phase13-frontend-page-parity-implementation`、`phase09-02-contract-lifecycle-delete-guards`、`phase10-data-access-and-migration-closure`
- Affected code: `docs/phase14_*`、`server/routes/rooms.ts`、`server/routes/buildings.ts`、`server/routes/meters.ts`、`src/app/api/rooms/**/route.ts`、`src/app/api/buildings/**/route.ts`、`src/app/api/meters/**/route.ts`、`server/lib/legacy-route-inventory.ts`、`src/lib/domain/delete-guards/index.ts`

## ADDED Requirements
### Requirement: Rooms Domain Freeze
系统 SHALL 为房间域提供单一的宿主与 drain 解释，明确 `/api/rooms*` 当前哪些路径仍是 retained-legacy，哪些已由 `server/routes/rooms.ts` 承接为 compat 或局部 formal。

#### Scenario: 房源主链读写可解释
- **WHEN** 团队查看 `/api/rooms`、`/api/rooms/:id`、`/api/rooms/:id/status`、`/api/rooms/:id/meters`、`/api/rooms/batch`
- **THEN** 每条路径都能回溯到当前旧 Next、Hono 路由、删除门禁或共享领域服务中的单一职责解释，并明确 `/api/rooms/batch` 与 `DELETE /api/rooms/:id` 已进入 formal/compat，其他主链读写仍属 retained-legacy

#### Scenario: 房态与删除门禁不被误归类
- **WHEN** 团队评估房间删除、房间状态更新、房间换楼栋或房间挂表
- **THEN** 不会把删除门禁、房态修改与普通引用数据读写混写为同一类 drain 结果，并继续把 `OCCUPIED` / `OVERDUE`、合同、账单、仪表、抄表与账单明细历史视为阻断条件

### Requirement: Buildings Domain Freeze
系统 SHALL 为楼栋域提供单一的 formal-host-owned 解释，明确 `/api/buildings*` 已由 `server/routes/buildings.ts` 作为正式宿主承接，旧 Next 入口仅保留回滚价值。

#### Scenario: 楼栋引用数据边界稳定
- **WHEN** 团队查看房源页面的楼栋选择、楼栋 CRUD 与楼栋删除限制
- **THEN** 能明确区分楼栋作为引用数据的 formal 宿主，与房间主链 retained-legacy 读写之间的边界，并保持“仅空楼栋可删”的删除门禁

### Requirement: Meters Domain Freeze
系统 SHALL 为仪表域提供单一的 compat-wrapper 解释，明确 `server/routes/meters.ts` 当前承接的是独立资产详情、更新、启停与删除门禁，而房间挂表仍属于 `/api/rooms/:id/meters` retained-legacy 边界。

#### Scenario: 独立资产与房间绑定分离
- **WHEN** 团队查看 `/api/meters/:meterId`、`/api/meters/:meterId/status` 与 `/api/rooms/:id/meters`
- **THEN** 能明确区分“仪表作为独立资产”的正式宿主与“房间绑定关系”的 retained-legacy 边界，并把 `/api/meters/:meterId*` 视为 compat-wrapper、`/api/rooms/:id/meters` 视为 rooms retained-legacy

#### Scenario: 历史保留语义稳定
- **WHEN** 团队评估仪表停用、删除门禁与历史抄表/账单关联
- **THEN** 不会把历史保留要求弱化为普通物理删除，并继续保持“有历史则停用保留、无历史才可硬删除”的解释

### Requirement: Rooms Buildings Meters Domain Boundary Closure
系统 SHALL 冻结房间、楼栋、仪表三域之间的页面影响、删除门禁与后续 D2 drain 顺序，使 `phase14-04` 以后不再重复争论引用数据边界。

#### Scenario: D2 顺序可直接复用
- **WHEN** 后续 `phase14-04 ~ phase14-07` 继续引用 rooms/buildings/meters 结论
- **THEN** 不需要重新定义楼栋 formal 宿主、仪表 compat 边界与房间 retained-legacy 解释，并可直接复用 `/rooms*`、`/add/room`、`/add/contract`、`/meter-readings/*` 的页面影响与 `buildings -> meters -> rooms` 的退出顺序

## MODIFIED Requirements
### Requirement: Phase14 Host Matrix D2 Reuse
`phase14-01` 已冻结的 host matrix 字段集 SHALL 被 `phase14-03` 直接复用到 `rooms / buildings / meters` 三域，不新增第二套 D2 专用字段。

#### Scenario: D2 继续复用 phase14-01
- **WHEN** 团队为 rooms/buildings/meters 输出冻结结论
- **THEN** 继续使用 `inventoryScope`、`dominantCategory`、`formalHosts`、`bridgeHosts`、`domainServicePaths`、`pageImpact`、`drainPriority` 与 `freezeConclusion`

### Requirement: Page13 Room Area Handoff Reuse
`phase13` 已冻结的房源页面、楼栋选择器、仪表挂接与页面-API/query 交接 SHALL 作为 `phase14-03` 的直接输入，而不是重新做页面审计。

#### Scenario: 房源页面影响面直接复用
- **WHEN** `phase14-03` 冻结房源域结论
- **THEN** 直接继承 `/rooms*`、`/add/room`、`/add/contract` 与 `/meter-readings/*` 的页面影响判断

### Requirement: D2 Exit Order Freeze
系统 SHALL 为 rooms/buildings/meters 输出单一的 D2 退出顺序，避免后续子任务在 formal-host-owned、compat-wrapper 与 retained-legacy 之间反复改写旧入口退出节奏。

#### Scenario: D2 退出顺序固定
- **WHEN** 团队评估 rooms/buildings/meters 的旧 Next API 去留
- **THEN** 继续按 `buildings -> meters -> rooms` 的顺序解释退出评估，其中 `/api/buildings*` 最先进入 exit-evaluation，`/api/meters/:meterId*` 在统一 Hono 调用后退出，`/api/rooms*` 与 `/api/rooms/:id/meters` 最后评估 drain

## REMOVED Requirements
### Requirement: None
**Reason**: 本子任务只新增 `phase14-03` 的冻结与解释要求，不移除既有能力。
**Migration**: 无。
