# Phase12-01 页面盘点与范围冻结 Spec

## Why
`phase12-frontend-parity-and-shell-cutover` 进入 `/spec` 前，必须先把旧 `src/app/**/page.tsx` 的真实页面范围、分类边界与后续 parity 路线图输入冻结为单一事实来源。若继续停留在“原则正确但盘点结果未落盘”的状态，后续 `/spec`、页面迁移与 retained-legacy 退出顺序都将重新承担高影响决策。

## What Changes
- 冻结旧 `src/app/**/page.tsx` 的页面盘点结果，并以 37 个真实页面入口作为当前基线。
- 定义页面分类规则，明确区分正式业务页面、状态/支持页面、运维治理页面、dev-only / 待归档候选。
- 冻结 `phase12 ~ phase15` 默认 parity 范围内必须覆盖的页面集合。
- 规定 `phase12-01` 的最小交付必须包含页面分类表、正式页面范围表、延后/不进入 parity 范围表。
- 规定验证规则，确保页面路径真实存在，且正式页面与 dev-only / 辅助页边界不混写。

## Impact
- Affected specs:
  - `phase12-frontend-parity-and-shell-cutover`
  - `phase12-01-page-inventory-and-formal-scope-freeze`
- Affected code:
  - `src/app/**/page.tsx`
  - `src/lib/page-governance.ts`
  - `src/lib/navigation-config.ts`
  - `src/lib/route-config.ts`
  - `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md`

## ADDED Requirements
### Requirement: 旧页面清单冻结
系统 SHALL 以旧 `src/app/**/page.tsx` 的真实文件清单作为 `phase12-01` 的页面盘点输入，并将当前页面入口总数冻结为 37 个。

#### Scenario: 盘点旧页面入口
- **WHEN** 执行 `phase12-01-page-inventory-and-formal-scope-freeze`
- **THEN** 必须以仓库中真实存在的 `src/app/**/page.tsx` 文件为唯一盘点输入
- **AND** 盘点结果必须明确当前页面入口总数为 37 个
- **AND** 不得以估算、口头描述或历史记忆替代文件级盘点结果

### Requirement: 页面分类边界冻结
系统 SHALL 把 37 个旧页面入口按单一规则划分为正式业务页面、状态/支持页面、运维治理页面、dev-only / 待归档候选四类。

#### Scenario: 分类正式业务页面
- **WHEN** 页面承载房源、租客、合同、账单、抄表、设置或工作台主链能力
- **THEN** 该页面必须被归类为正式业务页面
- **AND** 该归类必须能被后续页面映射、页面装配与 parity 验收直接复用

#### Scenario: 分类支持与治理页面
- **WHEN** 页面只承担登录、离线、通知、个人资料等支持功能
- **THEN** 该页面必须被归类为状态/支持页面
- **AND** 不得与正式业务主链页面混写
- **WHEN** 页面承担系统健康、数据一致性等治理职责
- **THEN** 该页面必须被归类为运维治理页面

#### Scenario: 分类 dev-only 页面
- **WHEN** 页面属于性能测试、布局演示、组件展示、业务流程验证等开发辅助入口
- **THEN** 该页面必须被归类为 dev-only / 待归档候选
- **AND** 不得被误记为正式 parity 范围页面

### Requirement: 正式页面范围冻结
系统 SHALL 产出正式页面范围表，明确哪些页面进入 `phase12 ~ phase15` 默认 parity 路线图。

#### Scenario: 冻结正式 parity 范围
- **WHEN** 完成 `phase12-01` 页面盘点
- **THEN** 必须生成正式页面范围表
- **AND** 该表至少覆盖 `/`、`/rooms`、`/contracts`、`/bills`、`/add`、`/settings`、合同详情链路、账单详情链路、租客链路、抄表链路等正式业务页面
- **AND** 该表必须可被后续页面映射任务直接引用

### Requirement: 延后范围冻结
系统 SHALL 产出延后/不进入 parity 范围表，明确哪些页面延后承接或不进入正式 parity 范围。

#### Scenario: 标记延后或排除页面
- **WHEN** 页面属于运维治理或 dev-only / 待归档候选
- **THEN** 必须在延后/不进入 parity 范围表中显式标明
- **AND** 必须说明其延后原因或不纳入正式 parity 的原因

### Requirement: 页面盘点产物最小集合
系统 SHALL 要求 `phase12-01` 的当前轮交付至少包含页面分类表、正式页面范围表、延后/不进入 parity 范围表三张事实表。

#### Scenario: 验收 phase12-01 文档产物
- **WHEN** 审核 `phase12-01` 结果
- **THEN** 若缺少任一事实表，则不得视为当前轮任务完成
- **AND** 不得以“已在其他文档口头说明”替代结构化表格产物

### Requirement: 页面盘点验证规则
系统 SHALL 在 `phase12-01` 完成时复核页面路径存在性与分类边界一致性。

#### Scenario: 复核页面路径与边界
- **WHEN** 对 `phase12-01` 进行验证
- **THEN** 必须确认所有被列入清单的页面路径在 `src/app/**/page.tsx` 中真实存在
- **AND** 必须确认正式页面与 dev-only / 辅助页边界没有混写
- **AND** 必须确认盘点结果与 `docs/phase12_*` 当前共享口径一致

## MODIFIED Requirements
### Requirement: `phase12` 进入 `/spec` 的前置条件
`phase12` 的 `/spec` 不再允许停留在抽象“待盘点”状态，而必须建立在已冻结的旧页面清单、分类结果和正式范围表之上。

#### Scenario: 进入后续 `/spec`
- **WHEN** 后续子任务尝试进入 `/spec`
- **THEN** 必须能够引用 `phase12-01` 已冻结的页面分类表、正式页面范围表和延后范围表
- **AND** 不得重新定义页面总数、页面分类口径或正式 parity 范围

## REMOVED Requirements
### Requirement: 以“待后续盘点”替代事实表
**Reason**: 该做法会让后续 `/spec` 和实现重新承担高影响决策，破坏 `phase12` 的单一真相源。
**Migration**: 以本次 `phase12-01` 产出的三张事实表替代所有“后续再盘点”的模糊表述。
