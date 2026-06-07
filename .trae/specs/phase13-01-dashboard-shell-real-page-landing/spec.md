# Phase13-01 首页真实页面壳落位 Spec

## Why
当前 `/` 虽然已经在 `src/minix` 中挂载，但仍是阶段说明页，无法作为 `phase13` 真实页面迁移实施的起点。需要先把首页升级为真实工作台页面壳，并冻结首页在新宿主中的页面装配边界、导航节奏与页面级状态边界，作为后续一级入口页迁移的共用基线。

## What Changes
- 把 `src/minix/routes/HomePage.tsx` 从说明性承接页升级为真实工作台页面壳
- 在首页范围内明确页面装配层、快捷入口节奏、搜索入口与设置入口承接方式
- 为首页冻结 loader / pending / error 同类边界的最小实现口径
- 复用旧首页主体表达与新宿主导航壳，但不切 dashboard retained-legacy API，不扩写通知中心、个人资料或 PWA runtime
- 以旧 `DashboardPage.tsx` / `DashboardPageWithStats.tsx` 源代码为直接原型，除最小技术适配外接近 `100%` 还原旧首页的信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义

## Impact
- Affected specs: `phase13-frontend-page-parity-implementation`, `phase12-frontend-parity-and-shell-cutover`
- Affected code: `src/minix/routes/HomePage.tsx`, `src/minix/router/index.tsx`, `src/minix/layout/*`, `src/components/pages/DashboardPage.tsx`, `src/components/pages/DashboardPageWithStats.tsx`, `src/components/business/dashboard-home.tsx`

## ADDED Requirements
### Requirement: 首页真实页面壳承接
系统 SHALL 将 `/` 从说明性承接页升级为真实工作台页面壳，并继续以 `src/minix` 作为正式前端宿主。

#### Scenario: 打开首页
- **WHEN** 用户进入 `/`
- **THEN** 页面展示真实工作台页面壳，而不是阶段说明或 placeholder 内容

### Requirement: 首页装配边界单一解释
系统 SHALL 在首页 route module 中明确页面装配边界、快捷入口节奏、搜索入口与设置入口承接方式，并保持与旧 UI 原型一致。

#### Scenario: 首页承接入口
- **WHEN** 用户浏览首页的快捷入口、搜索入口与设置入口
- **THEN** 首页具备单一可解释的装配结构与导航节奏，且不引入第二套导航骨架

### Requirement: 首页必须以旧 Rento 源代码为直接原型高保真承接
系统 SHALL 以旧 `DashboardPage.tsx` / `DashboardPageWithStats.tsx` 源代码为首页迁移原型；除已批准的最小技术适配外，首页必须接近 `100%` 还原旧页面的信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义。

#### Scenario: 首页验收对照旧原型
- **WHEN** 对照旧 `Rento` 首页源代码审查 `src/minix/routes/HomePage.tsx`
- **THEN** 不得保留迁移说明文案、宿主标签、开发态状态卡、验收辅助卡片、占位交互、重复快捷入口或其他不属于旧首页原型的结构漂移项

### Requirement: 首页页面级状态边界可复用
系统 SHALL 为首页提供 loader / pending / error 同类边界的最小实现口径，供后续正式页面 route module 复用。

#### Scenario: 首页加载或异常
- **WHEN** 首页首屏加载中或出现可恢复错误
- **THEN** 新宿主能够通过首页 route module 提供统一的状态边界，而不是继续依赖旧宿主说明页逻辑

## MODIFIED Requirements
### Requirement: 首页从阶段说明承接升级为正式页面入口
首页在 `phase13-01` 中不再承担“迁移说明页”职责，而是承担真实工作台页面壳与页面装配入口职责；但该变更仅限首页页面 parity，不等于切换 dashboard retained-legacy API、PWA runtime 或后续 cutover。

## REMOVED Requirements
- 无
