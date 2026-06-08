# Tasks
- [x] Task 1: 盘点 `phase13-04` 范围内租客与抄表页面的新旧宿主输入、高保真参考源与延后边界。
  - [x] SubTask 1.1: 复核 `src/app/renters/**/page.tsx`、`src/app/meter-readings/**/page.tsx` 中页面级 `notFound()`、`next/navigation`、页面级数据整形与旧宿主跳转协议现状。
  - [x] SubTask 1.2: 复核 `src/components/pages/Renter*.tsx`、`BatchMeterReadingPage.tsx`、`MeterReadingHistoryPage.tsx` 与相关 `src/components/business/*` 的可复用部分，明确哪些内容可直接承接，哪些内容必须先拆除 `next/*` 宿主协议。
  - [x] SubTask 1.3: 明确 `phase13` 当前 legacy document fallback 中哪些路径属于本轮收回范围，哪些路径仍应留到后续子任务。
  - [x] Completion Note: 已确认旧宿主输入边界为“租客 4 页由 `src/app/renters/**/page.tsx` 承担 metadata、`notFound()`、页面级数据整形与 `next/navigation`；抄表 2 页旧宿主主要保留 metadata 壳，实际首屏加载、筛选、提交和恢复协议在页面组件内部”。
  - [x] Completion Note: 已确认 `RenterForm`、`RenterGrid`、`RenterBasicInfo`、`RenterContractHistory` 以及抄表批量/历史页的既有 UI 结构与业务语义可高保真复用；`RenterActions`、各页面组件中的 `next/navigation`、`window.location`、页面内 `fetch` 与 `alert/confirm` 需先拆为可注入导航与 route-level loader/action 边界。
  - [x] Completion Note: 已确认 fallback 收回范围仅限 6 个正式页面入口；`/bills/stats`、`/system-health`、`/data-consistency` 继续保留 document fallback。页面 fallback 收回不等于 API compat 移除：`/api/renters` 除 GET 列表外仍旧宿主承接，`/api/meter-readings` 的历史列表/状态检查/修复也仍属 compat/后续范围。

- [x] Task 2: 为租客列表/新建/详情/编辑页建立真实 route module 与页面级数据边界。
  - [x] SubTask 2.1: 为 `/renters`、`/renters/new`、`/renters/:id`、`/renters/:id/edit` 建立新宿主 route module、loader、pending、error、not-found 与提交后回跳策略。
  - [x] SubTask 2.2: 高保真复用旧租客列表、详情与表单表达，不新增第二套 UI 结构、视觉语言或迁移说明模块。
  - [x] SubTask 2.3: 确保租客详情与编辑/新建页的跳转、删除、合同联动与错误恢复路径继续符合旧原型和当前业务语义。
  - [x] Completion Note: 已新增 `RenterListRoute`、`RenterCreateRoute`、`RenterDetailRoute`、`RenterEditRoute`，并在 `src/minix/router/index.tsx` 中注册 `/renters`、`/renters/new`、`/renters/:id`、`/renters/:id/edit` 正式路由。
  - [x] Completion Note: 已在 `src/minix/lib/primary-route-data.ts` 中补齐 renters 的 route data 类型、列表统计、详情加载与编辑回填数据入口，使 loader / pending / error / not-found 进入 route module。
  - [x] Completion Note: 已把 `RenterListPage`、`RenterDetailPage`、`RenterCreatePage`、`RenterEditPage` 的 `next/navigation` 依赖拆为可注入宿主导航协议，保持旧 `Rento` 页面结构与表单/详情表达不变。

- [x] Task 3: 为批量抄表与抄表历史页建立真实 route module 与流程承接。
  - [x] SubTask 3.1: 为 `/meter-readings/batch`、`/meter-readings/history` 建立新宿主 route module、pending、error、empty、提交后回跳与恢复策略。
  - [x] SubTask 3.2: 拆离旧页面中的 `next/navigation`、旧宿主提交回跳与页面级协议，保持批量抄表与历史页表达结构高保真复用。
  - [x] SubTask 3.3: 确保多仪表、结构化 `recordType`、历史保留、自动出账提示与状态检查/修复语义未因页面迁移被放宽或改写。
  - [x] Completion Note: 已新增 `MeterReadingBatchRoute`、`MeterReadingHistoryRoute` 与共享 `MeterReadingRouteState`，并在 `src/minix/router/index.tsx` 中注册 `/meter-readings/batch`、`/meter-readings/history` 正式路由。
  - [x] Completion Note: 已把 `BatchMeterReadingPage` 的宿主跳转拆为可注入导航协议，提交成功后的“跳转抄表历史”不再依赖 `next/navigation`，页面主体继续高保真复用旧实现。
  - [x] Completion Note: 已保留批量抄表与历史页内部的多仪表、聚合/独立账单、结构化 `recordType`、状态检查/修复与历史保留表达，不在本子任务中改写为新的流程或视觉结构。

