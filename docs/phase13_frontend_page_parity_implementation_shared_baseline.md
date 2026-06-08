# Phase13 Frontend Page Parity Implementation Shared Baseline

## 当前状态
- `phase13` 的共享基线用于冻结真实页面迁移实施阶段必须共同遵守的词汇、边界与判断标准。
- 本文档直接建立在 `phase12` 已冻结的页面事实表、页面映射、五层复用矩阵、UI 保真边界与页面-API 联动之上。
- 当前互链文档为：
  - [phase13_frontend_page_parity_implementation_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_architecture_plan.md)
  - [phase13_frontend_page_parity_implementation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_dev_plan.md)
- `phase13-01 ~ phase13-04` 的 route module、loader 与页面壳已在 `src/minix` 落地；`phase13-05` 已完成迁移审计与验收基线收口。
- `phase13-06` 与 `phase13-07` 已完成首页 `/` 与 `/bills/stats` 的尾项收口；当前 `phase13` 已形成可直接交给 `phase14` 的页面 parity 上游输入。
- 当前轮不执行 `phase14 ~ phase16` 的实现职责。

## 一、文档目的
本文档用于冻结 `phase13-frontend-page-parity-implementation` 的共享判断标准，避免后续子任务分别从页面壳、路由装配、宿主绑定、数据加载或页面验收视角出发，重新产出互相冲突的解释。

## 二、共享前提
- `phase01 ~ phase11` 已完成当前轮阶段收口
- `phase12` 已完成：
  - 正式页面范围冻结
  - 页面映射表冻结
  - 五层复用矩阵冻结
  - UI 保真边界冻结
  - `phase12 ~ phase16` 路线图冻结
- 当前正式数据访问主线继续固定为 `Prisma + PostgreSQL`
- 当前正式部署主线继续固定为 `Caddy + systemd + Hono + PostgreSQL`
- 当前 `src/minix/layout/*`、`src/minix/router/index.tsx` 与 `src/minix/routes/PlaceholderPage.tsx` 已构成 `phase13` 的正式宿主骨架

## 三、共享判断标准
- 默认优先把首页、主导航一级页面、详情/编辑/新建/流程动作页迁入 `src/minix`，而不是继续扩写说明页或 placeholder。
- 默认优先把 route module、页面装配层、页面级数据加载边界与宿主协议拆分收口到 `src/minix/routes/*Route.tsx`，而不是继续把这些逻辑散落在旧 `src/app/**/page.tsx`。
- 默认优先复用 `src/components/pages/*`、`src/components/business/*`、`src/components/layout/*` 与 `src/components/ui/*` 的既有表达层，而不是重做 UI。
- 默认继续以旧 `Rento` 页面信息结构、导航节奏、表单交互与状态反馈为 UI 原型，不把迁移解释成重做设计系统。
- 默认进一步把“旧 `Rento` 源代码作为直接原型、除最小技术适配外接近 `100%` 还原旧页面”视为验收硬门槛；只完成页面壳替换、说明页替换或局部模块复用，不足以单独构成通过结论。
- 默认继续保持低复杂度、单仓库、单主线、单一真相源。
- 默认不把 retained-legacy API/query parity、PWA parity 或 cutover/legacy-exit 职责混入 `phase13`。

## 四、共享输入清单
### 4.1 页面与组件输入
- `src/app/**/page.tsx`
- `src/minix/router/index.tsx`
- `src/minix/layout/*`
- `src/minix/routes/*`
- `src/components/pages/*`
- `src/components/business/*`
- `src/components/layout/*`
- `src/components/ui/*`

### 4.2 数据与宿主输入
- `src/lib/queries.ts`
- `src/lib/dashboard-queries.ts`
- `src/lib/domain/*`
- `src/lib/prisma.ts`
- `src/lib/transaction-manager.ts`
- `server/lib/legacy-route-inventory.ts`

### 4.3 顶层治理输入
- `README.md`
- `AGENTS.md`
- `project_rules.md`
- `global_skills.md`
- `project_skills.md`
- `plan.md`
- `architecture_map.md`
- `docs/phase12_*`

## 五、统一词汇语义
### 5.1 页面 parity
- 指旧 `src/app/*` 正式页面在 `src/minix` 中完成真实页面壳、页面装配、导航与主要交互表达的承接。
- 它不等于像素级复刻，但默认要求信息结构、主交互节奏与业务语义一致。
- 对 `phase13` 而言，页面 parity 还要求：除最小技术适配外，新页面必须继续以旧 `Rento` 源代码为直接原型，并达到接近 `100%` 的页面保真度；否则只能视为中间迁移结果。

### 5.2 route module
- 指 `src/minix/routes/<domain>/*Route.tsx` 中的页面承接文件。
- 它负责参数解析、loader / pending / error boundary、页面主体装配与宿主协议。
- 它不等于页面主体表达层，也不等于组件库层。

### 5.3 页面装配层
- 指 route module 中用于拼接页面壳、页面主体、布局片段、页面级状态边界的那一层。
- 它不同于 `src/components/pages/*` 中的主体表达组件。

