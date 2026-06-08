# Phase13 Frontend Page Parity Implementation 架构规划

## 当前状态
- `phase12` 已完成当前轮路线图与文档收口，继续作为 `phase13` 的冻结上游输入。
- 当前文档用于冻结 `phase13-frontend-page-parity-implementation` 的实施架构，不替代：
  - [phase13_frontend_page_parity_implementation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_dev_plan.md)
  - [phase13_frontend_page_parity_implementation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_shared_baseline.md)
- `phase13-01 ~ phase13-04` 已把 P0 / P1 正式页面的大部分 route module、loader 与错误边界落到 `src/minix`。
- `phase13-05` 已完成把真实页面清单、迁移状态、未迁移清单、验收矩阵、浏览器基线与 `phase14` 交接冻结成单一真相源。
- 当前轮后续实施任务聚焦 `phase13-06` 与 `phase13-07`：分别收口首页 `/` 的高保真复验，以及 `/bills/stats` 的正式页面承接位。
- 当前轮不执行 `phase14` retained-legacy API drain、`phase15` PWA parity 或 `phase16` cutover 验收。

## 一、文档目标
本文档用于回答以下问题，并把答案冻结成后续 `phase13-*` `/spec` 的单一依据：

- `phase13` 首批真实迁移哪些页面，哪些页面继续延后
- 正式页面在 `src/minix` 中如何组织 route module、页面装配层与数据加载边界
- 旧 `src/app/**/page.tsx`、`src/components/pages/*`、`src/components/layout/*` 与 `src/components/business/*` 中哪些内容继续复用，哪些必须先拆宿主绑定
- 如何在不破坏旧 UI 原型、导航节奏、表单交互与主链语义的前提下完成真实页面承接
- `phase13` 应如何给 `phase14` 提供稳定的页面 parity 输出，而不提前混写 API/query parity、PWA parity 或 cutover 职责

## 二、继承输入
### 2.1 冻结自 `phase12` 的上游输入
- 正式页面范围与优先级
- 旧页面到 `src/minix` 的映射表
- 五层复用矩阵
- 目录级策略表
- UI 保真边界与四类最小技术适配口径
- 页面 parity 与 retained-legacy API 的联动规则

