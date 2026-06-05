# Phase10-01 数据访问入口盘点与查询角色分类

## 1. 边界确认

- 本子任务只产出盘点清单、角色分类、legacy route inventory 映射与验证记录。
- 本子任务不重写 `src/lib/queries.ts`、`src/lib/optimized-queries.ts`、`src/lib/dashboard-queries.ts`、`src/lib/search-queries.ts` 等实现。
- 本子任务直接复核的上游输入：
  - `docs/phase10_data_access_and_migration_closure_architecture_plan.md`
  - `docs/phase10_data_access_and_migration_closure_dev_plan.md`
  - `docs/phase10_data_access_and_migration_closure_shared_baseline.md`
  - `server/lib/legacy-route-inventory.ts`
  - `scripts/phase09-06-legacy-route-inventory.ts`

## 2. 单一数据访问入口清单

| 入口 | 当前主角色 | 当前服务对象 | 保留原因 | 后续去向 / 退出条件 |
| --- | --- | --- | --- | --- |
| `src/lib/prisma.ts` | 正式主链写路径 | `src/lib/domain/*` 共享领域服务、`/api/health`、legacy 查询层、治理脚本 | 当前仓库唯一 Prisma Client 单例入口；`phase10` 明确要求继续固定为正式数据访问基础入口 | 继续保留为底层客户端入口；`phase10-02`、`phase10-03` 只收口其上层调用分层，不替换该单例 |
| `src/lib/transaction-manager.ts` | 正式主链写路径 | `src/lib/data-repairer.ts`、`src/lib/batch-bill-generator.ts`、`src/lib/domain/delete-guards/index.ts` 的事务类型引用 | 现有 `Serializable + 重试` 事务候选承接位；是 `phase10-02` 统一事务来源判断的直接输入 | 在 `phase10-02` 冻结为统一事务来源，或被更轻量共享 helper 取代；本子任务不改实现 |
| `src/lib/queries.ts` | legacy compat 查询 | 旧 `src/app/api/*` CRUD、现有 `src/app/*` 页面读取、`src/lib/validation.ts`、`src/lib/business-flow-validator.ts` | 仍承接大量旧宿主读写与兼容查询，是当前 legacy route inventory 的主要查询依赖 | `phase10-03` 需冻结 canonical read path，并把残留写职责继续退出到共享领域服务或正式宿主 |
| `src/lib/optimized-queries.ts` | 正式主链查询 | 合同、账单、房间、租客的分页列表读取；当前被 legacy `src/app/api/*` 列表路由复用 | 已承接数据库侧分页、过滤、排序和聚合，是正式读取模型候选承接位 | `phase10-03` 需明确哪些分页读取升级为 canonical read path，哪些仅保留 compat 壳复用 |
| `src/lib/dashboard-queries.ts` | 治理与脚本查询 | `/api/dashboard/*` 统计与提醒接口、统计卡片 hook / 组件 | 仪表板聚合属于辅助读模型，不应反向成为主链数据真相源 | 后续阶段决定继续保留为辅助宿主查询层，或并入统一 observability / dashboard 承接位 |
| `src/lib/search-queries.ts` | 治理与脚本查询 | 搜索建议与辅助搜索试验入口；当前未发现活动导入方 | 属于辅助查询 helper，但尚未进入 `phase09-06` legacy route inventory 主路径 | 若后续未被正式搜索入口采用，应归档或合并；本子任务先明确其不属于当前 canonical read path |
| `src/lib/global-settings.ts` | 治理与脚本查询 | `/api/settings*`、合同提醒窗口与默认值读取、`src/lib/domain/meters/index.ts`、dashboard 告警 | 当前全局设置存储与回退逻辑唯一入口，同时被主链读写过程引用为配置来源 | 保持治理配置入口身份；后续如需细分，可把“治理写入口”与“只读配置查询”拆层，但本子任务不重写 |
| `src/lib/health-checker.ts` | 治理与脚本查询 | `/api/health/system`、`/api/health/bills` 辅助健康检查 | 细粒度健康探针只服务辅助健康页和问题定位，不是正式主链查询真相 | 后续阶段根据 observability 策略决定继续保留、并入统一健康层或归档 |

## 3. 过渡期混合职责文件

以下文件虽然可以归入单一主角色，但当前仍处于过渡期混合职责状态，必须带着退出条件继续推进：

