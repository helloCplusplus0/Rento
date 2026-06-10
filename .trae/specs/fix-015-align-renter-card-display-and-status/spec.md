# 租客卡片与当前状态表达对齐 Spec

## Why
当前租客列表卡片会把活跃合同的月租金展示为 `0`，同时租客详情页“当前状态”区块表达过薄，无法准确传达当前租住事实。需要在不破坏旧 `Rento` 原型和既有交互节奏的前提下，冻结租客卡片与详情状态区块的正确信息边界和修复范围。

## What Changes
- 明确租客列表卡片承载“租客身份摘要 + 当前生效合同快照”，而不是只展示纯租客实体字段
- 补齐租客列表查询与序列化链路所需的活跃合同字段，避免月租金因字段缺失被静默回退为 `0`
- 调整租客详情页“当前状态”区块的信息结构，使其与同类状态卡的表达层级对齐
- 收紧租客列表/详情相关组件的类型约束，降低缺字段静默渲染的风险
- **BREAKING** 租客卡片中的“当前房间”“月租金”将被明确解释为当前生效合同快照，不再允许把这些字段当作租客固定属性理解

## Impact
- Affected specs: `fix_015`, `phase13-04-renters-and-meter-reading-routes-parity`
- Affected code: `src/components/business/RenterCard.tsx`, `src/components/business/RenterBasicInfo.tsx`, `src/components/business/RenterGrid.tsx`, `src/components/business/RenterContractHistory.tsx`, `src/minix/lib/primary-route-data.ts`, `src/lib/optimized-queries.ts`, `server/lib/renters-route-service.ts`, `src/types/database.ts`

## ADDED Requirements
### Requirement: 租客卡片必须展示可解释的当前合同快照
系统 SHALL 允许租客列表卡片展示与当前 `ACTIVE` 合同直接关联的快照信息，但必须把这些信息视为“当前生效合同快照”，而不是租客固定属性。

#### Scenario: 租客存在生效中合同
- **WHEN** 租客拥有状态为 `ACTIVE` 的合同
- **THEN** 租客卡片展示真实的当前房间和真实的当前月租金
- **AND** 这些字段来源于当前生效合同，而不是租客实体本身

#### Scenario: 租客不存在生效中合同
- **WHEN** 租客没有状态为 `ACTIVE` 的合同
- **THEN** 租客卡片不得展示误导性的房间或月租快照
- **AND** 卡片继续展示租客基础资料与空闲状态

### Requirement: 租客详情页必须提供清晰的当前状态摘要
系统 SHALL 在租客详情页中用清晰、分层的状态区块表达当前租住事实，至少包含状态标签、关联对象摘要与解释文本。

#### Scenario: 详情页查看有生效合同的租客
- **WHEN** 用户打开存在 `ACTIVE` 合同的租客详情页
- **THEN** “当前状态”区块展示状态 badge、当前房间、合同摘要信息和状态说明
- **AND** 视觉层级与同类状态卡保持一致

#### Scenario: 详情页查看无生效合同的租客
- **WHEN** 用户打开没有 `ACTIVE` 合同的租客详情页
- **THEN** “当前状态”区块明确表达该租客当前无生效合同且处于空闲状态

## MODIFIED Requirements
### Requirement: 租客列表查询必须满足当前卡片展示所需字段
当前租客列表查询与序列化链路必须返回租客卡片实际展示所需的活跃合同字段，至少包括 `monthlyRent` 以及支持当前房间展示的房间/楼栋信息；不得再因字段缺失把真实值静默回退为 `0` 后直接渲染到界面。

### Requirement: 租客列表与详情相关组件必须使用明确的客户端 DTO 或 view-model
当前租客列表和详情相关组件不得继续依赖宽泛的 `any` 作为主要数据输入类型；至少需要对卡片、状态区块、合同历史和列表网格使用明确的客户端 DTO 或裁剪后的 view-model，以便在字段缺失时尽早暴露问题。

## REMOVED Requirements
### Requirement: 列表卡片可在缺字段时直接回退显示默认数值
**Reason**: 对金额字段直接回退为 `0` 会把“未返回数据”误渲染成“真实月租金为 0”，造成业务误判。
**Migration**: 缺失字段时应通过查询补齐或在界面上避免展示该快照字段，不再把缺失值直接当成有效业务值。
