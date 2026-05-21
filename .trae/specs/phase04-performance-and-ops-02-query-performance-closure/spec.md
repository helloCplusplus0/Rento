# Phase04 查询性能收口 Spec

## Why

`phase04-performance-and-ops-02-query-performance-closure` 的目标不是引入新基础设施，而是把当前最明显的查询性能热点从“全量查询后内存过滤/分页/N+1”收回到数据库侧过滤、分页和聚合路径。当前关键列表接口已经出现旧查询路径未被优化实现全面接管的问题，若不先收口，会继续放大正式业务页与性能基准页的响应成本。

## What Changes

- 审视并收口关键列表接口与统计接口的查询路径
- 优先替换明显的全量查询后内存过滤、分页与 N+1 查询
- 明确哪些优化能力复用 `optimized-queries.ts`，哪些仍保留在 `queries.ts`
- 补最少量性能验证路径，证明关键接口至少不再继续沿用明显低效的旧路径
- **BREAKING**：关键列表接口可能从旧的“全量拉取 + 内存过滤”行为切换为数据库侧分页和过滤，返回顺序、默认分页或查询参数的执行路径会更严格依赖服务端约束

## Impact

- Affected specs:
  - 关键列表接口查询性能
  - 数据库侧过滤、分页、排序与聚合路径
  - 性能验证与基准方式
- Affected code:
  - `src/lib/queries.ts`
  - `src/lib/optimized-queries.ts`
  - 必要时 `src/lib/dashboard-queries.ts`
  - `src/app/api/rooms/route.ts`
  - `src/app/api/renters/route.ts`
  - `src/app/api/contracts/route.ts`
  - `src/app/api/bills/route.ts`
  - 必要时 `scripts/benchmark.js`

## ADDED Requirements

### Requirement: 关键列表接口数据库侧收口

系统 SHALL 对关键列表接口优先使用数据库侧过滤、分页、排序和聚合，不再默认依赖“全量查询后再内存过滤/分页”的旧路径。

#### Scenario: 账单列表避免全量过滤

- **WHEN** 用户请求账单列表并带状态、合同、搜索或分页参数
- **THEN** 服务端应优先在数据库侧完成过滤和分页
- **AND** 不应先全量拉取账单后再在内存中二次过滤与 `slice`

#### Scenario: 合同列表避免全量搜索

- **WHEN** 用户请求合同列表并带搜索条件
- **THEN** 服务端应优先将搜索条件下推到数据库侧
- **AND** 不应先 `findMany` 全量拉取后再做内存 `filter`

### Requirement: 热点查询优先级显式化

系统 SHALL 对当前阶段的查询性能治理热点给出明确优先级，以保证 `phase04-02` 保持低复杂度并优先收口正式业务主链。

#### Scenario: 固定高优先级热点

- **WHEN** 用户或后续 `/spec` 审核 `phase04-02`
- **THEN** 应明确 `/api/bills`、`/api/contracts`、`/api/rooms?includeMeters=true`、`/api/renters` 无筛选分支属于高优先级治理对象
- **AND** 其他查询路径可按影响面和实现复杂度决定是否纳入

## MODIFIED Requirements

### Requirement: 性能验证方式

系统的性能验证 SHALL 优先证明关键接口已不再沿用明显低效的查询路径，而不是扩写为重型压测平台。

#### Scenario: 最小验证路径

- **WHEN** 完成 `phase04-02` 的实现
- **THEN** 至少应存在一条可执行验证路径证明关键接口的查询行为已更接近数据库侧收口
- **AND** 验证可以复用现有基准脚本或新增最小化验证，不要求引入新的外部性能工具

## REMOVED Requirements

### Requirement: 关键列表接口继续默认沿用旧查询路径

**Reason**: 旧路径已经在账单、合同、房间和租客列表中形成明显的全量查询后内存过滤或 N+1 问题，不符合 `phase04` 的数据库侧优化原则。

**Migration**: 优先复用 `optimized-queries.ts` 中现有的分页、过滤与统计能力；对尚未覆盖的热点查询，在当前接口内做最小数据库侧收口并补验证。
