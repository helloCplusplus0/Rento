# phase13-05 页面 Parity 验收基线收口 Spec

## Why
`phase13` 是 `Rento -> Rento-miniX` 正式业务页面迁移的唯一实施阶段，后续 `phase14 ~ phase16` 不再继续承接“把旧页面迁到新宿主”这类职责。因此，`phase13-05` 必须先把页面迁移完成度、未迁移页面清单、页面 parity 验收矩阵与对 `phase14` 的页面-API 交接关系收口成单一真相源。

## What Changes
- 为 `phase13` 增加“正式业务页面 100% 迁移完成度审计”要求，必须基于旧 `src/app/**/page.tsx` 正式页面清单与当前 `src/minix/router` 实际承接结果逐页核对。
- 为 `phase13` 增加“未迁移/部分迁移页面清单”输出，明确哪些页面已迁移、哪些仍未迁移、哪些仅保留 legacy document fallback。
- 为 `phase13` 增加页面 parity 验收矩阵，覆盖首页、列表页、详情页、编辑/新建页与流程动作页。
- 为 `phase13` 增加人工浏览器操作基线，要求能被后续 `/spec`、实现与最终验收直接复用。
- 为 `phase13` 增加页面与 retained-legacy API/query 的交接关系表，供 `phase14` 直接引用。
- 为 `phase13` 增加仅文档轮次的最小验证要求与一致性复核要求。

## Impact
- Affected specs:
  - `phase13-frontend-page-parity-implementation`
  - `phase14-api-query-parity-and-legacy-route-drain`
- Affected code:
  - `docs/phase13_frontend_page_parity_implementation_dev_plan.md`
  - `docs/phase13_frontend_page_parity_implementation_architecture_plan.md`
  - `docs/phase13_frontend_page_parity_implementation_shared_baseline.md`
  - `plan.md`
  - `server/lib/legacy-route-inventory.ts`
  - `src/minix/router/index.tsx`
  - `src/minix/lib/route-navigation.ts`
  - `src/components/pages/*`
  - 旧 `src/app/**/page.tsx`

## ADDED Requirements
### Requirement: 完整页面迁移完成度审计
系统 SHALL 基于旧 `src/app` 正式业务页面清单与当前 `src/minix` 路由承接结果，形成一份完整页面迁移完成度审计，而不是只描述已迁移页面。

#### Scenario: 统计正式业务页面总量
- **WHEN** 编写 `phase13-05` 页面 parity 验收基线
- **THEN** 必须先给出旧 `src/app` 正式业务页面总量、页面路径清单与页面类别分组
- **AND** 必须排除 dev-only、治理页、支持页与状态页，避免把非正式业务页误记为迁移范围

#### Scenario: 输出迁移状态分类
- **WHEN** 对照旧 `src/app` 页面与 `src/minix/router` / route module 承接结果
- **THEN** 必须对每个正式业务页面标注为“已迁移 / 部分迁移 / 未迁移”
- **AND** 必须明确是否仍依赖 legacy document fallback 或旧宿主协议

#### Scenario: 列出未迁移页面清单
- **WHEN** 发现仍有正式业务页面未被 `src/minix` 真实承接
- **THEN** 文档必须单独列出未迁移页面路径、页面类型、当前承接状态与未迁移原因
- **AND** 不得在未列出清单的情况下笼统宣称 `phase13` 已完成全部页面迁移

### Requirement: 页面 parity 验收矩阵
系统 SHALL 为 `phase13` 形成单一可引用的页面 parity 验收矩阵，用于证明页面迁移与旧 `Rento` 原型保持接近 `100%` 保真。

#### Scenario: 覆盖全部页面类别
- **WHEN** 产出页面 parity 验收矩阵
- **THEN** 验收矩阵必须覆盖首页、列表页、详情页、编辑/新建页与流程动作页
- **AND** 每类页面都必须包含参考来源、核心验收点、最小浏览器路径与页面级风险说明

#### Scenario: 引用旧页面原型
- **WHEN** 为任一已迁正式业务页面定义验收项
- **THEN** 验收矩阵必须能追溯到对应旧 `src/app/**/page.tsx` 原型
- **AND** 必须明确页面信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义的比对口径

### Requirement: 人工浏览器验收基线
系统 SHALL 为 `phase13` 形成最小但可执行的人工浏览器验收基线，使后续 `/spec` 与实施可以直接复用。

#### Scenario: 输出可执行操作链
- **WHEN** 编写人工浏览器验收基线
- **THEN** 每条基线必须包含入口路径、关键操作、预期结果、失败回退方式与是否依赖登录态/测试数据
- **AND** 不得只写抽象说明而缺少可实际执行的操作步骤

#### Scenario: 保持阶段边界
- **WHEN** 定义浏览器验收基线
- **THEN** 基线只覆盖 `phase13` 页面 parity 本身
- **AND** 不得提前混写 `phase14` API 清退、`phase15` PWA parity 或 `phase16` cutover 验收

### Requirement: 页面到 retained-legacy API 的交接说明
系统 SHALL 输出页面与 retained-legacy API/query 的交接关系，作为 `phase14` 的直接输入。

#### Scenario: 页面依赖交接
- **WHEN** 为 `phase13-05` 产出交接说明
- **THEN** 必须至少说明每类正式页面当前依赖的 API/query 承接状态、compat 保留原因与后续 `phase14` 关注点
- **AND** 交接关系必须可被 `server/lib/legacy-route-inventory.ts` 与后续 `phase14` 文档直接引用

### Requirement: 文档轮次最小验证要求
系统 SHALL 为 `phase13-05` 明确仅文档轮次的最小验证要求，确保该子任务不会误触实现阶段职责。

#### Scenario: 仅文档轮次验证
- **WHEN** 本轮仅新增或更新 `phase13-05` 文档与 spec 资产
- **THEN** 最小验证必须至少包括 `docs/phase13_*` 互链复核、被引用路径存在性复核，以及与 `plan.md`、`phase12` 上游输入的一致性复核
- **AND** 不得把实现阶段的 retained-legacy API 清退、PWA parity 或 cutover 验收提前作为本子任务完成条件

## MODIFIED Requirements
### Requirement: phase13 页面迁移完成判定
`phase13` 的完成判定不再只基于“已迁移页面示例”或“已落地 route module 数量”，而必须同时满足以下条件：
- 已形成完整正式业务页面清单与迁移状态审计
- 已明确列出全部未迁移/部分迁移页面
- 已形成页面 parity 验收矩阵与人工浏览器验收基线
- 已形成对 `phase14` 的页面-API 交接说明

## REMOVED Requirements
### Requirement: 以局部页面迁移结果替代全量页面迁移判断
**Reason**: `phase13` 是正式业务页面迁移的唯一实施阶段，若不系统审计全部正式页面，将无法证明 `Rento -> Rento-miniX` 页面迁移是否真正完成。
**Migration**: 后续所有 `phase13-05` 文档与验收说明，必须先给出完整页面迁移审计，再讨论哪些未迁移页面需要继续实施或允许延期处理。
