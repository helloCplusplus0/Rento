# Phase10 Data Access And Migration Closure 开发规划

## 当前状态
- `phase10` 的开发规划已完成当前轮产出，作为后续 `/spec` 的顺序执行蓝图。
- 本文档只负责拆分任务、定义顺序、DoD 与验证要求，不替代：
  - `docs/phase10_data_access_and_migration_closure_architecture_plan.md`
  - `docs/phase10_data_access_and_migration_closure_shared_baseline.md`
- `phase10` 当前仍停留在阶段级文档完成、待审核状态；未经审核，不进入任一 `/spec`。

## 一、文档定位
本文档用于把 `phase10-data-access-and-migration-closure` 拆分为顺序执行的子任务，确保仓库先把数据访问层边界、查询分类、事务策略与迁移兼容项解释清楚，再进入 `phase11` 的部署切线。

## 二、总体推进结论
`phase10` 的固定顺序为：

```text
先盘点现有数据访问入口与 route inventory 映射
    ->
再冻结统一事务边界与单一策略来源
    ->
再冻结 canonical read path 与 compat 查询去向
    ->
再冻结 SQLite 兼容残留、正式迁移目标与退出条件
    ->
最后收口文档一致性、验证要求与 phase11 上游输入
```

原因如下：
- 若不先盘点现有数据访问入口，后续事务和查询规划都会建立在不完整清单上。
- 若不先统一事务口径，正式主链写路径仍会继续在各领域模块中复制实现。
- 若不先冻结 canonical read path，legacy 查询层会继续反向牵制正式宿主与领域服务。
- 若不把迁移兼容项放在后半段单独收口，就会把“查询层收口”和“正式迁移链切线”重新绑成一轮高风险改写。

## 三、任务拆分建议
## phase10-01-data-access-inventory-and-query-role-classification
### 目标
盘点当前所有与主链相关的数据访问入口，并把它们按“正式主链写路径 / 正式主链查询 / legacy compat 查询 / 治理与脚本查询”分类，形成单一入口清单。

### 范围
- 盘点 `src/lib/prisma.ts`
- 盘点 `src/lib/transaction-manager.ts`
- 盘点 `src/lib/queries.ts`
- 盘点 `src/lib/optimized-queries.ts`
- 盘点 `src/lib/dashboard-queries.ts`
- 盘点 `src/lib/search-queries.ts`
- 盘点 `src/lib/global-settings.ts`
- 盘点 `src/lib/health-checker.ts`
- 把 `phase09-06` inventory 的 bucket 与上述入口建立映射关系

### 参考来源
- `server/lib/legacy-route-inventory.ts`
- `scripts/phase09-06-legacy-route-inventory.ts`
- `src/lib/queries.ts`
- `src/lib/optimized-queries.ts`
- `src/lib/dashboard-queries.ts`
- `src/lib/search-queries.ts`
- `src/lib/global-settings.ts`
- `src/lib/health-checker.ts`
- `docs/phase10_data_access_and_migration_closure_architecture_plan.md`
- `docs/phase10_data_access_and_migration_closure_shared_baseline.md`

### 不在范围内
- 不直接重写 query helper
- 不迁移新领域服务
- 不切换部署主线

### DoD
- 数据访问入口清单完整
- 每个入口均标明正式/兼容/治理身份
- 每个 legacy route bucket 均能回溯到对应查询依赖
- 不再存在“某条旧路由依赖哪类查询入口”无法解释的状态

### 验证要求
- 对照 `server/lib/legacy-route-inventory.ts` 和脚本输出，确认分桶与入口映射一致
- 复核所有被引用的查询文件路径真实存在

## phase10-02-transaction-boundary-unification-baseline
### 目标
冻结主链写事务的统一策略来源、默认参数、重试口径与适用范围，结束领域模块各自复制事务包装的状态。

### 范围
- 明确 `src/lib/transaction-manager.ts` 与领域服务事务包装之间的关系
- 冻结默认事务参数：
  - `Serializable`
  - `maxWait`
  - `timeout`
  - `P2034` 重试
- 冻结 array transaction 与 interactive transaction 的选用边界
- 冻结统一事务策略来源

### 参考来源
- `src/lib/transaction-manager.ts`
- `src/lib/domain/contracts/index.ts`
- `src/lib/domain/billing/index.ts`
- `src/lib/domain/meters/index.ts`
- `src/lib/domain/delete-guards/index.ts`
- Context7 Prisma 文档关于 interactive transaction 与 `P2034`

### 不在范围内
- 不在本子任务直接重写所有领域模块实现
- 不调整业务语义
- 不变更数据库 schema

### DoD
- 正式主链写事务的默认参数与重试规则被冻结
- 单一事务策略来源被冻结
- 不再允许后续 `/spec` 继续讨论“每个领域模块是否保留单独事务 helper”这种基础决策

### 验证要求
- 对照领域模块现状，确认共享文档中的事务参数与真实代码一致
- 对照 Context7 文档，确认默认策略与 Prisma 推荐口径一致

## phase10-03-canonical-read-path-and-compat-query-closure
### 目标
为合同、账单、房间、抄表与 dashboard 等核心读取场景冻结 canonical read path，并明确 compat 查询与治理查询的长期定位。

### 范围
- 冻结以下高频读取场景的 canonical read path：
  - 合同列表/详情
  - 账单列表/详情/明细
  - 房间列表/详情
  - 抄表列表/详情/related bills
  - dashboard 统计
