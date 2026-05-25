# 统一账单展示排序语义 Spec

## Why
当前合同详情页账单历史 Tab 与账单列表页使用了不同的排序真相源，导致同一批账单在不同入口展示顺序不一致。需要冻结一套统一的账单展示排序语义，让用户能优先看到待处理账单，并保证不同入口顺序一致。

## What Changes
- 新增统一的账单展示排序能力，收口“未完结优先 + 业务时间由近及远 + 创建时间兜底”的规则
- 合同详情页账单历史 Tab 改为复用统一排序能力，不再单独手写本地排序
- 账单列表页改为复用统一排序能力，确保与合同详情页保持一致
- 收口查询层与 `/api/bills` 的默认排序口径，避免 SSR 与 API 结果不一致
- 明确“业务时间”优先使用 `dueDate`，`createdAt` 仅作为同日稳定兜底

## Impact
- Affected specs:
  - 账单展示排序
  - 合同详情账单历史展示
  - 账单列表默认展示
- Affected code:
  - `src/components/business/EnhancedContractDetail.tsx`
  - `src/components/pages/BillListPage.tsx`
  - `src/lib/queries.ts`
  - `src/lib/optimized-queries.ts`
  - `src/lib/bill-semantics.ts`
  - 可能新增共享排序工具文件，例如 `src/lib/bill-sort.ts`

## ADDED Requirements
### Requirement: 统一账单展示排序
The system SHALL provide a shared bill display sorting rule that is reused by the contract bill history tab and the bill list page.

#### Scenario: 未完结账单优先展示
- **WHEN** 同一页面同时存在未完结账单和已完结账单
- **THEN** 未完结账单必须稳定排在已完结账单之前

#### Scenario: 同组内按业务时间倒序
- **WHEN** 多条账单属于同一结算阶段分组
- **THEN** 账单必须按 `dueDate` 由近及远排序

#### Scenario: 同业务时间稳定兜底
- **WHEN** 两条账单的 `dueDate` 相同
- **THEN** 系统必须使用 `createdAt desc` 作为稳定兜底排序

### Requirement: 合同详情页复用统一排序
The system SHALL make the contract detail bill history tab reuse the shared bill display sorting rule instead of maintaining a page-local custom sort.

#### Scenario: 合同详情页账单历史展示
- **WHEN** 用户打开合同详情页的账单历史 Tab
- **THEN** 页面展示顺序必须与统一账单展示排序规则一致
- **AND** 页面不得继续单独按 `createdAt desc` 手写排序

### Requirement: 账单列表页复用统一排序
The system SHALL make the bill list page reuse the same shared bill display sorting rule after filtering and searching.

#### Scenario: 账单列表默认展示
- **WHEN** 用户打开账单列表页
- **THEN** 初始账单顺序必须与合同详情页账单历史的排序语义一致

#### Scenario: 搜索与筛选后的展示
- **WHEN** 用户执行状态筛选或搜索
- **THEN** 过滤后的账单集合仍必须遵守统一账单展示排序规则

### Requirement: 查询层默认排序口径一致
The system SHALL align SSR query sorting and `/api/bills` default sorting so that different data-loading paths return the same display order semantics.

#### Scenario: SSR 与 API 一致
- **WHEN** 账单列表数据分别通过 SSR 查询层和 `/api/bills` 获取
- **THEN** 两条链路必须遵守一致的默认展示排序语义

## MODIFIED Requirements
### Requirement: 账单列表默认顺序
账单相关页面的默认顺序不再分别依赖“合同详情页本地排序”或“查询层各自的 `orderBy` 实现”，而必须统一遵守“未完结优先、组内按 `dueDate desc`、同日按 `createdAt desc` 兜底”的共享排序规则。

## REMOVED Requirements
### Requirement: 合同详情页本地创建时间倒序
**Reason**: 该规则只在单页面成立，无法与账单列表页形成一致的展示语义。
**Migration**: 改为复用共享账单展示排序工具，不再在页面组件中直接按 `createdAt` 手写排序。
