# Phase12 Frontend Parity And Shell Cutover Shared Baseline

## 当前状态
- `phase12` 的共享基线已完成当前轮产出，继续作为当前默认工作流的统一语义输入。
- 本文档直接建立在 `phase10` 已完成的 `Prisma + PostgreSQL` 数据访问主线冻结、`phase11` 已完成的正式部署主线冻结之上。
- 本文档不替代 `architecture_plan` 的结构判断，也不替代 `dev_plan` 的任务拆分；它只负责冻结所有 `phase12-*` 子任务必须共同遵守的边界与词汇。
- 当前互链文档为 [phase12_frontend_parity_and_shell_cutover_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md) 与 [phase12_frontend_parity_and_shell_cutover_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md)。

## 一、文档目的
本文档用于冻结 `phase12-frontend-parity-and-shell-cutover` 的共享判断标准，避免后续子任务分别从页面盘点、页面映射、页面装配、UI 保真或路线图规划视角出发，重新产出互相冲突的解释。

## 二、共享前提
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- `phase06-minix-replatform` 已完成完整路线图、模块分类与真相源切换冻结
- `phase07-app-shell-and-runtime-foundation` 已完成新应用壳、新运行时入口与旧运行线映射冻结
- `phase08-api-and-auth-foundation` 已完成统一 API 宿主、认证门禁、中间件链、错误处理与最小页面守卫冻结
- `phase09-domain-service-migration` 已完成共享领域服务、正式宿主、主链 smoke 与 compat wrapper 清单收口
- `phase10-data-access-and-migration-closure` 已完成 `Prisma + PostgreSQL` 长期数据访问主线、查询分层、统一事务边界与迁移兼容边界冻结
- `phase11-deployment-cutover-and-cutline-closure` 已完成正式部署主线、legacy 回滚基线、文档最小验证要求与部署演练记录要求冻结
- 当前根级真相源已切换到 `phase12-frontend-parity-and-shell-cutover`

## 三、共享判断标准
- 默认优先冻结旧页面到 `src/minix` 的映射表与页面装配复用策略，而不是直接开始大范围页面重写。
- 默认优先继续固定 `Prisma + PostgreSQL` 为当前正式数据访问主线，而不是在 parity 阶段重新打开 ORM 替换议题。
- 默认优先把旧 `Rento` 页面信息结构、导航节奏、表单交互和组件表达继续视为 UI 原型参考，而不是把迁移视为重做设计。
- 默认优先一次性规划 `phase12 ~ phase15` 的完整路线图，而不是重新退回“先做一个 phase，再决定下一个 phase”的推进方式。
- 默认继续保持低复杂度、单仓库、单主线、单一真相源。

## 四、共享输入清单
### 4.1 页面与组件输入
- `src/app/**/page.tsx`
- `src/minix/*`
- `src/components/pages/*`
- `src/components/business/*`
- `src/components/layout/*`
- `src/components/ui/*`

### 4.2 正式宿主与数据访问输入
- `server/*`
- `src/lib/domain/*`
- `src/lib/prisma.ts`
- `src/lib/queries.ts`
- `src/lib/dashboard-queries.ts`
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
- `docs/phase10_*`
- `docs/phase11_*`

## 五、统一词汇语义
### 5.1 页面 parity
- 指旧 `src/app/*` 正式页面在纯新主线 `src/minix` 中完成页面壳、页面装配、导航与主要交互表达的对齐
- 它不等于“像素级复刻”，但默认要求信息结构、交互节奏与业务语义一致

### 5.2 页面装配层
- 指把页面壳、布局壳、导航壳、数据加载边界和组件组合在一起的宿主绑定层
- 它与 `src/components/pages/*`、`src/components/business/*` 的通用表达层不同
- `phase12` 默认优先迁移这一层，而不是先重写业务组件层

### 5.3 UI 保真
- 指默认沿用旧 `Rento` 的页面信息结构、导航顺序、表单交互、状态反馈与整体视觉风格
- 允许的变动仅限最小技术适配、明显 bug 修复、移动端可用性改善与必要的信息架构优化
- UI 保真不等于禁止所有调整，但等于禁止借迁移之名重做设计系统

### 5.4 纯新主线
- 指在不依赖旧 `src/app`、旧 `src/app/api/*`、旧 Next PWA 宿主与 legacy 容器化运行线的前提下，由 `src/minix + server + Prisma + PostgreSQL + Caddy + systemd` 组成的正式技术路径
- 它不等于“当前已经全部实现完成”，但等于后续阶段必须以此为唯一目标方向

