# Phase03 Consistency Hardening 推进计划

## Summary

* 当前仓库已经完成 `phase02-auth-gate-*`，并已把默认入口切换到 `phase03-consistency-hardening-*`，因此下一步不应直接写代码，而应先完成 `phase03` 的阶段级设计文档与顶层真相源同步。

* 本轮 `/plan` 的目标不是立即修复所有一致性问题，而是先把 `phase03` 的边界、子任务顺序、共享约束和验收口径冻结为新的阶段真相源。

* 基于当前代码实况，`phase03` 的核心问题已可明确收束为三类：

  * 删除门禁与历史保留存在服务端缺口，部分链路仍直接物理删除。

  * 金额字段、查询条件和仪表盘统计存在历史语义漂移。

  * PostgreSQL 主线已经成立，但迁移链仍依赖 `sqlite` 历史兼容分支。

* 执行顺序建议固定为：

```text
先同步顶层规范与阶段快照
    ->
产出 phase03 的 architecture_plan / dev_plan / shared_baseline
    ->
停止并等待用户审核
    ->
用户审核后再按 dev_plan 逐个子任务进入 /spec
```

## Current State Analysis

### 1. 顶层真相源已切到 phase03，但阶段级文档尚未生成

* [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md) 已把当前默认工作流切到 `phase03-consistency-hardening-*`。

