# Phase10-01 数据访问盘点与查询角色分类 Spec

## Why
`phase09` 已冻结共享领域服务、正式宿主边界与 legacy route inventory，但当前仓库中的数据访问入口仍分散在多个查询 helper、事务入口和治理辅助文件中。若不先形成一份可追溯、可验证的单一入口清单，后续 `phase10` 的事务统一、canonical read path 冻结与迁移兼容项收口都会建立在不完整事实之上。

## What Changes
- 新增 `phase10-01` 的数据访问入口盘点 spec，明确本子任务只做盘点、分类与映射，不直接重写实现
- 为 `src/lib/prisma.ts`、`src/lib/transaction-manager.ts`、`src/lib/queries.ts`、`src/lib/optimized-queries.ts`、`src/lib/dashboard-queries.ts`、`src/lib/search-queries.ts`、`src/lib/global-settings.ts`、`src/lib/health-checker.ts` 建立统一角色分类口径
- 把 `phase09-06` legacy route inventory 的 bucket 与上述入口建立可回溯映射关系
- 明确每个入口属于“正式主链写路径 / 正式主链查询 / legacy compat 查询 / 治理与脚本查询”中的哪一类
- 明确每个入口的保留原因、当前服务对象、退出条件或后续阶段承接位

## Impact
- Affected specs:
  - `phase10-data-access-and-migration-closure`
  - `phase10-01-data-access-inventory-and-query-role-classification`
- Affected code:
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

## ADDED Requirements
### Requirement: 数据访问入口必须形成单一盘点清单
系统 SHALL 为 `phase10-01` 范围内的所有数据访问入口建立统一盘点清单，且清单能够说明每个入口当前承担的角色、服务对象与后续去向。

#### Scenario: 范围内入口全部被盘点
- **WHEN** 审核 `phase10-01` 的盘点结果
- **THEN** `src/lib/prisma.ts`、`src/lib/transaction-manager.ts`、`src/lib/queries.ts`、`src/lib/optimized-queries.ts`、`src/lib/dashboard-queries.ts`、`src/lib/search-queries.ts`、`src/lib/global-settings.ts`、`src/lib/health-checker.ts` 均被纳入清单
- **AND** 不再存在“该文件是否属于 `phase10-01` 范围”无法解释的状态

### Requirement: 每个入口必须有明确角色分类
系统 SHALL 为 `phase10-01` 范围内的每个数据访问入口标记明确角色分类，分类仅限：
- 正式主链写路径
- 正式主链查询
- legacy compat 查询
- 治理与脚本查询

#### Scenario: 入口分类可被复核
- **WHEN** 审核任一入口的盘点结果
- **THEN** 能看到该入口的角色分类
- **AND** 能看到其当前服务对象、保留原因与是否属于过渡期保留入口

### Requirement: legacy route bucket 必须能回溯到查询依赖
系统 SHALL 使用 `phase09-06` legacy route inventory 作为 `phase10-01` 的直接输入，并确保每个 `phase10Input` bucket 都能回溯到对应的数据访问入口或查询依赖。

#### Scenario: route inventory 映射完整
- **WHEN** 复核 `exit-evaluation`、`keep-compat`、`defer-unmigrated` 三类 bucket
- **THEN** 每类 bucket 都能解释其依赖的查询入口或数据访问入口
- **AND** 不再存在“某条旧路由依赖哪类查询入口”无法解释的状态

### Requirement: 本子任务不得越界到实现改写
系统 SHALL 将 `phase10-01` 限定为盘点与分类任务，不得在本子任务中直接重写 query helper、迁移新领域服务或切换部署主线。

#### Scenario: 盘点任务保持最小边界
- **WHEN** 执行 `phase10-01`
- **THEN** 变更集中于盘点结果、角色分类、映射关系和必要验证
- **AND** 不直接重写 `queries.ts`、`optimized-queries.ts` 等实现逻辑
- **AND** 不新增新的主链领域迁移范围

## MODIFIED Requirements
### Requirement: `phase10` 的直接输入定义
`phase10` 的直接输入不仅包括 `phase09-06` route inventory 与 Prisma 事务、SQLite 兼容残留，也包括 `phase10-01` 范围内所有实际参与主链、compat 或治理读取的数据访问入口清单。

#### Scenario: 输入定义与仓库现状一致
- **WHEN** 审核 `phase10-01` 交付
- **THEN** `global-settings.ts` 与 `health-checker.ts` 等实际存在的查询/治理入口被纳入统一输入定义
- **AND** `phase10` 后续子任务不再遗漏这些入口

## REMOVED Requirements
### Requirement: 仅凭文件名或历史印象判断查询角色
**Reason**: 现有查询入口职责重叠，继续靠经验判断会造成 `phase10` 边界漂移。
**Migration**: 改为以 `phase10-01` 的单一盘点清单与 `phase09-06` route inventory 映射结果作为后续 `/spec` 和实现判断依据。
