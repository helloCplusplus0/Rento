# Phase10-04 迁移兼容项与退出条件 Spec

## Why
当前仓库已经把 `prisma/schema.prisma` 固定到 PostgreSQL，但 `prisma/migrations/migration_lock.toml` 仍保留 sqlite 历史残留，`scripts/migrate-and-seed.sh` 也仍包含 `db push` 兼容兜底。若不把这些兼容项的存在原因、当前作用、风险、退出条件和回滚条件冻结清楚，后续阶段仍会出现“运行时已切 PostgreSQL，但迁移主线真相不清”的状态。

同时，用户已明确新增约束：`Rento-miniX` 不再寻求 sqlite 支持，唯一正式数据支持由 PostgreSQL 承担。本子任务需要把该决策纳入迁移链治理语义，而不是继续保留“未来也许支持 sqlite”的模糊空间。

## What Changes
- 冻结 `schema.prisma` 已切 PostgreSQL 而 `migration_lock.toml` 仍为 sqlite 的现实原因
- 冻结 `scripts/migrate-and-seed.sh` 中 `db push` 兼容分支的当前作用、正式/兼容边界与退出条件
- 冻结正式迁移目标为 PostgreSQL 基线上的 `prisma migrate deploy`
- 明确 SQLite 不再属于 `Rento-miniX` 的正式数据支持范围
- 明确退出兼容路径前必须满足的前提、回滚条件与验证路径
- 保持边界：不直接修改 lock 文件、不直接重建迁移链、不在本子任务执行生产切线

## Impact
- Affected specs:
  - `phase10-data-access-and-migration-closure`
  - `phase10-04-migration-compatibility-and-exit-conditions`
- Affected code:
  - `prisma/schema.prisma`
  - `prisma/migrations/migration_lock.toml`
  - `scripts/migrate-and-seed.sh`
  - `docs/phase10_data_access_and_migration_closure_architecture_plan.md`
  - `docs/phase10_data_access_and_migration_closure_shared_baseline.md`
  - `docs/phase10_data_access_and_migration_closure_dev_plan.md`
  - `docs/phase03_consistency_hardening_dev_plan.md`
  - `docs/phase03_consistency_hardening_shared_baseline.md`

## ADDED Requirements
### Requirement: 迁移兼容项必须被完整标记
系统 SHALL 明确标记 `migration_lock.toml`、旧迁移目录与 `db push` 分支都属于历史兼容项，而不是当前最佳实践或未来长期正式路径。

#### Scenario: 审核兼容项语义
- **WHEN** 审核 `phase10-04` 的收口结果
- **THEN** 能看到每一项兼容残留的：
  - 存在原因
  - 当前作用
  - 风险
  - 退出条件
  - 回滚条件
- **AND** 不再把它们误读为 PostgreSQL 正式迁移主线的一部分

### Requirement: PostgreSQL 必须被冻结为唯一正式数据库主线
系统 SHALL 明确 PostgreSQL 是 `Rento-miniX` 唯一正式数据支持，SQLite 不再属于当前产品主线的支持范围。

#### Scenario: 审核数据库支持边界
- **WHEN** 审核 `phase10-04` 输出
- **THEN** 能明确判断：
  - `schema.prisma` 的 PostgreSQL provider 是正式主真相
  - SQLite 只以历史兼容残留形式存在于迁移链治理语境
- **AND** 不再保留“未来仍可能继续支持 sqlite”这种模糊口径

### Requirement: 正式迁移目标必须明确为 `migrate deploy`
系统 SHALL 把 PostgreSQL 基线上的 `prisma migrate deploy` 冻结为正式迁移目标，并把 `db push` 限定为兼容兜底，而不是同级正式路径。

#### Scenario: 审核迁移执行边界
- **WHEN** 审核 `scripts/migrate-and-seed.sh` 与阶段文档
- **THEN** 能看到 `migrate deploy` 是正式目标路径
- **AND** 能看到 `db push` 仅在兼容前提下保留
- **AND** 不再出现“两条正式迁移主线并存”的解释

### Requirement: 退出兼容路径前置条件必须被冻结
系统 SHALL 为移除 sqlite 残留与 `db push` 兼容分支之前的治理动作冻结最小前提与回滚条件。

#### Scenario: 审核退出条件
- **WHEN** 审核 `phase10-04` 输出
- **THEN** 能看到退出兼容路径前至少需要完成的条件
- **AND** 能说明若 PostgreSQL 正式迁移链验证失败时，当前回滚基线是什么
- **AND** 不需要在本子任务内直接执行 lock 文件修改或迁移重建

## MODIFIED Requirements
### Requirement: `phase10` 的迁移链治理边界
`phase10` 的迁移链治理从“记录兼容项”升级为“在明确仅支持 PostgreSQL 的前提下，冻结兼容项身份、正式迁移目标、退出条件与回滚条件，并为后续专项整改提供单一上游真相源”。

#### Scenario: 后续阶段继承统一口径
- **WHEN** 后续阶段继续收口迁移链或部署主线
- **THEN** PostgreSQL 单主线与 `db push` 兼容兜底的边界已经冻结
- **AND** 不再需要重新争论 sqlite 是否仍在正式支持范围内

## REMOVED Requirements
### Requirement: 默认保留 SQLite 作为潜在正式支持选项
**Reason**: 用户已明确决定 `Rento-miniX` 不再寻求 sqlite 支持，继续保留此选项会让迁移链治理长期处于双主线模糊状态。
**Migration**: 将 SQLite 降级为仅存在于历史兼容残留与迁移链退出计划中的治理对象，不再作为正式数据库方案进行规划或传播。
