# Phase12 Frontend Parity And Shell Cutover 架构规划

## 一、文档定位
本文档用于承接 `phase11-deployment-cutover-and-cutline-closure` 完成后的下一阶段工作流，回答以下问题：

- 为什么 `phase11` 完成后，下一阶段应先进入前端页面 parity，而不是直接执行 legacy 退出
- 为什么后续路线图不能只规划一个笼统的 `phase12-full-minix-parity-and-legacy-exit`
- 为什么当前应继续固定 `Prisma + PostgreSQL` 为正式数据访问主线，而不重新打开 Prisma 替换议题
- 为什么 `Rento-miniX` 在后续迁移中必须继续沿用旧 `Rento` 的页面原型与 UI 表达
- 为什么 `phase12` 必须同时冻结 `phase12 ~ phase15` 的完整路线图，才能避免重新退回“走一步看一步”的推进方式

本文档不替代：

- [plan.md](file:///home/dell/Projects/Rento/plan.md) 的阶段顺序与当前结论职责
- [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md) 的入口摘要职责
- [phase12_frontend_parity_and_shell_cutover_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md) 的子任务拆分职责
- [phase12_frontend_parity_and_shell_cutover_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md) 的共享边界职责

## 当前文档状态
- 本文档已与 [phase12_frontend_parity_and_shell_cutover_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md) 和 [phase12_frontend_parity_and_shell_cutover_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md) 完成互链收口。
- `phase12` 当前轮只完成阶段文档规划产出，用于冻结“页面 parity + 多阶段路线图”的统一判断标准；尚未进入 `/spec` 或页面迁移实现。

## 二、当前阶段前提
### 2.1 已完成上游
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- `phase06-minix-replatform` 已完成完整路线图、模块分类与真相源切换冻结
- `phase07-app-shell-and-runtime-foundation` 已完成新应用壳、新运行时入口与旧运行线映射冻结
- `phase08-api-and-auth-foundation` 已完成统一 API 宿主、认证门禁、中间件链、错误处理与最小页面守卫收口
- `phase09-domain-service-migration` 已完成共享领域服务、正式宿主、主链 smoke 与 compat wrapper 清单收口
- `phase10-data-access-and-migration-closure` 已完成 `Prisma + PostgreSQL` 长期数据访问主线、查询分层、统一事务边界与迁移兼容边界冻结
- `phase11-deployment-cutover-and-cutline-closure` 已完成正式部署主线、legacy 回滚基线、发布门禁与部署演练记录要求冻结

### 2.2 真实现状
- 当前纯新主线前端承接位已经存在：
  - `src/minix/App.tsx`
  - `src/minix/router/index.tsx`
  - `src/minix/layout/*`
  - `src/minix/routes/*`
- 但当前 `src/minix` 仍主要承担：
  - 最小登录态探测
  - 路由骨架
  - 页面占位承接
  - 新宿主入口验证
- 当前旧 `src/app/*` 仍承载大量正式页面壳与页面装配逻辑，尚未完成纯新主线 parity。
- 当前旧 `src/app/api/*` 仍保留一批 retained-legacy 与 compat-wrapper 路由，说明“纯新主线完整替代旧技术栈”还没有达到。
- 当前 PWA 能力仍主要依赖旧 Next 宿主，不属于纯 `Vite + Hono` 新主线的正式承接结果。

### 2.2.1 旧页面真实清单与分类结果
当前旧 `src/app/**/page.tsx` 实际共 37 个页面入口。为满足 `phase12-01` “不可只停留在原则说明，必须落成三张事实表”的要求，当前轮在 `docs/phase12_*` 中将页面盘点结果冻结为以下结构化表格。

#### 2.2.1.1 页面盘点底稿表
| 页面路径 | 旧宿主文件 | 基础用途 |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | 工作台首页与核心数据概览入口 |
| `/rooms` | `src/app/rooms/page.tsx` | 房源列表与房态管理入口 |
| `/rooms/[id]` | `src/app/rooms/[id]/page.tsx` | 房源详情查看入口 |
| `/rooms/[id]/edit` | `src/app/rooms/[id]/edit/page.tsx` | 房源编辑入口 |
| `/add` | `src/app/add/page.tsx` | 聚合添加入口页 |
| `/add/room` | `src/app/add/room/page.tsx` | 新增房源表单入口 |
| `/add/contract` | `src/app/add/contract/page.tsx` | 新增合同表单入口 |
| `/contracts` | `src/app/contracts/page.tsx` | 合同列表入口 |
| `/contracts/new` | `src/app/contracts/new/page.tsx` | 新签合同入口 |
| `/contracts/[id]` | `src/app/contracts/[id]/page.tsx` | 合同详情入口 |
| `/contracts/[id]/edit` | `src/app/contracts/[id]/edit/page.tsx` | 合同编辑入口 |
| `/contracts/[id]/renew` | `src/app/contracts/[id]/renew/page.tsx` | 合同续租入口 |
| `/contracts/[id]/checkout` | `src/app/contracts/[id]/checkout/page.tsx` | 合同退租结算入口 |
| `/bills` | `src/app/bills/page.tsx` | 账单列表入口 |
| `/bills/create` | `src/app/bills/create/page.tsx` | 新建账单入口 |
| `/bills/[id]` | `src/app/bills/[id]/page.tsx` | 账单详情入口 |
| `/bills/[id]/edit` | `src/app/bills/[id]/edit/page.tsx` | 账单编辑入口 |
| `/bills/stats` | `src/app/bills/stats/page.tsx` | 账单统计入口 |
| `/renters` | `src/app/renters/page.tsx` | 租客列表入口 |
| `/renters/new` | `src/app/renters/new/page.tsx` | 新增租客入口 |
| `/renters/[id]` | `src/app/renters/[id]/page.tsx` | 租客详情入口 |
| `/renters/[id]/edit` | `src/app/renters/[id]/edit/page.tsx` | 租客编辑入口 |
| `/meter-readings/batch` | `src/app/meter-readings/batch/page.tsx` | 批量抄表入口 |
| `/meter-readings/history` | `src/app/meter-readings/history/page.tsx` | 抄表历史入口 |
| `/settings` | `src/app/settings/page.tsx` | 系统设置入口 |
| `/login` | `src/app/login/page.tsx` | 登录与会话入口 |
| `/offline` | `src/app/offline/page.tsx` | 离线兜底与最小提示入口 |
| `/profile` | `src/app/profile/page.tsx` | 个人资料与账户信息入口 |
| `/notifications` | `src/app/notifications/page.tsx` | 通知与消息查看入口 |
| `/system-health` | `src/app/system-health/page.tsx` | 系统健康检查与运行治理入口 |
| `/data-consistency` | `src/app/data-consistency/page.tsx` | 数据一致性检查与修复治理入口 |
| `/performance-test` | `src/app/performance-test/page.tsx` | 开发期性能测试入口 |
| `/performance-benchmark` | `src/app/performance-benchmark/page.tsx` | 开发期性能基准入口 |
| `/performance-analysis` | `src/app/performance-analysis/page.tsx` | 开发期性能分析入口 |
| `/layout-demo` | `src/app/layout-demo/page.tsx` | 布局演示与回归验证入口 |
| `/components` | `src/app/components/page.tsx` | 组件展示与联调入口 |
| `/business-flow-validation` | `src/app/business-flow-validation/page.tsx` | 核心业务流程验证入口 |

#### 2.2.1.2 页面分类表
| 分类 | 页面路径 | 数量 | 说明 |
| --- | --- | --- | --- |
| 正式业务页面 | `/`、`/rooms`、`/rooms/[id]`、`/rooms/[id]/edit`、`/add`、`/add/room`、`/add/contract`、`/contracts`、`/contracts/new`、`/contracts/[id]`、`/contracts/[id]/edit`、`/contracts/[id]/renew`、`/contracts/[id]/checkout`、`/bills`、`/bills/create`、`/bills/[id]`、`/bills/[id]/edit`、`/bills/stats`、`/renters`、`/renters/new`、`/renters/[id]`、`/renters/[id]/edit`、`/meter-readings/batch`、`/meter-readings/history`、`/settings` | 25 | 承载房源、租客、合同、账单、抄表、设置与工作台主链，属于 `phase12 ~ phase15` 的正式 parity 输入 |
| 状态/支持页面 | `/login`、`/offline`、`/profile`、`/notifications` | 4 | 承担登录、离线兜底与支持类入口，不与正式业务主链混写 |
| 运维治理页面 | `/system-health`、`/data-consistency` | 2 | 治理与排障入口，分类口径与 `src/lib/page-governance.ts` 保持一致 |
| dev-only / 待归档候选 | `/performance-test`、`/performance-benchmark`、`/performance-analysis`、`/layout-demo`、`/components`、`/business-flow-validation` | 6 | 仅用于开发、验证或演示，不进入正式 parity 范围 |

#### 2.2.1.3 正式页面范围表
| 范围类型 | 页面路径 | 当前冻结结论 |
| --- | --- | --- |
| 正式业务页面 | `/`、`/rooms`、`/rooms/[id]`、`/rooms/[id]/edit`、`/add`、`/add/room`、`/add/contract`、`/contracts`、`/contracts/new`、`/contracts/[id]`、`/contracts/[id]/edit`、`/contracts/[id]/renew`、`/contracts/[id]/checkout`、`/bills`、`/bills/create`、`/bills/[id]`、`/bills/[id]/edit`、`/bills/stats`、`/renters`、`/renters/new`、`/renters/[id]`、`/renters/[id]/edit`、`/meter-readings/batch`、`/meter-readings/history`、`/settings` | 必须进入 `phase12 ~ phase15` 默认 parity 路线图，并作为后续页面映射、页面装配与 API parity 的共享输入 |
| 状态/支持页面 | `/login`、`/offline`、`/profile`、`/notifications` | 属于支持类 parity 输入；其中 `/login`、`/offline` 已有新宿主承接位，`/profile`、`/notifications` 继续延后到核心业务页之后承接 |

#### 2.2.1.4 延后 / 不进入 parity 范围表
| 页面路径 | 分类 | 当前结论 | 原因 |
| --- | --- | --- | --- |
| `/system-health` | 运维治理 | 延后承接，不进入 `phase12` 首批正式页面 parity 范围 | 属于治理与排障入口，应与正式业务主入口语义分离，且当前仅在 `route-manifest` governance 说明中保留承接位 |
| `/data-consistency` | 运维治理 | 延后承接，不进入 `phase12` 首批正式页面 parity 范围 | 属于治理工具链，需继续保持治理边界，不与正式业务页混写 |
| `/performance-test` | dev-only / 待归档候选 | 不进入正式 parity 范围 | 仅用于开发阶段性能验证 |
| `/performance-benchmark` | dev-only / 待归档候选 | 不进入正式 parity 范围 | 仅用于开发阶段基准测试 |
| `/performance-analysis` | dev-only / 待归档候选 | 不进入正式 parity 范围 | 仅用于调试与诊断 |
| `/layout-demo` | dev-only / 待归档候选 | 不进入正式 parity 范围 | 属于 UI 演示与回归验证资产 |
| `/components` | dev-only / 待归档候选 | 不进入正式 parity 范围 | 属于组件展示与联调入口 |
| `/business-flow-validation` | dev-only / 待归档候选 | 不进入正式 parity 范围 | 属于开发/验收辅助台，不属于正式日常业务入口 |

### 2.2.2 当前 `src/minix` 的真实承接能力
- 当前新宿主真实可用的独立页面组件只有：
  - `HomePage`
  - `LoginPage`
  - `OfflinePage`
  - `LoadingPage`
  - `ErrorPage`
  - `NotFoundPage`
  - `PlaceholderPage`
  - `StatusPageShell`
- 当前路由入口见 [index.tsx](file:///home/dell/Projects/Rento/src/minix/router/index.tsx#L17-L56)：
  - `/login`
  - `/offline`
  - `/loading`
  - `/error`
  - `/404`
  - `/`
  - 来自 `minixPrimaryRoutes` 的 `/rooms`、`/add`、`/contracts`、`/bills`、`/settings`
- 其中 `/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 当前仍只是 `PlaceholderPage` 承接位，而不是正式页面 parity 完成态。
- `/renters`、`/meter-readings/*`、`/contracts/[id]/*`、`/bills/[id]/*`、`/rooms/[id]/*`、`/profile`、`/notifications`、`/system-health`、`/data-consistency` 当前在新宿主中都还没有正式路由落点。

### 2.2.3 当前页面 parity 基线映射表
下表冻结 `phase12` 当前轮必须吸收的真实映射基线；后续 `/spec` 只能在这个表的基础上细化实现，不再重新发明范围。

| 旧页面路径 | 分类 | 当前新宿主承接现状 | 目标新路由/承接位 | `phase12` 判断 | 优先级 | 是否阻塞 `phase13` |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 正式业务 | 已有 `HomePage`，但仍是承接说明页 | 保留 `/`，由 [HomePage](file:///home/dell/Projects/Rento/src/minix/routes/HomePage.tsx) 逐步承接真实工作台页面壳 | 保留现有首页路由，后续替换为真实工作台页面 parity | P0 | 是 |
| `/login` | 状态页 | 已有 `LoginPage` | 保留 `/login`，继续由 [LoginPage](file:///home/dell/Projects/Rento/src/minix/routes/LoginPage.tsx) 承接 | 继续保留为正式状态页，无需重定义范围 | P0 | 否 |
| `/offline` | 状态页 | 已有 `OfflinePage` | 保留 `/offline`，继续由 [OfflinePage](file:///home/dell/Projects/Rento/src/minix/routes/OfflinePage.tsx) 承接 | 继续保留为正式状态页，并作为 `phase14` PWA 输入 | P0 | 否 |
| `/rooms` | 正式业务 | 已有 `/rooms` placeholder | 保留 `/rooms`，后续以 `src/minix/routes/rooms/RoomListRoute.tsx` 替换 placeholder | 作为首批正式业务列表页迁移落点 | P0 | 是 |
| `/add` | 正式业务 | 已有 `/add` placeholder | 保留 `/add`，后续以 `src/minix/routes/add/AddHubRoute.tsx` 替换 placeholder | 作为首批聚合入口页迁移落点 | P0 | 是 |
| `/contracts` | 正式业务 | 已有 `/contracts` placeholder | 保留 `/contracts`，后续以 `src/minix/routes/contracts/ContractListRoute.tsx` 替换 placeholder | 作为首批正式业务列表页迁移落点 | P0 | 是 |
| `/bills` | 正式业务 | 已有 `/bills` placeholder | 保留 `/bills`，后续以 `src/minix/routes/bills/BillListRoute.tsx` 替换 placeholder | 作为首批正式业务列表页迁移落点 | P0 | 是 |
| `/settings` | 正式业务 | 已有 `/settings` placeholder | 保留 `/settings`，后续以 `src/minix/routes/settings/SettingsRoute.tsx` 替换 placeholder | 作为首批正式设置入口页迁移落点 | P0 | 是 |
| `/rooms/[id]` | 正式业务 | 新宿主无对应子路由 | 新增 `/rooms/:id`，承接位命名为 `src/minix/routes/rooms/RoomDetailRoute.tsx` | 需要新增 `/rooms/:id` 正式页面壳 | P1 | 是 |
| `/rooms/[id]/edit` | 正式业务 | 新宿主无对应子路由 | 新增 `/rooms/:id/edit`，承接位命名为 `src/minix/routes/rooms/RoomEditRoute.tsx` | 需要新增 `/rooms/:id/edit` 正式页面壳 | P1 | 是 |
| `/add/room` | 正式业务 | 新宿主无对应子路由 | 新增 `/add/room`，承接位命名为 `src/minix/routes/add/AddRoomRoute.tsx` | 需要新增 `/add/room` 子路由壳，继续复用现有表单表达 | P1 | 是 |
| `/add/contract` | 正式业务 | 新宿主无对应子路由 | 新增 `/add/contract`，承接位命名为 `src/minix/routes/add/AddContractRoute.tsx` | 需要新增 `/add/contract` 子路由壳 | P1 | 是 |
| `/contracts/new` | 正式业务 | 新宿主无对应子路由 | 新增 `/contracts/new`，承接位命名为 `src/minix/routes/contracts/ContractCreateRoute.tsx` | 需要新增 `/contracts/new` 页面壳 | P1 | 是 |
| `/contracts/[id]` | 正式业务 | 新宿主无对应子路由 | 新增 `/contracts/:id`，承接位命名为 `src/minix/routes/contracts/ContractDetailRoute.tsx` | 需要新增 `/contracts/:id` 页面壳 | P1 | 是 |
| `/contracts/[id]/edit` | 正式业务 | 新宿主无对应子路由 | 新增 `/contracts/:id/edit`，承接位命名为 `src/minix/routes/contracts/ContractEditRoute.tsx` | 需要新增 `/contracts/:id/edit` 页面壳 | P1 | 是 |
| `/contracts/[id]/renew` | 正式业务 | 新宿主无对应子路由 | 新增 `/contracts/:id/renew`，承接位命名为 `src/minix/routes/contracts/ContractRenewRoute.tsx` | 需要新增 `/contracts/:id/renew` 页面壳 | P1 | 是 |
| `/contracts/[id]/checkout` | 正式业务 | 新宿主无对应子路由 | 新增 `/contracts/:id/checkout`，承接位命名为 `src/minix/routes/contracts/ContractCheckoutRoute.tsx` | 需要新增 `/contracts/:id/checkout` 页面壳 | P1 | 是 |
| `/bills/create` | 正式业务 | 新宿主无对应子路由 | 新增 `/bills/create`，承接位命名为 `src/minix/routes/bills/BillCreateRoute.tsx` | 需要新增 `/bills/create` 页面壳 | P1 | 是 |
| `/bills/[id]` | 正式业务 | 新宿主无对应子路由 | 新增 `/bills/:id`，承接位命名为 `src/minix/routes/bills/BillDetailRoute.tsx` | 需要新增 `/bills/:id` 页面壳 | P1 | 是 |
| `/bills/[id]/edit` | 正式业务 | 新宿主无对应子路由 | 新增 `/bills/:id/edit`，承接位命名为 `src/minix/routes/bills/BillEditRoute.tsx` | 需要新增 `/bills/:id/edit` 页面壳 | P1 | 是 |
| `/renters` | 正式业务 | 新宿主尚无正式路由 | 新增 `/renters`，承接位命名为 `src/minix/routes/renters/RenterListRoute.tsx` | 需要新增 `/renters` 顶级正式路由 | P1 | 是 |
| `/renters/new` | 正式业务 | 新宿主尚无正式路由 | 新增 `/renters/new`，承接位命名为 `src/minix/routes/renters/RenterCreateRoute.tsx` | 需要新增 `/renters/new` 页面壳 | P1 | 是 |
| `/renters/[id]` | 正式业务 | 新宿主尚无正式路由 | 新增 `/renters/:id`，承接位命名为 `src/minix/routes/renters/RenterDetailRoute.tsx` | 需要新增 `/renters/:id` 页面壳 | P1 | 是 |
| `/renters/[id]/edit` | 正式业务 | 新宿主尚无正式路由 | 新增 `/renters/:id/edit`，承接位命名为 `src/minix/routes/renters/RenterEditRoute.tsx` | 需要新增 `/renters/:id/edit` 页面壳 | P1 | 是 |
| `/meter-readings/batch` | 正式业务 | 新宿主尚无正式路由 | 新增 `/meter-readings/batch`，承接位命名为 `src/minix/routes/meter-readings/MeterReadingBatchRoute.tsx` | 需要新增 `/meter-readings/batch` 页面壳 | P1 | 是 |
| `/meter-readings/history` | 正式业务 | 新宿主尚无正式路由 | 新增 `/meter-readings/history`，承接位命名为 `src/minix/routes/meter-readings/MeterReadingHistoryRoute.tsx` | 需要新增 `/meter-readings/history` 页面壳 | P1 | 是 |
| `/bills/stats` | 正式业务 | 新宿主尚无正式路由 | 新增 `/bills/stats`，承接位命名为 `src/minix/routes/bills/BillStatsRoute.tsx` | 保留为正式业务统计页，迁移顺序晚于核心 CRUD 页 | P2 | 是 |
| `/profile` | 状态/支持 | 新宿主尚无正式路由 | 新增 `/profile`，承接位命名为 `src/minix/routes/support/ProfileRoute.tsx` | 作为支持页延后，待核心业务页 parity 后再承接 | P2 | 否 |
| `/notifications` | 状态/支持 | 新宿主尚无正式路由 | 新增 `/notifications`，承接位命名为 `src/minix/routes/support/NotificationsRoute.tsx` | 作为支持页延后，待核心业务页 parity 后再承接 | P2 | 否 |
| `/system-health` | 运维治理 | 仅在 `route-manifest` 的 governance 说明中出现，router 未挂载 | 延后新增 `/system-health`，承接位预留为 `src/minix/routes/governance/SystemHealthRoute.tsx` | 不进入 `phase12` 首批页面 parity，实现承接延后至治理相关阶段 | P3 | 否 |
| `/data-consistency` | 运维治理 | 仅在 `route-manifest` 的 governance 说明中出现，router 未挂载 | 延后新增 `/data-consistency`，承接位预留为 `src/minix/routes/governance/DataConsistencyRoute.tsx` | 不进入 `phase12` 首批页面 parity，实现承接延后至治理相关阶段 | P3 | 否 |
| `/performance-test` | dev-only | 新宿主无路由 | 不新增正式路由，若保留仅允许 dev-only 承接位 `src/minix/routes/dev/PerformanceTestRoute.tsx` | 继续归类为 dev-only，不进入正式 parity 范围 | P4 | 否 |
| `/performance-benchmark` | dev-only | 新宿主无路由 | 不新增正式路由，若保留仅允许 dev-only 承接位 `src/minix/routes/dev/PerformanceBenchmarkRoute.tsx` | 继续归类为 dev-only，不进入正式 parity 范围 | P4 | 否 |
| `/performance-analysis` | dev-only | 新宿主无路由 | 不新增正式路由，若保留仅允许 dev-only 承接位 `src/minix/routes/dev/PerformanceAnalysisRoute.tsx` | 继续归类为 dev-only，不进入正式 parity 范围 | P4 | 否 |
| `/layout-demo` | dev-only | 新宿主无路由 | 不新增正式路由，若保留仅允许 dev-only 承接位 `src/minix/routes/dev/LayoutDemoRoute.tsx` | 继续归类为 dev-only，不进入正式 parity 范围 | P4 | 否 |
| `/components` | dev-only | 新宿主无路由 | 不新增正式路由，若保留仅允许 dev-only 承接位 `src/minix/routes/dev/ComponentsRoute.tsx` | 继续归类为 dev-only，不进入正式 parity 范围 | P4 | 否 |
| `/business-flow-validation` | dev-only | 新宿主无路由 | 不新增正式路由，若保留仅允许 dev-only 承接位 `src/minix/routes/dev/BusinessFlowValidationRoute.tsx` | 继续归类为 dev-only，不进入正式 parity 范围 | P4 | 否 |

#### 2.2.3.1 缺失承接位命名规则
- 本轮只冻结命名与路由落点，不创建任何新页面文件，也不修改 `src/minix/router/index.tsx`。
- 目标新路由默认保持旧页面 URL 语义稳定；仅在 `React Router` 动态段语法上把 Next 风格的 `[id]` 统一转换为 `:id`。
- 缺失承接位文件命名统一遵循 `src/minix/routes/<domain>/<PascalCase>Route.tsx`：
  - 列表页使用 `*ListRoute.tsx`
  - 详情页使用 `*DetailRoute.tsx`
  - 编辑页使用 `*EditRoute.tsx`
  - 新增/新建页使用 `*CreateRoute.tsx`
  - 聚合入口页使用 `*HubRoute.tsx`
  - 流程动作页使用 `*<Action>Route.tsx`
- 支持页承接位统一落到 `src/minix/routes/support/*Route.tsx`，治理页统一落到 `src/minix/routes/governance/*Route.tsx`，dev-only 入口若未来仍需保留，只允许落到 `src/minix/routes/dev/*Route.tsx`。
- 已存在的首页、登录页、离线页与 placeholder 顶级路由保持原路径不变；后续实现只允许“替换承接组件”，不允许重新发明另一套路由别名。

#### 2.2.3.2 P0 / P1 / P2 优先级说明
- `P0`：已在新宿主真实挂载，且属于首页、状态入口或主导航一级入口；这些页面决定 `src/minix` 能否先稳定承接工作台、核心列表与设置壳层，也是 `phase13` 开始切 rooms / contracts / bills / settings / dashboard retained-legacy 路由顺序的最小前提。
- `P1`：尚未在新宿主挂载，但属于核心主链的详情、编辑、新建或流程动作页；这些页面必须在 `P0` 路由骨架稳定后补齐，否则 `phase13` 无法对合同、账单、房源、租客、抄表等 retained-legacy 路由进行实质性清退。
- `P2`：统计页与支持页，依赖核心 CRUD 页面已经完成基本 parity；它们需要进入后续路线图，但不应反向阻塞 `phase12` 首批页面壳冻结。
- `P3` 与 `P4` 继续分别表示治理页延后承接、dev-only / 待归档候选不进入正式 parity 范围；它们保留在表中只是为了防止后续阶段重新扩写范围。

### 2.2.4 当前 `phase12` 的首批 parity 范围
结合上表，`phase12` 当前轮默认首批页面 parity 范围应冻结为：

- P0：
  - `/`
  - `/login`
  - `/offline`
  - `/rooms`
  - `/add`
  - `/contracts`
  - `/bills`
  - `/settings`
- P1：
  - `/rooms/[id]`
  - `/rooms/[id]/edit`
  - `/add/room`
  - `/add/contract`
  - `/contracts/new`
  - `/contracts/[id]`
  - `/contracts/[id]/edit`
  - `/contracts/[id]/renew`
  - `/contracts/[id]/checkout`
  - `/bills/create`
  - `/bills/[id]`
  - `/bills/[id]/edit`
  - `/renters`
  - `/renters/new`
  - `/renters/[id]`
  - `/renters/[id]/edit`
  - `/meter-readings/batch`
  - `/meter-readings/history`
- P2 及以后：
  - `/bills/stats`
  - `/profile`
  - `/notifications`
  - 运维治理页
  - dev-only / 待归档候选

### 2.3 为什么现在进入 `phase12`
当前最合理的下一阶段是：

```text
phase12-frontend-parity-and-shell-cutover
```

原因如下：

- `phase07 ~ phase11` 已把运行时、API 宿主、共享领域服务、数据访问主线、正式部署主线与回滚基线冻结完毕，当前最大缺口已转为“前端正式页面尚未迁入纯新宿主”。
- 若继续把默认工作流停留在 `phase11`，会把“部署切线审核”与“纯新主线 parity”混写成一件事，导致后续职责边界失真。
- 若直接把后续全部问题塞进一个大而全的 `phase12-full-minix-parity-and-legacy-exit`，会再次把页面迁移、API 切流、PWA 迁移、自动化验收与 legacy 退出绑定成高复杂度大爆炸任务。
- 当前最需要补齐的是：
  - 页面映射表
  - 页面装配复用策略
  - UI 保真边界
  - `phase12 ~ phase15` 完整路线图
  而不是马上进入实现。

### 2.4 外部资料校验
按当前阶段要求，已通过 Context7 核验与本阶段直接相关的官方资料，得到以下结论：

- React Router 官方继续支持使用 `createBrowserRouter` 与 `RouterProvider` 组织 data router，并以 loader 形式把数据加载边界挂在路由树上；这与 `src/minix` 继续作为正式前端路由承接位的方向一致。
- React Router 官方继续支持按 route module 懒加载组件与 loader；这意味着后续页面 parity 可以优先迁移页面壳与装配边界，而不需要一次性把所有页面逻辑重写成单体。
- `vite-plugin-pwa` 官方继续支持在 `vite.config.ts` 中以插件方式冻结 manifest、service worker、更新策略与离线提示；这与后续 `phase14` 把 PWA 能力迁入纯新主线的方向一致。
- `vite-plugin-pwa` 官方继续提供自动更新与更新提示模式；这意味着后续 `phase14` 可以在“最小受控 PWA”前提下复用当前安装/更新价值，而不必继续绑定旧 Next 宿主。

## 三、关键决策
### 3.1 当前正式数据访问主线继续固定为 `Prisma + PostgreSQL`
选择原因：

- `phase10` 已明确把 `Prisma + PostgreSQL` 冻结为当前长期数据访问主线。
- 当前剩余主要缺口位于前端页面 parity、旧 API 宿主切流、PWA 迁移与 legacy 退出，而不是 ORM 本身。
- 若在当前阶段重新打开 Prisma 替换议题，会把“纯新主线完整替代旧技术栈”与“数据访问层重写”重新耦合，显著放大风险。

本阶段结论：

- `Prisma + PostgreSQL` 继续固定为当前正式数据访问主线
- 后续阶段默认只移除旧 `Next.js` / legacy API / legacy PWA / `Docker-heavy` 运行依赖
- Prisma 替换只保留为条件成熟时的独立议题，不进入当前路线图

### 3.2 旧 `Rento` 页面 UI 继续作为默认原型参考
选择原因：

- 当前 `Rento` 前端 UI 展示效果已符合预期，根级真相源已明确要求默认承接。
- 当前纯新主线的最大任务是宿主迁移与页面装配迁移，不是产品设计翻修。
- 若在 parity 阶段同时重做 UI，会让验收目标从“是否对齐旧实现”漂移成“是否接受新设计”，直接破坏 parity 定义。

本阶段结论：

- 页面信息结构、导航节奏、表单交互、组件表达与整体视觉风格默认继续沿用旧 `Rento`
- 允许的 UI 调整仅限最小技术适配、移动端可用性修复、明显 bug 修复与必要信息架构修正
- 不允许借页面迁移之名重新设计整套 UI

### 3.3 `phase12` 只负责前端页面 parity 与路线图冻结，不直接吞掉后续全部问题
选择原因：

- 页面 parity、API parity、PWA parity、最终 cutover/legacy exit 在风险性质、验收方式与回滚边界上明显不同。
- 若只设置一个大而全的 `phase12`，阶段内部会再次出现“边做边定义边界”的问题。
- 当前项目不是从零开始的新项目，而是目标明确的原地重构；更合理的做法是一次性规划完整路线图，再按阶段顺序逐段执行。

本阶段结论：

- `phase12` 负责：
  - 页面映射与页面装配复用策略
  - UI 保真边界
  - 旧页面到 `src/minix` 的承接原则
  - `phase12 ~ phase15` 完整路线图冻结
- `phase13` 负责 retained-legacy API / query drain
- `phase14` 负责纯新主线 PWA parity
- `phase15` 负责自动化 / 人工 parity 验收、cutover 审核与 legacy 退出

### 3.3.1 为什么当前文档还必须继续补“事实表”
选择原因：

- `plan.md` 对 `phase12` 的验收条件不是“方向正确”而是“能清楚说明哪些页面仍在旧宿主、哪些先迁、哪些继续延后”。
- 因此 `phase12` 阶段文档若只有原则，没有真实页面清单与映射表，就仍不是决策完成版。

本阶段结论：

- `phase12` 当前轮审核通过的最低前提，不只是存在三份文档
- 还必须把：
  - 真实页面清单
  - 页面分类
  - 一一映射
  - 首批 parity 范围
  冻结为可直接引用的事实表

### 3.4 纯新主线 parity 必须先从页面壳和页面装配边界开始，而不是先做大规模业务重写
选择原因：

- 当前共享领域服务、正式 API 宿主与数据访问主线已经存在；前端缺口更多在“哪个页面壳挂在哪个宿主、如何复用现有组件与数据加载边界”。
- 现有 `src/components/pages/*`、`src/components/business/*`、`src/components/layout/*` 已承载大量页面表达与交互模式，具备被新宿主直接复用的价值。
- 若先重写页面业务逻辑，再反向找旧页面对照，实施和验收成本都会显著上升。

本阶段结论：

- 优先迁移页面壳、布局壳、导航壳、路由落点与页面装配边界
- 优先复用旧组件与旧页面表达
- 后续页面 parity 默认先对齐旧页面，再考虑更进一步的增量优化

### 3.5 PWA parity 必须单独成阶段，不应顺带塞入页面迁移
选择原因：

- 当前 PWA 仍依赖旧 Next 宿主，迁移到纯新主线涉及 manifest、service worker、更新提示、最小离线页与缓存边界，不是页面壳迁移的附带工作。
- PWA 迁移需要单独冻结“哪些资源允许缓存、哪些动态鉴权路径禁止缓存”的安全边界。
- 把 PWA 顺带塞进 `phase12` 会让页面 parity 验收与运行时缓存边界混在一起。

本阶段结论：

- `phase14` 单独承接 PWA parity
- `phase12` 只负责为 `phase14` 提供页面壳、路由壳与 UI 保真前提
- `phase14` 默认继续保持最小受控 PWA 策略，不引入第二套前端宿主或第二套缓存真相源

## 四、承接资产与实现边界
### 4.1 允许直接承接的资产
- `src/app/*`
- `src/minix/*`
- `src/components/pages/*`
- `src/components/business/*`
- `src/components/layout/*`
- `src/components/ui/*`
- `src/lib/domain/*`
- `src/lib/prisma.ts`
- `src/lib/queries.ts`
- `src/lib/dashboard-queries.ts`
- `server/*`
- `server/lib/legacy-route-inventory.ts`
- `public/*`
- `vite.config.ts`
- `README.md`
- `AGENTS.md`
- `project_rules.md`
- `architecture_map.md`
- `plan.md`

### 4.1.1 页面壳 / 页面装配层 / 数据加载边界 / 导航壳 / 布局壳复用矩阵
| 层次 | 旧宿主主要落点 | 新宿主正式落点 | 当前冻结复用策略 | 必须拆出的旧宿主绑定 | 当前不进入本轮实现的边界 |
| --- | --- | --- | --- | --- | --- |
| 页面壳 | `src/app/**/page.tsx`、`src/components/pages/*` | `src/minix/routes/<domain>/*Route.tsx` + 复用后的 `src/components/pages/*` | 页面 URL、信息结构、标题区块、主操作区与状态反馈默认沿用旧页；`src/minix/routes/*` 只负责接住页面壳，不重写页面主体组件 | `params/searchParams` 解析、`generateMetadata`、`notFound()`、`dynamic = 'force-dynamic'`、`Suspense` 包装，以及 `next/*` 路由协议带来的跳转、刷新与链接语义 | 不在本轮创建任何新 route 文件，不提前改写页面主体实现 |
| 页面装配层 | 旧 `src/app/**/page.tsx` 中“查询 + 数据整形 + 组件拼装”组合逻辑 | `src/minix/routes/*Route.tsx` | 旧页面中的装配逻辑要先从 Next 页面入口里拆成“路由承接 + 页面主体”两层；后续 route module 只承接参数、装配顺序和错误/加载边界 | 直接调用 `roomQueries` / `contractQueries` / `globalSettings` 的 server page 入口、Decimal 转换、search query 归一化、Next 页面级错误跳转 | 不在 `phase12-03` 里切 API、不重做 query 层、不把装配逻辑继续散落回 `src/app/*` |
| 数据加载边界 | 旧 `src/app/**/page.tsx`、`generateMetadata()`、页面内 server query | `src/minix/router/*` 与后续 `src/minix/routes/*Route.tsx` 的 route-level loader / pending / error 边界 | 统一冻结为“数据边界属于 route module，不属于布局壳、导航壳或纯展示组件”；页面主体优先接收已解析的 props/loaderData，而不是自行承担宿主取数协议 | Next server component 取数、`notFound()`、页面级 metadata 生成、依赖 `searchParams` 的初始筛选注入 | 本轮只冻结边界，不决定最终是直挂 loader 还是经 `phase13` API parity 后再切正式请求路径 |
| 导航壳 | `src/components/layout/UnifiedNavigation.tsx`、`src/lib/navigation-config.ts`、`src/lib/route-config.ts` | `src/minix/layout/UnifiedNavigation.tsx`、`src/minix/routes/route-manifest.tsx` | 继续复用导航顺序、图标语义、搜索入口语义与主导航信息架构；新宿主只承接激活态、跳转协议和最小桌面/移动导航骨架 | `next/link`、`usePathname()`、`useRouter()`、`NotificationEntryButton`、`UserProfileSheet`、旧提醒/用户抽屉联动 | 不在本轮扩写通知中心、个人资料抽屉和治理入口暴露方式；支持页保持 P2 / 延后承接 |
| 布局壳 | `src/app/layout.tsx`、`src/components/layout/AppLayout.tsx`、`src/components/layout/PageContainer.tsx` | `src/minix/layout/MinixShellLayout.tsx` + 后续 route-level page container 适配 | 继续复用键盘 inset、桌面/移动双导航切换、主内容容器宽度与 sticky 页面头部表达；布局壳只承接宿主级骨架，不吞页面数据与业务动作 | `Metadata` / `Viewport`、`next/font`、`html/body`、`AlertManagerProvider`、PWA runtime / install prompt、`PageContainer` 内的 `router.back()` | PWA 运行时与安装提示延后到 `phase14`；provider 收口按页面 parity 真正需要再逐步迁入，不在本轮扩写 |

### 4.1.2 目录级策略表
| 目录 / 组 | 当前职责 | `phase12-03` 冻结策略 | 原因与边界 |
| --- | --- | --- | --- |
| `src/components/ui/*` | 基础 UI 原子组件 | 直接复用 | 不承载 Next 宿主协议，可继续作为新旧宿主共享底层组件 |
| `src/components/business/*` | 领域片段、卡片、表单块、统计块 | 仅不含 `next/*` 路由协议的文件可直接复用；凡直接依赖 `next/link`、`next/navigation` 等协议的文件都必须先拆宿主绑定。至少 [FunctionGrid.tsx](file:///home/dell/Projects/Rento/src/components/business/FunctionGrid.tsx) 当前使用 `next/link`，需先拆出链接承接层后再复用 | 保留业务表达与交互语义，不把导航协议、路由跳转继续埋在业务片段内，也不把含 `next/link` 的业务片段误判为可直接复用 |
| `src/components/pages/*` | 旧页面主体表达与交互拼装 | 拆出宿主绑定后复用，不整目录直搬为新路由文件 | 多数页面可作为页面主体参考，但当前已有一批文件直接依赖 `next/*` 路由协议，必须先拆宿主动作 |
| `src/components/layout/*` | 旧布局壳、页面容器、PWA 运行时与辅助布局 | 分层处理：`DetailPageTemplate` / `DesktopLayout` / `MobileLayout` 当前仍经由 `PageContainer` / `UnifiedNavigation` 转依赖 Next 宿主协议，必须先拆宿主绑定后再复用或仅作参考；`AppLayout` / `UnifiedNavigation` / `PageContainer` 需拆宿主绑定；`PwaRuntimeManager` / `PwaInstallPrompt` 延后 | 该目录同时混有纯布局表达、Next 宿主绑定与 PWA runtime，不允许整目录一刀切；凡是经由 `PageContainer` / `UnifiedNavigation` 带入 `next/navigation`、`next/link`、`router.back()` 的布局组件，都不能被误判为“可优先直接复用” |
| `src/minix/router/*` | 新宿主路由树、守卫、未来 data boundary | 作为正式宿主唯一路由绑定层保留 | 后续 loader、guard、error boundary 都应优先收口在这里，而不是回写旧 `src/app` |
| `src/minix/layout/*` | 新宿主布局壳与导航壳 | 直接作为正式宿主承接位扩展 | 该目录已经承接最小壳层，后续只补 route-level composition，不重造第二套布局体系 |
| `src/minix/routes/*` | 当前首页 / 状态页 / placeholder 壳层 | 作为正式页面装配层目录扩展 | 后续新增 `*Route.tsx` 只负责页面壳、装配顺序和数据边界，不承载共享业务组件库职责 |
| `src/app/**` | 旧 Next 页面宿主、页面级取数和 metadata 绑定 | 仅保留参考基线与拆壳来源，不再作为新增正式宿主落点 | `phase12` 之后不能再把新页面壳、新装配逻辑默认写回旧宿主 |
| `src/app/api/*` | retained-legacy / compat API 宿主 | 延后到 `phase13`，本轮只作为依赖关系参考 | `phase12-03` 只冻结页面壳与复用策略，不切 API |
| `src/lib/navigation-config.ts`、`src/lib/route-config.ts`、`src/lib/page-governance.ts` | 导航元数据、页面标题描述、治理分类 | 继续作为共享配置输入复用 | 导航顺序、治理页分类和路由说明应保持单一真相源，不在 `src/minix` 复制一份新配置 |

### 4.1.3 旧 `src/app` 中必须拆出的 Next 宿主绑定逻辑
- 根布局绑定：
  - `src/app/layout.tsx` 中的 `Metadata`、`Viewport`、`next/font`、`html/body` 包裹、manifest / icons、`AlertManagerProvider`、`PwaRuntimeManager`、`PwaInstallPrompt`
- 页面入口绑定：
  - 各 `src/app/**/page.tsx` 中基于 `params` / `searchParams` 的 URL 解析、`generateMetadata()`、`dynamic = 'force-dynamic'`、`notFound()`、`Suspense` 骨架包裹与页面级 server query 入口
- 数据整形绑定：
  - 各 page 文件中面向宿主传递的 Decimal -> number 转换、初始搜索条件归一化、页面首屏 fallback 组装；这些逻辑后续要么进入 route loader，要么进入专门的 adapter，而不是继续绑定在 Next 页面文件里
- 导航协议绑定：
  - `next/link`、`next/navigation` 的 `push` / `replace` / `refresh` / `back`、`usePathname()`、`useSearchParams()`；后续统一改由 `React Router` 路由层或宿主适配函数承接
- 支持与治理暴露绑定：
  - `/system-health`、`/data-consistency` 从设置页跳出的治理入口，`/profile`、`/notifications` 的支持类入口，以及通知/用户抽屉联动，不在本轮混入核心业务页 parity

### 4.1.4 当前可直接复用、需拆宿主绑定、延后治理的单一口径
- 可直接复用：
  - `src/components/ui/*`
  - `src/lib/navigation-config.ts`
  - `src/lib/route-config.ts`
  - `src/lib/page-governance.ts`
  - `src/minix/layout/*`
  - `src/minix/router/*`
- 拆出宿主绑定后复用：
  - `src/components/pages/*`
  - `src/components/layout/AppLayout.tsx`
  - `src/components/layout/DetailPageTemplate.tsx`
  - `src/components/layout/DesktopLayout.tsx`
  - `src/components/layout/MobileLayout.tsx`
  - `src/components/layout/UnifiedNavigation.tsx`
  - `src/components/layout/PageContainer.tsx`
  - `src/components/business/*` 中直接使用 `next/*` 路由协议的文件，包括 [FunctionGrid.tsx](file:///home/dell/Projects/Rento/src/components/business/FunctionGrid.tsx) 使用 `next/link` 的情况
- 延后到后续阶段：
  - `src/app/system-health/*`、`src/app/data-consistency/*` 及对应治理组件，延后到治理相关承接阶段
  - `src/app/profile/*`、`src/app/notifications/*`、`NotificationEntryButton`、`UserProfileSheet`，延后到支持页 P2 parity
  - `src/components/layout/PwaRuntimeManager.tsx`、`src/components/layout/PwaInstallPrompt.tsx` 与其运行时策略，延后到 `phase14`
  - `src/app/performance-*`、`src/app/layout-demo/*`、`src/app/components/*`、`src/app/business-flow-validation/*`，继续保持 dev-only / 待归档候选

### 4.2 允许做的事
- 冻结旧页面到 `src/minix` 的映射表
- 冻结页面壳、布局壳、导航壳与页面装配复用策略
- 冻结 UI 保真边界与允许的最小技术适配
- 冻结 `phase12 ~ phase15` 的完整阶段职责、顺序与上游输入关系
- 明确 `Prisma + PostgreSQL` 的继续保留口径

### 4.3 不允许做的事
- 不在 `phase12` 中直接重开 Prisma 替换议题
- 不把页面迁移扩写成整套 UI 重设计
- 不把 retained-legacy API 清零与 PWA 迁移全部塞入同一个实现阶段
- 不以“旧页面还在”作为跳过 parity 验收的理由

## 五、与后续阶段的关系
### 5.1 `phase13` 直接继承内容
- 旧页面与新页面之间的页面-API 映射
- 页面 parity 对 retained-legacy 路由的切流优先级判断
- `Prisma + PostgreSQL` 继续保留的前提

### 5.1.1 页面 parity 与 retained-legacy API 的联动基线
当前页面 parity 与旧 API 退出优先级至少存在以下直接联动：

| 页面模块 | 直接牵动的旧 API 族 | 当前事实 |
| --- | --- | --- |
| 房源 | `/api/rooms*` | 旧页面与旧 API 仍是主路径，页面 parity 会直接影响 rooms retained-legacy 退出顺序 |
| 合同 | `/api/contracts*` | 合同列表、详情、编辑、续租、退租页面 parity 会直接影响 contracts retained-legacy 清理 |
| 账单 | `/api/bills*` | 账单列表、详情、编辑、统计页面 parity 会直接影响 bills retained-legacy 清理 |
| 租客 | `/api/renters*` | 租客列表、详情、编辑页面 parity 会直接影响 renters retained-legacy 清理 |
| 抄表 | `/api/meter-readings*` | 批量抄表与历史页 parity 会直接影响 meter-readings retained-legacy 清理 |
| 设置 / 工作台 | `/api/settings*`、`/api/dashboard/*` | 设置页、工作台与统计页 parity 会影响 settings / dashboard retained-legacy 清理 |

### 5.2 `phase14` 直接继承内容
- 新宿主正式路由壳与页面壳
- 旧 PWA 页面入口到新宿主入口的承接关系
- 不重做 UI 的共享约束

### 5.3 `phase15` 直接继承内容
- 页面 parity 矩阵
- UI 保真验收标准
- 旧页面与新页面之间的人工浏览器验收对照基线

## 六、当前阶段最低验证要求
- 若本轮仅涉及 `phase12` 文档，至少完成：
  - `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md`
  三份文档互链复核
- 复核被引用代码、脚本、文档路径真实存在
- 复核根级真相源、`README.md` 与本阶段文档对“Prisma 保留、UI 承接、完整路线图一次性规划”的表述一致

## 七、阶段结论
`phase12-frontend-parity-and-shell-cutover` 的价值不在于“立刻迁完所有页面”，而在于：

```text
先把页面 parity、UI 保真、Prisma 保留与 phase12 ~ phase15 完整路线图冻结成单一答案，
再让后续 /spec 和实现建立在稳定的迁移蓝图之上。
```

这能确保：

- 不让 `phase11` 的部署收口职责继续与 parity 迁移职责混写
- 不让“纯新主线完整替代旧技术栈”再次退回走一步看一步
- 不让页面迁移顺带演变为 UI 重设计
- 不让 Prisma 替换重新闯入当前默认路线图
