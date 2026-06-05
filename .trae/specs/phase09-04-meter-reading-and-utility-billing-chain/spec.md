# Phase09-04 抄表与水电账单主链 Spec

## Why
`phase09-03` 已把账务金额语义、基础支付周期和账单删除门禁迁入共享服务层，但仪表/抄表、周期判重、自动出账、相关账单追溯与 `CHECKOUT_FINAL` 最终抄表语义仍主要停留在旧 `src/app/api/*` 与旧查询层中。若不把多仪表抄表主链迁入 `src/lib/domain/meters/*` 与正式 Hono 宿主，后续退租终抄、聚合水电账单和历史追溯仍会继续依赖旧宿主作为事实真相。

## What Changes
- 新增共享领域服务对抄表创建、周期判重和记录类型语义的正式承接位
- 新增共享领域服务对抄表自动生成账单与相关账单追溯的正式承接位
- 新增共享领域服务对 `INITIAL_BASELINE / REGULAR_READING / CHECKOUT_FINAL` 的结构化语义承接
- 新增 `server/routes/meter-readings.ts` 对抄表写入、详情、相关账单追溯与终抄语义的正式消费入口
- 让旧 `src/app/api/meter-readings/*` 与 `src/app/api/utility-readings/route.ts` 退化为 compat wrapper 或共享服务消费者
- 明确多仪表历史保留、抄表禁删与 compat 边界
- **BREAKING** 新正式宿主下，正式抄表重复门禁、自动出账和终抄语义以共享领域服务为单一真相源，不允许旧宿主继续独立演化第二套判重或账单追溯规则

## Impact
- Affected specs: `phase09-domain-service-migration`
- Affected code: `src/lib/domain/meters/*`, `server/routes/meter-readings.ts`, `src/app/api/meter-readings/route.ts`, `src/app/api/meter-readings/[id]/route.ts`, `src/app/api/meter-readings/[id]/related-bills/route.ts`, `src/app/api/utility-readings/route.ts`, `prisma/schema.prisma`, `docs/fix/fix_003_analysis_meter-reading-replacement.md`

## ADDED Requirements
### Requirement: Meter Reading Lifecycle Service Host
系统 SHALL 在共享领域服务层正式承接抄表创建、周期判重和结构化记录类型，使多仪表抄表写路径不再依赖旧宿主作为唯一真相源。

#### Scenario: Create regular readings with precise duplicate guard
- **WHEN** 正式宿主或 compat wrapper 提交正式抄表
- **THEN** 共享领域服务必须基于 `meterId + readingDate + recordType=REGULAR_READING` 做精确周期判重
- **AND** 判重必须基于提交的业务日期而不是服务器当前日期
- **AND** 合同初始底数与退租最终抄表不得被误判为正式抄表重复

### Requirement: Utility Billing From Meter Readings
系统 SHALL 在共享领域服务层正式承接抄表自动出账与多仪表账单追溯，使水电费聚合账单可解释、可追溯、可回溯到具体抄表记录。

#### Scenario: Generate utility bill from multiple readings
- **WHEN** 正式宿主消费一次或多次有效抄表记录生成水电费账单
- **THEN** 共享领域服务必须保留与账单关联的 `meterReadingIds` 或等价追溯线索
- **AND** 同一次提交中的有效仪表不应因误判重而被遗漏
- **AND** 当前子任务只迁移抄表出账主链，不新增治理/辅助统计接口

#### Scenario: Query related bills for a reading
- **WHEN** 用户查询某条抄表记录关联账单
- **THEN** 共享领域服务必须返回与该抄表记录相关的账单摘要、追溯明细和金额汇总
- **AND** 查询逻辑必须优先依赖结构化追溯信息，而不是仅靠时间范围猜测

### Requirement: Checkout Final Reading Semantics
系统 SHALL 在共享领域服务层正式承接 `CHECKOUT_FINAL` 最终抄表语义，使退租终抄与常规抄表在数据层明确区分。

#### Scenario: Persist checkout final reading
- **WHEN** 退租流程写入最终抄表
- **THEN** 共享领域服务必须以 `recordType=CHECKOUT_FINAL` 持久化该记录
- **AND** 该记录不得污染常规抄表的重复门禁
- **AND** 终抄与相关账单追溯关系必须可解释

### Requirement: Meter Reading History Preservation
系统 SHALL 继续保持仪表历史保留与抄表禁删原则，不因主线迁移回退到物理删除历史事实。

#### Scenario: Reject deleting historical meter readings
- **WHEN** 用户尝试删除任意历史抄表记录
- **THEN** 服务端必须按当前治理口径拒绝删除
- **AND** 页面与服务端必须对“禁删”保持一致表达
- **AND** 不得因迁移把旧的伪删除能力重新暴露为可执行操作

## MODIFIED Requirements
### Requirement: Legacy Meter Reading API Compatibility
旧 `src/app/api/meter-readings/*` 与 `src/app/api/utility-readings/route.ts` 在 `phase09-04` 后继续保留兼容职责，但不得继续独占抄表判重、自动出账、相关账单追溯与终抄语义业务真相。

#### Scenario: Serve legacy reading request after migration
- **WHEN** 旧 Next.js 宿主收到抄表写入、相关账单追溯或终抄相关请求
- **THEN** 旧入口应调用共享领域服务或正式宿主承接结果
- **AND** 不得继续在旧入口独立维护第二套判重或账单追溯规则
- **AND** 必须保留存在原因与退出条件表达

## REMOVED Requirements
### Requirement: Legacy-Only Meter Reading Truth
**Reason**: 若抄表判重、自动出账与终抄语义长期停留在旧 `src/app/api/*` 与旧查询层，多仪表历史链将继续存在双重真相与缺项账单风险。
**Migration**: 抄表写入、自动出账、相关账单追溯与终抄语义迁入 `src/lib/domain/meters/*`，`server/routes/meter-readings.ts` 承接正式宿主，旧入口退化为 compat wrapper、薄包装或只读参考。
