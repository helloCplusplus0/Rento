# Tasks

- [x] 任务 1：复核 `phase14-03` 的输入边界并建立 rooms/buildings/meters 盘点范围
  - [x] 子任务 1.1：对照 `docs/phase14_*` 与 `phase14-01` host matrix，确认本子任务只覆盖 rooms/buildings/meters 的宿主解释、删除门禁、引用数据边界与 D2 drain 顺序
  - [x] 子任务 1.2：确认 `server/routes/rooms.ts`、`server/routes/buildings.ts`、`server/routes/meters.ts`、`src/app/api/rooms/**/route.ts`、`src/app/api/buildings/**/route.ts`、`src/app/api/meters/**/route.ts`、`server/lib/legacy-route-inventory.ts`、`src/lib/domain/delete-guards/index.ts` 全部纳入盘点范围
  - [x] 子任务 1.3：确认本子任务不越界到房源查询模型重写、仪表业务约束改写、旧路由删除或页面重构

- [x] 任务 2：冻结 rooms 域的 retained-legacy / compat 解释
  - [x] 子任务 2.1：逐条盘点 `/api/rooms`、`/api/rooms/batch`、`/api/rooms/:id`、`/api/rooms/:id/status`、`/api/rooms/:id/meters` 当前由 Hono、旧 Next、delete-guards 或查询 helper 承接的关系
  - [x] 子任务 2.2：明确 `server/routes/rooms.ts` 当前承接的局部 compat/formal 路径，与整域 retained-legacy 读写边界
  - [x] 子任务 2.3：冻结 rooms 的 `inventoryScope`、`dominantCategory`、`formalHosts`、`bridgeHosts`、`domainServicePaths`、`pageImpact`、`drainPriority` 与 `freezeConclusion`

- [x] 任务 3：冻结 buildings 域的 formal-host-owned 解释
  - [x] 子任务 3.1：逐条盘点 `/api/buildings` 与 `/api/buildings/:id` 当前由 Hono 与旧 Next 共同存在时的职责边界
  - [x] 子任务 3.2：明确 `server/routes/buildings.ts` 当前已是正式宿主，旧 Next 入口仅保留回滚价值
  - [x] 子任务 3.3：冻结楼栋引用数据、楼栋删除条件与房源主链的边界关系

- [x] 任务 4：冻结 meters 域的 compat-wrapper 解释
  - [x] 子任务 4.1：逐条盘点 `/api/meters/:meterId`、`/api/meters/:meterId/status` 与 `/api/rooms/:id/meters` 的职责边界
  - [x] 子任务 4.2：明确 `server/routes/meters.ts` 当前承接独立资产详情、更新、启停与删除门禁，而房间挂表仍属于 retained-legacy
  - [x] 子任务 4.3：冻结仪表作为独立资产、房间绑定关系与历史保留约束的单一解释

- [x] 任务 5：收口 D2 页面影响、删除门禁与退出顺序
  - [x] 子任务 5.1：把 `/rooms*`、`/add/room`、`/add/contract`、`/meter-readings/*` 对 rooms/buildings/meters 的影响写成单一解释
  - [x] 子任务 5.2：明确楼栋引用数据、房间删除门禁、房间换楼栋与仪表挂接/解绑的后续 drain 顺序
  - [x] 子任务 5.3：明确 `phase14-03` 输出可作为 `phase14-04-contracts-and-checkout-api-drain` 的 D2 上游输入

- [x] 任务 6：完成文档与 spec 的一致性验证
  - [x] 子任务 6.1：确认 `docs/phase14_*` 已同步 `phase14-03` 的冻结结论，并继续复用 `phase14-01` host matrix 字段集
  - [x] 子任务 6.2：确认本子任务未放宽历史数据保留、删除门禁与仪表独立资产约束
  - [x] 子任务 6.3：确认本子任务未进入实现、未改写 query model、未删除旧路由，并通过独立审核

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 1
- 任务 4 依赖任务 1
- 任务 5 依赖任务 2、任务 3、任务 4
- 任务 6 依赖任务 2、任务 3、任务 4、任务 5
