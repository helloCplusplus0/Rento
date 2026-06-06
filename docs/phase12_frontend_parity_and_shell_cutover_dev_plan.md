# Phase12 Frontend Parity And Shell Cutover 开发规划

## 当前状态
- `phase12` 的开发规划已完成当前轮产出，继续作为 `phase12` 的顺序执行蓝图与收口参考。
- 本文档只负责拆分任务、定义顺序、DoD 与验证要求，不替代：
  - [phase12_frontend_parity_and_shell_cutover_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md)
  - [phase12_frontend_parity_and_shell_cutover_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md)
- `phase12` 当前轮只完成阶段文档规划产出，尚未进入 `/spec` 或实现。

## 一、文档定位
本文档用于把 `phase12-frontend-parity-and-shell-cutover` 拆分为顺序执行的子任务，确保仓库先把页面映射、页面装配复用策略、UI 保真边界与 `phase12 ~ phase15` 路线图解释清楚，再进入具体实现。

## 二、总体推进结论
`phase12` 的固定顺序为：

```text
先盘点旧页面清单与正式页面范围
    ->
再冻结旧页面到 src/minix 的映射表
    ->
再冻结页面装配、导航壳与布局壳复用策略
    ->
再冻结 UI 保真边界与允许的最小技术适配
    ->
最后收口 phase12 ~ phase15 的完整路线图、验证要求与文档一致性
```

原因如下：
- 若不先盘点旧页面清单，后续页面迁移优先级无法单一解释。
- 若不先冻结页面映射表，API parity、PWA parity 与最终验收都无法建立在稳定输入之上。
- 若不先把 UI 保真边界单独冻结，迁移实施会很容易漂移成重做 UI。
- 若不把 `phase12 ~ phase15` 的完整路线图放到最后一起收口，当前规划仍会退回“先做一个阶段，再看下个阶段”的状态。

## 三、任务拆分建议
## phase12-01-page-inventory-and-formal-scope-freeze
### 目标
盘点旧 `src/app/*` 中的正式页面、治理/辅助页面、开发辅助入口与待归档候选，冻结本阶段的正式页面范围与后续迁移优先级。

### 范围
- 盘点旧 `src/app/**/page.tsx`
- 区分：
  - 正式业务页面
  - 治理/辅助页面
  - 开发辅助入口
  - 待归档候选
- 明确当前哪些页面必须进入 `phase12 ~ phase15` 的 parity 路线图

### 当前事实基线
- 旧 `src/app/**/page.tsx` 当前至少包含 37 个页面入口。
- 当前轮必须把这 37 个页面明确分成：
  - 正式业务页面
  - 状态/支持页面
  - 运维治理页面
  - dev-only / 待归档候选
- `phase12` 审核阶段不能只写“要盘点”，必须把盘点结果写成可复核的事实表。

### 参考来源
- `src/app/**/page.tsx`
- `src/components/pages/*`
- `src/components/layout/*`
- `README.md`
- `architecture_map.md`

### 不在范围内
- 不直接迁移页面实现
- 不调整页面视觉设计
- 不冻结 retained-legacy API 切流顺序

### DoD
- 正式页面范围具备单一解释
- 页面分类与迁移优先级可直接被后续子任务引用
- 产出至少三张表：
  - 页面分类表
  - 正式页面范围表
  - 延后/不进入 parity 范围表

### 验证要求
- 复核所有被列入清单的页面路径真实存在
- 确认正式页面与 dev-only / 辅助页边界不混写

## phase12-02-page-to-minix-route-mapping
### 目标
冻结旧页面到 `src/minix` 路由承接位的一一映射表，回答“哪些页面迁、迁到哪里、先后顺序如何、哪些继续延后”。

### 范围
- 为正式页面建立旧宿主 -> 新宿主映射
- 为缺失的新宿主承接位建立占位命名与优先级说明
- 冻结登录、首页、核心主链列表/详情/编辑页的迁移优先顺序
- 冻结“是否阻塞 `phase13`”的单一判断口径，但不在本任务中执行 API 切流

### 当前事实基线
- 当前 `src/minix/router/index.tsx` 已真实挂载：
  - `/`
  - `/login`
  - `/offline`
  - `/loading`
  - `/error`
  - `/404`
  - `/rooms`
  - `/add`
  - `/contracts`
  - `/bills`
  - `/settings`
- 其中除 `/`、`/login`、`/offline` 外，其余正式业务页当前主要仍是 `PlaceholderPage` 承接位。
- `/renters`、`/meter-readings/*`、`/contracts/[id]/*`、`/bills/[id]/*`、`/rooms/[id]/*`、`/profile`、`/notifications`、`/system-health`、`/data-consistency` 当前都还没有新宿主正式落点。