### 5.5 retained-legacy
- 指旧 `src/app/api/*` 中仍承担正式业务职责的旧宿主路由
- 它们不是当前 `phase12` 直接清理对象，但它们的退出优先级会受到页面 parity 结果影响

## 六、UI 与数据访问共享口径
### 6.1 UI 共享口径
- 当前 `Rento` UI 展示效果继续视为正式原型参考
- 后续页面迁移默认先复用现有页面表达，再做宿主适配
- 不允许把 parity 迁移解释成“借机做全新 UI”

### 6.2 数据访问共享口径
- 当前正式数据访问主线固定为 `Prisma + PostgreSQL`
- `phase12` 不重新讨论 Prisma 替换
- 页面 parity 可依赖 `phase10` 已冻结的查询分层、事务边界与迁移兼容边界，但不得反向改写这些结论

### 6.3 宿主共享口径
- 新前端正式宿主继续固定为 `src/minix`
- 正式 API 宿主继续固定为 `server/`
- 旧 `src/app/*` 与旧 `src/app/api/*` 继续保留参考、兼容与未迁移职责，直到后续阶段满足退出条件

### 6.4 正式页面范围共享口径
- 当前 `phase12 ~ phase15` 默认 parity 范围继续覆盖以下正式业务页面：
  - `/`
  - `/rooms`
  - `/rooms/[id]`
  - `/rooms/[id]/edit`
  - `/add`
  - `/add/room`
  - `/add/contract`
  - `/contracts`
  - `/contracts/new`
  - `/contracts/[id]`
  - `/contracts/[id]/edit`
  - `/contracts/[id]/renew`
  - `/contracts/[id]/checkout`
  - `/bills`
  - `/bills/create`
  - `/bills/[id]`
  - `/bills/[id]/edit`
  - `/bills/stats`
  - `/renters`
  - `/renters/new`
  - `/renters/[id]`
  - `/renters/[id]/edit`
  - `/meter-readings/batch`
  - `/meter-readings/history`
  - `/settings`
- 当前状态/支持页面默认 parity 范围继续覆盖：
  - `/login`
  - `/offline`
  - `/profile`
  - `/notifications`
- 当前运维治理页面：
  - `/system-health`
  - `/data-consistency`
  默认不进入 `phase12` 首批正式页面 parity 范围，但其承接关系必须在映射表中显式标明“延后”。
- 当前 dev-only / 待归档候选：
  - `/performance-test`
  - `/performance-benchmark`
  - `/performance-analysis`
  - `/layout-demo`
  - `/components`
  - `/business-flow-validation`
  默认不进入正式 parity 范围。

### 6.5 页面映射表共享口径
- 旧页面到 `src/minix` 的映射表是 `phase12 ~ phase15` 的共享输入，不是后续 `/spec` 可自由重定义的实现细节。
- 映射表至少必须回答：
  - 旧页面属于哪一类
  - 当前新宿主是否已有正式承接位或仅有 placeholder
  - 目标承接位是什么
  - 当前优先级是什么
  - 是否直接影响 `phase13` retained-legacy API 退出顺序
- 若没有这张映射表，`phase12` 当前轮不视为规划完成。

### 6.5.1 缺失承接位命名规则
- 本阶段只冻结命名规则与目标承接位，不创建新页面文件、不挂载新路由、不切 retained-legacy API。
- 目标新路由默认保持旧页面 URL 语义稳定；仅把 Next 风格动态段 `[id]` 统一转换为 `React Router` 的 `:id`。
- 缺失承接位文件命名统一遵循 `src/minix/routes/<domain>/<PascalCase>Route.tsx`：
  - 列表页使用 `*ListRoute.tsx`
  - 详情页使用 `*DetailRoute.tsx`
  - 编辑页使用 `*EditRoute.tsx`
  - 新增/新建页使用 `*CreateRoute.tsx`
  - 聚合入口页使用 `*HubRoute.tsx`
  - 流程动作页使用 `*<Action>Route.tsx`
- 支持页统一落到 `src/minix/routes/support/*Route.tsx`，治理页统一落到 `src/minix/routes/governance/*Route.tsx`，dev-only 入口若未来仍保留，只允许落到 `src/minix/routes/dev/*Route.tsx`。
- 已存在的 `/`、`/login`、`/offline` 与 `minixPrimaryRoutes` 中的顶级占位路由保持原路径不变；后续只允许替换承接组件，不允许额外引入第二套路由别名。

