# Fix 011 其他账单条目名收口 Spec

## Why
当前 `OTHER` 账单缺少结构化条目名承载位，导致钥匙押金、卫生费等真实收费项在多个页面被统一展示成“其他/其他费用”，用户难以理解账单用途。  
仅靠前端从 `remarks` 猜测条目名会继续制造前后端双重真相，因此需要在不改变正式账单类型体系的前提下，为 `OTHER` 建立单一展示真相源。

## What Changes
- 为 `Bill` 增加一个仅用于 `OTHER` 展示语义的可选结构化条目名字段
- 合同自动生成链路为钥匙押金、卫生费写入默认条目名
- 手动新增账单、编辑账单仅在 `type='OTHER'` 时提供条目名输入入口
- 账单列表、账单详情、合同账单预览、`fix_010` 本次应催缴汇总统一复用 `OTHER` 条目名与图标映射
- 为历史自动生成且可安全识别的 `OTHER` 账单提供条目名回填策略

## Impact
- Affected specs:
  - 账单展示语义
  - 合同自动生成账单
  - 手动新增/编辑账单
  - `fix_010` 应催缴汇总展示一致性
- Affected code:
  - `prisma/schema.prisma`
  - `src/lib/auto-bill-generator.ts`
  - `src/components/business/ContractForm.tsx`
  - `src/components/business/ContractBillPreview.tsx`
  - `src/components/business/BillInfoForm.tsx`
  - `src/components/pages/CreateBillPage.tsx`
  - `src/components/pages/EditBillPage.tsx`
  - `src/components/business/BillBasicInfo.tsx`
  - `src/components/business/bill-card.tsx`
  - `src/components/business/BillCardCompact.tsx`
  - `src/components/business/BillDueSummaryCard.tsx`

## ADDED Requirements
### Requirement: OTHER 账单结构化条目名
系统 SHALL 为 `Bill.type='OTHER'` 提供一个可选的结构化条目名字段，作为前后端共享的展示真相源。

#### Scenario: 合同自动生成 OTHER 账单
- **WHEN** 合同创建或续租时自动生成钥匙押金、卫生费账单
- **THEN** 新生成账单保持 `type='OTHER'`
- **AND** 账单同时写入结构化条目名，例如“钥匙押金”“卫生费”
- **AND** `remarks` 仅保留备注说明，不再作为条目名真相源

#### Scenario: 手动新增 OTHER 账单
- **WHEN** 管理者在新增账单页选择 `OTHER`
- **THEN** 页面显示“条目名”输入入口
- **AND** 创建请求将该条目名作为结构化字段提交
- **AND** 非 `OTHER` 类型不出现该入口

#### Scenario: 编辑 OTHER 账单
- **WHEN** 管理者编辑一张 `OTHER` 账单
- **THEN** 页面允许修改其结构化条目名
- **AND** 不得改变底层正式账单类型

### Requirement: OTHER 账单统一展示与图标
系统 SHALL 在所有账单展示入口统一复用 `OTHER` 条目名与图标映射。

#### Scenario: 列表与详情展示
- **WHEN** 用户查看账单列表页、账单详情页或合同账单预览
- **THEN** `OTHER` 账单展示为“其他-条目名”或等价的主次结构表达
- **AND** 图标映射基于结构化条目名，而不是依赖 `remarks` 模糊猜测
- **AND** 不再统一退化成 `￥` 占位图标

#### Scenario: fix_010 汇总页展示
- **WHEN** `fix_010` 的本次应催缴汇总纳入 `OTHER` 账单
- **THEN** 汇总页使用与列表、详情一致的条目名与图标口径
- **AND** 不再退化成单纯“其他”

### Requirement: 历史 OTHER 账单兼容回填
系统 SHALL 为历史 `OTHER` 账单提供安全回填与降级兼容策略。

#### Scenario: 可安全回填的历史账单
- **WHEN** 历史 `OTHER` 账单属于自动生成路径且 `remarks` 可稳定识别
- **THEN** 系统可将其回填为结构化条目名
- **AND** 清洁费类历史账单统一回填为“卫生费”

#### Scenario: 无法可靠识别的历史账单
- **WHEN** 历史手工 `OTHER` 账单无法从既有 `remarks` 可靠恢复条目名
- **THEN** 不强行批量改写历史数据
- **AND** 展示层允许降级为“其他”或“其他-备注摘要”

## MODIFIED Requirements
### Requirement: OTHER 账单展示语义
系统 SHALL 保持 `Bill.type` 作为正式账单类型主口径；`OTHER` 账单的具体收费项改由结构化条目名字段承担，`remarks` 仅承担备注职责。

#### Scenario: 展示与统计职责分离
- **WHEN** 系统进行账单展示、筛选、统计或结算
- **THEN** 正式分类仍以 `Bill.type` 为准
- **AND** 条目名只影响展示与图标，不参与支付周期、状态机、统计主口径和结算计算

### Requirement: 合同一次性费用默认命名
系统 SHALL 将合同自动生成的 `cleaningFee` 展示名统一收口为“卫生费”，同时保持底层合同字段暂不改名。

#### Scenario: 合同表单与自动生成一致
- **WHEN** 用户在合同创建相关页面查看或生成清洁费对应的一次性费用账单
- **THEN** 展示语义统一为“卫生费”
- **AND** 不要求当前 fix 内重命名底层 `cleaningFee` 字段

## REMOVED Requirements
### Requirement: 通过 remarks 猜测 OTHER 条目名
**Reason**: 继续依赖 `remarks` 会制造前后端双重真相，并导致新增、编辑、列表、详情、汇总之间口径继续分裂。  
**Migration**: 新数据改为写入结构化条目名字段；历史数据按“安全回填 + 降级兼容”策略过渡。
