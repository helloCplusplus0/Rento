# Phase13 Frontend Page Parity Implementation 开发规划

## 当前状态
- `phase13` 的开发规划用于把真实前端页面迁移实施拆成可逐个进入 `/spec` 的子任务顺序。
- 本文档不替代：
  - [phase13_frontend_page_parity_implementation_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_architecture_plan.md)
  - [phase13_frontend_page_parity_implementation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_shared_baseline.md)
- 当前轮只产出阶段文档与顶层真相源同步，不进入 `/spec` 或实现。

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
- 当前 `/` 已由 `HomePage` 挂载，但内容仍是阶段说明与承接清单，而不是正式工作台页面。
- `src/minix/layout/UnifiedNavigation.tsx` 已完成 React Router 导航壳承接，可作为首页真实化后的稳定壳层输入。
- `src/components/pages/DashboardPage.tsx` 与 `DashboardPageWithStats.tsx` 已提供旧首页主体表达参考，但仍需判断其是否直接依赖旧宿主或旧数据获取方式。

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

### 验证要求
- 确认首页仍保持旧工作台信息结构与导航节奏
- 确认首页未引入新的视觉语言或第二套导航骨架
- 确认首页实现未越界到 API/query parity 或 PWA parity

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
- 当前 `src/minix/router/index.tsx` 中上述路由仍由 `minixPrimaryRoutes` + `PlaceholderPage` 承接。
- 旧宿主中已存在对应页面主体与表达层，但大量依赖 `next/navigation` 或旧宿主页面级 query。
- `phase12` 已冻结这些页面为 P0 且全部标记为阻塞 `phase14` retained-legacy API 清退的关键页面。

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
- 上述路由当前在新宿主尚无正式落点。
- 旧宿主中这些页面广泛混有：
  - `generateMetadata()`
  - `notFound()`
  - `dynamic = 'force-dynamic'`
  - 页面级 server query 与 Decimal 转换
- 因此本子任务的关键不是“复制页面组件”，而是把旧页面的宿主绑定、数据加载与错误出口正确拆离并承接到新 route module。

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
- 上述路由当前在新宿主中都还没有正式承接位。
- 旧宿主中的租客与抄表页面同样依赖 `next/navigation`、`notFound()` 或页面级数据整形。
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
- 当前 `phase12` 已冻结页面映射、优先级与页面-API 联动，但尚未形成实施后的验收矩阵。
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

## 四、推荐实施顺序
建议严格按如下顺序推进：

```text
phase13-01-dashboard-and-shell-real-page-landing
phase13-02-primary-list-routes-parity
phase13-03-detail-create-edit-flow-routes-parity
phase13-04-renters-and-meter-reading-routes-parity
phase13-05-page-parity-acceptance-baseline-closure
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
