# Phase13-04 租客与抄表页面高保真迁移 Spec

## Why
当前 `phase13-03` 已补齐房源、合同、账单主链的详情/新建/编辑/流程页，但租客与抄表页面仍未在 `src/minix` 中形成正式落点，首页快捷入口和部分详情联动仍需回落到 legacy 宿主。需要在不重做 UI、不越界切 retained-legacy API/query 的前提下，把租客与抄表页面迁入新宿主，补齐首批正式业务页闭环，并为 `phase14` 提供稳定的页面 parity 输入。

## What Changes
- 为 `/renters`、`/renters/new`、`/renters/:id`、`/renters/:id/edit`、`/meter-readings/batch`、`/meter-readings/history` 建立真实 `src/minix` route module 与页面装配层
- 把旧 `src/app/renters/**/page.tsx` 与 `src/app/meter-readings/**/page.tsx` 中仍依赖的 `next/navigation`、`notFound()`、页面级数据整形与旧宿主跳转协议拆到新宿主可解释的 loader、pending、error、not-found 与提交后回跳边界
- 继续以旧 `Rento` 源代码与既有 `src/components/pages/*`、`src/components/business/*` 为直接原型，高保真承接租客与抄表页面的信息结构、组件表达、导航节奏、表单交互与状态反馈
- 收缩 `phase13` 当前对 `/renters/**` 与 `/meter-readings/**` 的 legacy document fallback，使这些正式页面改由新宿主默认承接
- **BREAKING** 当前仍通过 document navigation 回落到 legacy 宿主的 `/renters/**` 与 `/meter-readings/**` 正式业务页面，在本子任务完成后应由 `src/minix` 真实页面默认承接，不再视为“未迁移占位入口”

## Impact
- Affected specs: `phase13-frontend-page-parity-implementation`, `phase13-03-detail-create-edit-flow-routes-parity`, `phase12-frontend-parity-and-shell-cutover`
- Affected code: `src/minix/router/index.tsx`, `src/minix/lib/route-navigation.ts`, `src/minix/routes/renters/*`, `src/minix/routes/meter-readings/*`, `src/minix/lib/*`, `src/app/renters/**`, `src/app/meter-readings/**`, `src/components/pages/Renter*.tsx`, `src/components/pages/BatchMeterReadingPage.tsx`, `src/components/pages/MeterReadingHistoryPage.tsx`

## ADDED Requirements
### Requirement: 租客与抄表正式页面必须在新宿主中具备真实落点
系统 SHALL 将 `phase13-04` 范围内的租客与抄表页面迁入 `src/minix`，使这些正式业务页不再依赖 legacy 宿主 document fallback 才能访问。

#### Scenario: 访问租客或抄表正式页面
- **WHEN** 用户进入 `/renters`、`/renters/new`、`/renters/:id`、`/renters/:id/edit`、`/meter-readings/batch` 或 `/meter-readings/history`
- **THEN** 新宿主展示真实页面壳、真实列表/详情/表单/流程页，而不是继续跳回 legacy 宿主或显示“当前入口仍在后续阶段承接”的提示

### Requirement: 租客与抄表页面必须高保真承接旧 Rento UI
系统 SHALL 以旧 `Rento` 对应页面源代码为直接迁移原型；除退出 `Next.js` 宿主协议所必需的最小技术适配外，`phase13-04` 范围内页面必须 100% 高保真还原旧页面的信息结构、组件表达、导航节奏、表单交互、状态反馈与业务语义，禁止借迁移重新设计 UI 或改变既有展示效果。

#### Scenario: 对照旧原型验收租客与抄表页面
- **WHEN** 对照旧 `src/app/renters/**/page.tsx`、`src/app/meter-readings/**/page.tsx` 与既有 `src/components/pages/*` 审查新宿主页面
- **THEN** 不得新增与旧原型无关的视觉重设计、迁移说明卡片、宿主标签、额外信息架构层、重复快捷入口或破坏既有桌面/移动端展示效果的改写

### Requirement: 页面级加载、错态与回跳边界必须进入 route module
系统 SHALL 将租客与抄表页面中的参数解析、首屏数据边界、旧宿主错误出口、提交成功后的回跳、取消返回与恢复动作收口到新宿主 route module，确保页面级解释单一。

#### Scenario: 页面加载中、目标不存在或提交后回跳
- **WHEN** 列表页、详情页、编辑页、新建页或抄表流程页处于加载中、资源不存在、提交失败或提交成功后需要回跳
- **THEN** 新宿主通过 route module 提供统一可解释的 loading、error、not-found、success redirect 与恢复路径，而不是继续依赖旧 `src/app/**/page.tsx` 的宿主协议

### Requirement: 抄表迁移不得放宽历史保留与多仪表语义
系统 SHALL 在迁移 `/meter-readings/batch` 与 `/meter-readings/history` 时继续保持多仪表模型、抄表历史保留、结构化 `recordType` 语义、自动出账联动边界与删除/修复治理口径稳定，不得因宿主迁移放宽历史追溯约束。

#### Scenario: 执行批量抄表或查看抄表历史
- **WHEN** 用户提交批量抄表、查看历史记录、按记录类型筛选或查看结构化抄表状态
- **THEN** 页面表达、提交结果、历史展示与回跳路径必须继续围绕现有抄表主链语义运行，不得弱化历史保留、聚合账单语义或结构化记录类型口径

### Requirement: 正式范围不得混入支持页、治理页与 dev-only 页面
系统 SHALL 严格把 `phase13-04` 限定在 6 个正式业务页，不得借迁移之名把 `/bills/stats`、支持页、治理页或 dev-only 页面混入同一子任务。

#### Scenario: 收缩 fallback 与补齐正式页面后复核范围
- **WHEN** 审查新宿主新增路由、首页快捷入口与 fallback 清单
- **THEN** 只有 `/renters/**` 与 `/meter-readings/**` 这 6 个正式业务页被纳入本子任务，`/bills/stats`、`/profile`、`/notifications`、治理页和 dev-only 页面继续保持既有延期边界

## MODIFIED Requirements
### Requirement: `phase13` 中租客与抄表 document fallback 边界必须随 `phase13-04` 收缩
当前 `phase13` 为 `/renters/**` 与 `/meter-readings/**` 保留的 document navigation fallback，在 `phase13-04` 范围完成真实页面落点后，必须只保留真正未进入本轮范围的延后页面作为 legacy fallback；本轮范围内路由不再继续以 fallback 作为默认访问路径。

## REMOVED Requirements
- 无