### 2.2 工程与宿主输入
- [router/index.tsx](file:///home/dell/Projects/Rento/src/minix/router/index.tsx)
- [MinixShellLayout.tsx](file:///home/dell/Projects/Rento/src/minix/layout/MinixShellLayout.tsx)
- [UnifiedNavigation.tsx](file:///home/dell/Projects/Rento/src/minix/layout/UnifiedNavigation.tsx)
- [route-manifest.tsx](file:///home/dell/Projects/Rento/src/minix/routes/route-manifest.tsx) `仅用于导航/状态页/治理元数据说明，不再作为正式业务页面实际承接真相源`
- `src/app/**/page.tsx`
- `src/components/pages/*`
- `src/components/business/*`
- `src/components/layout/*`
- `src/components/ui/*`

### 2.3 数据与部署输入
- `phase10` 已冻结的 `Prisma + PostgreSQL`、查询分层、统一事务边界与迁移兼容边界
- `phase11` 已冻结的正式部署主线、环境模板、发布门禁与 legacy 回滚基线

## 三、当前实施基线
### 3.1 当前新宿主真实挂载
- 当前 `src/minix/router/index.tsx` 已真实挂载全部 P0 / P1 正式业务路由，覆盖：
  - `/`
  - `/rooms`
  - `/rooms/:id`
  - `/rooms/:id/edit`
  - `/add`
  - `/add/room`
  - `/add/contract`
  - `/contracts`
  - `/contracts/new`
  - `/contracts/:id`
  - `/contracts/:id/edit`
  - `/contracts/:id/renew`
  - `/contracts/:id/checkout`
  - `/bills`
  - `/bills/create`
  - `/bills/:id`
  - `/bills/:id/edit`
  - `/renters`
  - `/renters/new`
  - `/renters/:id`
  - `/renters/:id/edit`
  - `/meter-readings/batch`
  - `/meter-readings/history`
  - `/settings`
- 状态页继续由 `/login`、`/offline`、`/loading`、`/error`、`/404` 承接。
- `PlaceholderPage` 已不再承担正式业务路由，只保留为历史占位资产与对照参考。
- `src/minix/routes/route-manifest.tsx` 当前只继续承接导航标签、状态页元数据与治理入口说明；正式业务页面的实际承接判断以 `src/minix/router/index.tsx` 与对应 `src/minix/routes/**/*Route.tsx` 为准。
- 当前 `src/minix/layout/*` 已稳定承接：
  - React Router 导航协议
  - 桌面/移动双导航壳
  - 键盘 inset 与移动端底部导航承接

### 3.2 正式业务页面迁移审计快照
- 旧 `src/app/**/page.tsx` 冻结的正式业务页面总量仍为 `25`。
- 其中：
  - `23` 个页面已完成 `src/minix` route module 落位并可通过 React Router 直接进入。
  - `1` 个页面为“部分迁移”：`/` 已脱离说明页并进入真实工作台壳，但仍需按旧首页原型执行高保真复验。
  - `1` 个页面为“未迁移”：`/bills/stats` 仍通过 legacy document fallback 打开。
- 因此 `phase13` 当前的主风险已从“是否仍是 placeholder”切换为：
  - 页面保真验收是否完成
  - `/bills/stats` 是否补齐正式承接位
  - 页面已迁移但 API/query 仍在 retained-legacy / compat-wrapper 的 `phase14` 交接是否单一可解释
- 这两个残余风险继续分别由 `phase13-06-dashboard-parity-closure` 与 `phase13-07-bill-stats-route-parity` 承接，不再混写回 `phase13-05` 的文档基线收口职责。

### 3.3 当前旧宿主与 `phase14` 依赖事实
- 旧 `src/app/**/page.tsx` 仍大量保留：
  - `generateMetadata()`
  - `notFound()`
  - `dynamic = 'force-dynamic'`
  - 页面级 server query
  - Decimal 到 number 的数据整形
  - `Suspense` 壳层
- 旧 `src/components/pages/*` 与 `src/components/layout/*` 中仍可见：
  - `next/navigation`
  - `next/link`
  - `router.push/replace/back/refresh`
- 当前 `src/minix/lib/route-navigation.ts` 已把 document fallback 收窄到：
  - `/bills/stats`
  - `/system-health`
  - `/data-consistency`
- 因此当前 `phase13-05` 必须把“页面已迁移”与“API/query 已切流”明确拆开，避免把 `phase14` 的 retained-legacy drain 错写成页面迁移已完成。

### 3.4 Context7 对实施边界的补充依据
- React Router 当前文档继续把 `createBrowserRouter`、嵌套路由与 route-level children 作为推荐承接方式，适合作为新宿主中列表页/详情页/动作页的层级骨架。
- `phase13` 因此应继续以：
  - `src/minix/router/index.tsx`
  - `src/minix/routes/<domain>/*Route.tsx`
  为正式页面装配与数据边界落点，而不是把旧页面逻辑重新塞回单一全局壳层。

### 3.5 首页验收重点
- 当前 [HomePage.tsx](file:///home/dell/Projects/Rento/src/minix/routes/HomePage.tsx) 已通过 `MinixDashboardAdapters` 复用旧首页主体表达，不再是单纯说明页。
- 但在缺少人工浏览器对照记录前，`phase13-05` 仍必须把 `/` 标记为“部分迁移”，避免把“真实工作台壳已落位”误判为“已完成接近 `100%` 的旧原型保真验收”。

## 四、正式业务页面全量清单与迁移状态
### 4.1 全量页面清单
| 旧页面路径 | 页面类型 | 优先级 | 当前承接位 | 迁移状态 | 当前说明 |
| --- | --- | --- | --- | --- | --- |
| `/` | 工作台首页 | P0 | `src/minix/routes/HomePage.tsx` | 部分迁移 | 已完成真实工作台壳落位，但仍需按旧 `DashboardPageWithStats` 执行高保真复验 |
| `/rooms` | 列表页 | P0 | `src/minix/routes/rooms/RoomListRoute.tsx` | 已迁移 | 已在新宿主承接列表、筛选、详情跳转与错误边界 |
| `/add` | 聚合入口页 | P0 | `src/minix/routes/add/AddHubRoute.tsx` | 已迁移 | 已承接新增入口聚合与页面内跳转 |
| `/contracts` | 列表页 | P0 | `src/minix/routes/contracts/ContractListRoute.tsx` | 已迁移 | 已承接合同列表、续租跳转与详情跳转 |
| `/bills` | 列表页 | P0 | `src/minix/routes/bills/BillListRoute.tsx` | 已迁移 | 已承接账单列表与详情跳转；统计页按钮仍落到 legacy document fallback |
| `/settings` | 设置页 | P0 | `src/minix/routes/settings/SettingsRoute.tsx` | 已迁移 | 设置主页已迁入；治理辅助入口仍通过 document fallback 打开治理页 |
| `/rooms/[id]` | 详情页 | P1 | `src/minix/routes/rooms/RoomDetailRoute.tsx` | 已迁移 | 已承接房源详情、关联合同入口与错误边界 |
| `/rooms/[id]/edit` | 编辑页 | P1 | `src/minix/routes/rooms/EditRoomRoute.tsx` | 已迁移 | 已承接房源编辑与提交后回跳 |
| `/add/room` | 新建页 | P1 | `src/minix/routes/add/AddRoomRoute.tsx` | 已迁移 | 已承接房源创建与楼栋选择流程 |
| `/add/contract` | 新建页 | P1 | `src/minix/routes/add/AddContractRoute.tsx` | 已迁移 | 已承接快捷签约入口与房源/租客预填 |
| `/contracts/new` | 新建页 | P1 | `src/minix/routes/contracts/ContractCreateRoute.tsx` | 已迁移 | 已承接合同新建表单与成功回跳 |
| `/contracts/[id]` | 详情页 | P1 | `src/minix/routes/contracts/ContractDetailRoute.tsx` | 已迁移 | 已承接合同详情、账单/房源/租客联动入口 |
| `/contracts/[id]/edit` | 编辑页 | P1 | `src/minix/routes/contracts/ContractEditRoute.tsx` | 已迁移 | 已承接合同编辑与回填 |
| `/contracts/[id]/renew` | 流程动作页 | P1 | `src/minix/routes/contracts/ContractRenewRoute.tsx` | 已迁移 | 已承接续租上下文预加载、流程表单与回跳 |
| `/contracts/[id]/checkout` | 流程动作页 | P1 | `src/minix/routes/contracts/ContractCheckoutRoute.tsx` | 已迁移 | 已承接退租结算流程与结果反馈 |
| `/bills/create` | 新建页 | P1 | `src/minix/routes/bills/CreateBillRoute.tsx` | 已迁移 | 已承接手工建账入口与回跳 |
| `/bills/[id]` | 详情页 | P1 | `src/minix/routes/bills/BillDetailRoute.tsx` | 已迁移 | 已承接账单详情、关联合同与租客跳转 |
| `/bills/[id]/edit` | 编辑页 | P1 | `src/minix/routes/bills/EditBillRoute.tsx` | 已迁移 | 已承接账单编辑与结果反馈 |
| `/renters` | 列表页 | P1 | `src/minix/routes/renters/RenterListRoute.tsx` | 已迁移 | 已承接租客列表与详情跳转 |
| `/renters/new` | 新建页 | P1 | `src/minix/routes/renters/RenterCreateRoute.tsx` | 已迁移 | 已承接租客创建表单 |
| `/renters/[id]` | 详情页 | P1 | `src/minix/routes/renters/RenterDetailRoute.tsx` | 已迁移 | 已承接租客详情、关联合同与快捷签约入口 |
| `/renters/[id]/edit` | 编辑页 | P1 | `src/minix/routes/renters/RenterEditRoute.tsx` | 已迁移 | 已承接租客编辑与回填 |
| `/meter-readings/batch` | 流程动作页 | P1 | `src/minix/routes/meter-readings/MeterReadingBatchRoute.tsx` | 已迁移 | 已承接批量抄表流程与批处理跳转协议 |
| `/meter-readings/history` | 流程动作页 | P1 | `src/minix/routes/meter-readings/MeterReadingHistoryRoute.tsx` | 已迁移 | 已承接抄表历史浏览与详情恢复路径 |
| `/bills/stats` | 统计页 | P2 | 暂无；由 `BillListRoute` 经 `navigateToMinixOrDocument('/bills/stats')` 打开 | 未迁移 | 当前仍依赖 legacy document fallback，是正式业务页面中的唯一未迁移项 |

### 4.2 未迁移 / 部分迁移清单
| 页面路径 | 当前状态 | 现状说明 | 是否阻断 `phase13` 完成判定 |
| --- | --- | --- | --- |
| `/` | 部分迁移 | 路由、页面壳、统计卡、快捷入口与提醒面板已进入新宿主，但尚缺少按旧首页原型完成的正式浏览器对照结论 | 是 |
| `/bills/stats` | 未迁移 | 仍无 `src/minix/routes/bills/BillStatsRoute.tsx`；当前通过 legacy document fallback 打开旧宿主页 | 是 |

### 4.3 延后范围保持不变
- P2
  - `/profile`
  - `/notifications`
- P3
  - `/system-health`
  - `/data-consistency`
- P4
  - `/performance-*`
  - `/layout-demo`
  - `/components`
  - `/business-flow-validation`
- 以上页面继续按 `phase12` 冻结口径延后，不因 `phase13-05` 的验收基线收口而被重新包装成已迁移正式页面。
- 其中 `/` 与 `/bills/stats` 虽然不再属于“页面清单待审计”问题，但仍属于 `phase13` 当前必须继续收口的实施尾项。

## 五、新宿主承接结构
### 5.1 目录承接位
`phase13` 的正式承接结构固定如下：

- `src/minix/router/index.tsx`
  - 继续作为 `createBrowserRouter` 根入口
  - 负责顶级 children 注册、全局 guard、根 error boundary
- `src/minix/layout/*`
  - 继续作为统一布局壳与导航壳
- `src/minix/routes/<domain>/*Route.tsx`
  - 作为正式页面 route module 目录
  - 负责参数解析、loader、pending、error boundary、页面主体装配顺序
- `src/components/pages/*`
  - 继续作为页面主体表达层
- `src/components/business/*`
  - 继续作为业务卡片、表单块、筛选器、详情块等可复用表达层
- `src/components/layout/*`
  - 只保留拆宿主绑定后仍适合复用的页面容器与布局片段

### 5.2 route module 命名规则
沿用 `phase12` 已冻结命名口径：

- 列表页：`*ListRoute.tsx`
- 详情页：`*DetailRoute.tsx`
- 编辑页：`*EditRoute.tsx`
- 新建页：`*CreateRoute.tsx`
- 聚合入口页：`*HubRoute.tsx`
- 流程动作页：`*<Action>Route.tsx`

### 5.3 route module 统一职责
每个 `src/minix/routes/<domain>/*Route.tsx` 只承担以下职责：

- 读取 `params` / `searchParams`
- 调用 loader 或包装后的数据获取入口
- 声明 pending / error / not-found 同类边界
- 组装页面主体组件与布局片段
- 承接宿主侧跳转、回退、刷新与提交后跳转协议

以下内容不应继续散落在旧 `src/app/**/page.tsx`：

- 页面级 server query 入口
- `generateMetadata()` 依赖的宿主元数据逻辑
- `notFound()` 与 Next 风格错误出口
- `next/navigation` 的页面协议

## 六、典型迁移模式
### 6.1 列表页模式
适用页面：
- `/rooms`
- `/contracts`
- `/bills`
- `/renters`

统一模式：
- route module 负责：
  - 搜索参数解析
  - 首屏 loader 数据获取
  - 空态 / 错态 / 首屏 loading 骨架
- 页面主体组件负责：
  - 搜索栏
  - 筛选
  - 卡片网格 / 列表
  - 页面级 CTA

### 6.2 详情页模式
适用页面：
- `/rooms/:id`
- `/contracts/:id`
- `/bills/:id`
- `/renters/:id`

统一模式：
- route module 负责：
  - `:id` 参数解析
  - 不存在资源的 not-found 同类出口
  - 详情主数据与关联摘要的聚合
- 页面主体组件负责：
  - 信息块展示
  - 历史记录
  - 页面内动作入口

### 6.3 编辑 / 新建页模式
适用页面：
- `/rooms/:id/edit`
- `/contracts/new`
- `/contracts/:id/edit`
- `/bills/create`
- `/bills/:id/edit`
- `/renters/new`
- `/renters/:id/edit`
- `/add/room`
- `/add/contract`

统一模式：
- route module 负责：
  - 首屏预加载
  - 回填数据整形
  - 提交成功后的回跳策略
- 页面主体组件负责：
  - 表单展示
  - 前端交互
  - 局部校验与提交触发

### 6.4 流程动作页模式
适用页面：
- `/contracts/:id/renew`
- `/contracts/:id/checkout`
- `/meter-readings/batch`
- `/meter-readings/history`

统一模式：
- route module 负责：
  - 业务上下文预加载
  - 流程性 loading / error / empty boundary
  - 提交流程完成后的跳转与提示
- 页面主体组件负责：
  - 步骤展示
  - 表单块
  - 操作反馈

## 七、宿主绑定拆分架构
### 7.1 必须拆出的旧宿主绑定
`phase13` 默认把以下内容视为“必须先拆出，再判断复用”的阻断项：

- `next/navigation`
  - `useRouter`
  - `usePathname`
  - `useSearchParams`
- `next/link`
- `generateMetadata()`
- `notFound()`
- `dynamic = 'force-dynamic'`
- 页面级 server query 与数据整形
- 依赖 Next `Suspense` 外壳的页面首屏流程

### 7.2 目录级拆分策略
| 目录 | `phase13` 统一策略 | 说明 |
| --- | --- | --- |
| `src/components/ui/*` | 直接复用 | 不承载宿主协议 |
| `src/components/business/*` | 拆宿主绑定后复用 | 保留业务表达，不保留 Next 协议 |
| `src/components/pages/*` | 拆宿主绑定后复用 | 保留页面主体表达，不直接等同于 route module |
| `src/components/layout/*` | 分层复用 | `PageContainer`、旧 `UnifiedNavigation` 需拆宿主绑定 |
| `src/app/**` | 只作拆壳来源 | 不再作为新增页面落点 |
| `src/minix/routes/*` | 正式页面装配层 | 承担页面级承接与数据边界 |

### 7.3 代表性阻断示例
- [RoomListPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/RoomListPage.tsx) 使用 `next/navigation`
- [PageContainer.tsx](file:///home/dell/Projects/Rento/src/components/layout/PageContainer.tsx) 使用 `router.back()`
- [UnifiedNavigation.tsx](file:///home/dell/Projects/Rento/src/components/layout/UnifiedNavigation.tsx) 使用 `next/link` 与 `next/navigation`
- [rooms/page.tsx](file:///home/dell/Projects/Rento/src/app/rooms/page.tsx) 混有 `dynamic = 'force-dynamic'`、server query 与 Decimal 转换
- [contracts/[id]/page.tsx](file:///home/dell/Projects/Rento/src/app/contracts/[id]/page.tsx) 混有 `generateMetadata()` 与 `notFound()`

## 八、验收基线
### 8.1 页面 parity 验收矩阵
| 页面类别 | 覆盖路径 | 旧原型参考 | 核心验收点 | 最小浏览器路径 | 当前风险 |
| --- | --- | --- | --- | --- | --- |
| 工作台首页 | `/` | `src/app/page.tsx`、`src/components/pages/DashboardPageWithStats.tsx` | 统计卡、快捷入口、搜索入口、提醒区、个人入口与整体信息结构需接近旧原型 | `/` -> 搜索 -> 快捷入口 -> 设置 -> 返回首页 | 仍需防止首页被“已挂载”误判为“已完成高保真迁移” |
| 列表页 | `/rooms`、`/contracts`、`/bills`、`/renters` | 对应旧 `src/app/**/page.tsx` 列表页 | 搜索/筛选、空态/错态、详情跳转、一级 CTA 与列表信息结构保持稳定 | 列表 -> 搜索/筛选 -> 打开详情或新建入口 | 账单列表仍存在 `/bills/stats` fallback；各列表的 API/query 切流尚未进入 `phase14` |
| 详情页 | `/rooms/:id`、`/contracts/:id`、`/bills/:id`、`/renters/:id` | 对应旧详情页 | 详情信息块、关联合同/账单/租客/房源跳转、not-found 同类出口与恢复路径可解释 | 列表 -> 详情 -> 打开关联实体 -> 返回 | 详情读取仍部分依赖 retained-legacy / compat-wrapper API |
| 编辑 / 新建页 | `/rooms/:id/edit`、`/add/room`、`/add/contract`、`/contracts/new`、`/contracts/:id/edit`、`/bills/create`、`/bills/:id/edit`、`/renters/new`、`/renters/:id/edit` | 对应旧表单页 | 首屏预加载、回填、校验、提交、成功回跳与错误提示保持单一解释 | 进入表单 -> 修改字段 -> 提交 -> 回跳到列表或详情 | 不能因宿主迁移弱化表单字段语义与回跳规则 |
| 流程动作页 | `/contracts/:id/renew`、`/contracts/:id/checkout`、`/meter-readings/batch`、`/meter-readings/history` | 对应旧流程页 | 上下文预加载、步骤反馈、成功提示、历史保留语义与恢复路径保持稳定 | 合同详情 -> 续租/退租；抄表批量 -> 历史页 | 抄表与续退租仍依赖 compat bridge，必须与 `phase14` drain 边界分开验收 |

### 8.2 人工浏览器验收基线
| 业务域 | 入口路径 | 关键操作 | 预期结果 | 失败回退方式 | 数据前提 |
| --- | --- | --- | --- | --- | --- |
| 工作台 | `/` | 加载首页 -> 搜索入口 -> 快捷入口 -> 设置入口 | 首页不出现说明页/placeholder；搜索、快捷入口和设置入口语义与旧原型一致 | 刷新当前页；若首页装配失败，使用页面内重试按钮并记录错误信息 | 已登录，存在基础 dashboard 数据 |
| 房源 | `/rooms` | 搜索或筛选 -> 进入 `/rooms/:id` -> 进入 `/rooms/:id/edit` | 列表、详情、编辑链路可走通；详情可打开签约入口；编辑成功后可回跳 | 返回列表后重新打开同一房源，必要时记录错态入口 | 已登录，至少有 1 个房源与可编辑样本 |
| 合同 | `/contracts` | 打开详情 -> 编辑 -> 续租或退租 | 详情结构、编辑回填、续租/退租流程与旧宿主语义一致 | 返回合同列表后重新进入详情；如失败记录对应合同 ID | 已登录，至少有 1 个进行中合同 |
| 账单 | `/bills` | 打开详情 -> 编辑 -> 新建账单 -> 打开统计入口 | 列表、详情、编辑、新建路径可执行；统计入口要么迁入新宿主，要么明确落到 legacy fallback | 失败时返回账单列表；若统计页尚未迁移，必须记录当前 fallback 行为 | 已登录，至少有 1 张账单与 1 条可新建路径 |
| 租客 | `/renters` | 打开详情 -> 编辑 -> 新建租客 -> 从详情跳到关联合同或签约入口 | 列表、详情、编辑、新建链路一致，关联跳转不出现死链 | 返回租客列表，记录关联跳转是否落到新宿主或 compat 桥接 | 已登录，至少有 1 个租客 |
| 抄表 | `/meter-readings/batch` | 批量抄表 -> 提交或预演 -> 打开历史页 | 批量页与历史页都可进入；历史记录保留语义不被破坏 | 返回批量页重新进入；如失败记录批次与房间样本 | 已登录，至少有 1 个可抄表房间和历史记录样本 |

### 8.3 与 `phase14` 的页面-API 交接表
| 页面 / 域 | 当前页面状态 | 直接关联 retained-legacy API / query | 当前保留原因 | `phase14` 优先关注点 |
| --- | --- | --- | --- | --- |
| 工作台 / 设置 | `/` 部分迁移；`/settings` 已迁移 | `/api/dashboard/*`、`/api/settings*` | dashboard 查询与设置接口仍属 retained-legacy / governance 口径，尚未冻结正式 Hono 查询宿主 | 先明确 dashboard/settings 的正式读取宿主，再决定治理辅助接口如何处理 |
| 房源 / 新增房源 | `/rooms*`、`/add/room` 已迁移 | `/api/rooms*`、`/api/rooms/:id/meters`、`/api/meters/:meterId*`、`/api/buildings*` | 房源列表/详情/状态/仪表读取仍含 retained-legacy；楼栋与部分仪表操作已进入 formal-host-owned / compat-wrapper | 先拆清房源读路径、仪表读路径与批量/删除写路径，再判断 route drain 顺序 |
| 合同 / 快捷签约 | `/contracts*`、`/add/contract` 已迁移 | `/api/contracts*` | 合同列表/详情读取仍 retained-legacy；续租、退租、删除等动作已切到 compat-wrapper | 先收口列表/详情/编辑读写，再清理续租/退租 compat 包装 |
| 账单 | `/bills*` 已迁移；`/bills/stats` 未迁移 | `/api/bills*` | 账单列表、详情、统计仍有 retained-legacy；状态更新/编辑/删除部分已进入 compat-wrapper | 账单 stats 路由补齐与账单读模型切流必须一起评估，避免页面先迁而查询仍分裂 |
| 租客 | `/renters*` 已迁移 | `/api/renters*` | 当前仍通过 shared renter page-closure compat helper 桥接旧 Next 与 Hono runtime | 先在 route inventory 中把 compat bridge 与最终正式宿主边界写清，再执行 drain |
| 抄表 | `/meter-readings*` 已迁移 | `/api/meter-readings*`、`/api/utility-readings` | 当前仍通过 shared meter-reading page-closure compat helper 桥接旧入口 | 先确认批量抄表与历史页对应的读写路径，再统一 cut 到正式宿主 |

### 8.4 文档轮次最小验证要求
- `docs/phase13_*` 三份文档互链复核通过。
- 被引用的 `src/minix/*`、`src/components/pages/*`、旧 `src/app/**/page.tsx` 与 `server/lib/legacy-route-inventory.ts` 路径存在。
- 页面清单与 `phase12` 冻结的 `25` 个正式业务页面保持一致，不重新扩写支持页、治理页或 dev-only 页面。
- 文档明确区分：
  - 页面迁移状态
  - 页面保真验收状态
  - `phase14` retained-legacy API/query drain 依赖
- 文档不把 `phase14 ~ phase16` 的职责提前写成本子任务完成条件。

## 九、明确延后项
以下内容不属于 `phase13` 的实施范围：

- retained-legacy API/query 清退
- PWA manifest / service worker / runtime
- legacy cutover / rollback / exit
- `/profile`、`/notifications`、治理页、dev-only 页面
- Prisma 替换
- 视觉重设计

## 十、验证要求
- 确认文档只使用 `phase12` 已冻结的正式页面范围、映射表与优先级，不重新定义范围
- 确认文档中的路径与目录真实存在
- 确认架构描述与现有 `src/minix/router/index.tsx`、`src/minix/layout/*` 结构一致
- 确认所有实施边界都没有混写 `phase14 ~ phase16` 职责
- 确认页面迁移仍保持 `Prisma + PostgreSQL`、UI 保真与历史保留约束
- 确认任何页面验收都不会把“页面壳已落位”误判为“页面迁移已完成”；若与旧原型仍有显著结构漂移，必须明确回退验收结论
- 确认全量页面清单、未迁移清单、验收矩阵、浏览器基线与 `phase14` 交接表之间没有相互冲突的状态描述

## 十一、阶段结论
`phase13-frontend-page-parity-implementation` 在当前轮的架构价值，不再只是“规划下一步怎么迁”，而在于：

```text
先把 25 个正式业务页面的真实承接结果做成可审计清单，
再通过 `phase13-05` 固定未迁移项、保真验收矩阵、浏览器基线与 phase14 交接，
最后由 `phase13-06`、`phase13-07` 分别收口首页与 `/bills/stats`，
避免页面迁移结果和后续 API drain 判断继续各说各话。
```

这能确保：

- 不让页面迁移结果继续停留在“已经有路由所以应该算完成”的模糊状态
- 不让 `next/*` 协议、legacy document fallback 与 retained-legacy API 依赖被混写成单一问题
- 不让 `phase14` 在没有页面清单和浏览器基线的情况下自行猜测 drain 顺序
- 不让 UI 迁移顺带演变成视觉重设计
