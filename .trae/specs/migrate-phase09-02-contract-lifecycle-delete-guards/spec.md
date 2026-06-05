# Phase09-02 合同生命周期与删除门禁 Spec

## Why
`phase09-01` 已冻结共享领域服务承接位与正式宿主骨架，但合同锚点相关语义仍主要停留在旧 `src/app/api/*` 与 `src/lib/*` 中。若不先把合同激活、合同删除门禁和房间删除门禁迁到共享服务层与新宿主，后续账单、抄表和退租链路将继续依赖旧宿主作为事实真相。

## What Changes
- 新增共享领域服务对合同生命周期的正式承接位，覆盖 `PENDING -> ACTIVE` 激活与基础状态流转约束
- 新增共享领域服务对合同删除门禁的正式承接位
- 新增共享领域服务对房间删除门禁的正式承接位
- 新增 `server/routes/contracts.ts` 与 `server/routes/rooms.ts` 对合同激活、合同删除、房间删除相关入口的正式承接
- 让旧 `src/app/api/contracts/[id]/route.ts`、`src/app/api/rooms/[id]/route.ts` 退化为 compat wrapper 或共享服务消费者
- 明确合同/房间删除与终止、归档、释放房态之间的关系
- **BREAKING** 新正式宿主下，合同/房间删除继续优先受服务端门禁保护，不允许因为迁移而回退到直接物理删除

## Impact
- Affected specs: `phase09-domain-service-migration`
- Affected code: `src/lib/domain/contracts/*`, `src/lib/domain/delete-guards/*`, `server/routes/contracts.ts`, `server/routes/rooms.ts`, `server/app.ts`, `src/lib/contract-activation.ts`, `src/lib/validation.ts`, `src/app/api/contracts/[id]/route.ts`, `src/app/api/rooms/[id]/route.ts`

## ADDED Requirements
### Requirement: Contract Lifecycle Service Host
系统 SHALL 在共享领域服务层正式承接合同激活与合同状态流转规则，使合同锚点相关写路径不再依赖旧宿主作为唯一真相源。

#### Scenario: Activate a pending contract on the new host
- **WHEN** 正式宿主触发待生效合同激活
- **THEN** 共享领域服务必须校验合同存在、当前状态为 `PENDING`、房间可释放为在租
- **AND** 必须在同一事务内完成合同状态更新与房间状态联动
- **AND** 路由层只负责鉴权、请求解析和响应适配

### Requirement: Contract Delete Guard Service
系统 SHALL 在共享领域服务层正式承接合同删除门禁，并保持“仅允许删除未形成历史事实的窄场景待生效合同”这一业务约束。

#### Scenario: Reject deleting historical contract facts
- **WHEN** 用户尝试删除已生效、已到期、已终止或已产生账单/抄表事实的合同
- **THEN** 服务端必须拒绝删除
- **AND** 返回可解释的 `errorCode`、`blockingReasons` 与 `suggestion`
- **AND** 不得因 `schema.prisma` 中的级联关系放宽历史保留原则

#### Scenario: Allow deleting a narrow pending contract
- **WHEN** 合同仍为 `PENDING` 且不存在账单、抄表、计费明细等历史事实
- **THEN** 共享领域服务可以执行受控删除
- **AND** 删除必须通过正式宿主或 compat wrapper 调用共享领域服务完成

### Requirement: Room Delete Guard Service
系统 SHALL 在共享领域服务层正式承接房间删除门禁，并继续优先保留合同、账单、仪表和抄表历史。

#### Scenario: Reject deleting room with business history
- **WHEN** 房间处于 `OCCUPIED` 或 `OVERDUE`，或存在合同、账单、仪表绑定、抄表历史
- **THEN** 服务端必须拒绝物理删除
- **AND** 返回可解释的阻断原因和替代建议
- **AND** 替代建议必须优先指向退租、终止、归档、停用或解绑流程

#### Scenario: Allow deleting empty room without history
- **WHEN** 房间没有合同、账单、仪表、抄表等主链历史且状态可释放
- **THEN** 共享领域服务可以执行受控物理删除
- **AND** 必须同步处理楼栋房间计数等联动副作用

## MODIFIED Requirements
### Requirement: Legacy Contract And Room API Compatibility
旧 `src/app/api/contracts/[id]/route.ts` 与 `src/app/api/rooms/[id]/route.ts` 在 `phase09-02` 后继续保留兼容职责，但不得继续独占合同生命周期与删除门禁业务真相。

#### Scenario: Serve legacy request after migration
- **WHEN** 旧 Next.js 宿主收到合同删除或房间删除请求
- **THEN** 旧入口应调用共享领域服务或正式宿主承接结果
- **AND** 不得继续在旧入口独立演化新的删除规则
- **AND** 必须保留存在原因与退出条件表达

## REMOVED Requirements
### Requirement: Direct Delete Logic As Legacy-Only Truth
**Reason**: 把合同删除门禁和房间删除门禁长期留在旧 `src/app/api/*` 会阻断新宿主承接合同锚点主链。
**Migration**: 删除与激活相关逻辑迁入 `src/lib/domain/contracts/*` 与 `src/lib/domain/delete-guards/*`，旧入口退化为 compat wrapper、薄包装或只读参考。
