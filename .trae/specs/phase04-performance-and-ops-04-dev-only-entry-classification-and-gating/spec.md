# Phase04-04 dev-only 页面分类与门禁治理 Spec

## Why
当前仓库已经冻结了辅助页面的初始分类口径，但 `src/app` 下的性能页、演示页、验证页和运维治理页仍与正式业务入口并存。若不把页面用途、门禁边界和导航暴露面继续收口，正式入口会持续被辅助能力污染，发布边界也会保持模糊。

## What Changes
- 为 `src/app` 中的辅助页面建立可执行的分类结果，区分 `dev-only`、`运维治理`、`正式业务入口`
- 明确各类页面的门禁策略，包括是否必须认证、是否仅限开发环境访问、是否允许继续保留直达路由
- 收口导航和入口暴露面，避免开发辅助页继续出现在正式业务主导航或被误读为正式功能
- 为保留页面补最小用途说明与保留理由，使代码和文档对页面定位保持一致
- 必要时更新页面分类相关文档口径，确保 `architecture_map.md` 与实现边界一致

## Impact
- Affected specs: 页面分类治理、dev-only 页面门禁、导航暴露面、运维治理入口边界
- Affected code: `src/app/performance-test/page.tsx`、`src/app/performance-benchmark/page.tsx`、`src/app/performance-analysis/page.tsx`、`src/app/layout-demo/page.tsx`、`src/app/components/page.tsx`、`src/app/business-flow-validation/page.tsx`、必要时 `src/app/system-health/page.tsx`、`src/app/data-consistency/page.tsx`、`src/lib/route-config.ts`、`src/lib/navigation-config.ts`、`src/components/layout/UnifiedNavigation.tsx`、必要时 `src/middleware.ts`、`architecture_map.md`

## ADDED Requirements
### Requirement: 辅助页面分类结果显式化
系统 SHALL 为当前 `src/app` 中的辅助页面提供明确且可执行的分类结果，至少区分 `dev-only`、`运维治理` 与 `正式业务入口` 三类。

#### Scenario: 用户审视页面用途
- **WHEN** 开发者检查 `performance-*`、`layout-demo`、`components`、`business-flow-validation`、`system-health`、`data-consistency`
- **THEN** 可以明确知道每个页面属于哪一类
- **AND** 不需要依赖历史对话或隐性知识猜测页面定位

### Requirement: dev-only 页面不得继续污染正式入口
系统 SHALL 让被归类为 `dev-only` 的页面退出正式业务导航与默认入口暴露面，同时保留其在开发和治理阶段的必要使用价值。

#### Scenario: 正式导航不再出现 dev-only 页面
- **WHEN** 用户浏览移动端或桌面端主导航、常规页面入口或默认业务流
- **THEN** 不会把 `dev-only` 页面误认为正式产品功能
- **AND** 正式业务入口不会继续被性能页、演示页或验证页污染

### Requirement: 页面门禁策略与页面分类一致
系统 SHALL 根据页面分类应用一致的门禁策略，明确页面是否必须认证、是否仅限开发环境、以及是否允许继续通过直达路由访问。

#### Scenario: dev-only 页面只在允许场景暴露
- **WHEN** 非开发环境用户或不符合条件的访问者尝试打开 `dev-only` 页面
- **THEN** 系统会按既定门禁策略拒绝或重定向
- **AND** 不会因为导航已隐藏却仍存在未收口的裸露入口

#### Scenario: 运维治理页保留但边界清晰
- **WHEN** 用户访问 `system-health` 或 `data-consistency`
- **THEN** 系统会把它们视为运维治理入口而非正式业务页
- **AND** 其门禁与导航归属会与页面定位一致

### Requirement: 页面用途说明可追溯
系统 SHALL 为保留的辅助页面提供最小用途说明或保留理由，使后续维护者可以理解该页面为何存在以及它不属于正式业务入口的原因。

#### Scenario: 后续维护者理解页面保留原因
- **WHEN** 维护者阅读页面实现、路由配置或结构文档
- **THEN** 可以看到该页面的用途、分类与保留边界说明
- **AND** 不会把历史测试页误当成可继续扩写的正式功能

## MODIFIED Requirements
### Requirement: 主导航与正式入口治理
项目的主导航、默认页面入口和页面分类配置 SHALL 仅暴露正式业务入口；`dev-only` 页面与运维治理页不得继续以与正式业务入口等价的方式暴露。

#### Scenario: 主导航只表达正式业务骨架
- **WHEN** 用户查看移动端底部导航、桌面端顶部导航或统一导航配置
- **THEN** 导航项只表达正式业务骨架
- **AND** 辅助页面即使保留，也必须通过独立边界而非正式主导航进入

## REMOVED Requirements
### Requirement: 辅助页面与正式入口默认并列暴露
**Reason**: 该状态会持续制造导航噪音，并让 dev-only 页面与正式产品能力发生语义混淆。
**Migration**: 将辅助页面按分类结果迁移到明确的门禁与入口边界中，正式导航仅保留业务主链入口；必要时在文档中说明页面用途和保留理由。
