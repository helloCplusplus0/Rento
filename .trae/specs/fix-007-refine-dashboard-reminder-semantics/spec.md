# 提醒模块语义与配置收口 Spec

## Why
当前 Dashboard 提醒模块把房态信号、合同生命周期窗口提醒和已逾期待处理事项并列展示，但命名、配置边界和实现路径没有完全收口，导致用户难以判断四个提醒的区别，也无法明确哪些提醒窗口应该进入设置页。需要基于 `fix_007` 分析文档，完成提醒模块的语义定性、设置项边界冻结和实现真相源收口。

## What Changes
- 收口 Dashboard 四个提醒的正式业务定义与页面命名
- 保留 `空房查询`、`离店提醒`、`30天搬入`、`合同到期` 四个入口，但按语义重新分层
- 将 `30天搬入` 收口为“即将生效合同/待入住合同”语义，并接入统一的窗口配置
- 保持 `contractExpiryAlertDays` 作为“离店提醒/合同即将到期窗口”的唯一真相源
- 新增 `upcomingMoveInAlertDays` 作为“即将生效合同”提醒的全局兜底配置
- 保持“已到期合同/逾期合同”是客观待处理事项，不引入可调窗口配置
- 收口提醒模块的装配路径，避免首页真实实现与旧版聚合实现长期并存
- **BREAKING** Dashboard 提醒文案会发生语义化调整，`30天搬入` 与 `合同到期` 的对外命名将更明确

## Impact
- Affected specs:
  - Dashboard 提醒语义
  - 全局提醒窗口配置
  - 设置页正式业务配置边界
  - Dashboard 提醒装配真相源
- Affected code:
  - `src/components/business/UnifiedAlertsPanel.tsx`
  - `src/app/api/dashboard/vacant-rooms/route.ts`
  - `src/app/api/dashboard/leaving-tenants/route.ts`
  - `src/app/api/dashboard/upcoming-contracts/route.ts`
  - `src/app/api/dashboard/contract-alerts/route.ts`
  - `src/lib/dashboard-queries.ts`
  - `src/lib/contract-alert-semantics.ts`
  - `src/lib/global-settings.ts`
  - `src/hooks/useSettings.ts`
  - `src/app/settings/page.tsx`

## ADDED Requirements
### Requirement: Dashboard 提醒必须具备稳定语义分层
The system SHALL present Dashboard reminders as stable, non-overlapping business signals instead of mixing different reminder semantics under ambiguous labels.

#### Scenario: 四个提醒语义可解释
- **WHEN** 用户查看 Dashboard 提醒区
- **THEN** 用户必须能够区分房态信号、窗口型合同提醒和已逾期待处理事项

#### Scenario: 合同结束链提醒不再混淆
- **WHEN** 用户同时看到“离店提醒”和“已到期合同/逾期合同”
- **THEN** 系统必须明确表达前者是窗口内即将到期，后者是已到期未处理

### Requirement: 即将生效合同提醒使用统一窗口配置
The system SHALL provide a single global fallback setting for the upcoming-contract reminder window instead of keeping the Dashboard on a hardcoded 30-day range.

#### Scenario: 即将生效合同提醒读取统一设置
- **WHEN** 系统生成 Dashboard 中“即将生效合同/待入住合同”提醒数量和标题
- **THEN** 系统必须读取统一的 `upcomingMoveInAlertDays`

#### Scenario: 设置页维护即将生效合同窗口
- **WHEN** 用户进入设置页查看提醒配置
- **THEN** 用户必须能够查看并维护 `upcomingMoveInAlertDays`

### Requirement: 合同到期窗口仍以 contractExpiryAlertDays 为唯一真相源
The system SHALL keep `contractExpiryAlertDays` as the single global fallback for contract-expiry-window reminders that already exist in the product.

#### Scenario: 离店提醒使用统一窗口
- **WHEN** 系统生成 Dashboard 的离店提醒
- **THEN** 查询窗口、返回标题和前端展示必须全部基于 `contractExpiryAlertDays`

### Requirement: 已到期合同属于客观待处理事项
The system SHALL keep expired active contracts as a distinct operational signal and SHALL NOT model them as a configurable reminder window.

#### Scenario: 已到期合同独立展示
- **WHEN** 合同已经超过结束日期且仍处于 `ACTIVE`
- **THEN** 系统必须将其归类为“已到期合同/逾期合同”而不是继续并入窗口型提醒

### Requirement: Settings 只暴露真实进入提醒主链的配置
The system SHALL expose only reminder-related settings that have a real consumption path in the Dashboard or related core flows.

#### Scenario: 未接线提醒配置不被误开放
- **WHEN** `billReminderDays`、`readingReminderDays`、`enableNotifications` 没有真实提醒主链消费
- **THEN** 设置页不得把这些字段展示为正式已生效的业务配置

### Requirement: Dashboard 提醒装配路径应收口为单一真相源
The system SHALL avoid long-term parallel reminder assembly paths for the same Dashboard capability.

#### Scenario: 首页提醒来源一致
- **WHEN** 首页需要展示提醒概览与详情
- **THEN** 提醒标题、窗口定义和数量口径必须来自统一语义实现，而不是散落在多套并行逻辑中

## MODIFIED Requirements
### Requirement: Dashboard 提醒默认承诺
Dashboard 提醒区不再默认承诺“四个按钮只是同一层级的普通提醒统计”，而是明确区分房态信号、合同窗口提醒与已逾期待处理事项，并保证命名与查询条件一致。

### Requirement: 设置页提醒配置承诺
设置页只承诺那些已经真实进入提醒主链的全局兜底配置；提醒相关字段若无真实消费链，不得继续以正式业务配置身份展示。

## REMOVED Requirements
### Requirement: 30天搬入固定为硬编码窗口
**Reason**: 固定 30 天会使窗口型提醒只完成半套配置化，和已收口的 `contractExpiryAlertDays` 形成不一致。
**Migration**: 使用统一的 `upcomingMoveInAlertDays` 替代硬编码 30 天，并同步更新 API 查询范围、返回标题和前端文案。

### Requirement: 合同到期沿用模糊命名
**Reason**: “合同到期”容易与“即将到期/离店提醒”混淆，不利于运营判断。
**Migration**: 将其收口为“已到期合同”或“逾期合同”的明确客观状态表达，并保持查询条件不变。
