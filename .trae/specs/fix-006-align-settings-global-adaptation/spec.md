# 设置页全局配置适配 Spec

## Why
当前设置页看起来像全局配置真相源，但页面中大量配置项并没有真正进入业务主链，用户修改后不会对系统产生可验证影响。需要收口设置页，让它重新回归“真实全局兜底入口”，并消除配置项、服务端主链和设置模型之间的双重真相。

## What Changes
- 收口设置页语义，只保留或明确标识具有真实业务意义的配置项
- 补齐 `gasPrice` 在设置页与设置类型中的暴露，保持与全局设置真相源一致
- 让抄表服务端主链读取数据库全局设置，替换 `usageAnomalyThreshold`、`autoGenerateBills`、`requireReadingApproval` 的硬编码默认值
- 明确区分业务配置、治理入口、只读信息和暂未启用配置，避免同层级误导
- 对未接线且暂无真实适配场景的配置项进行隐藏、禁用或降级说明，而不是继续作为“已生效配置”展示
- 第二批仅开放 `contractExpiryAlertDays`，统一合同列表、详情、统计与离店提醒使用的合同到期窗口
- 明确 `billReminderDays` 当前尚未进入真实账单提醒主链，本轮不以正式生效配置项开放

## Impact
- Affected specs:
  - 全局配置兜底
  - 设置页展示语义
  - 抄表主链配置读取
- Affected code:
  - `src/app/settings/page.tsx`
  - `src/hooks/useSettings.ts`
  - `src/lib/global-settings.ts`
  - `src/app/api/settings/route.ts`
  - `src/app/api/meter-readings/route.ts`
  - 可能涉及 `src/lib/bill-calculations.ts`
  - 可能涉及抄表相关前端展示组件
  - `src/lib/queries.ts`
  - `src/app/api/contracts/route.ts`
  - `src/app/contracts/page.tsx`
  - `src/app/contracts/[id]/page.tsx`
  - `src/components/pages/ContractListPage.tsx`
  - `src/components/pages/ContractDetailPage.tsx`
  - `src/components/business/EnhancedContractDetail.tsx`
  - `src/app/api/dashboard/leaving-tenants/route.ts`
  - `src/lib/dashboard-queries.ts`
  - `src/components/business/UnifiedAlertsPanel.tsx`

## ADDED Requirements
### Requirement: 设置页只暴露真实全局兜底配置
The system SHALL make the settings page expose only configuration items that have a real business fallback effect or are explicitly marked as non-business entries.

#### Scenario: 业务配置项可验证生效
- **WHEN** 用户修改设置页中的业务配置项
- **THEN** 对应业务主链必须能够表现出可验证的变化

#### Scenario: 未接线配置项不再伪装成已生效
- **WHEN** 某个设置项尚未进入任何真实业务主链
- **THEN** 该设置项不得继续以“已生效全局配置”姿态展示给用户

### Requirement: 设置页暴露燃气单价
The system SHALL expose `gasPrice` in the settings page and settings typing when the business logic already uses it as a global billing fallback.

#### Scenario: 维护燃气单价
- **WHEN** 用户进入设置页查看计费相关全局配置
- **THEN** 用户必须能够查看并维护 `gasPrice`

### Requirement: 抄表服务端读取数据库全局设置
The system SHALL make the meter-reading server-side flow read global settings from the database instead of relying on hardcoded defaults for exposed reading-related settings.

#### Scenario: 自动生成账单设置生效
- **WHEN** 用户修改 `autoGenerateBills`
- **THEN** 抄表服务端主链必须根据数据库全局设置决定是否自动生成账单

#### Scenario: 异常阈值设置生效
- **WHEN** 用户修改 `usageAnomalyThreshold`
- **THEN** 抄表相关校验或提示逻辑必须读取统一设置值，而不是继续依赖硬编码默认值

#### Scenario: 抄表审批开关有唯一真相源
- **WHEN** 用户修改 `requireReadingApproval`
- **THEN** 服务端主链必须读取数据库全局设置，而不是继续使用代码内置默认值

### Requirement: 设置页分层展示
The system SHALL visually distinguish business settings, governance tools, read-only information, and not-yet-enabled settings so that users do not confuse them as the same level of global configuration.

#### Scenario: 页面分层清晰
- **WHEN** 用户浏览设置页
- **THEN** 用户必须能够区分哪些项是真实业务配置，哪些是治理入口，哪些是只读信息或暂未启用项

### Requirement: 合同到期窗口配置进入真实主链
The system SHALL make `contractExpiryAlertDays` the single global fallback for contract expiry alert windows wherever the current product already exposes "即将到期/离店提醒" semantics.

#### Scenario: 合同列表即将到期筛选读取统一设置
- **WHEN** 用户在合同列表使用“即将到期”筛选
- **THEN** 系统必须使用统一的 `contractExpiryAlertDays` 窗口，而不是继续硬编码 30 天

#### Scenario: 合同详情到期提醒读取统一设置
- **WHEN** 合同详情页判断是否展示到期提醒
- **THEN** 系统必须使用统一的 `contractExpiryAlertDays` 窗口

#### Scenario: Dashboard 离店提醒读取统一设置
- **WHEN** 系统生成 Dashboard 的离店提醒数量与标题
- **THEN** 系统必须使用统一的 `contractExpiryAlertDays` 窗口，并保持展示文案与查询口径一致

### Requirement: 未接线提醒配置不得伪装成已生效设置
The system SHALL keep `billReminderDays` out of the formal settings surface until a real bill reminder consumption path exists.

#### Scenario: 账单提醒配置暂不开放
- **WHEN** 系统尚未存在真实账单提醒主链消费 `billReminderDays`
- **THEN** 设置页不得把 `billReminderDays` 展示为正式已生效的业务配置

## MODIFIED Requirements
### Requirement: 设置页默认承诺
设置页不再默认承诺“页面中所有配置项都已接入系统主链”，而只对真实业务兜底配置做正式承诺；治理入口、只读信息和暂未启用项必须有清晰语义区分。

## REMOVED Requirements
### Requirement: 未接线配置按已生效配置展示
**Reason**: 这种展示方式会制造“配置存在但不生效”的双重真相，持续损害用户对全局配置入口的信任。
**Migration**: 将未接线配置项隐藏、禁用、移动到暂未启用区，或补齐主链适配后再恢复为正式业务配置。
