# Phase13 Frontend Page Parity Implementation 开发规划

## 当前状态
- `phase13` 的开发规划用于把真实前端页面迁移实施拆成可逐个进入 `/spec` 的子任务顺序。
- 本文档不替代：
  - [phase13_frontend_page_parity_implementation_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_architecture_plan.md)
  - [phase13_frontend_page_parity_implementation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_shared_baseline.md)
- `phase13-01 ~ phase13-04` 的主要 route module、loader 与错误边界已经落位到 `src/minix`。
- `phase13-05` 已完成“全量页面审计、验收矩阵、浏览器基线与 `phase14` 交接”的文档收口，并把残余问题收缩到首页 `/` 与 `/bills/stats`。
- 当前 `phase13` 的后续实施任务不再是重开前四个子任务，而是为这两个残余阻断项补充可进入 `/spec` 的正式收口子任务。
- 补充约束：`phase13` 任一页面迁移子任务都必须以旧 `Rento` 源代码为直接原型；除已批准的最小技术适配外，接近 `100%` 还原旧页面的信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义，是验收通过的硬门槛之一。
- 补充判断：当前正式业务页面已不再主要卡在 placeholder 替换，而是卡在“是否完成高保真验收”与“`/bills/stats` 是否仍为未迁移页面”。

## 一、文档定位
本文档用于把 `phase13-frontend-page-parity-implementation` 拆分为顺序执行的实施子任务，确保仓库先明确“先迁哪些页面、如何拆宿主绑定、如何承接页面级数据边界、如何验收”，再进入逐个页面切片实施。

## 二、总体推进结论
`phase13` 的固定顺序为：

```text
先把工作台首页与新宿主壳的真实页面入口落位
    ->
再替换主导航一级入口的 placeholder 页面
    ->
再补齐详情 / 新建 / 编辑 / 流程动作页
    ->
再补齐租客与抄表页面
    ->
最后收口页面 parity 验收矩阵与浏览器验收基线
```

原因如下：
- 若不先把首页与壳层入口替换为真实页面，`phase13` 的“纯新主线已具备正式页面承接能力”无法成立。
- 若不先完成主导航一级入口页，后续详情页、编辑页与流程动作页将继续建立在 placeholder 之上。
- 若不先明确宿主绑定拆分与 route-level 数据边界，实施会退回整目录搬运或临时兼容拼接。
- 若不把页面级验收基线放到最后一起收口，`phase14` 将缺少单一可引用的页面 parity 输出。

