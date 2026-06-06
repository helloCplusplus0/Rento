# phase12 路线图重分层修正规划

## 背景
- 当前 `phase12-frontend-parity-and-shell-cutover` 在 `plan.md` 的阶段目标表述为“把旧 `src/app` 的正式业务页面壳、页面装配边界与前端路由承接位系统迁入 `src/minix`”。
- 但已执行完毕的 `phase12-01 ~ phase12-05` 子任务全部属于冻结、盘点、映射、复用策略、UI 保真边界与路线图收口，不包含真实页面迁移实施。
- 现有 `phase13 ~ phase15` 又分别承担 API/query parity、PWA parity、cutover/legacy exit，没有显式承接“前端页面真实迁移实施阶段”。

## 核心判断
- 当前缺口属于规划层缺口，而不是执行偏差。
- 最合理修法是：保留 `phase12` 作为前端页面 parity 的冻结/规划阶段，新增一个独立的“前端页面真实迁移实施阶段”，并将原 `phase13 ~ phase15` 整体顺延。

## 本轮修正策略
- 保留 `phase12-frontend-parity-and-shell-cutover` 的名称，但把其职责明确收口为：
  - 页面事实表冻结
  - 页面映射冻结
  - 页面装配复用策略冻结
  - UI 保真边界冻结
  - `phase12 ~ phase16` 路线图冻结
- 新增 `phase13-frontend-page-parity-implementation`，专门承接：
  - `src/minix` 页面真实迁移实施
  - 页面壳、页面装配、数据加载边界与正式路由落点的逐步承接
  - 不扩写到 API/query parity、PWA parity 或 cutover
- 将原 `phase13-api-query-parity-and-legacy-route-drain` 顺延为 `phase14-*`
- 将原 `phase14-minix-pwa-and-runtime-parity` 顺延为 `phase15-*`
- 将原 `phase15-parity-verification-cutover-and-legacy-exit` 顺延为 `phase16-*`

## 需要同步的文档
- 顶层真相源：
  - `README.md`
  - `AGENTS.md`
  - `project_rules.md`
  - `architecture_map.md`
  - `plan.md`
  - `global_skills.md`
  - `project_skills.md`
- 当前阶段文档：
  - `docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md`
  - `docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md`

## 预期结果
- `phase12` 的“冻结”与“实施”职责不再混写。
- 前端页面真实迁移将拥有明确阶段承接位，不再隐含地悬空在 `phase13 ~ phase15` 之外。
- `phase12 ~ phase16` 的阶段顺序、依赖链、DoD、退出条件与文档轮次最小验证要求形成单一解释。
