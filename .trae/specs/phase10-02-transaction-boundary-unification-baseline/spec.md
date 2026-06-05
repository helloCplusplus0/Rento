# Phase10-02 事务边界统一基线 Spec

## Why
`phase09` 已把合同、账单、抄表和删除门禁主链写逻辑迁入共享领域服务；当前这四个正式主链领域模块已经统一通过 `src/lib/transaction-manager.ts` 导出的 `runInMainChainWriteTransaction()` 承接 interactive transaction。仓库内仍保留 `TransactionManager` 类给治理脚本、批处理和兼容工具使用，因此 `phase10-02` 需要进一步把“统一事务来源”的验收口径收窄为正式主链四领域模块，避免把这项冻结结果误读为已覆盖全仓所有写路径。

## What Changes
- 为 `phase10-02` 新增事务边界统一 spec，冻结正式主链四领域模块的统一事务策略来源、默认参数、重试口径与适用范围
- 盘点并对齐 `src/lib/transaction-manager.ts` 与 `src/lib/domain/contracts|billing|meters|delete-guards` 中现有统一接入方式
- 明确默认事务参数：
  - `Serializable`
  - `maxWait`
  - `timeout`
  - `P2034` 有界重试
- 明确 array transaction 与 interactive transaction 的选用边界
- 冻结“正式主链四领域模块统一事务策略来源”这一基础决策，后续子任务不再重复讨论是否为这四个模块恢复独立事务 helper

## Impact
- Affected specs:
  - `phase10-data-access-and-migration-closure`
  - `phase10-02-transaction-boundary-unification-baseline`
- Affected code:
  - `src/lib/transaction-manager.ts`
  - `src/lib/domain/contracts/index.ts`
  - `src/lib/domain/billing/index.ts`
  - `src/lib/domain/meters/index.ts`
  - `src/lib/domain/delete-guards/index.ts`
  - `docs/phase10_data_access_and_migration_closure_architecture_plan.md`
  - `docs/phase10_data_access_and_migration_closure_shared_baseline.md`
  - `docs/phase10_data_access_and_migration_closure_dev_plan.md`

## ADDED Requirements
### Requirement: 正式主链写事务必须冻结统一默认参数
系统 SHALL 为正式主链四领域模块的写事务冻结单一默认参数口径，并与仓库现状和 Prisma 官方推荐口径保持一致。

#### Scenario: 默认参数被统一声明
- **WHEN** 审核 `phase10-02` 的事务基线结果
- **THEN** 能看到明确冻结的默认值：
  - `isolationLevel = Serializable`
  - `maxWait = 5000`
  - `timeout = 10000`
  - `P2034` 作为统一写冲突重试码
- **AND** 能解释这些值来自当前领域模块实现与 Context7 的 Prisma 文档交集，而不是凭空指定

### Requirement: 正式主链四领域模块必须冻结单一策略来源
系统 SHALL 为正式主链四领域模块冻结单一策略来源，并明确该冻结结果当前只覆盖 `contracts`、`billing`、`meters`、`delete-guards` 四个共享领域模块，不外推为“全仓所有写路径都已完成统一”。

#### Scenario: 单一策略来源可被明确指认
- **WHEN** 审核 `phase10-02`
- **THEN** 能明确说明统一事务策略来源是 `src/lib/transaction-manager.ts` 或在其基础上提炼出的共享承接位
- **AND** 能明确说明当前已完成统一接入的是 `contracts`、`billing`、`meters`、`delete-guards` 四个正式主链领域模块
- **AND** 后续 `/spec` 不再允许重新讨论“这四个领域模块是否继续保留独立事务 helper”
- **AND** 不会把该结论误写成治理脚本、批处理和兼容工具等全仓所有写路径都已迁入同一 helper

### Requirement: 必须明确 interactive transaction 与 array transaction 的边界
系统 SHALL 为正式主链四领域模块的写路径冻结事务选型边界，明确何时使用 interactive transaction，何时允许使用 array transaction。

#### Scenario: 事务选型边界清晰
- **WHEN** 审核任一主链写场景
- **THEN** 能判断其是否属于跨聚合编排、条件判断较多的 interactive transaction 场景
- **AND** 能判断其是否属于顺序明确、单纯批量提交的 array transaction 场景
- **AND** 不会因选型边界不清而重新把事务策略下沉到路由层或各领域私有 helper

### Requirement: 本子任务不得越界到主链业务改写
系统 SHALL 将 `phase10-02` 限定为事务边界冻结任务，不得在本子任务中直接重写所有领域模块实现、调整业务语义或变更数据库 schema。

#### Scenario: 事务基线任务保持最小边界
- **WHEN** 执行 `phase10-02`
- **THEN** 变更集中于事务参数、策略来源、适用范围与验证链
- **AND** 不直接重构全部领域模块写逻辑
- **AND** 不调整合同、账单、抄表、删除门禁的业务语义
- **AND** 不修改 Prisma schema 或迁移链

## MODIFIED Requirements
### Requirement: `phase10` 的共享事务口径
`phase10` 的共享事务口径从“多个领域模块现状大体趋同”升级为“正式主链四领域模块的单一策略来源、默认参数、重试规则与选型边界均被冻结并可执行验证”。

#### Scenario: 事务口径不再只是经验共识
- **WHEN** 进入 `phase10-03` 或后续阶段
- **THEN** 事务默认参数与策略来源已是上游真相源
- **AND** 不再需要重新争论 `Serializable`、`maxWait`、`timeout`、`P2034` 重试或事务 helper 归属

## REMOVED Requirements
### Requirement: 允许各领域模块长期保留各自事务 helper 作为平行真相
**Reason**: 多套并行事务 helper 会导致参数漂移、重试规则不一致和主链写路径审计困难。
**Migration**: 改为先在 `phase10-02` 冻结正式主链四领域模块的统一策略来源和参数基线；仓库内其他治理/兼容写路径是否复用同一封装，留待后续子任务按边界单独判断。
