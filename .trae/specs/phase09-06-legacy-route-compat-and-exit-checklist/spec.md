# Phase09-06 旧路由兼容与退出清单 Spec

## Why
`phase09-01` 到 `phase09-05` 已把合同、账单、抄表、退租与删除门禁等主链逐步迁入 `src/lib/domain/*` 与 `server/routes/*`，但旧 `src/app/api/*` 仍同时承载正式已迁接口、compat wrapper、未迁移存量接口与治理/辅助接口。若在 `phase09` 结束前不把这些旧入口的当前角色、去向、退出条件和回滚条件写清，`phase10` 将继续面对“哪些接口还能动、哪些接口只是兼容层、哪些接口必须保留”的双重真相。

## What Changes
- 新增旧 `src/app/api/*` 的分类清单，明确“正式承接 / compat wrapper / 未迁移存量接口”三类口径
- 新增旧接口到 `server/routes/*`、共享领域服务或后续阶段的去向映射
- 新增旧兼容宿主退出条件、回滚条件与阶段边界清单
- 新增 `phase10` 上游输入清单，说明哪些接口已具备退出前提、哪些接口必须继续保留
- **BREAKING** `phase09-06` 后，旧 `src/app/api/*` 不再被笼统视为“仍是默认真相源”；每个旧入口都必须具有明确类别、承接位与退出条件

## Impact
- Affected specs: `phase09-domain-service-migration`
- Affected code: `src/app/api/*`, `server/routes/*`, `src/lib/domain/*`, `docs/phase09_domain_service_migration_shared_baseline.md`, `docs/phase09_domain_service_migration_architecture_plan.md`

## ADDED Requirements
### Requirement: Legacy Route Classification Inventory
系统 SHALL 提供旧 `src/app/api/*` 的完整分类清单，并为每个旧入口明确其当前职责归属。

#### Scenario: Classify a legacy route
- **WHEN** 开发者审查任意旧 `src/app/api/*` 路由
- **THEN** 清单必须明确其属于“已迁移为新主线正式承接”“compat wrapper”“未迁移存量接口”中的哪一类
- **AND** 必须写明对应正式宿主、共享领域服务或继续保留原因
- **AND** 不得把治理/辅助接口伪装成“已迁移正式主链接口”

### Requirement: Exit And Rollback Conditions
系统 SHALL 为旧兼容宿主提供清晰的退出条件与回滚条件，使 `phase10` 可以基于同一判断标准推进。

#### Scenario: Decide whether a legacy route can exit
- **WHEN** 开发者评估某个旧接口是否可退出
- **THEN** 清单必须明确至少包含正式宿主承接状态、共享领域服务真相源状态、页面/服务端/数据库一致性状态与剩余兼容调用情况
- **AND** 必须提供回滚条件，说明在什么情况下仍需恢复或保留旧入口
- **AND** 不得在未满足前提时直接建议删除旧接口

### Requirement: Phase10 Upstream Input
系统 SHALL 为 `phase10` 输出明确的上游输入清单，说明旧接口的后续去向与仍待处理项。

#### Scenario: Prepare phase10 upstream input
- **WHEN** `phase09-06` 完成
- **THEN** 必须形成可供 `phase10` 直接消费的输入清单
- **AND** 该清单必须区分“可继续退出评估”“必须继续保留 compat”“仍未迁移且留待后续阶段”的旧接口集合
- **AND** 必须保持与 `server/routes/*` 和共享领域服务现状一致

## MODIFIED Requirements
### Requirement: Legacy API Host Responsibility
旧 `src/app/api/*` 在 `phase09-06` 后继续作为存量运行线存在，但其职责必须细化为已迁接口兼容层、未迁移存量接口或治理/辅助接口，不得继续以“默认正式宿主”身份承接新增主链真相。

#### Scenario: Read legacy API responsibility after phase09-06
- **WHEN** 开发者查看旧 `src/app/api/*` 的职责
- **THEN** 每个旧入口都必须能映射到清单中的明确分类与去向
- **AND** 已迁主链接口必须显示其正式宿主与共享领域服务承接位
- **AND** 未迁移接口必须显示继续保留原因与后续阶段去向

## REMOVED Requirements
### Requirement: Implicit Legacy Route Ownership
**Reason**: 若旧 `src/app/api/*` 仍以“默认还在工作”这种隐含口径存在，`phase10` 无法建立清晰的数据访问层与退出评估基线。
**Migration**: 通过旧路由分类清单、退出条件、回滚条件与 `phase10` 上游输入清单，把每个旧接口的状态、承接位和后续去向显式化。