- 明确 `queries.ts` 中哪些能力仍可保留、哪些应退出写职责
- 明确 `optimized-queries.ts` 中哪些能力属于正式读取模型，哪些只是兼容优化实现
- 明确 `dashboard-queries.ts`、`search-queries.ts` 的治理/辅助身份
- 明确 `global-settings.ts`、`health-checker.ts` 是否属于治理/脚本查询承接位

### 参考来源
- `src/lib/queries.ts`
- `src/lib/optimized-queries.ts`
- `src/lib/dashboard-queries.ts`
- `src/lib/search-queries.ts`
- `src/lib/global-settings.ts`
- `src/lib/health-checker.ts`
- `src/app/api/*` 中被 `defer-unmigrated` 标记的读接口
- `src/lib/domain/contracts/index.ts` 中的主链一致性矩阵

### 不在范围内
- 不直接删除 legacy 查询入口
- 不直接迁移 dashboard 到 Hono 正式宿主
- 不处理最终部署切线

### DoD
- 核心读取场景均有 canonical read path 结论
- compat 查询与治理查询的边界清楚
- `phase09-06` 的分桶结果能映射到查询层收口顺序

### 验证要求
- 核对 route inventory 中的 `keep-compat` 与 `defer-unmigrated` 项，确认其查询层依赖均被分类
- 核对文档表述与现有查询文件职责不冲突

## phase10-04-migration-compatibility-and-exit-conditions
### 目标
明确 SQLite 兼容残留、`migration_lock.toml`、`db push` 分支与 PostgreSQL 正式迁移目标之间的关系、风险、退出条件和回滚条件。

### 范围
- 解释 `prisma/schema.prisma` 已切 PostgreSQL 而 `migration_lock.toml` 仍是 sqlite 的现实原因
- 解释 `scripts/migrate-and-seed.sh` 中 `db push` 兼容兜底的现实用途
- 冻结正式迁移目标为 PostgreSQL 基线上的 `migrate deploy`
- 冻结退出兼容路径前必须满足的前提

### 参考来源
- `prisma/schema.prisma`
- `prisma/migrations/migration_lock.toml`
- `scripts/migrate-and-seed.sh`
- Context7 Prisma 文档关于 `migrate deploy`
- 历史 `phase03` / `phase04` 关于迁移兼容项的治理结论

### 不在范围内
- 不直接修改 lock 文件
- 不直接重建迁移链
- 不执行生产切线

### DoD
- 兼容项的存在原因、当前作用、风险、退出条件、回滚条件写清
- `db push` 与 `migrate deploy` 的正式/兼容职责边界写清
- 后续阶段不再出现“运行时已切 PostgreSQL 但迁移主线真相不清”的状态

### 验证要求
- 对照 `scripts/migrate-and-seed.sh` 现状，确认文档没有虚构执行路径
- 对照 Context7 结论，确认正式迁移目标表述准确

## phase10-05-documentation-consistency-and-verification-closure
### 目标
收口顶层真相源、阶段文档、验证命令与后续 `phase11` 输入，形成“`phase10` 阶段级文档齐备、待审核”的稳定状态。

### 范围
- 复核：
  - `AGENTS.md`
  - `plan.md`
  - `architecture_map.md`
  - `project_rules.md`
- 复核三份 `docs/phase10_*` 的互链与阶段状态
- 冻结 `phase10` 后续实施前的验证命令要求
- 冻结供 `phase11` 直接继承的最小上游输入清单

### 参考来源
- `AGENTS.md`
- `plan.md`
- `architecture_map.md`
- `project_rules.md`
- `docs/phase10_data_access_and_migration_closure_architecture_plan.md`
- `docs/phase10_data_access_and_migration_closure_shared_baseline.md`
- `docs/phase10_data_access_and_migration_closure_dev_plan.md`

### 不在范围内
- 不直接进入 `/spec`
- 不新增实现代码
- 不切换默认工作流到 `phase11`

### DoD
- 顶层真相源与阶段文档状态一致
- 三份 `docs/phase10_*` 已齐备且互相引用正确
- 验证命令、验证脚本和供 `phase11` 直接继承的最小上游输入已明确

### 验证要求
- 运行并记录必要校验：
  - `npm run audit:phase09:legacy-routes`
  - `npm run lint`
  - `npm run type-check`
- 若本轮仅涉及文档，则至少完成文档互链和路径存在性复核

## 四、推荐实施顺序
建议严格按如下顺序推进：

```text
phase10-01-data-access-inventory-and-query-role-classification
phase10-02-transaction-boundary-unification-baseline
phase10-03-canonical-read-path-and-compat-query-closure
phase10-04-migration-compatibility-and-exit-conditions
phase10-05-documentation-consistency-and-verification-closure
```

## 五、默认路线约束
`phase10` 的全部子任务都必须遵守：
- 默认继续把 `src/lib/domain/*` 视为正式主链写路径承接位
- 默认继续把 `Prisma + PostgreSQL` 视为正式数据访问主线
- 默认把 `phase09-06` inventory 视为 `phase10` 的直接排序输入
- 默认把 `db push` 视为兼容兜底，而不是正式迁移链
- 默认不迁移新的主链领域服务，不切换最终部署主线，不重做 UI
- 默认由用户审核 `phase10` 阶段文档后，再逐个进入 `/spec`

## 六、结语
`phase10` 的价值不在于“已经完成最终部署切线”或“已经删光所有 legacy 查询”，而在于：

```text
先把长期数据访问主线、查询分类、事务边界与迁移兼容项冻结成单一真相源，
再让后续实现和部署建立在清晰、稳定的数据访问基础之上。
```
