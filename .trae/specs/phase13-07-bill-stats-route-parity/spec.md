# Phase13-07 账单统计页迁移收口 Spec

## Why
`phase13-05` 和 `phase13-06` 收口后，`/bills/stats` 成为 `phase13` 唯一剩余的正式业务页面尾项。当前它仍通过 legacy document fallback 打开旧宿主页，且 `BillStatsPage` 仍绑定 `next/navigation`，因此需要通过独立的 `phase13-07` 子任务把账单统计页正式迁入 `src/minix`，同时保持与 `phase14` API/query drain 的边界清晰。

## What Changes
- 为 `/bills/stats` 增加 `src/minix` 正式 route module 承接位，并收口页面级 loader / pending / error 边界
- 拆除 `BillStatsPage` 对 `next/navigation` 的直接依赖，使其可被 `src/minix` 正式复用
- 固定账单统计页当前对 retained-legacy API/query 的依赖关系与最小 bridge 说明，并明确它们属于 `phase14` 后续输入
- 确保统一 `/api/bills/stats` bridge 由静态 stats 路径承接，不再被动态 `bills/:id` 路由吞掉
- 移除 `/bills/stats` 作为正式业务页面的 document fallback 身份
- 保持账单统计页页面结构、筛选、汇总语义与旧原型一致，不重写账单统计读模型

## Impact
- Affected specs: `phase13-frontend-page-parity-implementation`, `phase13-05-page-parity-acceptance-baseline`, `phase12-frontend-parity-and-shell-cutover`
- Affected code: `src/app/bills/stats/page.tsx`, `src/components/pages/BillStatsPage.tsx`, `src/app/api/bills/stats/route.ts`, `src/lib/bill-stats.ts`, `src/minix/routes/bills/*`, `src/minix/lib/route-navigation.ts`, `server/routes/bills.ts`, `server/lib/legacy-route-inventory.ts`, `docs/phase13_*`

## ADDED Requirements
### Requirement: 账单统计页必须具备新宿主正式承接位
系统 SHALL 为 `/bills/stats` 提供 `src/minix` 正式 route module 承接位，使其不再依赖 legacy document fallback 作为正式业务页面入口。

#### Scenario: 账单统计页在新宿主打开
- **WHEN** 用户从 `src/minix` 导航进入 `/bills/stats`
- **THEN** 页面应由 `BillStatsRoute` 等新宿主正式 route module 承接，而不是跳转到旧宿主页

### Requirement: BillStatsPage 必须完成宿主绑定拆分
系统 SHALL 将 `BillStatsPage` 拆分为可被 `src/minix` 复用的页面主体，不再直接依赖 `next/navigation` 或旧宿主页面协议。

#### Scenario: 统计页在新宿主复用页面主体
- **WHEN** `BillStatsRoute` 组装账单统计页
- **THEN** 页面主体应通过宿主无关的导航/回跳适配方式工作，而不是直接引用 `next/navigation`

### Requirement: 账单统计页必须具备单一的 retained-legacy bridge 说明
系统 SHALL 明确账单统计页当前仍依赖的 retained-legacy API/query 边界，并将其标记为 `phase14` 后续输入，而不是在 `phase13-07` 中提前清退。

#### Scenario: 审查账单统计页与旧 API/query 的关系
- **WHEN** 实施 `/bills/stats` 页面迁移
- **THEN** 必须说明当前 retained-legacy API/query 的存在原因、保留边界与 `phase14` 退出条件

#### Scenario: 统一 `/api/bills/stats` bridge 被调用
- **WHEN** `BillStatsRoute` 或统计页筛选在新宿主请求 `/api/bills/stats`
- **THEN** 请求必须命中静态 stats bridge，而不是被动态 `/:id` 详情路由解释为 bill id

### Requirement: 账单统计页迁移不得越界到 phase14
系统 SHALL 将 `phase13-07` 严格限制在页面 parity、宿主绑定拆分、route-level 边界和 bridge 说明范围内，不得提前执行 `/api/bills/stats` 的正式宿主切流或账单统计读模型重写。

#### Scenario: 审查 phase13-07 变更边界
- **WHEN** 对 `/bills/stats` 做页面迁移与验收
- **THEN** 变更不得被解释为账单 stats API/query drain、正式宿主切流或读模型重构

## MODIFIED Requirements
### Requirement: phase13 页面迁移完成标准
`phase13` 的页面迁移完成标准必须包含 `/bills/stats` 已在 `src/minix` 中具备正式承接位、`BillStatsPage` 已完成宿主绑定拆分、且该页对 retained-legacy API/query 的 bridge 说明已收口为单一解释。

## REMOVED Requirements
- 无
