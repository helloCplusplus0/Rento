# 账单状态跟踪提示对齐 Spec

## Why
当前账单列表卡片只有状态徽标，没有像合同卡片那样独立建模的状态跟踪提示层，导致逾期提示位置分散、阈值口径未冻结、排序语义也没有和提示设计一起收口。需要把账单卡片体验与 `fix_017` 已完成的合同卡片机制对齐，同时保持账单状态事实语义稳定。

## What Changes
- 为账单列表卡片新增与合同卡片一致的“状态跟踪提示”语义层
- 统一账单状态事实、状态跟踪提示、窗口阈值与列表排序的边界
- 复用设置页 `contractExpiryAlertDays` 作为账单/合同统一窗口型提醒的全局兜底配置
- 收口账单列表前后端排序规则，明确“未结清优先、到期更近优先、已支付/已完成后置”
- 验证账单列表卡片、筛选、排序和设置口径在新旧宿主链路下保持一致

## Impact
- Affected specs: `fix_018`, `fix_017`, `phase13-03-contracts-bills-p0-pages`, `phase14-api-query-parity-and-legacy-route-drain`
- Affected code: `src/components/pages/BillListPage.tsx`, `src/components/business/BillCardCompact.tsx`, `src/lib/bill-semantics.shared.ts`, `src/lib/optimized-queries.ts`, `src/lib/queries.ts`, `src/minix/lib/primary-route-data.ts`, `src/components/pages/SettingsPage.tsx`, `src/lib/global-settings.ts`

## ADDED Requirements
### Requirement: 账单卡片必须提供独立的状态跟踪提示
系统 SHALL 将账单卡片中的“状态事实徽标”和“状态跟踪提示”视为两层不同语义：状态徽标表达账单事实状态，状态跟踪提示只表达当前是否仍处于待跟进窗口或逾期窗口。

#### Scenario: 开放账单进入提醒窗口
- **WHEN** 账单仍未结清，且到期日已进入系统提醒窗口
- **THEN** 系统在账单状态徽标左侧显示状态跟踪提示
- **AND** 状态跟踪提示文案为“X 天后到期”或“今日到期”
- **AND** 账单事实状态徽标继续显示原始账单状态

#### Scenario: 开放账单已逾期
- **WHEN** 账单仍未结清，且到期日早于今天
- **THEN** 系统在账单状态徽标左侧显示“已逾期 X 天”
- **AND** 账单事实状态徽标继续显示 `OVERDUE`

#### Scenario: 已结清账单
- **WHEN** 账单已支付或已完成
- **THEN** 系统不显示状态跟踪提示
- **AND** 卡片仅展示账单事实状态徽标

### Requirement: 账单状态跟踪提示必须统一复用全局窗口阈值
系统 SHALL 使用设置页 `contractExpiryAlertDays` 作为账单/合同统一窗口型提醒的全局兜底配置，并在设置缺失或非法时回退到默认值。

#### Scenario: 用户调整设置页合同到期提醒窗口
- **WHEN** 用户在设置页修改 `contractExpiryAlertDays`
- **THEN** 合同卡片与账单卡片的窗口型状态跟踪提示同时使用更新后的阈值

#### Scenario: 设置值缺失或非法
- **WHEN** 系统读取不到合法的 `contractExpiryAlertDays`
- **THEN** 账单卡片状态跟踪提示回退到默认 `30` 天窗口

## MODIFIED Requirements
### Requirement: 账单列表排序必须与状态跟踪提示设计保持一致
当前账单列表页与 `/bills` API 必须共享同一套排序语义：未结清账单优先，再按到期日距今更近优先，已支付/已完成账单整体后置；不得出现前端和后端各自定义排序逻辑的情况。

### Requirement: 账单列表卡片不得继续使用分散的逾期提示实现
当前账单卡片不得再把“已逾期 X 天”作为底部局部文案单独拼接；逾期提示、窗口提示和状态徽标布局必须复用统一的状态跟踪提示语义。

## REMOVED Requirements
### Requirement: 账单卡片底部单独拼接逾期文案即可满足状态提示需求
**Reason**: 该实现只能覆盖逾期场景，无法承接窗口内待跟进账单，也会造成提示位置、阈值算法和排序规则分裂。
**Migration**: 改为由共享账单状态跟踪提示 helper 统一生成提示文案、tone 与是否显示，再在卡片右上角与状态徽标成组展示。
