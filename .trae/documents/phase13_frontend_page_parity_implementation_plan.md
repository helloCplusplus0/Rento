# phase13_frontend_page_parity_implementation_plan

## Summary
- 本轮 `/plan` 的目标不是直接实现页面迁移，而是为 `phase13-frontend-page-parity-implementation` 产出一套可审核、可继续进入 `/spec` 的阶段文档闭环。
- `phase13` 必须严格建立在 `phase12` 已冻结的页面事实表、页面映射、五层复用矩阵、UI 保真边界与页面-API 联动之上，不重新定义范围，也不提前吞掉 `phase14 ~ phase16` 的职责。
- 产出物应包括：
  - `docs/phase13_frontend_page_parity_implementation_architecture_plan.md`
  - `docs/phase13_frontend_page_parity_implementation_dev_plan.md`
  - `docs/phase13_frontend_page_parity_implementation_shared_baseline.md`
- 顶层真相源需要先同步到“进入 `phase13` 文档审核阶段”的状态，再停止等待用户审核；不得直接进入 `phase13` `/spec` 或实现。

## Current State Analysis
- 路线图真相源已经完成重分层，`phase13` 被定义为“真实前端页面迁移实施阶段”，当前状态是“尚未开始”，见 `plan.md` 中 `### phase13-frontend-page-parity-implementation`。
- `phase12` 已经冻结了 `phase13` 的关键上游输入：
  - 正式页面范围与优先级：
    - P0: `/`、`/rooms`、`/add`、`/contracts`、`/bills`、`/settings`
    - P1: `/rooms/:id`、`/rooms/:id/edit`、`/add/room`、`/add/contract`、`/contracts/new`、`/contracts/:id`、`/contracts/:id/edit`、`/contracts/:id/renew`、`/contracts/:id/checkout`、`/bills/create`、`/bills/:id`、`/bills/:id/edit`、`/renters*`、`/meter-readings/*`
  - 路由命名规则：
    - `src/minix/routes/<domain>/<PascalCase>Route.tsx`
  - 五层复用矩阵：
    - 页面壳 / 页面装配层 / 数据加载边界 / 导航壳 / 布局壳
  - 目录级策略：
    - `src/components/ui/*` 可直接复用
    - `src/components/pages/*` 与大部分 `src/components/business/*` 需先拆宿主绑定
    - `src/minix/router/*`、`src/minix/layout/*`、`src/minix/routes/*` 是正式新宿主落点
- 当前代码状态清楚表明 `phase13` 不能写成“整目录搬运”：
  - `src/minix/router/index.tsx` 仍只把主业务入口挂到 `PlaceholderPage`
  - `src/minix/routes/HomePage.tsx` 仍是说明性承接页，不是真实工作台页面
  - `src/components/pages/*` 与 `src/components/layout/PageContainer.tsx`、`src/components/layout/UnifiedNavigation.tsx` 中广泛存在 `next/navigation` / `next/link`
  - `src/app/**/page.tsx` 广泛混有 `generateMetadata()`、`notFound()`、`dynamic = 'force-dynamic'`、服务端 query、Decimal 转换与 `Suspense` 壳层
- 当前 `src/minix` 目录里尚无真实业务 route module 目录，只有：
  - `src/minix/routes/HomePage.tsx`
  - `src/minix/routes/LoginPage.tsx`
  - `src/minix/routes/PlaceholderPage.tsx`
  - 若干状态页与 `route-manifest.tsx`
- 当前导航壳已经迁到 `React Router`，因此 `phase13` 的结构承接位是可信的：
  - `src/minix/layout/MinixShellLayout.tsx`
  - `src/minix/layout/UnifiedNavigation.tsx`
  - `src/minix/router/index.tsx`

## Assumptions & Decisions
- 决策 1：本轮 `/plan` 的交付边界是“同步顶层真相源 + 产出 `phase13` 三份阶段文档”，不进入代码实现。
- 决策 2：`phase13` 的首批正式实施范围按 `phase12` 已冻结的 P0 / P1 页面承接，不把 P2 支持页、P3 治理页、P4 dev-only 页面混入首批正式迁移。
- 决策 3：`phase13` 必须继续保持：
  - UI 保真，不借迁移重做设计
  - `Prisma + PostgreSQL` 保留，不重开 ORM 议题
  - 不切 API/query parity，不混写到 `phase14`
  - 不切 PWA/runtime parity，不混写到 `phase15`
  - 不切 cutover / legacy exit，不混写到 `phase16`
