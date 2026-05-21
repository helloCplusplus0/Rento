# Phase03 账务查询与仪表盘语义收口 Spec

## Why
当前账务查询与仪表盘统计仍存在字段漂移和状态口径分叉，导致待收金额、已收金额、状态分布与趋势解释不稳定。需要在不扩展功能面的前提下，先收口为统一、可追溯的服务端语义。

## What Changes
- 修复 `optimized-queries.ts` 中与 `schema.prisma` 不一致的字段引用
- 收口 `dashboard-queries.ts` 对 `pendingAmount`、`receivedAmount`、趋势和状态分布的统计口径
- 必要时补强账单详情与账单状态 API 的服务端语义对齐
- 明确 `PENDING / PAID / OVERDUE / COMPLETED` 在统计、金额聚合与状态流转中的一致解释
- **BREAKING**：移除或替换历史漂移字段（如 `monthlyRent` / `idNumber`）在账务查询路径中的使用

## Impact
- Affected specs: 账务金额语义一致性、账单状态统计一致性、仪表盘统计可解释性
- Affected code: `src/lib/optimized-queries.ts`、`src/lib/dashboard-queries.ts`、`src/lib/queries.ts`、必要时 `src/app/api/bills/[id]/status/route.ts`、必要时 `src/app/api/dashboard/stats/route.ts`

## ADDED Requirements
### Requirement: 统一账务金额聚合语义
系统 SHALL 以统一语义计算账单相关金额，确保待收与已收统计可映射回账单状态事实。

#### Scenario: 待收与已收金额统计
- **WHEN** 系统按账单集合聚合 `pendingAmount` 与 `receivedAmount`
- **THEN** 待收金额仅包含仍需支付的部分，不与已收金额重复或混算
- **THEN** 已收金额仅包含已确认入账部分，不隐式包含待收或未确认金额

### Requirement: 统一账单状态统计口径
系统 SHALL 在查询层与统计层使用一致的 `BillStatus` 解释规则，避免同一状态在不同接口中被不同含义复用。

#### Scenario: 仪表盘状态分布与列表状态一致
- **WHEN** 仪表盘统计 `PENDING / PAID / OVERDUE / COMPLETED` 分布
- **THEN** 状态口径与账单列表、账单详情、状态变更接口保持一致
- **THEN** 不出现同一账单在不同接口被归入不同状态类别

### Requirement: 字段引用与 Schema 一致
系统 SHALL 仅引用当前 schema 中存在且语义一致的字段，不再依赖历史遗留或不存在字段。

#### Scenario: 查询构建字段校验
- **WHEN** 执行账务查询与仪表盘统计查询
- **THEN** 不再引用 `monthlyRent`、`idNumber` 等与当前实体不一致的字段
- **THEN** 查询结果能被下游 API 与 UI 稳定消费

## MODIFIED Requirements
### Requirement: 仪表盘账务趋势语义
仪表盘趋势统计必须以统一账单事实为输入，明确趋势维度和时间窗口，不混入与账单状态无关或重复口径的金额计算。

## REMOVED Requirements
### Requirement: 历史漂移字段兼容查询
**Reason**: 历史漂移字段导致统计语义分叉，无法满足“业务真实、状态可解释、历史可追溯”的阶段要求。  
**Migration**: 将历史字段引用替换为当前 schema 中对应语义字段，并在查询层集中收口状态与金额映射规则。
