# Phase09-03 账务语义与支付周期服务 Spec

## Why
`phase09-02` 已把合同锚点和删除门禁迁入共享服务层，但账单金额/状态语义、支付周期生成规则和账单删除门禁仍主要分散在旧 `src/lib/*` 与 `src/app/api/*` 中。若不先把账务主链的共享语义迁到 `src/lib/domain/billing/*` 与 `server/routes/bills.ts`，后续抄表出账与退租结算将继续建立在多套账务真相源之上。

## What Changes
- 新增共享领域服务对 `Bill.amount / receivedAmount / pendingAmount / BillStatus` 的正式承接位
- 新增共享领域服务对支付周期账单生成与基础自动出账规则的正式承接位
- 新增共享领域服务对账单删除门禁与历史保留规则的正式承接位
- 新增 `server/routes/bills.ts` 对账单更新、账单删除及基础账务语义查询的正式消费入口
- 让旧 `src/app/api/bills/[id]/route.ts` 与相关旧账务入口退化为 compat wrapper 或共享服务消费者
- 明确账单生成来源、展示语义与 compat 边界
- **BREAKING** 新正式宿主下，账单金额与状态的推导、支付周期生成和账单删除门禁以共享领域服务为单一真相源，不允许旧宿主继续独立演化第二套账务规则

## Impact
- Affected specs: `phase09-domain-service-migration`
- Affected code: `src/lib/domain/billing/*`, `server/routes/bills.ts`, `src/lib/bill-semantics.ts`, `src/lib/auto-bill-generator.ts`, `src/app/api/bills/[id]/route.ts`, `src/app/api/contracts/[id]/generate-bills/route.ts`, `docs/fix/fix_001_analysis_contract-billing-cycle.md`, `docs/fix/fix_002_analysis_contract-bill-consistency-and-state-statistics.md`

## ADDED Requirements
### Requirement: Billing Semantics Service Host
系统 SHALL 在共享领域服务层正式承接账单金额与状态语义，使 `amount / receivedAmount / pendingAmount / BillStatus` 的推导和展示口径不再分散在旧宿主与页面局部逻辑中。

#### Scenario: Normalize bill amounts and status
- **WHEN** 正式宿主或 compat wrapper 更新账单金额、待收金额或状态
- **THEN** 共享领域服务必须统一校验金额非负、应收与已收/待收关系一致
- **AND** 共享领域服务必须统一推导 `PENDING / OVERDUE / PAID / COMPLETED` 的状态结果
- **AND** 路由层只负责鉴权、请求解析与响应适配

### Requirement: Payment Cycle Bill Generation Service
系统 SHALL 在共享领域服务层正式承接支付周期账单生成基础规则，并保持合同支付周期与实际 RENT 账单生成结果一致。

#### Scenario: Generate rent bills from contract payment cycle
- **WHEN** 正式宿主或 compat wrapper 为合同生成基础账单
- **THEN** 共享领域服务必须使用统一的支付周期标准化与账期切分规则
- **AND** `月付 / 季付 / 半年付 / 年付` 的生成条数、每期金额与周期标签必须来自同一套真相源
- **AND** 当前子任务只迁移基础租金/押金/一次性费用生成，不迁移抄表自动出账细节

### Requirement: Bill Delete Guard Service
系统 SHALL 在共享领域服务层正式承接账单删除门禁，并继续优先保留已进入正式账务链的历史事实。

#### Scenario: Reject deleting historical bill facts
- **WHEN** 用户尝试删除已结清、已部分收款、已有关联抄表或账单明细的账单
- **THEN** 服务端必须拒绝删除
- **AND** 返回可解释的 `errorCode`、`blockingReasons` 或等价阻断说明、`suggestion`
- **AND** 不得因数据库关联或旧宿主实现差异放宽历史保留原则

#### Scenario: Allow deleting a narrow pending bill
- **WHEN** 账单仍为 `PENDING` 且不存在收款痕迹、抄表历史和账单明细历史
- **THEN** 共享领域服务可以执行受控删除
- **AND** 删除必须通过正式宿主或 compat wrapper 调用共享领域服务完成

## MODIFIED Requirements
### Requirement: Legacy Billing API Compatibility
旧 `src/app/api/bills/[id]/route.ts` 与相关账务旧入口在 `phase09-03` 后继续保留兼容职责，但不得继续独占账务金额/状态语义、支付周期生成与删除门禁业务真相。

#### Scenario: Serve legacy billing request after migration
- **WHEN** 旧 Next.js 宿主收到账单更新、账单删除或基础账单生成请求
- **THEN** 旧入口应调用共享领域服务或正式宿主承接结果
- **AND** 不得继续在旧入口独立演化账务金额与状态推导规则
- **AND** 必须保留存在原因与退出条件表达

## REMOVED Requirements
### Requirement: Legacy-Only Billing Truth
**Reason**: 若账务金额语义、支付周期和删除门禁长期停留在旧 `src/lib/*` 与 `src/app/api/*`，后续抄表出账、退租结算和统计将继续建立在双重真相源之上。
**Migration**: 账务金额/状态语义、支付周期生成与账单删除门禁迁入 `src/lib/domain/billing/*`，`server/routes/bills.ts` 承接正式宿主，旧入口退化为 compat wrapper、薄包装或只读参考。