- [x] Task 4: 收口租客与抄表页面的宿主绑定拆分与新旧导航桥接。
  - [x] SubTask 4.1: 让租客与抄表目标页面主体改用可注入的宿主导航协议，而不是继续直接绑定 `next/navigation`。
  - [x] SubTask 4.2: 为仍需保留的桥接、兼容跳转或回退逻辑写明存在原因、适用范围与退出条件，避免兼容逻辑重新成为第二真相源。
  - [x] SubTask 4.3: 确认本子任务未越界到 retained-legacy API/query、PWA runtime、支持页、治理页、`/bills/stats` 或 cutover 逻辑。
  - [x] Completion Note: 已把 renters 与 batch meter reading 目标页改用 `HostNavigationAdapter` / route-level `navigateToMinixOrDocument()` 注入导航协议，不再继续直接绑定 `next/navigation`。
  - [x] Completion Note: 已在 route-level 桥接与注释中明确：本轮收口的是页面入口与宿主导航，不等于提前清退 `/api/renters*` 或 `/api/meter-readings*` 的 retained-legacy/compat 边界。

- [x] Task 5: 收缩 `phase13` 中 `/renters/**` 与 `/meter-readings/**` 的 fallback 边界，并保持延后范围不被误纳入。
  - [x] SubTask 5.1: 将本轮已完成迁移的 `/renters/**` 与 `/meter-readings/**` 从 legacy document fallback 中移出，避免新旧宿主双入口并存。
  - [x] SubTask 5.2: 复核首页快捷入口、详情联动入口与其他导航触点，确保租客与抄表页默认进入新宿主真实页面。
  - [x] SubTask 5.3: 确认 `/bills/stats`、支持页、治理页与 dev-only 页面继续保留既有延期边界，未被重新混入正式范围。
  - [x] Completion Note: `src/minix/lib/route-navigation.ts` 已将 `/renters/**` 与 `/meter-readings/**` 纳入 Minix 正式路由判定，并从 legacy document fallback 白名单中移出。
  - [x] Completion Note: 首页快捷入口、合同详情和账单详情中的租客/抄表相关导航现在默认命中新宿主真实页面；仍保留 fallback 的仅剩 `/bills/stats`、`/system-health`、`/data-consistency` 等延后页面。

- [x] Task 6: 以旧 `Rento` 为直接原型完成高保真验收与工程验证。
  - [x] SubTask 6.1: 对照旧页面源码逐项复核租客列表/详情/表单与抄表批量/历史页的信息结构、组件表达、导航节奏、表单交互与状态反馈。
  - [x] SubTask 6.2: 清理迁移说明文案、宿主标签、额外辅助卡片、开发态占位元素与其他显著 UI 漂移项，确保页面展示效果 100% 高保真还原。
  - [x] SubTask 6.3: 完成最小工程验证，至少执行 `npm run lint`、`npm run type-check`，并在条件允许时执行 `npm run build:minix` 与最小浏览器验收。
  - [x] Completion Note: 已完成 `npm run lint`、`npm run type-check`、`npm run build:minix`，并在本地 `dev:minix` 拓扑中复验 `/renters`、`/renters/:id`、`/renters/:id/edit`、`/meter-readings/history`、`/meter-readings/batch` 与默认跳转链路。
  - [x] Completion Note: 已修复 `RouteStateBoundary` 对原生 `Response` 形式 404 的识别缺口，并额外恢复抄表 history 在未显式传入 `page/limit` 时的默认完整列表可达性，避免页面在无分页 UI 的情况下被入口默认截断。

- [x] Task 7: 指定独立子代理执行 `phase13-04` 终审，并仅在通过后才能提交推送。
  - [x] SubTask 7.1: 由独立子代理复核范围未越界到 `phase13-05 ~ phase16` 与任何支持页/治理页/dev-only 页面。
  - [x] SubTask 7.2: 由独立子代理复核租客与抄表页面是否保持旧 `Rento` 原型、历史保留约束与 UI 保真边界。
  - [x] SubTask 7.3: 仅在独立子代理明确给出“通过”结论后，才允许标记完成、提交并推送远程仓库。
  - [x] Completion Note: 独立子代理先指出 `MeterReadingHistoryPage` 反向依赖 `src/minix/lib/primary-route-data.ts` 与默认分页可达性回退问题；当前已通过新增宿主无关的 `src/lib/meter-reading-history.ts` 和显式分页门禁修复完成收口。
  - [x] Completion Note: 在忽略并行 `bills/settings/dashboard` 工作树改动的 scoped 审查前提下，独立子代理已明确给出 `phase13-04` 相关 `renters`/`meter-readings`/`page-closure` 文件 `Pass` 结论；后续提交前仍应按补丁边界拆分并行改动。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2 and Task 3
- Task 5 depends on Task 2, Task 3, and Task 4
- Task 6 depends on Task 2, Task 3, Task 4, and Task 5
- Task 7 depends on Task 6