### 参考来源
- `src/app/**/page.tsx`
- `src/minix/router/index.tsx`
- `src/minix/routes/*`
- `src/components/pages/*`
- `plan.md`

### 不在范围内
- 不直接实现页面迁移
- 不切 retained-legacy API
- 不在本任务中定义 PWA 迁移细节

### DoD
- 页面映射表完整且可追溯
- 页面迁移优先顺序单一可解释
- 能作为 `phase13 ~ phase15` 的共同输入
- 映射表至少包含以下字段：
  - 旧页面路径
  - 页面类别
  - 当前新宿主承接现状
  - 目标新路由/承接位
  - 优先级
  - 是否阻塞 `phase13`
- 缺失承接位命名规则已经冻结，且对动态段、列表页、详情页、编辑页、流程动作页有统一命名口径
- `P0 / P1 / P2` 的判定标准已经写清，避免后续 `/spec` 重新解释优先级

### 验证要求
- 至少覆盖正式业务主链页面
- 复核映射表中引用的旧页面与新承接位真实存在
- 复核“是否阻塞 `phase13`”只用于冻结依赖顺序，不等于在本任务中切换 API 宿主

## phase12-03-composition-reuse-and-shell-closure
### 目标
冻结页面装配层、布局壳、导航壳与组件复用策略，回答“如何迁、复用哪些现有资产、在哪一层做宿主适配”。

### 范围
- 明确：
  - 页面壳
  - 页面装配层
  - 数据加载边界
  - 导航壳
  - 布局壳
  的复用关系
- 明确现有组件目录的直接承接策略
- 明确需要从 `src/app` 拆出的宿主绑定层

### 当前事实基线
- 当前可直接承接的页面表达层主要位于：
  - `src/components/pages/*`
  - `src/components/business/*`
  - `src/components/layout/*`
  - `src/components/ui/*`
- 当前新宿主绑定层主要位于：
  - `src/minix/router/index.tsx`
  - `src/minix/layout/*`
  - `src/minix/routes/*`
- 当前 `HomePage` 与 `PlaceholderPage` 已明确表述“完整业务逻辑仍保留在旧宿主作为参考基线”，因此 `phase12` 必须先冻结“从旧页面抽什么、在新宿主适配什么”的边界。
- 当前不能把 `src/components/pages/*` 简单等同于“可整目录直搬”：
  - 现有多份页面组件直接依赖 `next/navigation`
  - `PageContainer`、旧 `UnifiedNavigation` 也仍带有 Next 宿主跳转协议
  - `src/app/**/page.tsx` 仍混有 `params/searchParams`、`generateMetadata()`、`notFound()`、server query 与数据整形逻辑
- 因此 `phase12-03` 的最低交付不只是原则说明，而是必须落成：
  - 页面壳 / 页面装配层 / 数据加载边界 / 导航壳 / 布局壳五层复用矩阵
  - 目录级策略表
  - “直接复用 / 拆宿主绑定后复用 / 延后治理”的单一分类口径

### 参考来源
- `src/components/pages/*`
- `src/components/business/*`
- `src/components/layout/*`
- `src/components/ui/*`
- `src/minix/layout/*`
- `src/minix/router/*`

### 不在范围内
- 不直接重写组件表达
- 不重新定义业务语义
- 不扩大到 API / query parity 实现

### DoD
- 能清楚说明“复用什么、适配什么、舍弃什么及原因”
- 宿主绑定层与业务组件层边界单一可解释
- 至少明确列出：
  - 可直接复用的组件层目录
  - 需要迁移或改造的页面装配层目录
  - 暂不处理的治理/辅助层目录
- 至少形成两张事实化表格：
  - 五层复用矩阵
  - 目录级策略表
- 至少明确一份清单：
  - 旧 `src/app` 中必须拆出的 Next 宿主绑定逻辑

### 验证要求
- 复核引用的组件目录与页面装配文件真实存在
- 确认复用策略与 UI 承接硬约束不冲突
- 确认含 `next/navigation`、`next/link`、`generateMetadata()`、`notFound()`、`dynamic = 'force-dynamic'` 的文件未被误判为“可直接整目录复用”
- 确认 `architecture_plan`、`shared_baseline` 与本任务对“延后治理 / 支持层”的划分保持一致

## phase12-04-ui-parity-and-adaptation-boundary
### 目标
冻结 UI 保真边界、允许的最小技术适配范围与禁止路线，防止 parity 迁移演变成重做 UI。

### 范围
- 冻结默认沿用的：
  - 页面信息结构
  - 导航节奏
  - 表单交互
  - 组件表达
  - 整体视觉风格
- 明确允许的最小改动：
  - 宿主适配
  - 明显 bug 修复
  - 移动端可用性改善
  - 最小信息架构优化
