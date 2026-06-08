# Phase14 Execution Layer Correction /plan

## Summary
- 目标：纠正 `phase14-api-query-parity-and-legacy-route-drain` 的阶段结构，避免再次出现“阶段名是实施阶段，但实际只完成冻结文档”的偏差。
- 本轮仍停留在 `/plan`：只修正文档、阶段定义与完成条件，不直接进入新的 API/query drain 实现，不删除旧 `src/app/api/*`，不提前进入 `phase15` 或 `phase16`。
- 纠偏后的单一结论固定为：
  - `phase14-01 ~ phase14-03` 只构成前置冻结层
  - `phase14-04 ~ phase14-07` 才是 `phase14` 的真实实现层
  - `phase14` 阶段完成不得只以文档冻结视为完成，必须包含真实 API/query drain 实施结果

## Current State Analysis
### 已确认的问题
- 现有 `docs/phase14_*`、`plan.md`、`AGENTS.md`、`README.md`、`architecture_map.md` 与 `project_rules.md` 都把 `phase14` 当前状态表述为“阶段文档已产出，等待审核”。
- `phase14-01`、`phase14-02`、`phase14-03` 已完成的内容本质上都是前置冻结：
  - route inventory 分类与 host matrix
  - dashboard / settings query host 闭环解释
  - rooms / buildings / meters 的宿主、删除门禁与 D2 顺序解释
- 现有文档里仍存在两类会诱发误判的表达：
  - “当前轮不执行 `phase14` 的任何 API/query 切流实现”
  - `phase14-01 ~ phase14-03` 被写成“已完成（文档冻结）”，但未同步说明后续还必须进入真实实现层

### 已确认不能被改写的上游输入
- `phase10` 的查询分层、canonical read path、统一事务边界与 `server/lib/legacy-route-inventory.ts` 继续作为 `phase14` 的稳定输入。
- `phase11` 的正式部署主线、发布门禁与 legacy 回滚基线继续作为 `phase14` 的稳定输入。
- `phase12` 与 `phase13` 的页面事实、页面 parity、浏览器验收基线与页面-API/query 交接继续作为 `phase14` 的直接上游输入。

### Context7 依据
- Hono 最新文档继续确认：
  - 子路由必须先在子应用内挂好，再由父应用通过 `app.route()` 挂载。
  - 路由按注册顺序匹配，更窄、更具体的静态路径应优先于动态路径。
- 因此 `phase14` 的实现层仍应继续沿用“按业务域组织 `server/routes/*`，在子路由内先窄后宽”的宿主组织原则，而不是重开新的 API 组织方式。

## Proposed Changes
### 1. 产出单独的纠偏 `/plan`
- 文件：
  - `/home/dell/Projects/Rento/.trae/documents/phase14_execution_layer_correction_plan.md`
- What：
  - 明确 `phase14-01 ~ phase14-03` 只是前置冻结层。
  - 明确 `phase14-04 ~ phase14-07` 是真实实现层。
  - 明确 `phase14` 阶段完成条件必须包含真实 API/query drain 实施结果。
- Why：
  - 需要一个可被后续审核直接引用的纠偏承接位，避免只在对话里承认问题、却不落回仓库真相源。

### 2. 改写 `docs/phase14_*` 的阶段含义
- 文件：
  - `docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md`
  - `docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md`
  - `docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md`
- What：
  - 把“当前轮不执行实现”改写为“本次纠偏 `/plan` 不执行新增实现，但 `phase14` 阶段本身仍必须完成真实实现层”。
  - 把 `phase14-01 ~ phase14-03` 的状态统一改成“已完成（前置冻结层）”。
  - 把 `phase14-04 ~ phase14-07` 的状态统一改成“待开始（真实实现层）”。
  - 在 `phase14` 的 DoD、阶段结论与共享口径中写清“前置冻结层不能替代真实迁移”。
- Why：
  - 真正需要纠正的是阶段定义，不是局部文字润色。

### 3. 同步根级真相源
- 文件：
  - `plan.md`
  - `AGENTS.md`
  - `project_rules.md`
  - `README.md`
  - `architecture_map.md`
- What：
  - 把 `phase14` 当前状态统一表达为：
    - 已完成前置冻结层与纠偏 `/plan`
    - 当前等待用户审核
    - 未经批准，不得进入 `phase14` 实现层 `/spec` 或实现
  - 把 `phase14` 的阶段完成条件统一表达为：
    - 不是只完成冻结文档
    - 而是要完成真实 API/query drain 实施并通过验收
- Why：
  - 如果只改 `docs/phase14_*`，但根级真相源仍保留旧口径，仓库会继续存在双重解释。

### 4. 保持边界不漂移
- What：
  - 不把本次纠偏扩写为新的 API 设计题、页面迁移题、PWA 题或 cutover 题。
  - 不重开 `Prisma` 替换、事务策略重构或治理接口整治。
- Why：
  - 本轮修的是阶段结构，不是借机扩大范围。

## Assumptions & Decisions
- 决策：`phase14-01 ~ phase14-03` 的既有冻结结论保持有效，但其语义被重新收口为“前置冻结层已完成”。
- 决策：后续 `phase14` 不再追加新的“纯冻结型子任务”；`phase14-04 ~ phase14-07` 默认按真实实现层解释。
- 决策：本轮完成后必须停下并等待用户审核，不能直接越过审核进入实现层。
- 假设：`phase14-04 ~ phase14-07` 的任务标题可以继续沿用，但状态与 DoD 必须改成真实实现导向。

## Verification Steps
- 复核 `docs/phase14_*` 是否都已显式写出：
  - `phase14-01 ~ phase14-03` = 前置冻结层
  - `phase14-04 ~ phase14-07` = 真实实现层
  - `phase14` 阶段完成必须包含真实迁移
- 复核 `plan.md`、`AGENTS.md`、`project_rules.md`、`README.md`、`architecture_map.md` 是否已与上述口径一致。
- 复核本轮文本没有把 `phase15`、`phase16` 或治理接口整治混入 `phase14` 完成条件。