## 二点五、当前实施状态快照
| 子任务 | 当前状态 | 当前结论 |
| --- | --- | --- |
| `phase13-01-dashboard-and-shell-real-page-landing` | 已落位，待高保真复验 | 首页已由 `HomePage` 承接真实工作台壳，但仍需按旧首页原型完成浏览器对照 |
| `phase13-02-primary-list-routes-parity` | 已完成实现，待统一验收 | `/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 已不再是 placeholder |
| `phase13-03-detail-create-edit-flow-routes-parity` | 已完成实现，待统一验收 | 房源/合同/账单详情、编辑、新建与流程动作页已具备正式 route module |
| `phase13-04-renters-and-meter-reading-routes-parity` | 已完成实现，待统一验收 | 租客与抄表页面已进入新宿主；compat bridge 退出留给 `phase14` |
| `phase13-05-page-parity-acceptance-baseline-closure` | 已完成 | 已完成全量页面清单、迁移状态、验收矩阵、浏览器基线与 `phase14` 交接说明收口 |
| `phase13-06-dashboard-parity-closure` | 待执行 | 负责首页 `/` 的高保真复验、差异清单收口与最终页面 parity 验收 |
| `phase13-07-bill-stats-route-parity` | 待执行 | 负责 `/bills/stats` 正式迁入 `src/minix`，但不得提前混写 `phase14` API/query drain |

## 三、任务拆分建议
## phase13-01-dashboard-and-shell-real-page-landing
### 目标
把首页从说明性承接页升级为真实工作台页面壳，并冻结首页在新宿主中的页面装配边界、快捷入口节奏、搜索入口与设置入口承接方式。

### 范围
- `/`
- `HomePage`
- 工作台页面壳
- 首页快捷入口与导航节奏
- 首页 loader / pending / error 同类边界

### 当前事实基线
- 当前 `/` 已由 `HomePage` 挂载，并通过 `MinixDashboardAdapters` 承接工作台统计卡、快捷入口、提醒面板、搜索入口与个人入口。
- `src/minix/layout/UnifiedNavigation.tsx` 已完成 React Router 导航壳承接，可作为首页真实化后的稳定壳层输入。
- `src/components/pages/DashboardPage.tsx` 与 `DashboardPageWithStats.tsx` 已提供旧首页主体表达参考，但仍需判断其是否直接依赖旧宿主或旧数据获取方式。
- `phase13-01` 的当前阻断已经不再是“首页是否仍是说明页”，而是“首页是否已经按旧 `DashboardPageWithStats` / `DashboardPage` 完成高保真对照并形成可复核的浏览器验收记录”。
- 因此 `phase13-05` 必须继续把 `/` 标记为“部分迁移”，直到首页通过正式保真复验。

### 参考来源
- `src/minix/routes/HomePage.tsx`
- `src/components/pages/DashboardPage.tsx`
- `src/components/pages/DashboardPageWithStats.tsx`
- `src/components/business/dashboard-home.tsx`
- `src/minix/layout/*`
- `src/lib/navigation-config.ts`

### 不在范围内
- 不切 dashboard retained-legacy API
- 不扩写通知中心、个人资料、PWA runtime
- 不调整桌面/移动端主导航原型

### DoD
- `/` 不再只是阶段说明页，而是具备真实工作台页面壳与装配结构
- 首页快捷入口、搜索入口、设置入口与导航节奏有单一解释
- 首页 loader / pending / error 同类边界可被后续页面复用
- 除最小技术适配外，首页必须以旧 `DashboardPageWithStats` / `DashboardPage` 源代码为直接原型，接近 `100%` 还原其信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义
- 首页不得保留迁移说明文案、宿主标签、开发态状态卡、验收辅助卡片、占位交互或重复快捷入口

### 验证要求
- 确认首页仍保持旧工作台信息结构与导航节奏
- 确认首页未引入新的视觉语言或第二套导航骨架
- 确认首页实现未越界到 API/query parity 或 PWA parity
- 确认首页逐项对照旧 `DashboardPageWithStats` / `DashboardPage` 后，不再存在显著结构漂移
- 确认首页中的搜索入口、快捷入口、提醒/个人入口语义、告警/统计承接方式与旧 `Rento` 原型保持单一解释
- 若仍存在迁移说明卡、入口协同卡、首页状态边界卡、重复 `设置` 快捷入口或裸露技术态错误文案，则本子任务不得验收通过

## phase13-02-primary-list-routes-parity
### 目标
把主导航一级正式业务页从 `PlaceholderPage` 替换为真实页面壳与装配层，形成新宿主可浏览的首批正式页面闭环。

### 范围
- `/rooms`
- `/add`
- `/contracts`
- `/bills`
- `/settings`
- 与上述页面对应的 route module、页面装配层与首屏数据边界

### 当前事实基线
- 当前 `src/minix/router/index.tsx` 中上述路由已分别由 `RoomListRoute`、`AddHubRoute`、`ContractListRoute`、`BillListRoute` 与 `SettingsRoute` 真实承接。
- 旧宿主中的页面主体与表达层已完成第一轮宿主适配，但对应页面仍需要统一纳入 `phase13-05` 验收矩阵。
- `phase12` 已冻结这些页面为 P0，当前它们继续作为阻塞 `phase14` retained-legacy API 清退的关键页面。

### 参考来源
- `src/minix/router/index.tsx`
- `src/minix/routes/PlaceholderPage.tsx`
- `src/components/pages/RoomListPage.tsx`
- `src/components/pages/ContractListPage.tsx`
- `src/components/pages/BillListPage.tsx`
- `src/app/add/page.tsx`
- `src/app/settings/page.tsx`
- `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`

### 不在范围内
- 不补 P1 详情/编辑/流程动作页
- 不切 retained-legacy API
- 不迁移 `/profile`、`/notifications`、治理页或 dev-only 页

### DoD
- `/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 已不再是 placeholder
- 每个页面都具备真实页面壳、页面装配层与首屏数据边界
- 页面级返回、跳转、搜索与错误恢复路径具备单一解释

### 验证要求
- 确认每个页面都仍保持旧 UI 原型、导航节奏与主链语义
- 确认页面主体优先复用既有 `src/components/pages/*` / `src/components/business/*`
- 确认新增 route module 没有继续引用 `next/*` 宿主协议

## phase13-03-detail-create-edit-flow-routes-parity
### 目标
补齐房源、合同、账单主链的详情、新建、编辑与流程动作页，使首批正式页面具备可执行主链闭环。

### 范围
- `/rooms/:id`
- `/rooms/:id/edit`
- `/add/room`
- `/add/contract`
- `/contracts/new`
- `/contracts/:id`
- `/contracts/:id/edit`
- `/contracts/:id/renew`
- `/contracts/:id/checkout`
- `/bills/create`
- `/bills/:id`
- `/bills/:id/edit`

### 当前事实基线
- 上述路由当前已在新宿主具备正式 route module 与 loader / error boundary 落点。
- 旧宿主中这些页面原本广泛混有：
  - `generateMetadata()`
  - `notFound()`
  - `dynamic = 'force-dynamic'`
  - 页面级 server query 与 Decimal 转换
- 当前这部分工作的重点已从“补齐路由文件”切换为“确认拆壳结果与旧原型一致，并把 retained-legacy / compat 依赖明确交给 `phase14`”。

### 参考来源
- `src/app/rooms/[id]/page.tsx`
- `src/app/rooms/[id]/edit/page.tsx`
- `src/app/contracts/[id]/page.tsx`
- `src/app/contracts/[id]/edit/page.tsx`
- `src/app/contracts/[id]/renew/page.tsx`
- `src/app/contracts/[id]/checkout/page.tsx`
- `src/app/bills/create/page.tsx`
- `src/app/bills/[id]/page.tsx`
- `src/app/bills/[id]/edit/page.tsx`
- `src/components/pages/*`

### 不在范围内
- 不补租客与抄表页面
- 不切 retained-legacy API/query
- 不迁入 PWA runtime 或 cutover 逻辑

### DoD
- 核心详情 / 编辑 / 新建 / 流程动作页在新宿主中已具备真实落点
- 页面级 not-found、loading、error 与提交后回跳策略可解释
- 旧宿主的 `generateMetadata()`、`notFound()`、Next 路由协议已不再成为新宿主阻断项

### 验证要求
- 确认详情页、表单页、流程动作页都未破坏合同、账单、房源主链语义
- 确认页面级 loader / pending / error 边界已进入 route module，而不是继续散落在旧 `src/app/**/page.tsx`
- 确认任何新增兼容逻辑都注明存在原因与退出条件

## phase13-04-renters-and-meter-reading-routes-parity
### 目标
补齐租客与抄表页面，使首批正式业务页覆盖房源、合同、账单、租客、抄表主链。

### 范围
- `/renters`
- `/renters/new`
- `/renters/:id`
- `/renters/:id/edit`
- `/meter-readings/batch`
- `/meter-readings/history`

### 当前事实基线
- 上述路由当前都已经在新宿主中具备正式承接位。
- 租客与抄表页面虽然已迁入 `src/minix`，但仍通过 shared compat helper / runtime bridge 维持与旧入口的过渡协同。
- `phase12` 已把这些页面冻结为 P1 正式业务页，并明确标记为会直接影响 `phase14` 对 `/api/renters*` 与 `/api/meter-readings*` 的 retained-legacy 清退判断。

### 参考来源
- `src/app/renters/**/page.tsx`
- `src/app/meter-readings/**/page.tsx`
- `src/components/pages/RenterListPage.tsx`
- `src/components/pages/RenterDetailPage.tsx`
- `src/components/pages/RenterCreatePage.tsx`
- `src/components/pages/RenterEditPage.tsx`
- `src/components/pages/BatchMeterReadingPage.tsx`
- `src/components/pages/MeterReadingHistoryPage.tsx`

### 不在范围内
- 不补 `/bills/stats`
- 不迁移支持页、治理页或 dev-only 页面
- 不切 retained-legacy API/query

### DoD
- 租客与抄表页面在新宿主中具备真实页面壳与装配层
- 页面级跳转、空态、错态与回跳路径可解释
- 页面 parity 结果可以被 `phase14` 直接引用

### 验证要求
- 确认租客、抄表页面仍保持旧 UI 原型与业务语义
- 确认抄表与历史页没有因迁移放宽历史记录保留约束
- 确认支持页、治理页与 dev-only 页面未被重新混入正式范围

## phase13-05-page-parity-acceptance-baseline-closure
### 目标
收口 `phase13` 的页面 parity 验收矩阵、人工浏览器验收基线、页面承接清单与对 `phase14` 的页面-API 依赖交接。

### 范围
- 页面级最小验收矩阵
- 人工浏览器操作基线
- 页面 parity 对 retained-legacy API 清退顺序的最新影响说明
- `phase13` 仅文档轮次最小验证要求

### 当前事实基线
- 当前 `phase12` 已冻结页面映射、优先级与页面-API 联动；`phase13-01 ~ phase13-04` 已把 `24/25` 个正式业务页面挂入新宿主。
- 当前 `phase13-05` 已完成：
  - 全量正式业务页面审计
  - 未迁移 / 部分迁移清单
  - 页面 parity 验收矩阵
  - 人工浏览器基线
  - 页面与 retained-legacy API/query 的 `phase14` 交接说明
- 当前留给后续子任务继续实施的阻断项是：
  - `/` 仍需高保真验收结论
  - `/bills/stats` 仍是未迁移页面
- `phase14` 需要以 `phase13` 的真实页面 parity 结果作为 retained-legacy API/query 清退的直接输入。

### 参考来源
- `docs/phase12_*`
- `plan.md`
- `server/lib/legacy-route-inventory.ts`
- `src/minix/router/index.tsx`
- `src/components/pages/*`
- 旧 `src/app/**/page.tsx`

### 不在范围内
- 不新增 `phase14` 阶段文档正文
- 不执行 retained-legacy API 清退
- 不把 PWA parity 或 cutover 验收提前写入本子任务

### DoD
- `phase13` 的页面 parity 验收标准具备单一解释
- 人工浏览器操作链可直接被后续 `/spec` 与实施复用
- 页面与 retained-legacy API 的交接关系可被 `phase14` 直接引用

### 验证要求
- 确认页面验收矩阵覆盖首页、列表页、详情页、编辑/新建页与流程动作页
- 确认验收基线未混入 `phase14 ~ phase16` 的职责
- 确认 `docs/phase13_*`、顶层真相源与 `phase12` 上游输入状态一致

## phase13-06-dashboard-parity-closure
### 目标
收口首页 `/` 的高保真复验、差异清单与最终验收结论，使首页不再停留在“部分迁移”状态。

### 范围
- `/`
- `HomePage`
- `DashboardPageWithStats`
- 首页人工浏览器高保真对照
- 首页 parity gap 的最小修复与复验记录

### 当前事实基线
- 当前首页已由 `HomePage` 在 `src/minix` 中真实承接，但仍被文档冻结为“部分迁移”。
- 当前阻断不再是“是否已有页面壳”，而是“是否已按旧首页原型完成接近 `100%` 的高保真复验，并形成单一验收结论”。
- 在首页通过正式保真验收前，`phase13` 不应被视为整体完成。

### 参考来源
- `src/minix/routes/HomePage.tsx`
- `src/components/pages/DashboardPage.tsx`
- `src/components/pages/DashboardPageWithStats.tsx`
- `src/minix/components/homepage/*`
- `docs/phase13_*`

### 不在范围内
- 不切 dashboard retained-legacy API/query
- 不扩写通知中心、个人资料或治理入口
- 不重做首页信息架构或导航骨架

### DoD
- `/` 已完成与旧首页原型的高保真浏览器对照
- 首页 parity gap 已被明确为“已消除”或“仍存在且阻断验收”的单一结论
- 首页不再保留“部分迁移”状态

### 验证要求
- 确认首页搜索入口、快捷入口、提醒面板、统计卡与个人入口语义仍与旧原型一致
- 确认首页不存在迁移说明卡、宿主标签、重复入口或其他显著 UI 漂移
- 确认首页验收未越界到 `phase14` API/query parity

## phase13-07-bill-stats-route-parity
### 目标
把 `/bills/stats` 正式迁入 `src/minix`，收口页面壳、宿主绑定拆分与页面级承接位，使其不再作为正式业务页面唯一 fallback。

### 范围
- `/bills/stats`
- `BillStatsPage`
- `BillStatsRoute`
- 账单统计页宿主绑定拆分
- 页面级 loader / pending / error 边界

### 当前事实基线
- `/bills/stats` 当前仍通过 legacy document fallback 打开旧宿主页。
- 旧 `BillStatsPage` 仍绑定 `next/navigation`，且统计页数据依赖 retained-legacy API/query。
- 当前阶段目标是先完成页面 parity 承接与最小 bridge 说明，而不是提前执行 `phase14` 的账单 stats API/query drain。

### 参考来源
- `src/app/bills/stats/page.tsx`
- `src/components/pages/BillStatsPage.tsx`
- `src/app/api/bills/stats/route.ts`
- `src/lib/bill-stats.ts`
- `src/minix/routes/bills/*`
- `server/lib/legacy-route-inventory.ts`

### 不在范围内
- 不执行 `/api/bills/stats` 的正式宿主切流
- 不重写账单统计读模型
- 不把 retained-legacy API 清退提前混写进本子任务

### DoD
- `/bills/stats` 已具备 `src/minix` 正式承接位
- `BillStatsPage` 不再直接依赖 `next/navigation`
- 统计页当前对 retained-legacy API/query 的依赖关系具备单一解释，并明确作为 `phase14` 后续输入

### 验证要求
- 确认统计页页面结构、筛选、汇总语义与旧原型保持一致
- 确认统计页迁移未反向扩张为账单 stats API/query drain
- 确认 `/bills/stats` 不再是正式业务页面 document fallback

## 四、推荐实施顺序
建议严格按如下顺序推进：

```text
phase13-01-dashboard-and-shell-real-page-landing
phase13-02-primary-list-routes-parity
phase13-03-detail-create-edit-flow-routes-parity
phase13-04-renters-and-meter-reading-routes-parity
phase13-05-page-parity-acceptance-baseline-closure
phase13-06-dashboard-parity-closure
phase13-07-bill-stats-route-parity
```

## 四点五、子任务实施验收门禁
- `phase13-*` 任一已批准 `/spec` 子任务在实现完成后，必须额外指定独立子代理执行审核验收。
- 子代理审核必须优先关注：
  - 范围是否越界到 `phase14 ~ phase16`
  - 页面切片范围是否仍符合 `phase12` 冻结事实表
  - UI 保真边界是否被破坏
  - 是否重新引入 `next/*` 宿主协议或新的 retained-legacy 依赖
  - 页面验收矩阵与浏览器基线是否真实可执行
- 只有在子代理明确给出“审核通过 / 验收通过”结论后，才允许把该子任务标记为正式完成。
- 未通过子代理审核的子任务，必须继续修正并重复“实现 -> 子代理审核 -> 复验”循环，不得提前提交或推送远程仓库。

## 五、阶段结论
`phase13` 的顺序价值在于：

```text
先把首页与一级入口页替换为真实页面壳，
再补齐详情 / 编辑 / 新建 / 流程动作页，
最后收口页面级验收与对 phase14 的交接。
```

这能避免：

- 页面迁移重新退回整目录搬运
- 页面壳与 API/query parity 边界混写
- UI 迁移顺带演变成视觉重做
- 只有实现没有验收矩阵，导致 `phase14` 缺少稳定输入