- 决策 4：`phase13` 文档应把“真实页面迁移实施”拆成以页面切片与宿主适配为核心的子任务序列，而不是按技术层大杂烩拆分。
- 决策 5：顶层真相源在本轮应切换到“`phase13` 文档审核阶段”，但仍明确“未进入 `phase13` `/spec` 或实现”。
- 假设 1：用户当前请求是标准阶段 `/plan`，因此本轮产出后即停止，等待审核。
- 假设 2：无需再向用户确认页面范围或优先级，因为这些内容已经由 `phase12` 文档冻结完成。

## Proposed Changes

### 1. 同步顶层真相源
- `README.md`
  - 更新当前状态说明，把仓库默认推进状态从“`phase12` 文档收口完成”推进为“已进入 `phase13` 文档审核阶段”。
  - 新增 `docs/phase13_*` 导航链接。
  - 保持“当前轮不进入实现”的边界描述。
- `AGENTS.md`
  - 更新“当前默认入口”和“当前下一步”，明确 `phase13-frontend-page-parity-implementation` 已进入 `/plan` 产出与文档审核阶段。
  - 明确 `phase13` 的职责是页面壳、页面装配、数据加载边界与浏览器验收基线，而不是 API/PWA/cutover。
  - 继续保留“阶段级文档产出后必须等待审核”的门禁。
- `project_rules.md`
  - 补充 `phase13` 的阶段进入条件、禁止事项和最小验证要求。
  - 明确 `phase13` 期间允许真实迁移 P0/P1 正式页面，但不得顺带切 retained-legacy API、PWA runtime 或 legacy cutover。
  - 明确若进入 `phase13` `/spec` 后，仍必须执行独立子代理审核门禁。
- `global_skills.md`
  - 新增 `phase13` 规划/实施技能条目，冻结：
    - route module 组织方式
    - 页面切片顺序
    - 宿主绑定拆分边界
    - 页面级加载/错态边界承接
    - 文档先行、审核后再进入 `/spec`
- `project_skills.md`
  - 把前端 parity 技能从“`phase12` 冻结蓝图”扩展为“`phase13` 的真实页面迁移实施规则”。
  - 明确多仪表、合同、账单、抄表主链页面迁移时必须保留业务语义与历史保留规则。
- `architecture_map.md`
  - 把“规划中的页面 parity 实施层”从路线图描述升级为“当前正在进入审核的阶段文档层”。
  - 新增 `docs/phase13_*` 在结构图与文档导航中的承接位。
- `plan.md`
  - 更新 `phase13` 当前结论为“阶段文档已产出，待审核”或等价口径。
  - 保持 `phase14 ~ phase16` 仍为后续阶段，不提前改写。

### 2. 新增 `phase13` 架构规划文档
- `docs/phase13_frontend_page_parity_implementation_architecture_plan.md`
  - 目标：冻结 `phase13` 的真实页面迁移架构，而不是阶段顺序或共享术语。
  - 应写清：
    - 首批实施页面范围：P0 / P1 正式业务页；P2+ 明确延后
    - 新宿主承接结构：
      - `src/minix/router/*`
      - `src/minix/layout/*`
      - `src/minix/routes/<domain>/*Route.tsx`
    - route module 职责边界：
      - 参数解析
      - loader / pending / error boundary
      - 页面主体组合
      - 与 `src/components/pages/*` 的关系
    - 旧宿主拆壳来源：
      - `src/app/**/page.tsx`
      - `src/components/pages/*`
      - `src/components/layout/*`
      - `src/components/business/*`
    - 典型迁移模式：
      - 列表页
      - 详情页
      - 编辑页
      - 新建页
      - 流程动作页
    - 需要拆出的宿主协议：
      - `next/navigation`
      - `next/link`
      - `generateMetadata()`
      - `notFound()`
      - `dynamic = 'force-dynamic'`
      - 页面级 server query / Decimal 转换 / Suspense
    - 页面级浏览器验收基线与最低人工对照方法
  - 应明确哪些内容继续延后：
    - retained-legacy API 清退
    - PWA runtime
    - profile / notifications / governance / dev-only

