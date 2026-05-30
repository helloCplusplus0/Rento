# Fix 012 批次 1 账单链路移动端视觉收口 Spec

## Why
`fix_012` 已明确当前移动端 UI 优化不适合一次性全站落地，而应按小批次逐轮收口。  
账单链路同时覆盖列表、详情、卡片与弹窗，是最适合作为移动端字体层级与间距节奏首轮收口的试验田。

## What Changes
- 仅针对账单链路的移动端视觉进行首轮收口
- 优先优化账单列表、账单详情、账单相关弹窗中的字体大小、字重层级、行高与区块间距
- 保持 PC 与移动端共用同一套页面和组件主线，不创建第二套移动端模板
- 尽量把移动端视觉优化沉淀到共享组件或同类结构，而不是只修孤立页面
- **BREAKING** 无

## Impact
- Affected specs:
  - 账单列表页移动端可读性
  - 账单详情页移动端信息层级
  - 账单相关弹窗的移动端宽高与滚动体验
  - 账单卡片与金额区的移动端视觉节奏
- Affected code:
  - `src/components/pages/BillListPage.tsx`
  - `src/components/business/BillCardCompact.tsx`
  - `src/components/business/bill-card.tsx`
  - `src/components/pages/BillDetailPage.tsx`
  - `src/components/business/BillBasicInfo.tsx`
  - `src/components/business/ContractBillDueSummaryDialog.tsx`
  - `src/components/business/BillDueSummaryCard.tsx`
  - `src/components/business/AggregatedBillTemplateCard.tsx`
  - 如有必要，涉及 `src/components/layout/PageContainer.tsx`、`src/components/ui/dialog.tsx` 等共享层的最小样式收口

## ADDED Requirements
### Requirement: 账单列表页移动端字体与间距收口
系统 SHALL 提升账单列表页在移动端的可读性，使卡片主次关系、金额信息和辅助文案更易扫读。

#### Scenario: 移动端查看账单列表
- **WHEN** 管理者在手机尺寸下进入账单列表页
- **THEN** 卡片标题、金额、辅助信息之间具备清晰的字体层级
- **AND** 卡片内外间距与点击区域不显拥挤
- **AND** 不出现新的横向溢出或信息挤压

### Requirement: 账单详情页移动端信息层级收口
系统 SHALL 优化账单详情页在移动端的标题、金额区、状态信息和说明区块节奏，使页面更适合单手扫读。

#### Scenario: 移动端查看账单详情
- **WHEN** 管理者在手机尺寸下打开账单详情页
- **THEN** 标题、金额、状态、辅助说明之间的主次关系更清晰
- **AND** 区块间距与文本行高适合移动端阅读
- **AND** 不要求改变原有业务结构或信息顺序

### Requirement: 账单相关弹窗移动端宽高与滚动体验收口
系统 SHALL 优化账单相关弹窗在移动端的宽度、高度、内容滚动区与操作区布局，避免内容挤压或双重滚动混乱。

#### Scenario: 移动端打开账单相关弹窗
- **WHEN** 管理者在手机尺寸下打开账单相关弹窗
- **THEN** 弹窗内容区和操作区边界清晰
- **AND** 不出现内容被裁切、横向滑动或底部操作难以触达的情况
- **AND** 弹窗关闭、确认和滚动行为保持可解释

### Requirement: 账单链路首轮优化优先沉淀到共享模式
系统 SHALL 在本批次优先复用或收口共享模式，而不是为单个页面临时制造只服务当前页面的移动端特例。

#### Scenario: 同类账单卡片或弹窗复用优化结果
- **WHEN** 首轮优化涉及账单卡片、金额块、弹窗容器等高复用结构
- **THEN** 应优先抽象为同类组件共享的移动端视觉规则
- **AND** 不得为了图省事复制一套移动端专用页面

## MODIFIED Requirements
### Requirement: fix_012 的推进边界
`fix_012` 的首轮 `/spec` 改为只覆盖账单链路移动端视觉收口，而不是一次性覆盖合同、房间、仪表盘等全站页面。

#### Scenario: 首轮范围控制
- **WHEN** 本批次进入实现
- **THEN** 只处理账单列表、账单详情、账单相关弹窗与共享展示模板
- **AND** 合同链路、房间链路、仪表盘链路留待后续独立批次处理

## REMOVED Requirements
### Requirement: 首轮同时处理全站移动端页面
**Reason**: 当前缺少精确视觉原型，若首轮直接覆盖全站，会导致范围失控且难以验收。  
**Migration**: 改为“按账单链路 -> 合同链路 -> 其他高频页面”的小批次方式逐轮推进。