| 文件 | 当前混合状态 | 当前判断 | 后续承接位 |
| --- | --- | --- | --- |
| `src/lib/prisma.ts` | 同时被正式主链写路径、正式主链查询、legacy compat 查询、治理查询共用 | 这是允许的基础设施共享，不等于上层角色已经收口 | 保留为底层单例；上层分层在 `phase10-02` / `phase10-03` 明确 |
| `src/lib/transaction-manager.ts` | 名义上是正式写事务候选位，现实使用仍以 repair / batch helper 为主 | 事务口径尚未统一，不能把它直接当成已冻结正式入口 | `phase10-02` 决定“统一复用”还是“提炼后替换” |
| `src/lib/queries.ts` | 同时包含旧 CRUD 写方法、正式页面读取、legacy compat 查询与辅助统计 | 当前最重的职责混合点，也是 `phase10-03` 的主要收口对象 | 主链读取与 compat 查询边界在 `phase10-03` 冻结；写职责继续退出 |
| `src/lib/optimized-queries.ts` | 是正式读取模型候选位，但当前主要被 legacy 列表 API 宿主调用 | 读取模型已比 `queries.ts` 更接近 canonical read path，但宿主仍是旧运行线 | `phase10-03` 冻结正式读取场景后决定长期保留方式 |
| `src/lib/global-settings.ts` | 既承接治理接口写入，也为主链读取/领域服务提供配置回退 | 配置来源应保留单一真相，但治理写与主链读仍混用同一文件 | 后续按“治理写入口 / 只读配置入口”拆层；本子任务只先冻结身份 |

## 4. Legacy Route Inventory 到查询依赖映射

## 4.1 Bucket 级结论

| Bucket | 当前查询依赖特征 | `phase10-01` 判断 |
| --- | --- | --- |
| `exit-evaluation` | 已基本脱离 legacy 查询 helper；只有健康检查仍直接落到 `src/lib/prisma.ts` | 该 bucket 主要是旧入口退出评估，不再成为 query helper 收口阻塞项 |
| `keep-compat` | 已迁到共享领域服务的 compat wrapper，不再以 `queries.ts` / `optimized-queries.ts` 为主依赖 | 该 bucket 的重点是保留 compat 边界，不应回流为 legacy 查询主真相 |
| `defer-unmigrated` | 仍大量依赖 `queries.ts`、`optimized-queries.ts`、`dashboard-queries.ts`、`global-settings.ts`、`health-checker.ts` 和部分直接 `prisma.ts` 读取 | 这是 `phase10-03` 冻结 canonical read path 的主要输入桶 |

## 4.2 入口到 bucket 映射矩阵

| 入口 | `exit-evaluation` | `keep-compat` | `defer-unmigrated` | 说明 |
| --- | --- | --- | --- | --- |
| `src/lib/prisma.ts` | `/api/health` 通过旧健康检查执行数据库连通性探测 | 通过 `src/lib/domain/contracts/index.ts`、`src/lib/domain/billing/index.ts`、`src/lib/domain/meters/index.ts`、`src/lib/domain/delete-guards/index.ts` 作为 compat wrapper 的底层数据入口 | `/api/contracts/:id`、`/api/bills/:id/details`、`/api/bills/:id/utility-details`、`/api/bills/repair-details`、`/api/meter-readings/status-check`、`/api/meter-readings/repair-status`、`/api/data-consistency`、`/api/rooms/:id`、`/api/meters/:meterId`、`/api/buildings/:id`，以及 `/api/dashboard/contract-alerts`、`/api/dashboard/upcoming-contracts`、`/api/dashboard/leaving-tenants`、`/api/dashboard/overdue-payments`、`/api/dashboard/unpaid-rent`、`/api/dashboard/vacant-rooms` 等仍存在直接 Prisma 访问 | 是所有 bucket 共用的底层入口，但只有 `defer-unmigrated` 仍把它当成未收口的直接查询入口 |
| `src/lib/transaction-manager.ts` | 无 | 无直接 route inventory 依赖；当前只在 repair / batch helper 中使用 | 无 | 仍是 `phase10-02` 的事务统一候选位，而不是 `phase10-01` 的旧路由查询依赖 |
| `src/lib/queries.ts` | 无 | 无 | `/api/contracts`、`/api/contracts/:id`、`/api/bills/:id`、`/api/bills/stats`、`/api/meter-readings`、`/api/rooms*`、`/api/meters/:meterId*`、`/api/buildings*`、`/api/renters*` 等旧 CRUD / 统计读取主要依赖 | 是 `defer-unmigrated` bucket 最核心的 legacy 查询入口 |
| `src/lib/optimized-queries.ts` | 无 | 无 | `/api/contracts`、`/api/bills`、`/api/rooms`、`/api/renters` 的分页列表与过滤查询 | 属于“已优化但仍挂在 legacy 宿主”的正式读取候选位 |
| `src/lib/dashboard-queries.ts` | 无 | 无 | `/api/dashboard/stats` | 辅助 dashboard 聚合读取入口；当前只有总览统计路由直接依赖该 helper，不应与其他直接 Prisma 的 dashboard 子路由混同 |
| `src/lib/search-queries.ts` | 无 | 无 | 无 | 当前未进入 `phase09-06` route inventory 依赖链，应视为未接入的辅助搜索 helper |
| `src/lib/global-settings.ts` | 无 | `src/lib/domain/meters/index.ts` 读取抄表/自动出账设置时会间接依赖 | `/api/settings`、`/api/settings/init`、`/api/dashboard/upcoming-contracts`、`/api/dashboard/leaving-tenants`，以及 legacy 合同读取路径中的提醒窗口与默认值装配 | 既是治理设置宿主，又是部分主链/compat 路径的配置依赖 |
| `src/lib/health-checker.ts` | 无 | 无 | `/api/health/system`、`/api/health/bills` | 辅助健康子路径的专用治理入口，不属于正式主链查询 |

