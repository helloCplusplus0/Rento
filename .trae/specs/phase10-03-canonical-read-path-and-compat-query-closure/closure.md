# Phase10-03 Canonical Read Path 与 Compat 查询收口结果

## 1. 边界说明

- 本子任务只冻结 canonical read path、compat 查询边界与 route inventory 到查询层的收口顺序。
- 本子任务不删除 legacy 查询 helper，不迁移 dashboard 宿主，不切部署主线。
- 由于当前环境没有可用的 Context7 接口，本次实现以仓库内最新代码、`phase10` 文档与 `phase09-06` route inventory 作为收口依据。

## 2. 核心读取场景的 canonical read path

| 场景 | 当前 canonical read path | 当前身份判断 | 备注 |
| --- | --- | --- | --- |
| 合同列表 | SSR 页面 `src/app/contracts/page.tsx` -> `src/lib/queries.ts` -> `contractQueries.findAll()`；列表 API `/api/contracts` -> `src/lib/optimized-queries.ts` -> `optimizedContractQueries.findWithPagination()` | 当前列表读取仍分为 SSR compat 路径与 API 优化路径 | `optimized-queries.ts` 目前只覆盖 legacy 列表 API，不等于已经替代 SSR 页面读取 |
| 合同详情 | `src/lib/queries.ts` -> `contractQueries.findById()` | 过渡期 canonical detail read | 详情读取仍压在 legacy compat 查询层，但已冻结为单一详情承接位，不再与 `optimized-queries.ts` 摇摆 |
| 账单列表 | SSR 页面 `src/app/bills/page.tsx` -> `src/lib/queries.ts` -> `billQueries.findAll()`；列表 API `/api/bills` -> `src/lib/optimized-queries.ts` -> `optimizedBillQueries.findWithPagination()` | 当前列表读取仍分为 SSR compat 路径与 API 优化路径 | `optimized-queries.ts` 目前只覆盖 legacy 列表 API；SSR 页面仍直接依赖 `queries.ts` |
| 账单详情 | `src/lib/queries.ts` -> `billQueries.findById()` | 过渡期 canonical detail read | 详情主记录继续由 `queries.ts` 承接 |
| 账单明细 / utility details | `src/app/api/bills/[id]/details/route.ts` 与 `src/app/api/bills/[id]/utility-details/route.ts` 的 route-local Prisma 读取 | `defer-unmigrated` 的 ad-hoc 查询路径 | 该类明细尚未进入统一 query helper；`phase10-03` 先冻结其为待抽离路径，而不是误记为 `queries.ts`/`optimized-queries.ts` 主入口 |
| 房间列表 | SSR 页面 `src/app/rooms/page.tsx` -> `src/lib/queries.ts` -> `roomQueries.findAll()`；默认列表 API `/api/rooms` -> `src/lib/queries.ts` -> `roomQueries.searchRooms()`；`/api/rooms?includeMeters=true` -> `src/lib/optimized-queries.ts` -> `optimizedRoomQueries.findWithMeters()` | 当前列表读取拆分为 SSR 全量读取、默认搜索 API 与 `includeMeters` 优化分支 | `optimizedRoomQueries.findWithMeters()` 只服务批量抄表等带仪表场景，不等于默认房间列表 canonical read path |
| 房间详情 | `src/lib/queries.ts` -> `roomQueries.findById()` | 过渡期 canonical detail read | 详情读模型仍位于 compat 查询层 |
| 抄表列表 | `src/lib/queries.ts` -> `meterReadingQueries.findAll()` | 过渡期 canonical list read | 列表筛选仍在 legacy 查询层，后续才讨论抽离分页读模型 |
| 抄表详情 | `src/lib/domain/meters/index.ts` -> `meterReadingDomainService.getMeterReadingDetail()` | 正式主链查询 | 详情已脱离 `queries.ts`，旧 Next API 只保留 compat wrapper |
| 抄表 related bills | `src/lib/domain/meters/index.ts` -> `meterReadingDomainService.getRelatedBillsForMeterReading()` | 正式主链查询 | 关联账单追溯已冻结到共享领域服务 |
| Dashboard 总览统计 | `src/lib/dashboard-queries.ts` -> `getEnhancedDashboardStats()` | 治理/辅助查询 | 只服务 dashboard 总览统计，不反向定义合同/账单/房间/抄表的正式读模型 |

## 3. 查询文件的长期定位

