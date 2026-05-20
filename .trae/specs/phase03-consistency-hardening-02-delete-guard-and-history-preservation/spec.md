# Phase03 删除门禁与历史保留 Spec

## Why

`phase03-consistency-hardening-*` 的第二个子任务需要把房间、合同、账单、仪表主链中的高风险删除默认路径，从“直接物理删除”收回到“服务端门禁 + 非物理替代动作优先”。当前实现仍存在删除房间时清空合同和账单、删除合同时清空未支付账单和抄表、删除仪表时在部分场景直接硬删除等行为，与已冻结的共享基线冲突。

## What Changes

- 收紧 `src/lib/validation.ts` 的房间与合同删除安全检查，覆盖合同链、账务链、抄表链和业务状态
- 调整 `src/lib/queries.ts` 中房间、合同、账单、仪表、抄表的默认删除能力，使其不再被视为普通无条件物理删除入口
- 调整房间、合同、账单、仪表详情 API 的删除行为，优先拦截、停用、终止、归档或解绑
- 为删除失败场景提供可解释的业务错误码、原因和替代动作建议
- 补一条覆盖账单 / 合同 / 仪表主链的可执行验证路径

## Impact

- Affected specs:
  - `phase03-consistency-hardening-*`
  - 删除门禁
  - 历史事实保留
  - 服务端业务边界
- Affected code:
  - `src/lib/validation.ts`
  - `src/lib/queries.ts`
  - `src/app/api/rooms/[id]/route.ts`
  - `src/app/api/contracts/[id]/route.ts`
  - `src/app/api/meters/[meterId]/route.ts`
  - `src/app/api/bills/[id]/route.ts`
  - 必要时相关测试或验证脚本

## ADDED Requirements

### Requirement: 房间删除必须先通过主链门禁

系统 SHALL 在删除房间前先检查其对合同链、账务链、仪表链和抄表链的影响，而不是默认通过级联物理删除清理关联事实。

#### Scenario: 房间存在关联合同或历史事实

- **WHEN** 用户请求删除一个存在合同、账单、仪表或抄表历史的房间
- **THEN** 服务端必须阻止默认物理删除
- **AND** 返回可解释的业务错误与替代动作建议
- **AND** 不得因为 `force` 或类似入口而直接清空历史事实

### Requirement: 合同删除不得清空账单和抄表历史

系统 SHALL 把合同视为租务事实锚点；若合同已进入生效、到期、终止或已产生账单/抄表事实，默认不得通过删除合同来清空其关联历史。

#### Scenario: 合同存在账单或抄表记录

- **WHEN** 用户请求删除存在账单或抄表记录的合同
- **THEN** 服务端必须优先拒绝物理删除
- **AND** 仅允许在极窄、可解释且不破坏历史事实的条件下继续处理
- **AND** 返回终止、归档或使用专用业务流程的建议

### Requirement: 仪表删除优先停用或解绑

系统 SHALL 把 `Meter` 视为独立资产；当仪表已存在读数、账单明细或历史绑定事实时，删除行为必须优先转为停用或解绑，而不是硬删除。

#### Scenario: 仪表存在历史读数

- **WHEN** 用户请求删除存在读数或账单关联的仪表
- **THEN** 服务端必须保留历史事实
- **AND** 返回的成功结果应体现为停用、解绑或归档，而非真正物理删除

### Requirement: 账单删除受状态和金额语义约束

系统 SHALL 在删除账单前检查其状态、已收金额、待收金额和历史职责，防止通过删除账单破坏财务事实链。

#### Scenario: 账单已承载真实财务事实

- **WHEN** 用户请求删除已收款、已完成或已参与历史追溯的账单
- **THEN** 服务端必须拒绝物理删除
- **AND** 不得把账单删除作为“清理合同 / 房间关系”的附属步骤

## MODIFIED Requirements

### Requirement: 删除门禁的默认实现方式

`phase03-consistency-hardening-02-delete-guard-and-history-preservation` 必须把高风险删除默认路径从“物理删除”改为“拦截 / 停用 / 终止 / 归档 / 解绑”优先，并将这些规则落实到服务端共享校验和详情 API。

#### Scenario: 子任务 02 执行范围

- **WHEN** 执行子任务 `phase03-consistency-hardening-02-delete-guard-and-history-preservation`
- **THEN** 允许同时修改 `validation.ts`、`queries.ts` 与房间 / 合同 / 账单 / 仪表详情 API
- **AND** 修改范围仅限删除门禁、历史保留和可解释错误返回
- **AND** 不得把性能优化、UI 改造或迁移链整改混入本子任务
