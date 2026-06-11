# 合同状态跟踪提示对齐 Spec

## Why
当前合同状态跟踪提示不仅位置不合适，更存在服务端事实状态与前端展示语义不一致的问题。需要同时修正续租后旧合同状态、状态跟踪提示的展示位置，以及列表/详情/提醒组件的统一语义。

## What Changes
- 修正续租完成后旧合同的状态收口规则
- 统一“状态指示”与“状态跟踪提示”的语义边界
- 调整合同卡片与详情页中状态跟踪提示的位置和文案
- 收口列表页、详情页和到期提醒组件的到期提示算法与阈值口径
- 补充对历史“已续租承接但仍为 EXPIRED”合同的最小盘点与修复边界
- **BREAKING** 已完成续租承接的旧合同不再保留为 `EXPIRED`，而是收口为 `TERMINATED`

## Impact
- Affected specs: `fix_017`, `fix_016`, `phase09-05-checkout-renewal-and-main-flow-consistency`, `phase13-03-contracts-bills-p0-pages`
- Affected code: `src/lib/domain/contracts/index.ts`, `server/routes/contracts.ts`, `src/components/business/contract-card.tsx`, `src/components/business/EnhancedContractDetail.tsx`, `src/components/ui/status-badge.tsx`, `src/lib/contract-alert-semantics.ts`, `src/lib/queries.ts`

## ADDED Requirements
### Requirement: 合同状态跟踪提示必须只服务于待管理员跟进的临界态
系统 SHALL 将“状态指示”和“状态跟踪提示”视为两层不同语义：状态指示表达合同事实状态，状态跟踪提示只在合同仍处于待跟进临界态时显示。

#### Scenario: 合同接近到期但尚未处理
- **WHEN** 合同仍为有效中的待跟进合同且已进入提醒窗口
- **THEN** 系统显示状态指示为当前合同事实状态
- **AND** 系统在状态指示左侧显示状态跟踪提示，例如“X 天后到期”

#### Scenario: 合同已经到期但尚未完成续租或退租
- **WHEN** 合同处于真实未处理的到期状态
- **THEN** 系统显示状态指示为 `EXPIRED`
- **AND** 系统在状态指示左侧显示“已过期 X 天”

#### Scenario: 合同已完成续租承接或退租收口
- **WHEN** 旧合同已经由新合同承接，或退租流程已经完成
- **THEN** 系统显示状态指示为 `TERMINATED`
- **AND** 系统不再显示状态跟踪提示

### Requirement: 续租旧合同必须以终止态收口
系统 SHALL 在续租完成后将旧合同视为已完成历史合同，而不是继续保留为待处理到期合同。

#### Scenario: 续租成功创建新合同
- **WHEN** 用户基于旧合同完成续租并成功创建新合同
- **THEN** 旧合同状态更新为 `TERMINATED`
- **AND** 系统保留 `isExtended=true` 与续租备注，作为被新合同承接的历史证据
- **AND** 旧合同不得继续保留为 `EXPIRED`

## MODIFIED Requirements
### Requirement: 合同列表和详情页必须使用统一的到期提示语义
当前合同列表页、详情页和到期提醒组件不得再分别使用硬编码窗口和分散算法；它们必须共享同一套到期提示阈值、文案与颜色语义，并以系统设置 `contractExpiryAlertDays` 为准。

### Requirement: 合同统计与筛选必须尊重修正后的状态事实
当前合同统计、到期提醒和 `expiring_soon` 筛选不得再把“已续租承接的旧合同”计入待处理到期合同；续租完成后的旧合同应按 `TERMINATED` 处理。

## REMOVED Requirements
### Requirement: 已续租承接的旧合同继续作为 EXPIRED 合同展示与统计
**Reason**: 该规则把已收口历史合同误当成待处理到期合同，导致合同卡片、到期提醒和统计结果持续失真。
**Migration**: 新续租规则改为将旧合同收口为 `TERMINATED`；历史上 `isExtended=true && status='EXPIRED'` 的样本需专项盘点并按修复边界处理。