### 3. 新增 `phase13` 开发规划文档
- `docs/phase13_frontend_page_parity_implementation_dev_plan.md`
  - 目标：把 `phase13` 拆成可逐个 `/spec` 的子任务顺序。
  - 推荐拆分方向应围绕“实施切片”而非抽象概念，建议包含：
    - `phase13-01-dashboard-and-shell-real-page-landing`
      - 工作台首页从说明页替换为真实页面壳
      - 校准首页快捷入口、搜索入口、设置入口与导航节奏
    - `phase13-02-primary-list-routes-parity`
      - `/rooms`、`/add`、`/contracts`、`/bills`、`/settings`
      - 从 placeholder 替换为真实页面壳与装配层
    - `phase13-03-detail-create-edit-flow-routes-parity`
      - `/rooms/:id`、`/rooms/:id/edit`
      - `/add/room`、`/add/contract`
      - `/contracts/*`、`/bills/*`
    - `phase13-04-renters-and-meter-reading-routes-parity`
      - `/renters*`
      - `/meter-readings/*`
    - `phase13-05-page-parity-acceptance-baseline-closure`
      - 页面级验收矩阵
      - 人工浏览器操作基线
      - 与 `phase14` 的页面-API 依赖交接
  - 每个子任务都要写明：
    - 范围
    - 当前事实基线
    - 参考来源
    - 不在范围内
    - DoD
    - 验证要求
  - 必须把“实现完成后仍需独立子代理审核”写入阶段门禁。

### 4. 新增 `phase13` 共享基线文档
- `docs/phase13_frontend_page_parity_implementation_shared_baseline.md`
  - 目标：冻结 `phase13-*` 子任务共用的术语、边界与判断标准。
  - 应写清：
    - 页面 parity 在实施阶段的定义
    - route module、页面装配层、数据加载边界、页面主体组件之间的统一语义
    - P0 / P1 / P2 / P3 / P4 的实施期含义
    - UI 保真在实施期的统一约束
    - `src/minix/*` 与 `src/components/*` 的职责分层
    - 页面 parity 对 `phase14` retained-legacy API 清退顺序的影响口径
    - 文档轮次最小验证要求
  - 应继续保留：
    - `Prisma + PostgreSQL` 固定
    - 不切 API / PWA / cutover
    - 不把支持页和治理页包装成正式一级范围

### 5. 文档互链与审核停点
- 所有新增 `docs/phase13_*` 文档必须互链，并与：
  - `docs/phase12_*`
  - `plan.md`
  - `AGENTS.md`
  - `README.md`
  - `architecture_map.md`
  保持状态一致。
- `/plan` 完成后必须停下，等待用户审核。
- 只有在 `phase13` 文档审核通过后，才能进入 `phase13` 的 `/spec`。

## Verification Steps
- 文档内容验证
  - 复核 `phase13` 文档是否明确继承 `phase12` 的页面事实表、映射表、五层复用矩阵、UI 保真边界。
  - 复核 `phase13` 文档是否把 P0 / P1 正式页面作为实施主范围，且明确 P2+ 延后。
  - 复核 `phase13` 文档是否没有混入 `phase14` API/query parity、`phase15` PWA parity、`phase16` cutover/legacy-exit 职责。
- 路径存在性验证
  - 复核所有被引用路径真实存在：
    - `src/minix/router/index.tsx`
    - `src/minix/layout/*`
    - `src/minix/routes/*`
    - `src/components/pages/*`
    - `src/components/business/*`
    - `src/components/layout/*`
    - `src/app/**/page.tsx`
- 顶层真相源一致性验证
  - 复核 `README.md`、`AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`architecture_map.md`、`plan.md` 与 `docs/phase13_*` 的当前状态描述一致。
- 工具与框架边界验证
  - 复核 `React Router` 宿主、`src/minix` 路由壳与现有导航壳描述一致。
  - 复核 `phase13` 文档没有引导回退到 Next 宿主，也没有重新打开 Prisma 替换议题。

## Execution Order
1. 先同步顶层真相源，使当前默认工作流进入 `phase13` 文档审核阶段。
2. 再新增 `docs/phase13_*` 三份文档，分别承接架构、任务拆分与共享基线。
3. 完成互链、引用与状态一致性复核。
4. 停止，等待用户审核，不进入 `/spec` 或实现。