### 6.5.2 P0 / P1 / P2 优先级共享语义
- `P0`：已在新宿主真实挂载，且承担首页、状态入口或主导航一级入口；它们是 `phase13` 开始切 rooms / contracts / bills / settings / dashboard retained-legacy 路由的最小页面前提。
- `P1`：尚未在新宿主挂载，但属于核心主链的详情、编辑、新建或流程动作页；这些页面若未冻结目标承接位，会直接阻塞 `phase13` 对主链 retained-legacy 路由的实质性清退。
- `P2`：统计页与支持页，属于路线图正式输入，但应晚于核心 CRUD 页承接；它们默认不反向阻塞 `phase12` 首批页面壳冻结。
- `P3`：治理页延后承接，不进入 `phase12` 首批正式页面 parity 范围。
- `P4`：dev-only / 待归档候选，不进入正式 parity 范围，仅保留分类与退出边界说明。

## 七、与后续阶段的共享边界
### 7.1 对 `phase13` 的共享输入
- 页面映射表
- 页面-API 关系
- 页面迁移优先级
- 旧 UI 保真边界

### 7.1.1 页面 parity 与 retained-legacy API 联动规则
- 以下模块的页面 parity 会直接影响旧 API 退出优先级：
  - 房源页面 parity -> `/api/rooms*`
  - 合同页面 parity -> `/api/contracts*`
  - 账单页面 parity -> `/api/bills*`
  - 租客页面 parity -> `/api/renters*`
  - 抄表页面 parity -> `/api/meter-readings*`
  - 设置 / 工作台 / 统计页面 parity -> `/api/settings*`、`/api/dashboard/*`
- 因此页面映射表必须至少标记“是否阻塞 `phase13`”，防止后续阶段重新自行判断依赖关系。
- “是否阻塞 `phase13`” 的统一口径为：
  - `是`：该页面的页面壳或目标承接位若未冻结，`phase13` 不应对对应 retained-legacy API 族做正式退出判断。
  - `否`：该页面不直接决定 `phase13` 的 retained-legacy API 退出顺序，只作为支持页、治理页或 dev-only 边界保留。

### 7.2 对 `phase14` 的共享输入
- 新宿主页面壳与正式路由壳
- 新旧页面入口关系
- 不重做 UI 的共享约束

### 7.3 对 `phase15` 的共享输入
- 页面 parity 验收标准
- 页面原型对照关系
- 纯新主线的页面承接清单

## 八、允许路线
- 允许继续复用旧 `src/app/*` 作为页面原型与行为参考输入
- 允许继续复用 `src/components/pages/*`、`src/components/business/*`、`src/components/layout/*` 与 `src/components/ui/*`
- 允许在后续 `/spec` 中把页面壳、导航壳、布局壳与数据加载边界逐步迁入 `src/minix`
- 允许在后续阶段把 retained-legacy API、PWA parity 与最终 legacy 退出分别作为独立阶段承接

## 九、禁止路线
- 禁止在 `phase12` 中重开 Prisma 替换议题
- 禁止在 `phase12` 中把页面 parity 扩写为另一套 UI 设计系统
- 禁止把 `phase13` / `phase14` / `phase15` 的职责混写到一个大而全的实现任务中
- 禁止因为“旧页面暂时还能跑”而跳过 parity 路线图冻结

## 十、统一验证要求
- 至少确认：
  - `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md`
  三份文档已齐备并互相引用一致
- 至少确认顶层真相源已与三份 `docs/phase12_*` 的状态一致
- 至少确认“Prisma 保留、UI 保真、完整路线图一次性规划”的表述已形成单一判断标准
- 至少确认正式页面范围、延后页面范围与 dev-only / 候选归档范围已形成单一判断标准
- 至少确认旧页面到 `src/minix` 的映射表已写入阶段文档，而不是只保留为待办事项
- 至少确认被引用代码、脚本与文档路径真实存在

## 十一、阶段结论
`phase12-frontend-parity-and-shell-cutover` 的共享基线价值不在于“马上迁完全部页面”，而在于：

```text
先把页面 parity、UI 保真、Prisma 保留与 phase12 ~ phase15 路线图的共享词汇冻结，
再让后续 /spec 和实现建立在单一迁移真相之上。
```

这能确保：
- 不让页面迁移重新变成走一步看一步
- 不让 UI 迁移顺带演变成重做设计
- 不让 Prisma 替换重新闯入当前默认路线图
- 不让后续 API parity、PWA parity 与 legacy 退出失去统一上游输入
- 不让“真实页面清单、真实映射表、真实优先级”再次退回到后续 `/spec` 自行决定