* [plan.md](file:///home/dell/Projects/Rento/plan.md) 已把 `phase03` 定义为“主链一致性与语义收口”。

* 当前尚未存在以下阶段级正式文档：

  * `docs/phase03_consistency_hardening_architecture_plan.md`

  * `docs/phase03_consistency_hardening_dev_plan.md`

  * `docs/phase03_consistency_hardening_shared_baseline.md`

* 按现有全局规则，这意味着 `phase03` 仍缺少可供后续 `/spec` 直接承接的阶段真相源。

### 2. 删除门禁与历史保留的服务端实现仍不完整

* [validation.ts](file:///home/dell/Projects/Rento/src/lib/validation.ts) 已有 `performDeleteSafetyCheck()` 与 `performContractDeleteSafetyCheck()`，但当前规则仍偏弱：

  * 房间删除检查只看 `ACTIVE` 合同与未支付账单，未覆盖房态、仪表历史、抄表事实、账单明细。

  * 合同删除检查允许删除未支付账单与抄表记录，仍以“物理删除”作为主要落点。

* [queries.ts](file:///home/dell/Projects/Rento/src/lib/queries.ts) 中仍存在直接物理删除：

  * `roomQueries.delete()`

  * `contractQueries.delete()`

  * `billQueries.delete()`

  * `meterQueries.delete()`

  * `meterReadingQueries.delete()`

* [rooms/\[id\]/route.ts](file:///home/dell/Projects/Rento/src/app/api/rooms/%5Bid%5D/route.ts) 当前删除链路仍包含：

  * 删除账单

  * 删除合同

  * 删除房间

  * 仅在 `archive=true` 时把账单标记为 `COMPLETED`、合同标记为 `TERMINATED`

* [contracts/\[id\]/route.ts](file:///home/dell/Projects/Rento/src/app/api/contracts/%5Bid%5D/route.ts) 当前删除链路仍会删除：

  * 未支付账单

  * 抄表记录

  * 合同主记录

* [meters/\[meterId\]/route.ts](file:///home/dell/Projects/Rento/src/app/api/meters/%5BmeterId%5D/route.ts) 对无读数仪表仍做硬删除，仅在存在读数时才软删除。

* 上述行为与项目规则“历史记录优先保留、删除门禁必须服务端保证”仍有显著张力。

### 3. 查询与金额语义存在真实字段漂移

* [optimized-queries.ts](file:///home/dell/Projects/Rento/src/lib/optimized-queries.ts) 已确认存在与 schema 不一致的字段引用：

  * 房间筛选使用 `monthlyRent`，但 [schema.prisma](file:///home/dell/Projects/Rento/prisma/schema.prisma) 中 `Room` 字段为 `rent`

  * 租客搜索使用 `idNumber`，但 schema 中 `Renter` 字段为 `idCard`

* [dashboard-queries.ts](file:///home/dell/Projects/Rento/src/lib/dashboard-queries.ts) 当前统计口径仍需收口：

  * `pendingReceivables` 把 `status in ['PENDING', 'OVERDUE', 'PAID']` 且 `pendingAmount > 0` 的账单都计入待收

  * `payables` 相关字段仍为占位实现

  * 趋势统计仅基于 `paidDate + receivedAmount`，与 `PENDING / PAID / OVERDUE / COMPLETED` 的业务语义尚未完全对齐

* [bills/\[id\]/route.ts](file:///home/dell/Projects/Rento/src/app/api/bills/%5Bid%5D/route.ts) 已对已收款和已完成账单做基础删除限制，但尚未形成统一账务删除策略。

### 4. schema 与迁移链仍保留高风险历史兼容

* [schema.prisma](file:///home/dell/Projects/Rento/prisma/schema.prisma) 已固定 PostgreSQL，但多个关系仍保留 `onDelete: Cascade`，包括：

  * `Room -> Building`

  * `Contract -> Room/Renter`

  * `Bill -> Contract`

  * `Meter -> Room`

  * `MeterReading -> Meter`

  * `BillDetail -> Bill/MeterReading`

* 这些级联关系不代表当前一定要修改 schema，但必须在 `phase03` 明确其与“历史记录优先保留”之间的冲突与治理策略。

* [migration\_lock.toml](file:///home/dell/Projects/Rento/prisma/migrations/migration_lock.toml) 仍为 `provider = "sqlite"`。

* [migrate-and-seed.sh](file:///home/dell/Projects/Rento/scripts/migrate-and-seed.sh) 当前实际依赖“若锁文件仍是 sqlite，则改走 `db push`”的兼容分支。

* 这说明迁移链仍未形成“PostgreSQL 主线 + 正式退出条件”的统一口径。

## Proposed Changes

### 一、先同步顶层规范与 phase03 阶段快照

#### 目标

* 把 `phase03-consistency-hardening-*` 的当前问题、下一步动作和阶段文档入口同步为顶层真相源。

#### 文件与改动

* `/home/dell/Projects/Rento/AGENTS.md`

  * what: 保持当前默认工作流为 `phase03-consistency-hardening-*`，并补充“当前下一步应先产出 `phase03` 阶段文档，再进入 `/spec`”的阶段快照。

  * why: 避免仓库只知道“现在是 phase03”，却不知道“phase03 的第一步是什么”。

  * how: 在“当前默认入口”与“其他关键治理约束”中补入 `phase03` 阶段文档入口说明。

* `/home/dell/Projects/Rento/plan.md`

  * what: 补充 `phase03` 的推荐子任务顺序与验收口径摘要。

  * why: 当前 `plan.md` 只定义了 `phase03` 的大目标，尚未冻结阶段内部顺序。

  * how: 增加 `phase03` 的子任务顺序摘要，并把“先出阶段文档、再逐个 `/spec`”写成当前阶段默认执行方式。

* `/home/dell/Projects/Rento/architecture_map.md`

  * what: 把当前真实债务点显式映射到代码文件。

  * why: 当前架构图已指出 phase03 的大方向，但仍未把删除门禁、字段漂移、迁移兼容点映射为明确代码落点。

  * how: 在“已知结构债务”中加入 `validation.ts`、`queries.ts`、`optimized-queries.ts`、`dashboard-queries.ts`、`migrate-and-seed.sh` 等真实入口。

* `/home/dell/Projects/Rento/project_skills.md`

  * what: 将 `phase03` 的删除门禁、历史保留和账务语义要求进一步固化为项目技能。

  * why: 这些规则后续会被多个 `/spec` 反复引用，不应只存在于阶段文档。

  * how: 补充“删除应优先转为停用/终止/归档”“账单与抄表事实不得为清理房间或合同而被批量物理删除”等技能条目。

* `/home/dell/Projects/Rento/project_rules.md`

  * what: 仅做最小同步，确认当前规则已覆盖 `phase03` 的硬约束。

  * why: 当前规则主体已基本满足需要，避免为同步而同步。

  * how: 若执行时发现与 `phase03` 新阶段文档冲突，再做最小修正；否则保持不扩写。

* `/home/dell/Projects/Rento/global_skills.md`

  * what: 仅做最小同步，确认阶段工作流与当前 `/plan -> 审核 -> /spec` 规则一致。

  * why: 该文件当前已具备通用流程约束，不需要引入重复的 `phase03` 时间线。

  * how: 仅在执行时发现表达冲突时修正，否则保持不动。

### 二、产出 phase03 的阶段级正式文档

#### 目标

* 为 `phase03-consistency-hardening-*` 生成新的阶段真相源，作为后续所有 `/spec` 的唯一上游依据。

#### 需要新增的文件

* `/home/dell/Projects/Rento/docs/phase03_consistency_hardening_architecture_plan.md`

  * what: 说明为什么 `phase03` 当前重点是“删除门禁 + 历史保留 + 语义漂移 + 迁移兼容”，以及为什么不应直接扩展到性能治理或 UI 调整。

  * why: 防止 `phase03` 在执行中滑成“顺手修所有问题”的混合阶段。

  * how:

    * 明确 `phase03` 的允许范围与非范围

    * 明确服务端门禁优先于页面状态

    * 明确多仪表历史保留与账务追溯优先级

    * 明确迁移链在本阶段只做“正式治理路径与退出条件”，不做冒进重建

* `/home/dell/Projects/Rento/docs/phase03_consistency_hardening_dev_plan.md`

  * what: 把 `phase03` 拆分为顺序执行的子任务与 DoD。

  * why: 后续 `/spec` 必须逐个子任务进入，不能直接跳到实现。

  * how: 固定为以下 4 个子任务：

```text
phase03-consistency-hardening-01-boundary-and-shared-baseline-freeze
phase03-consistency-hardening-02-delete-guard-and-history-preservation
phase03-consistency-hardening-03-billing-query-and-dashboard-semantic-closure
phase03-consistency-hardening-04-migration-compatibility-exit-plan
```

* `/home/dell/Projects/Rento/docs/phase03_consistency_hardening_shared_baseline.md`

  * what: 固化整个 `phase03` 共用的允许/禁止路线。

  * why: `phase03` 横跨删除门禁、金额语义和迁移兼容，若没有共享基线，后续 `/spec` 很容易各写各的边界。

  * how:

    * 固化允许路线：服务端门禁、停用/终止/归档、字段口径统一、迁移兼容显式标注

    * 固化禁止路线：直接扩大 UI 改动、用级联删除掩盖历史、在无方案前盲改旧迁移锁、把 phase04 性能任务混入 phase03

### 三、冻结 phase03 的子任务边界

#### 子任务 01

`phase03-consistency-hardening-01-boundary-and-shared-baseline-freeze`

* 目标：

  * 冻结 `phase03` 允许/禁止路线

  * 冻结删除门禁、账务语义、迁移兼容的优先级顺序

  * 冻结哪些 schema 风险点先通过服务端规则收口，哪些只做记录与计划

* 主要输入文件：

  * `AGENTS.md`

  * `plan.md`

  * `architecture_map.md`

  * `project_skills.md`

  * `docs/phase03_consistency_hardening_shared_baseline.md`

* DoD：

  * `phase03` 的共享边界已冻结

  * 后续 `/spec` 不再需要重新判断本阶段是否允许做历史物理删除

#### 子任务 02

`phase03-consistency-hardening-02-delete-guard-and-history-preservation`

* 目标：

  * 收紧房间、合同、账单、仪表的删除门禁

  * 把“历史事实优先保留”落实到服务端行为

* 主要目标文件：

  * `src/lib/validation.ts`

  * `src/lib/queries.ts`

  * `src/app/api/rooms/[id]/route.ts`

  * `src/app/api/contracts/[id]/route.ts`

  * `src/app/api/meters/[meterId]/route.ts`

  * `src/app/api/bills/[id]/route.ts`

  * 必要时 `src/app/api/rooms/[id]/status/route.ts`、`src/app/api/contracts/[id]/checkout/route.ts`、`src/app/api/contracts/[id]/renew/route.ts`

* DoD：

  * 高风险删除改为明确拦截、停用、终止或归档

  * 不再出现为了删除房间/合同而直接清空账单、抄表、仪表历史的默认行为

  * 至少补一条覆盖主链的可执行验证路径

#### 子任务 03

`phase03-consistency-hardening-03-billing-query-and-dashboard-semantic-closure`

* 目标：

  * 修复字段漂移

  * 收口账务金额语义与仪表盘统计口径

* 主要目标文件：

  * `src/lib/optimized-queries.ts`

  * `src/lib/dashboard-queries.ts`

  * `src/lib/queries.ts`

  * 必要时 `src/app/api/bills/[id]/status/route.ts`

  * 必要时 `src/app/api/dashboard/stats/route.ts`

  * 必要时 `prisma/schema.prisma`（仅在确认字段语义需通过 schema 注释或约束补强时）

* DoD：

  * 不再引用不存在的字段

  * `pending / paid / overdue / completed` 语义在服务端统计与账单行为中一致

  * 多仪表账单、待收金额和趋势统计的口径可解释

#### 子任务 04

`phase03-consistency-hardening-04-migration-compatibility-exit-plan`

* 目标：

  * 把 PostgreSQL 主线与 SQLite 历史兼容的关系收口为“显式兼容项 + 退出条件”

* 主要目标文件：

  * `prisma/migrations/migration_lock.toml`

  * `scripts/migrate-and-seed.sh`

  * `architecture_map.md`

  * 必要时 `README.md` / `DEPLOYMENT.md` / `ENVIRONMENT_GUIDE.md`

* DoD：

  * `sqlite` 锁文件兼容的存在原因、当前作用、退出条件全部显式化

  * 不在缺少方案的前提下直接重建迁移链

  * 文档与脚本对迁移兼容状态口径一致

### 四、本轮 `/plan` 的完成标志

* 本轮 `/plan` 真正执行时，只完成以下动作：

  * 同步顶层规范与阶段快照

  * 生成 `phase03` 的 `architecture_plan`、`dev_plan`、`shared_baseline`

  * 明确 4 个子任务名称、范围和 DoD

* 到此必须停止，不直接进入 `phase03-consistency-hardening-01-*` 的 `/spec` 或实现。

## Assumptions & Decisions

* 决策 1：`phase03` 的第一步不是直接改代码，而是先产出阶段级正式文档。

* 决策 2：`phase03` 必须优先解决服务端删除门禁与历史保留，不允许把这部分降级为“仅前端限制”。

* 决策 3：`optimized-queries.ts` 与 `dashboard-queries.ts` 的字段/语义漂移属于 `phase03` 主线，而不是 `phase04` 的性能优化问题。

* 决策 4：迁移链问题在 `phase03` 只做“兼容项显式化 + 退出条件设计”，不在没有专项方案的前提下盲目修改历史锁文件。

* 决策 5：`phase04-performance-and-ops-*` 继续保持后置，不与 `phase03` 混做。

* 决策 6：本轮计划不包含 UI 重构、不包含 dev server 启动、不包含提交与推送。

* 假设 1：后续执行阶段的本地开发服务仍由用户手动启动，不由 AI 代为后台启动。

* 假设 2：`phase03` 执行时，验证仍以 `lint`、`type-check`、必要的 schema 校验与主链 smoke 路径为主。

## Verification Steps

### 计划阶段验证

* 核对当前默认入口是否已指向 `phase03-consistency-hardening-*`：

  * `AGENTS.md`

  * `plan.md`

* 核对删除门禁与历史保留的真实实现位置：

  * `src/lib/validation.ts`

  * `src/lib/queries.ts`

  * `src/app/api/rooms/[id]/route.ts`

  * `src/app/api/contracts/[id]/route.ts`

  * `src/app/api/meters/[meterId]/route.ts`

  * `src/app/api/bills/[id]/route.ts`

* 核对字段漂移与统计语义的真实位置：

  * `src/lib/optimized-queries.ts`

  * `src/lib/dashboard-queries.ts`

  * `prisma/schema.prisma`

* 核对迁移兼容入口：

  * `prisma/migrations/migration_lock.toml`

  * `scripts/migrate-and-seed.sh`

### `/plan` 执行完成后的验证

* 顶层文档与阶段快照一致指向 `phase03` 当前下一步是“先产出阶段文档，再进入 `/spec`”。

* 以下文件均存在且口径一致：

  * `docs/phase03_consistency_hardening_architecture_plan.md`

  * `docs/phase03_consistency_hardening_dev_plan.md`

  * `docs/phase03_consistency_hardening_shared_baseline.md`

* `dev_plan` 中的子任务顺序、命名与 `spec` 模板一致。

* `/plan` 执行在阶段文档产出后停止，没有越界进入实现。

### 后续实施阶段验证

* 子任务 02 完成后：

  * 存在未结清账单或历史抄表/账单事实的房间、合同、仪表不能按默认路径直接物理删除

* 子任务 03 完成后：

  * `optimized-queries.ts` 不再引用不存在字段

  * `dashboard-queries.ts` 的待收金额、趋势与账单状态口径一致

* 子任务 04 完成后：

  * 迁移兼容逻辑与退出条件均有明确说明

  * 文档、脚本、schema 口径不再互相冲突

## Recommended Execution Order

```text
1. 同步顶层规范与 phase03 当前阶段快照
2. 生成 phase03 的 architecture_plan / dev_plan / shared_baseline
3. 停止并等待用户审核
4. 进入 phase03-consistency-hardening-01-boundary-and-shared-baseline-freeze /spec
5. 进入 phase03-consistency-hardening-02-delete-guard-and-history-preservation /spec
6. 进入 phase03-consistency-hardening-03-billing-query-and-dashboard-semantic-closure /spec
7. 进入 phase03-consistency-hardening-04-migration-compatibility-exit-plan /spec
```