## 4.3 Route 组级说明

- `exit-evaluation`
  - `/api/auth/login`、`/api/auth/logout` 不依赖本子任务 8 个查询入口，属于认证语义，不进入 `phase10-01` 查询 helper 收口范围。
  - `/api/health` 仍直接依赖 `src/lib/prisma.ts` 做数据库探针，因此该 bucket 仍保留一个基础设施级数据访问入口。
- `keep-compat`
  - `/api/contracts/activate`、`/api/contracts/:id/generate-bills`、`/api/contracts/:id/renew`、`/api/contracts/:id/checkout`、`/api/bills/:id` 的 `PATCH/DELETE`、`/api/bills/:id/status`、`/api/meter-readings` 的 `POST`、`/api/meter-readings/:id*`、`/api/rooms/:id` 的 `DELETE`、`/api/utility-readings` 已转向共享领域服务。
  - 这些 compat wrapper 的查询债务已经明显小于 `defer-unmigrated`；`phase10-01` 只需记录其底层仍经过 `src/lib/prisma.ts`，以及 `meters` 领域服务会读取 `src/lib/global-settings.ts`。
- `defer-unmigrated`
  - 旧 CRUD / 详情 / 统计路由仍主要压在 `src/lib/queries.ts` 与 `src/lib/optimized-queries.ts`。
  - `/api/dashboard/stats` 直接依赖 `src/lib/dashboard-queries.ts`；`/api/dashboard/upcoming-contracts` 与 `/api/dashboard/leaving-tenants` 直接依赖 `src/lib/global-settings.ts` + `src/lib/prisma.ts`；`/api/dashboard/contract-alerts`、`/api/dashboard/overdue-payments`、`/api/dashboard/unpaid-rent`、`/api/dashboard/vacant-rooms` 直接依赖 `src/lib/prisma.ts`。
  - 健康细分子路径压在 `src/lib/health-checker.ts`。
  - 设置、提醒窗口和默认值配置压在 `src/lib/global-settings.ts`。
  - 若某条旧路由没有落到上述 helper，而是直接依赖 `src/lib/prisma.ts`，说明它属于仍未完成收口的 ad-hoc 查询路径，应在 `phase10-03` 优先处理。

## 5. 对 `phase10-02` 与 `phase10-03` 的直接上游输入

- `phase10-02`
  - `src/lib/prisma.ts` 继续作为底层客户端单例。
  - `src/lib/transaction-manager.ts` 是统一事务策略来源的候选承接位，但尚未冻结。
  - `keep-compat` bucket 已基本退出 legacy query helper，可直接聚焦事务来源，而不是再回头讨论旧查询层。
- `phase10-03`
  - `src/lib/queries.ts` 是最大 legacy 查询债务入口。
  - `src/lib/optimized-queries.ts` 是正式读取模型候选位。
  - `src/lib/dashboard-queries.ts`、`src/lib/global-settings.ts`、`src/lib/health-checker.ts` 应继续作为治理/辅助读取层，不反向定义主链 canonical read path。
  - `src/lib/search-queries.ts` 当前无 route inventory 依赖，不进入首批 canonical read path 冻结列表。

