# Phase10-03 Canonical Read Path 与 Compat 查询收口 Spec

## Why
`phase10-01` 已完成数据访问入口盘点，`phase10-02` 已冻结正式主链四领域模块的事务来源，但核心读取场景仍分散在 `queries.ts`、`optimized-queries.ts`、`dashboard-queries.ts`、`global-settings.ts`、`health-checker.ts` 与部分直接 `prisma` 路径中。若不先冻结 canonical read path，后续正式宿主、compat 查询和治理查询的边界仍会继续漂移。

## What Changes
- 为合同、账单、房间、抄表与 dashboard 等高频读取场景冻结 canonical read path
- 明确 `src/lib/queries.ts` 中哪些能力继续保留为 compat 查询，哪些职责应退出写路径或降级为过渡债务
- 明确 `src/lib/optimized-queries.ts` 中哪些读取能力属于正式读取模型，哪些仍只是 legacy 宿主下的兼容优化实现
- 明确 `src/lib/dashboard-queries.ts`、`src/lib/search-queries.ts` 的治理/辅助身份
- 明确 `src/lib/global-settings.ts`、`src/lib/health-checker.ts` 是否属于治理/脚本查询承接位
- 把 `phase09-06` route inventory 的 `keep-compat` 与 `defer-unmigrated` 结果映射到查询层收口顺序

## Impact
- Affected specs:
  - `phase10-data-access-and-migration-closure`
  - `phase10-03-canonical-read-path-and-compat-query-closure`
- Affected code:
  - `src/lib/queries.ts`
  - `src/lib/optimized-queries.ts`
  - `src/lib/dashboard-queries.ts`
  - `src/lib/search-queries.ts`
  - `src/lib/global-settings.ts`
  - `src/lib/health-checker.ts`
  - `src/app/api/*` 中 `defer-unmigrated` 读接口
  - `src/lib/domain/contracts/index.ts`
  - `server/lib/legacy-route-inventory.ts`
  - `.trae/specs/phase10-01-data-access-inventory-and-query-roles/inventory.md`

## ADDED Requirements
### Requirement: 核心读取场景必须冻结 canonical read path
系统 SHALL 为合同、账单、房间、抄表与 dashboard 统计等核心读取场景提供明确的 canonical read path 结论，且该结论必须与现有查询文件职责和 route inventory 输入一致。

#### Scenario: 核心读取场景均有明确归属
- **WHEN** 审核 `phase10-03` 的收口结果
- **THEN** 能看到以下场景的 canonical read path：
  - 合同列表 / 详情
  - 账单列表 / 详情 / 明细
  - 房间列表 / 详情
  - 抄表列表 / 详情 / related bills
  - dashboard 统计
- **AND** 不再存在“同一读取场景在 `queries.ts` 与 `optimized-queries.ts` 之间摇摆不定”的状态

### Requirement: Compat 查询与治理查询边界必须冻结
系统 SHALL 为 legacy compat 查询与治理/脚本查询冻结清晰边界，避免治理 helper 反向成为正式主链的读取真相源。

#### Scenario: 非主链查询身份清晰
- **WHEN** 审核 `dashboard-queries.ts`、`search-queries.ts`、`global-settings.ts`、`health-checker.ts`
- **THEN** 能判断它们是否属于 compat 查询、治理/脚本查询或未接入的辅助查询
- **AND** 能说明它们为何不应反向定义正式主链 canonical read path

### Requirement: `queries.ts` 的过渡职责必须被显式标注
系统 SHALL 明确 `src/lib/queries.ts` 当前哪些能力仍可保留为 compat 查询承接位，哪些属于应继续退出写职责的过渡债务。

#### Scenario: 混合职责文件不再被笼统描述
- **WHEN** 审核 `queries.ts`
- **THEN** 能看到“可保留查询职责”与“应退出写职责”的明确分类
- **AND** 不再把 `queries.ts` 直接误读为长期正式读取主入口

### Requirement: `optimized-queries.ts` 必须区分正式读取模型与兼容优化实现
系统 SHALL 为 `src/lib/optimized-queries.ts` 中的分页、过滤、排序与聚合能力区分“正式读取模型候选位”与“当前仍挂在 legacy 宿主下的兼容优化实现”。

#### Scenario: 优化查询不再被整体打包判断
- **WHEN** 审核 `optimized-queries.ts`
- **THEN** 能区分哪些读取能力应升级为 canonical read path
- **AND** 能区分哪些能力当前只服务 legacy API 列表宿主

## MODIFIED Requirements
### Requirement: `phase10` 的查询分层结论
`phase10` 的查询分层从“仅完成入口盘点”升级为“核心读取场景、compat 查询和治理查询的长期定位均有明确结论，并能回溯到 `phase09-06` route inventory 输入”。

#### Scenario: 查询分层成为后续上游真相源
- **WHEN** 进入 `phase10-04` 或后续部署切线前的治理任务
- **THEN** 查询层收口顺序已经可解释
- **AND** 不再需要重新争论 `dashboard-queries.ts`、`global-settings.ts`、`health-checker.ts` 是否属于主链 canonical read path

## REMOVED Requirements
### Requirement: 默认把所有旧查询 helper 一并视为正式读取主入口
**Reason**: `queries.ts`、`optimized-queries.ts`、`dashboard-queries.ts`、`global-settings.ts` 等文件当前职责重叠，继续整体打包会让 canonical read path 无法冻结。
**Migration**: 改为在 `phase10-03` 中逐场景冻结 canonical read path，并为 compat 查询、治理查询与未接入辅助查询分别标注长期定位。
