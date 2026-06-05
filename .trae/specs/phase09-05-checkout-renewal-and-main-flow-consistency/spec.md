# Phase09-05 退租续租与主链一致性 Spec

## Why
`phase09-04` 已把抄表、自动出账与终抄语义迁入共享领域服务，但退租结算、续租/补账单关联编排和主链查询/写路径一致性仍主要散落在旧 `src/app/api/contracts/*` 与旧工具链中。若不把退租和续租的跨合同、账单、抄表事务编排收口到共享领域与正式宿主，当前主链仍会停留在“页面、旧宿主、共享服务”三套事实共存的状态。

## What Changes
- 新增共享领域服务对退租结算计算器与退租事务编排的正式承接位
- 新增共享领域服务对续租与补账单关联主链的正式承接位
- 新增 `server/routes/contracts.ts` 与 `server/routes/checkout.ts` 对续租、补账单、退租结算的正式消费入口
- 让旧 `src/app/api/contracts/[id]/checkout/route.ts`、`renew/route.ts`、`generate-bills/route.ts` 退化为 compat wrapper 或共享服务消费者
- 收口主链查询与写路径的一致性，明确页面展示、服务端生成结果与数据库事实的统一口径
- 补齐至少四条主链 smoke 验证路径，并让其能落到真实脚本、验证器或清单
- **BREAKING** 新正式宿主下，退租结算、续租与补账单关联编排以共享领域服务为单一真相源，不允许旧宿主继续独立维护第二套事务编排或主链结果解释

## Impact
- Affected specs: `phase09-domain-service-migration`
- Affected code: `src/lib/domain/contracts/*`, `server/routes/contracts.ts`, `server/routes/checkout.ts`, `src/lib/checkout-settlement.ts`, `src/app/api/contracts/[id]/checkout/route.ts`, `src/app/api/contracts/[id]/renew/route.ts`, `src/app/api/contracts/[id]/generate-bills/route.ts`, `src/lib/business-flow-validator.ts`, `docs/delete_contract_chart.md`, `docs/renew_lease_chart.md`, `docs/moving_out_rental_chart.md`

## ADDED Requirements
### Requirement: Checkout Settlement Service Host
系统 SHALL 在共享领域服务层正式承接退租结算计算器与退租事务编排，使退租时的合同、账单、房间、租客与终抄处理由单一事务语义收口。

#### Scenario: Execute checkout settlement from formal host
- **WHEN** 正式宿主或 compat wrapper 发起退租结算
- **THEN** 共享领域服务必须统一计算租金、押金、钥匙押金、损坏赔偿与旧未付账单的结算结果
- **AND** 共享领域服务必须统一落结算账单、旧账单收口、合同终止、房间回空和终抄处理
- **AND** 路由层只负责鉴权、请求解析、响应适配与 compat 边界说明

### Requirement: Renewal And Supplemental Billing Orchestration
系统 SHALL 在共享领域服务层正式承接续租与补账单主链，使原合同状态流转、新合同创建、账单补齐与房态联动不再依赖旧宿主独立编排。

#### Scenario: Renew contract and generate related bills
- **WHEN** 用户发起续租
- **THEN** 共享领域服务必须统一校验原合同状态、房间可续租性与未结清账单前置条件
- **AND** 共享领域服务必须统一完成原合同收口、新合同创建、房态联动与后续账单生成或补齐
- **AND** 不得让旧宿主继续独立维护第二套续租事务顺序

### Requirement: Main Flow Query Write Consistency
系统 SHALL 收口主链查询与写路径的一致性，使页面预期、服务端结果与数据库事实在新签合同、续租、退租、多仪表抄表出账四条主链上保持统一口径。

#### Scenario: Explain main flow result consistently
- **WHEN** 页面展示合同、账单、退租结算或续租后的主链结果
- **THEN** 查询层与写路径必须返回可解释的一致事实
- **AND** 不得出现“页面已切新主线、服务端仍依赖旧解释”或“数据库事实与展示口径不一致”的双重真相

### Requirement: Main Flow Smoke Paths
系统 SHALL 为 `phase09-05` 提供至少四条可执行的主链 smoke 验证路径，并明确验证入口、验证数据和期望结果。

#### Scenario: Validate four critical business flows
- **WHEN** 开发者执行 `phase09-05` 验证
- **THEN** 至少应覆盖新签合同、续租、退租结算、多仪表抄表出账四条主链
- **AND** 每条路径都必须说明关键前置条件、执行步骤、期望数据库事实与失败信号
- **AND** 验证结果必须能区分“正式宿主已承接”与“仍由 compat wrapper 兜底”的边界

## MODIFIED Requirements
### Requirement: Legacy Contract Checkout Renewal Compatibility
旧 `src/app/api/contracts/[id]/checkout/route.ts`、`renew/route.ts` 与 `generate-bills/route.ts` 在 `phase09-05` 后继续保留兼容职责，但不得继续独占退租结算、续租/补账单事务编排与主链一致性解释。

#### Scenario: Serve legacy contract flow after migration
- **WHEN** 旧 Next.js 宿主收到退租、续租或补账单相关请求
- **THEN** 旧入口应调用共享领域服务或正式宿主承接结果
- **AND** 必须保留存在原因与退出条件表达
- **AND** 不得继续在旧入口独立演化第二套主链事务规则

## REMOVED Requirements
### Requirement: Legacy-Only Checkout Renewal Truth
**Reason**: 若退租结算、续租和补账单主链长期停留在旧 `src/app/api/contracts/*`，`phase09` 将无法真正完成“单一真相源”的主链迁移。
**Migration**: 退租结算、续租、补账单关联编排与主链 smoke 验证迁入 `src/lib/domain/contracts/*` 与正式 Hono 宿主，旧入口退化为 compat wrapper、薄包装或只读参考。
