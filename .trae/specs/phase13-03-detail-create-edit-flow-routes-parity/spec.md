# Phase13-03 详情/新建/编辑/流程页高保真迁移 Spec

## Why
当前 `phase13-02` 已完成一级正式列表页迁移，但房源、合同、账单主链的详情、新建、编辑与流程动作页仍未在 `src/minix` 中形成正式落点。需要在不改写既有 UI 展示效果、不越界切 retained-legacy API/query 的前提下，把旧 `Rento` 页面中的宿主绑定、页面级查询与错误出口拆离到新 route module，补齐第一批正式页面的可执行闭环。

## What Changes
- 为 `/rooms/:id`、`/rooms/:id/edit`、`/add/room`、`/add/contract`、`/contracts/new`、`/contracts/:id`、`/contracts/:id/edit`、`/contracts/:id/renew`、`/contracts/:id/checkout`、`/bills/create`、`/bills/:id`、`/bills/:id/edit` 建立真实 `src/minix` route module 与页面装配层
- 把旧 `src/app/**/page.tsx` 中的 `generateMetadata()`、`notFound()`、`dynamic = 'force-dynamic'`、页面级 server query 与 Decimal 转换拆到新宿主可解释的 loader、pending、error、not-found 边界
- 继续以旧 `Rento` 源代码和既有 `src/components/pages/*`、`src/components/business/*` 为直接原型，高保真承接页面信息结构、组件表达、表单节奏与状态反馈
- 为详情页、表单页、流程动作页明确提交后回跳、取消返回、异常恢复与兼容桥接策略，并对任何保留的兼容逻辑注明存在原因与退出条件
- **BREAKING** `phase13-02` 中依赖 document navigation 回落到 legacy 宿主的上述正式主链页面入口，在本子任务完成后应由新宿主真实页面承接，不再把这些路由视为“未迁移占位入口”

## Impact
- Affected specs: `phase13-frontend-page-parity-implementation`, `phase13-02-primary-list-routes-parity`, `phase12-frontend-parity-and-shell-cutover`
- Affected code: `src/minix/router/index.tsx`, `src/minix/routes/rooms/*`, `src/minix/routes/add/*`, `src/minix/routes/contracts/*`, `src/minix/routes/bills/*`, `src/minix/lib/*`, `src/app/rooms/[id]/**`, `src/app/contracts/**`, `src/app/bills/**`, `src/components/pages/*`

## ADDED Requirements
### Requirement: 主链详情/新建/编辑/流程页必须在新宿主中具备真实正式落点
系统 SHALL 将 `phase13-03` 范围内的房源、合同、账单详情/新建/编辑/流程动作页迁入 `src/minix`，使这些正式主链页面不再依赖 legacy 宿主 document fallback 才能访问。

#### Scenario: 访问主链详情或动作页
- **WHEN** 用户进入 `/rooms/:id`、`/rooms/:id/edit`、`/add/room`、`/add/contract`、`/contracts/new`、`/contracts/:id`、`/contracts/:id/edit`、`/contracts/:id/renew`、`/contracts/:id/checkout`、`/bills/create`、`/bills/:id` 或 `/bills/:id/edit`
- **THEN** 新宿主展示真实页面壳、真实表单或真实流程动作页，而不是继续跳回 legacy 宿主或显示占位提示

### Requirement: 详情/新建/编辑/流程页必须高保真承接旧 Rento UI
系统 SHALL 以旧 `Rento` 对应页面源代码为直接迁移原型；除退出 `Next.js` 宿主协议所必需的最小技术适配外，`phase13-03` 范围内页面必须高保真还原旧页面的信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义，禁止借迁移重新设计 UI。

#### Scenario: 对照旧原型验收详情与表单页
- **WHEN** 对照旧 `src/app/**/page.tsx` 与既有 `src/components/pages/*` 审查新宿主详情页、编辑页、新建页和流程动作页
- **THEN** 不得新增与旧原型无关的视觉重设计、说明性迁移卡片、宿主标签、额外信息架构层或破坏既有桌面/移动端展示效果的改写

### Requirement: 页面级数据加载与异常边界必须进入 route module
系统 SHALL 将旧页面中的 `generateMetadata()`、`notFound()`、`dynamic = 'force-dynamic'`、页面级 server query、Decimal 转换与错误出口拆离为新宿主中的 route loader、pending、error、not-found 与提交后回跳策略，确保页面级解释单一。

#### Scenario: 页面加载中、目标不存在或动作提交后回跳
- **WHEN** 详情页、编辑页、新建页或流程动作页处于加载中、目标资源不存在、提交失败或提交成功后需要回跳
- **THEN** 新宿主通过 route module 提供统一可解释的 loading、error、not-found、success redirect 与恢复路径，而不是继续依赖旧 `src/app/**/page.tsx` 的宿主协议

### Requirement: 主链详情与流程动作页不得破坏合同/账单/房源语义
系统 SHALL 在迁移 `/contracts/:id/renew`、`/contracts/:id/checkout`、账单编辑与房源编辑等页面时保持合同锚点、账务语义、删除门禁、历史保留与多仪表语义稳定，不得因宿主迁移放宽服务端业务边界。

#### Scenario: 提交流程动作或编辑表单
- **WHEN** 用户执行续租、退租、房源编辑、账单编辑或新建动作
- **THEN** 页面表达、参数组织、提交结果与回跳路径必须继续围绕真实主链语义运行，不得因页面迁移引入历史数据破坏、错误语义漂移或越权删除

### Requirement: 新增兼容逻辑必须声明存在原因与退出条件
系统 SHALL 对 `phase13-03` 中仍需保留的兼容桥接、legacy fallback、数据适配或提交后跳转兜底写明存在原因、当前责任与退出条件，避免兼容项重新成为第二真相源。

#### Scenario: 页面仍存在过渡性桥接
- **WHEN** 某个详情页、编辑页或流程动作页在迁移过程中仍需暂留兼容桥接
- **THEN** 实现与注释中必须明确该桥接的存在原因、适用范围和退出条件，且不得扩写为 retained-legacy API/query 的默认长期入口

## MODIFIED Requirements
### Requirement: `phase13-02` 的主链 document fallback 边界必须随 `phase13-03` 收缩
`phase13-02` 为未迁移详情/新建/流程动作页保留的 document navigation fallback，在 `phase13-03` 范围内完成真实页面落点后，必须只保留真正未进入本轮范围的页面作为 legacy fallback；本轮范围内路由不再继续以 fallback 作为默认访问路径。

## REMOVED Requirements
- 无