| 文件 | 主角色 | 允许继续承接 | 不应再承接 |
| --- | --- | --- | --- |
| `src/lib/queries.ts` | legacy compat 查询承接位 | 合同/账单/房间/抄表的存量详情与 SSR 直接读取；部分过渡期统计 | 新的主链写职责；新的分页主入口；被误读为长期正式统一读入口 |
| `src/lib/optimized-queries.ts` | 正式主链查询候选位 + legacy 列表优化承接位 | 合同/账单分页列表；legacy API 的数据库侧分页/过滤/排序优化 | 详情读模型的默认承接；治理查询聚合 |
| `src/lib/dashboard-queries.ts` | 治理/辅助查询 | `/api/dashboard/stats` 总览统计 | 主链 canonical read path 真相源 |
| `src/lib/search-queries.ts` | 未接入的辅助搜索 helper | 搜索建议原型与后续辅助搜索试验 | 当前主链 canonical read path |
| `src/lib/global-settings.ts` | 治理配置查询/写入承接位 | settings 管理、合同提醒窗口、抄表与计费默认值回退 | 合同/账单/房间/抄表主数据读取真相源 |
| `src/lib/health-checker.ts` | 治理/脚本查询承接位 | 细粒度健康检查、问题定位 | `/api/health` 主入口与主链页面读取真相源 |

## 4. `queries.ts` 与 `optimized-queries.ts` 的收口结论

### 4.1 `queries.ts`

- 可保留的 compat 查询
  - `contractQueries.findById()`
  - `billQueries.findById()`、`findByContract()`
  - `roomQueries.findAll()`、`findById()`
  - `meterReadingQueries.findAll()`、`findByMeter()`、`findByContract()`
- 应继续退出的写职责
  - `create()` / `update()` / `delete()` / `batchUpdateStatus()` 这类仍停留在查询层的写操作
  - 任何新的跨聚合写入编排

### 4.2 `optimized-queries.ts`

- 正式读取模型候选位
  - `optimizedContractQueries.findWithPagination()`
  - `optimizedBillQueries.findWithPagination()`
- 当前仍只是兼容优化实现
  - `optimizedRoomQueries.findWithMeters()`
  - `optimizedRoomQueries.findWithPagination()`
  - `optimizedRenterQueries.*`
- 原因
  - 这些能力虽然具备数据库侧分页/过滤/排序优势，但当前主要宿主仍是 legacy Next API，而非统一正式宿主

## 5. Route Inventory 到查询层收口顺序

### 5.1 `keep-compat`

| 顺序 | 收口重点 | 查询承接位 | 说明 |
| --- | --- | --- | --- |
| 1 | 保持已迁入共享领域服务的 compat wrapper 不回流到 `queries.ts` | `src/lib/domain/contracts/index.ts`、`src/lib/domain/billing/index.ts`、`src/lib/domain/meters/index.ts`、`src/lib/domain/delete-guards/index.ts` | 该 bucket 重点是守住已冻结的正式宿主/领域服务边界；`global-settings.ts` 不属于 `keep-compat` 主体 |

### 5.2 `defer-unmigrated`

| 顺序 | 收口重点 | 查询承接位 | 典型路由 |
| --- | --- | --- | --- |
| 1 | 先冻结已成型的列表 API 优化读模型，并单独记录 `includeMeters` 变体 | `src/lib/optimized-queries.ts` | `/api/contracts`、`/api/bills`、`/api/rooms?includeMeters=true` |
| 2 | 再冻结仍必须保留的详情、SSR 与默认列表读路径 | `src/lib/queries.ts` | `src/app/contracts/page.tsx`、`src/app/bills/page.tsx`、`src/app/rooms/page.tsx`、`/api/contracts/:id`、`/api/bills/:id`、`/api/rooms`、`/api/rooms/:id`、`/api/meter-readings` |
| 3 | 最后记录 route-local ad-hoc Prisma 读取 | route-local Prisma + cache | `/api/bills/:id/details`、`/api/bills/:id/utility-details`、多数组合型 dashboard 卡片 |
| 4 | 治理与辅助入口独立保留，不反向定义主链 | `src/lib/dashboard-queries.ts`、`src/lib/global-settings.ts`、`src/lib/health-checker.ts`、`src/lib/search-queries.ts` | `/api/dashboard/*`、`/api/settings*`、`/api/health/system`、`/api/health/bills` |

## 6. 不越界确认

- 未删除任何 legacy 查询 helper
- 未迁移 dashboard 到统一正式宿主
- 未修改部署、迁移链或 ORM 主线
- 仅冻结长期定位、查询角色与后续收口顺序