### 5.4 宿主绑定拆分
- 指把旧 `Next.js` 宿主特有协议从页面主体表达层中拆离。
- 至少包括：
  - `next/navigation`
  - `next/link`
  - `generateMetadata()`
  - `notFound()`
  - `dynamic = 'force-dynamic'`
  - 页面级 server query / Decimal 转换 / Suspense 外壳

### 5.5 页面级数据边界
- 指列表页、详情页、编辑页、新建页、流程动作页在 route module 中承接的 loader / pending / error / not-found 同类边界。
- 该边界属于路由层职责，不属于布局壳、导航壳或通用组件层。

### 5.6 迁移状态词汇
- `已迁移`：页面已具备 `src/minix/routes/*Route.tsx` 正式承接位，且主入口不再依赖 document fallback。
- `部分迁移`：页面已具备正式承接位，但当前仍缺少高保真验收结论，或仍存在需要显式追踪的 parity gap。
- `未迁移`：页面尚无 `src/minix` 正式承接位，当前仍依赖旧宿主页或 document fallback。
- `legacy document fallback`：通过 `navigateToMinixOrDocument()` 或 `openDocumentPath()` 打开旧宿主页，仅允许用于 `phase13` 明确延后的页面，不等于页面已经迁移。

### 5.7 验收状态词汇
- `待浏览器复验`：页面已完成 route module 落位，但尚未基于旧原型完成人工浏览器对照。
- `通过保真验收`：页面已基于旧 `src/app/**/page.tsx` 与既有主体表达完成对照，确认在除最小技术适配外达到接近 `100%` 保真。
- `存在 parity gap`：页面虽可访问，但仍存在信息结构、导航节奏、交互或历史语义的显著漂移，不得标记为通过。

## 六、正式范围共享口径
### 6.1 `phase13` 首批正式页面范围
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

### 6.2 延后范围
- P2
  - `/profile`
  - `/notifications`
- P3
  - `/system-health`
  - `/data-consistency`
- P4
  - `performance-*`
  - `layout-demo`
  - `components`
  - `business-flow-validation`

### 6.3 P0 / P1 / P2 / P3 / P4 的实施期含义
- `P0`：已在新宿主中存在顶级路由或首页入口，必须最先从说明页 / placeholder 切换为真实页面壳。
- `P1`：尚未在新宿主中存在正式路由，但属于核心主链详情、编辑、新建或流程动作页，必须在 P0 稳定后补齐。
- `P2`：统计页与支持页，属于后续正式输入，不进入 `phase13` 首批真实迁移实施范围；但若其已被阶段文档明确提升为 `phase13` 完成阻断项，则需在本阶段尾项继续补齐，不得静默滑入 `phase14`。
- `P3`：治理页，继续延后，不进入 `phase13` 首批范围。
- `P4`：dev-only / 待归档候选，不进入正式 parity 范围。

### 6.4 当前迁移状态快照
- 当前正式业务页面总量仍为 `25`，来源保持与 `phase12` 冻结事实表一致。
- 当前迁移审计结果固定为：
  - `25` 个页面 `已迁移`
- 当前正式业务页面已不存在 document fallback；`/system-health` 与 `/data-consistency` 属于治理延后项，不计入正式业务页面迁移统计。
- 设置页打开治理辅助入口时仍会触发 `openDocumentPath()`，但这不改变 `/settings` 主页面已迁移的判定。
- 首页中的 `/profile`、`/notifications` 支持页入口继续保持 P2 延后口径，但必须走受控 fallback / 阶段提示，不得在新宿主中直接落入未迁移路由死链。
- `phase13-05` 最终复核后，`/bills/stats` 已由 `phase13-07` 收口为“已迁移并完成浏览器复验”；其 retained-legacy stats API/query drain 继续留给 `phase14`。

## 七、UI 与数据访问共享口径
### 7.1 UI 共享口径
- 当前 `Rento` UI 展示效果继续视为正式原型参考。
- `phase13` 允许的调整仍只限：
  - 宿主适配
  - 明显 bug 修复
  - 移动端可用性改善
  - 最小信息架构优化
- 每类调整都必须附最小技术适配说明或明确收益说明。
- 不允许借 `phase13` 之名重做视觉系统、导航主轴或页面类型。
- 不允许在页面中残留迁移说明文案、宿主标签、开发态状态卡、验收辅助卡片、占位交互或其他不属于旧 `Rento` 原型的信息块；若存在这些内容，应视为严重 UI 漂移。

### 7.2 数据访问共享口径
- 当前正式数据访问主线固定为 `Prisma + PostgreSQL`。
- `phase13` 只继承 `phase10` 已冻结的 query / 事务边界，不重新打开 Prisma 替换议题。
- `phase13` 可为页面级 loader 规划新的路由层承接方式，但不得反向改写 `phase10` 已冻结的 canonical read path 与事务边界。

### 7.3 宿主共享口径
- 新前端正式宿主继续固定为 `src/minix`。
- 正式 API 宿主继续固定为 `server/`，但其正式切流属于 `phase14`。
- 旧 `src/app/*` 与旧 `src/app/api/*` 继续保留参考、兼容与未迁移职责，直到后续阶段满足退出条件。