## 6. `phase10-03` 冻结结论回填

### 6.1 核心读取场景

| 场景 | `phase10-03` 结论 | 当前承接位 |
| --- | --- | --- |
| 合同列表 | 正式主链分页列表优先冻结到优化查询层 | `src/lib/optimized-queries.ts` -> `optimizedContractQueries.findWithPagination()` |
| 合同详情 | 详情读取仍留在 compat 查询层，但冻结为单一 detail read | `src/lib/queries.ts` -> `contractQueries.findById()` |
| 账单列表 | 正式主链分页列表优先冻结到优化查询层 | `src/lib/optimized-queries.ts` -> `optimizedBillQueries.findWithPagination()` |
| 账单详情 | 主记录详情继续留在 compat 查询层 | `src/lib/queries.ts` -> `billQueries.findById()` |
| 账单明细 / utility details | 仍属 route-local ad-hoc Prisma 读取 | `src/app/api/bills/[id]/details/route.ts`、`src/app/api/bills/[id]/utility-details/route.ts` |
| 房间列表 | 当前 SSR 房源页继续以 `queries.ts` 为 canonical list read | `src/lib/queries.ts` -> `roomQueries.findAll()` |
| 房间详情 | 详情读取继续留在 compat 查询层 | `src/lib/queries.ts` -> `roomQueries.findById()` |
| 抄表列表 | 列表与筛选继续留在 compat 查询层 | `src/lib/queries.ts` -> `meterReadingQueries.findAll()` |
| 抄表详情 / related bills | 已冻结到共享领域服务 | `src/lib/domain/meters/index.ts` |
| Dashboard 总览统计 | 保留为治理/辅助统计读取 | `src/lib/dashboard-queries.ts` -> `getEnhancedDashboardStats()` |

### 6.2 查询文件长期定位

| 文件 | `phase10-03` 长期定位 |
| --- | --- |
| `src/lib/queries.ts` | legacy compat 查询承接位，保留过渡期 detail/SSR 读取，继续退出写职责 |
| `src/lib/optimized-queries.ts` | 正式主链分页列表读模型候选位，同时继续服务 legacy 列表优化 |
| `src/lib/dashboard-queries.ts` | 治理/辅助查询，只服务 dashboard 总览统计 |
| `src/lib/search-queries.ts` | 未接入主链的辅助搜索 helper |
| `src/lib/global-settings.ts` | 治理配置查询/写入承接位，不是主链数据读取真相源 |
| `src/lib/health-checker.ts` | 治理/脚本查询承接位，只服务细粒度健康检查 |

### 6.3 Route Inventory 到查询层收口顺序

- `keep-compat`
  - 优先守住 `src/lib/domain/*` 支撑的 compat wrapper，不把已迁出的写/读语义重新拉回 `queries.ts`
- `defer-unmigrated`
  - 先收口 `src/lib/optimized-queries.ts` 的合同/账单列表
  - 再收口 `src/lib/queries.ts` 的合同/账单/房间详情与抄表列表
  - 然后显式记录 route-local Prisma 读取债务
  - 最后隔离 `dashboard-queries.ts`、`global-settings.ts`、`health-checker.ts`、`search-queries.ts` 这类治理/辅助 helper；`global-settings.ts` 属于这里的治理配置依赖，而不是 `keep-compat` bucket 主体

## 7. 验证记录

- 已对照 `docs/phase10_data_access_and_migration_closure_architecture_plan.md`、`docs/phase10_data_access_and_migration_closure_dev_plan.md`、`docs/phase10_data_access_and_migration_closure_shared_baseline.md` 复核 `phase10-01` 边界。
- 已复核以下路径真实存在：
  - `server/lib/legacy-route-inventory.ts`
  - `scripts/phase09-06-legacy-route-inventory.ts`
  - `src/lib/prisma.ts`
  - `src/lib/transaction-manager.ts`
  - `src/lib/queries.ts`
  - `src/lib/optimized-queries.ts`
  - `src/lib/dashboard-queries.ts`
  - `src/lib/search-queries.ts`
  - `src/lib/global-settings.ts`
  - `src/lib/health-checker.ts`
- 已执行 `npm run audit:phase09:legacy-routes`
  - 结果：通过
  - 关键输出：扫描旧路由文件 48，清单覆盖文件 48，清单操作条目 52
  - phase10 输入统计：`exit-evaluation` 3，`keep-compat` 12，`defer-unmigrated` 37
- 已执行 `npm run type-check`
  - 结果：通过
