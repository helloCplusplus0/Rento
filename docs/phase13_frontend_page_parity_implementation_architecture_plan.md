# Phase13 Frontend Page Parity Implementation 架构规划

## 当前状态
- `phase12` 已完成当前轮路线图与文档收口，继续作为 `phase13` 的冻结上游输入。
- 当前文档用于冻结 `phase13-frontend-page-parity-implementation` 的实施架构，不替代：
  - [phase13_frontend_page_parity_implementation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_dev_plan.md)
  - [phase13_frontend_page_parity_implementation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_shared_baseline.md)
- 当前轮只产出阶段文档并收口顶层真相源，不进入 `/spec` 或实现。

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
- [route-manifest.tsx](file:///home/dell/Projects/Rento/src/minix/routes/route-manifest.tsx)
- `src/app/**/page.tsx`
- `src/components/pages/*`
- `src/components/business/*`
- `src/components/layout/*`
- `src/components/ui/*`

### 2.3 数据与部署输入
- `phase10` 已冻结的 `Prisma + PostgreSQL`、查询分层、统一事务边界与迁移兼容边界
- `phase11` 已冻结的正式部署主线、环境模板、发布门禁与 legacy 回滚基线

## 三、当前实施基线
### 3.1 当前新宿主能力
- 当前 `src/minix/router/index.tsx` 已承接：
  - `/login`
  - `/offline`
  - `/loading`
  - `/error`
  - `/404`
  - `/`
  - `/rooms`
  - `/add`
  - `/contracts`
  - `/bills`
  - `/settings`
- 其中除 `/`、`/login`、`/offline` 外，其余正式业务路由仍由 `PlaceholderPage` 占位。
- 当前 `HomePage` 仍是阶段说明页，不是正式工作台页面。
- 当前 `src/minix/layout/*` 已完成：
  - React Router 导航协议
  - 桌面/移动双导航壳
  - 键盘 inset 与移动端底部导航承接

### 3.2 当前旧宿主页面事实
- 旧 `src/app/**/page.tsx` 中仍大量包含：
  - `generateMetadata()`
  - `notFound()`
  - `dynamic = 'force-dynamic'`
  - 页面级 server query
  - Decimal 到 number 的数据整形
  - `Suspense` 壳层
- 旧 `src/components/pages/*` 与 `src/components/layout/*` 中大量包含：
  - `next/navigation`
  - `next/link`
  - `router.push/replace/back/refresh`
- 因此 `phase13` 不能采取“页面组件整目录直搬”策略，必须优先拆宿主绑定与 route-level 数据边界。

### 3.3 Context7 对实施边界的补充依据
- React Router 当前文档继续把 `createBrowserRouter`、嵌套路由与 route-level children 作为推荐承接方式，适合作为新宿主中列表页/详情页/动作页的层级骨架。
- `phase13` 因此应继续以：
  - `src/minix/router/index.tsx`
  - `src/minix/routes/<domain>/*Route.tsx`
  为正式页面装配与数据边界落点，而不是把旧页面逻辑重新塞回单一全局壳层。

## 四、首批实施范围
### 4.1 `phase13` 首批正式页面范围
`phase13` 只承接 `phase12` 已冻结的 P0 / P1 正式业务页面：

- P0
  - `/`
  - `/rooms`
  - `/add`
  - `/contracts`
  - `/bills`
  - `/settings`
- P1
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
  - `/renters`
  - `/renters/new`
  - `/renters/:id`
  - `/renters/:id/edit`
  - `/meter-readings/batch`
  - `/meter-readings/history`

### 4.2 延后范围
- P2
  - `/bills/stats`
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

### 4.3 首批实施顺序
为降低迁移风险，`phase13` 默认按以下顺序推进：

1. 首页与顶级列表/入口页
2. 详情 / 新建 / 编辑 / 流程动作页
3. 租客与抄表页面
4. 页面 parity 验收基线收口

该顺序的目的不是把所有页面一次性迁完，而是先让主导航一级页面与其后续动作页形成可解释、可浏览、可为 `phase14` 提供稳定输入的闭环。

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
### 8.1 页面级最小验收矩阵
`phase13` 至少要为以下维度建立统一验收矩阵：

- 页面是否已从 placeholder / 说明页切换为真实页面壳
- 页面信息结构是否与旧原型保持一致
- 导航节奏与返回/跳转语义是否一致
- 列表页搜索/筛选/空态是否可用
- 详情页加载失败 / 资源不存在 / 恢复路径是否可解释
- 表单页提交、回填、回跳与错误提示是否可解释
- 流程动作页状态反馈与历史语义是否失真

### 8.2 人工浏览器验收基线
每类页面至少形成一条人工浏览器操作链：

- 工作台：首页加载 -> 快捷入口 -> 搜索入口 -> 设置入口
- 房源：列表 -> 详情 -> 编辑
- 合同：列表 -> 详情 -> 编辑 / 续租 / 退租
- 账单：列表 -> 详情 -> 编辑 / 新建
- 租客：列表 -> 详情 -> 编辑 / 新建
- 抄表：批量抄表 -> 历史记录

### 8.3 与 `phase14` 的交接输出
`phase13` 完成后，应向 `phase14` 提供：

- 真实页面 parity 页面清单
- 页面与 retained-legacy API 的最新依赖关系
- 页面级浏览器验收基线
- 仍阻塞 retained-legacy API 清退的页面清单

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

## 十一、阶段结论
`phase13-frontend-page-parity-implementation` 的架构价值不在于“立即写完所有页面代码”，而在于：

```text
先把真实页面迁移的承接结构、页面切片顺序、宿主绑定拆分方式、
route-level 数据边界与验收基线冻结，
再进入逐个 /spec 的实施与审核。
```

这能确保：

- 不让页面迁移重新退回整目录搬运
- 不让 `next/*` 协议继续渗入新宿主
- 不让页面实施顺带混入 API / PWA / cutover 职责
- 不让 UI 迁移顺带演变成视觉重设计