## 八、结构分层共享口径
### 8.1 五层实施期职责
| 层次 | 正式落点 | `phase13` 统一职责 |
| --- | --- | --- |
| 页面壳 | `src/minix/routes/*Route.tsx` + 复用后的 `src/components/pages/*` | 承接页面路径、标题语义、主要交互节奏与首屏结构 |
| 页面装配层 | `src/minix/routes/*Route.tsx` | 承担参数解析、组件拼装顺序、页面级状态边界 |
| 数据加载边界 | route-level loader / pending / error boundary | 承担首屏数据获取与错态恢复，不继续散落在旧 `src/app/**/page.tsx` |
| 导航壳 | `src/minix/layout/UnifiedNavigation.tsx` | 保持旧导航节奏与入口语义，继续使用 React Router |
| 布局壳 | `src/minix/layout/MinixShellLayout.tsx` | 承接桌面/移动端外壳、键盘 inset 与主容器节奏 |

### 8.2 目录级复用口径
| 目录 | 统一结论 |
| --- | --- |
| `src/components/ui/*` | 直接复用 |
| `src/components/business/*` | 凡带 `next/*` 协议都先拆宿主绑定后复用 |
| `src/components/pages/*` | 作为页面主体表达层保留，默认拆宿主绑定后复用 |
| `src/components/layout/*` | 分层处理，不整目录一刀切 |
| `src/minix/router/*` | 根路由与全局 guard / error boundary 承接位 |
| `src/minix/layout/*` | 正式布局壳与导航壳承接位 |
| `src/minix/routes/*` | 正式页面 route module 目录 |
| `src/app/**` | 仅保留参考基线与拆壳来源 |

## 九、与后续阶段的共享边界
### 9.1 对 `phase14` 的共享输出
- 真实页面 parity 页面清单
- 页面迁移状态审计与“正式业务页面已无未迁移项”的最终结论
- 页面级验收矩阵
- 页面与 retained-legacy API 的最新依赖关系
- 仍阻塞 retained-legacy API 清退的页面 / API 依赖清单

### 9.2 对 `phase15` 的共享输出
- 已真实落位的页面壳与正式入口清单
- 新旧页面入口关系
- 页面级加载与错态边界在新宿主中的落点

### 9.3 对 `phase16` 的共享输出
- 页面 parity 验收标准
- 人工浏览器验收基线
- 正式页面承接清单

## 十、允许路线
- 允许继续复用旧 `src/app/*` 作为页面原型与行为参考输入
- 允许继续复用 `src/components/pages/*`、`src/components/business/*`、`src/components/layout/*` 与 `src/components/ui/*`
- 允许在 route module 中承接 loader、pending、error 与 not-found 同类边界
- 允许为退出 `next/*` 宿主协议做最小必要适配

## 十一、禁止路线
- 禁止把 `phase13` 的页面实施扩写成 retained-legacy API/query 清退
- 禁止把 `phase13` 的页面实施扩写成 PWA runtime 或 cutover 审核
- 禁止把支持页、治理页或 dev-only 页面包装成首批正式页面
- 禁止借迁移之名重做 UI 设计系统或主导航结构
- 禁止继续把 `next/navigation`、`next/link`、`generateMetadata()`、`notFound()` 等协议埋回新宿主组件层

## 十二、统一验证要求
- 至少确认：
  - [phase13_frontend_page_parity_implementation_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_architecture_plan.md)
  - [phase13_frontend_page_parity_implementation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_dev_plan.md)
  - [phase13_frontend_page_parity_implementation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_shared_baseline.md)
  三份文档已齐备并互相引用一致
- 至少确认顶层真相源已与三份 `docs/phase13_*` 的状态一致
- 至少确认 `phase13` 的正式范围仍严格建立在 `phase12` 冻结事实表之上
- 至少确认页面 parity、宿主绑定拆分、页面级数据边界与验收基线已经形成单一判断标准
- 至少确认被引用代码、文档与路径真实存在
- 至少确认任何已实施页面在验收时都会与旧 `Rento` 源代码逐项对照；若仍存在显著结构漂移，必须回退“验收通过”结论
- 至少确认“已迁移 / 部分迁移 / 未迁移 / legacy document fallback / 待浏览器复验”在三份 `docs/phase13_*` 中含义一致
- 至少确认当前文档轮次不会把 `phase14` route drain、`phase15` PWA parity 或 `phase16` cutover 验收写成本轮完成条件

## 十三、阶段结论
`phase13-frontend-page-parity-implementation` 的共享基线价值不在于“马上迁完全部页面”，而在于：

```text
先把真实页面迁移的实施词汇、边界、职责分层与验收标准冻结，
再让后续 /spec 和实现建立在单一实施真相之上，
并为首页 `/` 与 `/bills/stats` 这类阶段尾项保留明确的继续执行承接位。
```

这能确保：
- 不让页面实施重新退回整目录搬运
- 不让 UI 迁移顺带演变成视觉重做
- 不让 retained-legacy API/PWA/cutover 职责提前闯入
- 不让 `phase14` 失去稳定的页面 parity 上游输入