- 为四类允许改动分别补齐“最小技术适配说明”或“明确收益说明”的口径
- 明确禁止路线

### 参考来源
- `project_rules.md`
- `project_skills.md`
- 旧 `src/app/*`
- 现有 `src/components/*`
- `src/minix/layout/*`

### 不在范围内
- 不定义新的设计系统
- 不引入新的视觉语言
- 不以“用户体验优化”为名扩大改动范围

### DoD
- UI 保真边界与允许改动范围具备单一解释
- 后续 `/spec` 可直接复用该边界，不再重复争论
- 必须明确写出默认原型参考，至少覆盖：
  - `src/app/**/page.tsx`
  - `src/components/pages/*`
  - `src/components/business/*`
  - `src/components/layout/*`
  - `src/minix/layout/*`
- 必须把四类允许改动写成事实化边界，而不是仅保留原则口号
- 每类允许改动都必须带有“最小技术适配说明”或“明确收益说明”的统一要求
- 必须明确哪些调整仍停留在边界冻结、哪些已经越界到实现或视觉重设计

### 验证要求
- 确认文档与顶层真相源关于 UI 承接的表述一致
- 确认所有允许改动都属于最小技术适配或明确收益项
- 确认旧 `src/app/*`、现有 `src/components/*` 与 `src/minix/layout/*` 的真实代码现状已被用于支撑边界，而不是只写抽象原则
- 确认禁止路线已覆盖：
  - 重做设计系统
  - 引入新视觉语言
  - 以“用户体验优化”为名扩大改动范围
  - 越界到实现、PWA parity 或 retained-legacy API 切流

## phase12-05-roadmap-consistency-and-phase12-to-phase15-closure
### 目标
收口 `phase12 ~ phase15` 的完整路线图、上游输入、文档一致性与当前轮最小验证要求，形成后续实施的统一蓝图。

### 范围
- 收口：
  - `phase12` 页面 parity
  - `phase13` API / query parity
  - `phase14` PWA parity
  - `phase15` parity 验收与 legacy 退出
- 明确各阶段前后依赖、DoD 与退出条件
- 冻结本轮仅文档变更时的最小验证要求

### 当前事实基线
- 当前 `phase12` 三份文档已经补齐：
  - 真实页面清单
  - 真实页面分类
  - 一一映射表
  - 页面 parity 与 retained-legacy API 的联动说明
- 因此当前轮规划完成的关键前提已经具备；后续 `/spec` 与实施只能在这些既有事实表基础上细化，不再回退为重新定义范围与优先级。

### 参考来源
- 顶层真相源
- `docs/phase12_*`
- `docs/phase10_*`
- `docs/phase11_*`
- `server/lib/legacy-route-inventory.ts`

### 不在范围内
- 不直接进入 `/spec`
- 不启动页面迁移实现
- 不在本子任务中执行 cutover

### DoD
- `phase12 ~ phase15` 路线图具备单一解释
- `phase12` 三份文档齐备并互链正确
- 顶层真相源与阶段文档状态一致
- `phase12` 三份文档已补齐真实清单、真实映射与真实优先级，而不仅是框架化原则说明

### 验证要求
- 若本轮仅涉及文档，至少完成：
  - `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md`
  三份文档互链复核
- 复核被引用路径与文件真实存在
- 复核 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`plan.md` 与本阶段文档状态一致

## 四、推荐实施顺序
建议严格按如下顺序推进：

```text
phase12-01-page-inventory-and-formal-scope-freeze
phase12-02-page-to-minix-route-mapping
phase12-03-composition-reuse-and-shell-closure
phase12-04-ui-parity-and-adaptation-boundary
phase12-05-roadmap-consistency-and-phase12-to-phase15-closure
```

## 四点五、子任务实施验收门禁
- `phase12-*` 任一已批准 `/spec` 子任务在实现完成后，必须额外指定独立子代理执行审核验收。
- 子代理审核必须优先关注：范围是否越界、页面映射与分类是否仍符合已冻结事实表、UI 保真边界是否被破坏、是否引入新的 retained-legacy 依赖或文档漂移。
- 只有在子代理明确给出“审核通过 / 验收通过”结论后，才允许把该子任务标记为正式完成。
- 未通过子代理审核的子任务，必须继续修正并重复“实现 -> 子代理审核 -> 复验”循环，不得提前提交或推送远程仓库。

## 五、阶段结论
`phase12` 的顺序价值在于：

```text
先冻结“迁哪些页面、迁到哪里、如何复用、哪些 UI 不能动、后面还有哪些阶段”，
再进入任何页面迁移实现。
```

这能避免：

- 页面 parity 与 API parity 边界混写
- UI 迁移顺带演变成重做设计
- 当前路线图再次退回走一步看一步
- 只有原则没有事实表，导致后续 `/spec` 重新承担高影响决策
